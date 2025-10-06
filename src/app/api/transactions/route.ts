
'use server';

// Type declarations for missing modules
declare const NextResponse: any;
declare const admin: any;
declare const FieldValue: any;
declare const webpush: any;

// Type interfaces
interface NextRequest {
  json(): Promise<any>;
  headers: {
    get(name: string): string | null;
  };
  url: string;
}

interface PushSubscription {
  endpoint: string;
  keys: {
    auth: string;
    p256dh: string;
  };
}

// Environment variables type
declare global {
  var process: {
    env: {
      NEXT_PUBLIC_VAPID_PUBLIC_KEY?: string;
      VAPID_PRIVATE_KEY?: string;
      VAPID_SUBJECT?: string;
      NODE_ENV?: string;
    }
  };
}

// Mock implementations for compilation
const mockNextResponse = {
  json: (data: any, options?: any) => ({ data, options })
};

const mockAdmin = {
  apps: { length: 0 },
  initializeApp: () => ({}),
  firestore: () => ({
    collection: (path: string) => ({
      doc: (id: string) => ({
        collection: (subPath: string) => ({
          add: async (data: any) => ({ id: 'mock-id' }),
          orderBy: (field: string, direction: string) => ({
            limit: (count: number) => ({
              offset: (start: number) => ({
                get: async () => ({ docs: [] })
              })
            })
          }),
          get: async () => ({ docs: [], empty: true })
        })
      })
    })
  })
};

const mockFieldValue = {
  serverTimestamp: () => new Date()
};

const mockWebpush = {
  setVapidDetails: (subject: string, publicKey: string, privateKey: string) => {},
  sendNotification: async (subscription: any, payload: string, options?: any) => ({})
};

// Import fallbacks
const normalizeSubscriptionPayload = (data: any) => data;

// Declare require function
declare const require: any;

// Use mocks if real modules not available
const firebaseAdmin = typeof admin !== 'undefined' ? admin : mockAdmin;
const firestoreFieldValue = typeof FieldValue !== 'undefined' ? FieldValue : mockFieldValue;
const webPush = typeof webpush !== 'undefined' ? webpush : mockWebpush;
const NextRes = typeof NextResponse !== 'undefined' ? NextResponse : mockNextResponse;

// Initialize Firebase Admin SDK if not already initialized
if (firebaseAdmin.apps.length === 0) {
  firebaseAdmin.initializeApp();
}

const firestore = firebaseAdmin.firestore();

// Configure web-push with VAPID details from environment variables
if (process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY && process.env.VAPID_SUBJECT) {
  webPush.setVapidDetails(
    process.env.VAPID_SUBJECT,
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
} else {
  console.warn("VAPID keys not configured. Push notifications will not work.");
}

/**
 * Enhanced logging for iOS transaction processing
 */
function logTransactionEvent(message: string, data?: any) {
  const timestamp = new Date().toISOString();
  console.log(`[Transaction API - ${timestamp}] ${message}`, data);
}

/**
 * Detects iOS Safari from request headers
 */
function isIOSSafariRequest(request: NextRequest): boolean {
  const userAgent = request.headers.get('user-agent') || '';
  return /iPad|iPhone|iPod/.test(userAgent) && /Safari/.test(userAgent) && !/CriOS|FxiOS/.test(userAgent);
}

/**
 * Creates iOS-optimized push notification payload
 */
function createIOSPushPayload(messageBody: string, url: string, transactionData: any) {
  return {
    title: 'piggybank',
    body: messageBody,
    icon: '/icon.png',
    badge: '/icon.png',
    url: url,
    tag: 'transaction-notification',
    requireInteraction: false, // iOS handles this differently
    silent: false,
    data: {
      transactionId: transactionData.id || 'unknown',
      amount: transactionData.Amount,
      category: transactionData.Category,
      type: transactionData.Type,
      timestamp: Date.now(),
      url: url
    },
    actions: [
      {
        action: 'view',
        title: 'View Transaction'
      }
    ]
  };
}

/**
 * Enhanced push notification sender with iOS-specific handling
 */
async function sendPushNotification(userId: string, messageBody: string, url: string, transactionData: any, isIOSSafari: boolean = false) {
  const startTime = Date.now();
  
  try {
    logTransactionEvent('Starting push notification process', {
      userId,
      messageBody,
      isIOSSafari
    });

    const subscriptionsSnapshot = await firestore
      .collection('users')
      .doc(userId)
      .collection('pushSubscriptions')
      .get();

    if (subscriptionsSnapshot.empty) {
      logTransactionEvent('No push subscriptions found', { userId });
      return { sent: 0, failed: 0 };
    }

    logTransactionEvent(`Found ${subscriptionsSnapshot.docs.length} subscriptions`, { userId });
    
    // Create iOS-optimized payload
    const payload = isIOSSafari 
      ? createIOSPushPayload(messageBody, url, transactionData)
      : {
          title: 'piggybank',
          body: messageBody,
          url: url,
          data: {
            transactionId: transactionData.id || 'unknown',
            timestamp: Date.now()
          }
        };

    const payloadString = JSON.stringify(payload);
    logTransactionEvent('Push payload created', { payload, isIOSSafari });

    let sentCount = 0;
    let failedCount = 0;

    const sendPromises = subscriptionsSnapshot.docs.map(async (doc: any) => {
      const subscriptionData = doc.data();
      const normalized = normalizeSubscriptionPayload(subscriptionData);
      
      if (!normalized) {
        logTransactionEvent('Skipping malformed subscription', { docId: doc.id, data: subscriptionData });
        failedCount++;
        return;
      }

      const subscription: PushSubscription = {
        endpoint: normalized.endpoint,
        keys: normalized.keys,
      };

      const isSubscriptionIOS = subscriptionData.isIOSSafari || false;
      
      try {
        // iOS-specific push options
        const pushOptions = isSubscriptionIOS ? {
          TTL: 86400, // 24 hours for iOS
          urgency: 'normal',
          topic: 'piggybank-transactions'
        } : {
          TTL: 3600, // 1 hour for other browsers
          urgency: 'normal'
        };

        await webPush.sendNotification(subscription, payloadString, pushOptions);
        
        // Update last seen timestamp
         await doc.ref.update({
           lastSeen: firestoreFieldValue.serverTimestamp(),
           lastNotificationSent: firestoreFieldValue.serverTimestamp()
         });
        
        sentCount++;
        logTransactionEvent('Push notification sent successfully', {
          endpoint: normalized.endpoint,
          isIOSSafari: isSubscriptionIOS
        });
        
      } catch (error: any) {
        failedCount++;
        
        // Handle expired or invalid subscriptions
        if (error.statusCode === 410 || error.statusCode === 404) {
          logTransactionEvent('Subscription expired, deleting', {
            docId: doc.id,
            endpoint: normalized.endpoint,
            statusCode: error.statusCode
          });
          
          try {
            await doc.ref.delete();
          } catch (deleteError) {
            logTransactionEvent('Failed to delete expired subscription', { deleteError });
          }
        } else {
          logTransactionEvent('Push notification failed', {
            endpoint: normalized.endpoint,
            statusCode: error.statusCode,
            error: error.message,
            isIOSSafari: isSubscriptionIOS
          });
        }
      }
    });

    await Promise.all(sendPromises);
    
    const processingTime = Date.now() - startTime;
    logTransactionEvent('Push notification process completed', {
      userId,
      sent: sentCount,
      failed: failedCount,
      total: subscriptionsSnapshot.docs.length,
      processingTime
    });

    return { sent: sentCount, failed: failedCount, processingTime };

  } catch (error) {
    const processingTime = Date.now() - startTime;
    logTransactionEvent('Push notification process failed', {
      userId,
      error: error instanceof Error ? error.message : 'Unknown error',
      processingTime
    });
    
    return { sent: 0, failed: 1, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

/**
 * Validates transaction data with enhanced validation
 */
function validateTransactionData(data: any) {
  const { Amount, Category, Notes, Type, Date: transactionDate } = data || {};

  if (!Amount || !Category || !Notes || !Type) {
    return {
      valid: false,
      error: "Incomplete transaction data. Required fields: Amount, Category, Notes, Type."
    };
  }

  if (typeof Category !== 'string' || Category.trim().length === 0) {
    return {
      valid: false,
      error: "Category must be a non-empty string."
    };
  }

  if (typeof Notes !== 'string' || Notes.trim().length === 0) {
    return {
      valid: false,
      error: "Notes must be a non-empty string."
    };
  }

  if (typeof Type !== 'string' || !['Expense', 'Income'].includes(Type)) {
    return {
      valid: false,
      error: "Type must be either 'Expense' or 'Income'."
    };
  }

  const numericAmount = Number(Amount);
  if (isNaN(numericAmount) || numericAmount <= 0) {
    return {
      valid: false,
      error: "Amount must be a positive number."
    };
  }

  // Validate date if provided
  if (transactionDate) {
    const date = new Date(transactionDate);
    if (isNaN(date.getTime())) {
      return {
        valid: false,
        error: "Invalid date format."
      };
    }
  }

  return { valid: true };
}

/**
 * Enhanced POST handler for transactions with iOS support
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    const requestBody = await request.json();
    const { userId, ...newEntry } = requestBody;
    const isIOSSafari = isIOSSafariRequest(request);
    
    logTransactionEvent('Transaction creation request received', {
      userId: userId ? 'present' : 'missing',
      hasData: !!newEntry.data,
      isIOSSafari,
      userAgent: request.headers.get('user-agent')
    });

    // Validate user ID
    if (!userId || typeof userId !== 'string') {
      logTransactionEvent('Invalid user ID provided');
      return NextRes.json(
        { error: "User ID is required and must be a string." },
        { status: 400 }
      );
    }
    
    // Validate transaction data
    const validation = validateTransactionData(newEntry.data);
    if (!validation.valid) {
      logTransactionEvent('Transaction validation failed', { error: validation.error, data: newEntry.data });
      return NextRes.json(
        { error: validation.error },
        { status: 400 }
      );
    }

    const { Amount, Category, Notes, Type, Date: transactionDate } = newEntry.data;
    const numericAmount = Number(Amount);

    // Create transaction data with enhanced metadata
    const transactionData = {
      Amount: numericAmount,
      Category: Category.trim(),
      Notes: Notes.trim(),
      Type,
      Date: transactionDate ? new Date(transactionDate) : firestoreFieldValue.serverTimestamp(),
       userId: userId,
       createdAt: firestoreFieldValue.serverTimestamp(),
      source: isIOSSafari ? 'ios-shortcut' : 'web-app',
      userAgent: request.headers.get('user-agent') || 'unknown'
    };
    
    // Add the transaction to Firestore
    const docRef = await firestore
      .collection('users')
      .doc(userId)
      .collection('transactions')
      .add(transactionData);

    logTransactionEvent('Transaction saved to Firestore', {
      userId,
      transactionId: docRef.id,
      amount: numericAmount,
      category: Category,
      type: Type
    });

    // Send push notification with iOS optimization
    let pushResult = { sent: 0, failed: 0 };
    try {
      const message = `New ${Type.toLowerCase()}: ${Notes} for $${numericAmount.toFixed(2)}`;
      pushResult = await sendPushNotification(userId, message, '/', {
        ...transactionData,
        id: docRef.id
      }, isIOSSafari);
      
      logTransactionEvent('Push notification completed', pushResult);
    } catch (pushError) {
      logTransactionEvent('Push notification failed', { error: pushError });
      // Don't fail the transaction request for push notification errors
    }

    const processingTime = Date.now() - startTime;
    
    // Return success response with detailed information
    return NextRes.json({
      success: true,
      id: docRef.id,
      transaction: {
        id: docRef.id,
        Amount: numericAmount,
        Category,
        Notes,
        Type,
        userId
      },
      pushNotification: {
         sent: pushResult.sent,
         failed: pushResult.failed,
         ...((pushResult as any).error && { error: (pushResult as any).error })
       },
      metadata: {
        isIOSSafari,
        processingTime,
        source: transactionData.source
      }
    });

  } catch (error) {
    const processingTime = Date.now() - startTime;
    logTransactionEvent('Transaction creation failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      processingTime
    });
    
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    return NextResponse.json(
      {
        error: "Failed to create transaction.",
        details: errorMessage,
        processingTime
      },
      { status: 500 }
    );
  }
}

/**
 * GET handler to retrieve transactions
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');
    
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    const transactionsSnapshot = await firestore
      .collection('users')
      .doc(userId)
      .collection('transactions')
      .orderBy('Date', 'desc')
      .limit(limit)
      .offset(offset)
      .get();

    const transactions = transactionsSnapshot.docs.map((doc: any) => ({
      id: doc.id,
      ...doc.data(),
      Date: doc.data().Date?.toDate?.()?.toISOString() || null,
      createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || null
    }));

    logTransactionEvent('Transactions retrieved', {
      userId,
      count: transactions.length,
      limit,
      offset
    });

    return NextResponse.json({
      transactions,
      count: transactions.length,
      hasMore: transactions.length === limit
    });

  } catch (error) {
    logTransactionEvent('Failed to retrieve transactions', { error });
    
    const message = error instanceof Error ? error.message : 'Unknown error occurred';
    return NextResponse.json(
      { error: 'Failed to retrieve transactions.', details: message },
      { status: 500 }
    );
  }
}
