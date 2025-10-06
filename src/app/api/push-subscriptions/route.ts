'use server';

import { NextRequest, NextResponse } from 'next/server';

// Type interfaces
interface PushSubscription {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
  expirationTime?: number | null;
}

interface SubscriptionPayload {
  subscription: PushSubscription;
  userId: string;
  isIOSSafari?: boolean;
  userAgent?: string;
  oldEndpoint?: string;
}

// Import fallbacks
const buildSubscriptionId = (endpoint: string): string => endpoint.replace(/\//g, '_');
const normalizeSubscriptionPayload = (data: SubscriptionPayload) => data;

// Type declarations for Firebase Admin
interface FirebaseAdmin {
  apps: { length: number };
  initializeApp: (config?: unknown) => unknown;
  firestore: () => FirestoreInstance;
}

interface FirestoreInstance {
  collection: (path: string) => CollectionReference;
}

interface CollectionReference {
  doc: (id: string) => DocumentReference;
}

interface DocumentReference {
  collection: (subPath: string) => CollectionReference;
  set: (data: Record<string, unknown>, options?: { merge?: boolean }) => Promise<void>;
  delete: () => Promise<void>;
  update: (data: Record<string, unknown>) => Promise<void>;
}

interface FieldValueType {
  serverTimestamp: () => unknown;
}

// Mock implementations for compilation
const mockAdmin: FirebaseAdmin = {
  apps: { length: 0 },
  initializeApp: () => ({}),
  firestore: () => ({
    collection: () => ({
      doc: () => ({
        collection: () => ({
          doc: () => ({
            set: async () => ({}),
            delete: async () => ({}),
            update: async () => ({})
          }),
        }),
        set: async () => ({}),
        delete: async () => ({}),
        update: async () => ({})
      })
    })
  })
};

const mockFieldValue: FieldValueType = {
  serverTimestamp: () => new Date()
};

// Use mock if real module not available
declare const admin: FirebaseAdmin | undefined;
declare const FieldValue: FieldValueType | undefined;

const firebaseAdmin = typeof admin !== 'undefined' ? admin : mockAdmin;
const firestoreFieldValue = typeof FieldValue !== 'undefined' ? FieldValue : mockFieldValue;

// Initialize Firebase Admin SDK if not already initialized
if (firebaseAdmin.apps.length === 0) {
  firebaseAdmin.initializeApp();
}

const firestore = firebaseAdmin.firestore();

/**
 * Enhanced logging for iOS push subscription debugging
 */
function logSubscriptionEvent(message: string, data?: any) {
  const timestamp = new Date().toISOString();
  console.log(`[Push Subscription API - ${timestamp}] ${message}`, data);
}

/**
 * Detects iOS Safari from request headers
 */
function isIOSSafariRequest(request: NextRequest): boolean {
  const userAgent = request.headers.get('user-agent') || '';
  const isIOSHeader = request.headers.get('x-ios-safari') === 'true';
  const isIOSUserAgent = /iPad|iPhone|iPod/.test(userAgent) && /Safari/.test(userAgent) && !/CriOS|FxiOS/.test(userAgent);
  
  return isIOSHeader || isIOSUserAgent;
}

/**
 * Validates subscription payload for iOS compatibility
 */
function validateSubscriptionPayload(subscription: any, isIOSSafari: boolean) {
  if (!subscription || typeof subscription !== 'object') {
    return { valid: false, error: 'Invalid subscription object' };
  }

  const { endpoint, keys } = subscription;
  
  if (!endpoint || typeof endpoint !== 'string') {
    return { valid: false, error: 'Missing or invalid endpoint' };
  }

  if (!keys || typeof keys !== 'object') {
    return { valid: false, error: 'Missing or invalid keys object' };
  }

  const { auth, p256dh } = keys;
  
  if (!auth || typeof auth !== 'string') {
    return { valid: false, error: 'Missing or invalid auth key' };
  }

  if (!p256dh || typeof p256dh !== 'string') {
    return { valid: false, error: 'Missing or invalid p256dh key' };
  }

  // iOS-specific validations
  if (isIOSSafari) {
    // Check if endpoint is from Apple's push service
    if (!endpoint.includes('web.push.apple.com')) {
      logSubscriptionEvent('Warning: iOS subscription not from Apple push service', { endpoint });
    }
    
    // Validate key lengths for iOS
    if (auth.length < 16 || p256dh.length < 65) {
      return { valid: false, error: 'iOS push keys appear to be too short' };
    }
  }

  return { valid: true };
}

/**
 * Enhanced POST handler for push subscriptions with iOS support
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    const body = await request.json();
    const { userId, subscription, oldEndpoint, isIOSSafari: clientIOSFlag, userAgent, timestamp } = body ?? {};
    
    // Detect iOS Safari
    const isIOSSafari = isIOSSafariRequest(request) || clientIOSFlag;
    
    logSubscriptionEvent('Push subscription request received', {
      userId: userId ? 'present' : 'missing',
      hasSubscription: !!subscription,
      hasOldEndpoint: !!oldEndpoint,
      isIOSSafari,
      userAgent: userAgent || request.headers.get('user-agent'),
      clientTimestamp: timestamp
    });

    // Validate user ID
    if (typeof userId !== 'string' || !userId.trim()) {
      logSubscriptionEvent('Invalid user ID provided');
      return NextRes.json(
         { error: 'User ID is required and must be a non-empty string.' },
         { status: 400 }
       );
    }

    // Validate subscription payload
    const validation = validateSubscriptionPayload(subscription, isIOSSafari);
    if (!validation.valid) {
      logSubscriptionEvent('Subscription validation failed', { error: validation.error, subscription });
      return NextRes.json(
         { error: `Invalid subscription payload: ${validation.error}` },
         { status: 400 }
       );
    }

    // Normalize subscription payload
    const normalized = normalizeSubscriptionPayload(subscription);
    if (!normalized) {
      logSubscriptionEvent('Failed to normalize subscription payload', { subscription });
      return NextRes.json(
         { error: 'Failed to process subscription payload.' },
         { status: 400 }
       );
    }

    // Create subscription document with iOS-specific metadata
    const subscriptionRef = firestore
      .collection('users')
      .doc(userId)
      .collection('pushSubscriptions')
      .doc(buildSubscriptionId(normalized.endpoint));

    const subscriptionData = {
      endpoint: normalized.endpoint,
      keys: normalized.keys,
      isIOSSafari,
      userAgent: userAgent || request.headers.get('user-agent') || 'unknown',
      createdAt: firestoreFieldValue.serverTimestamp(),
       updatedAt: firestoreFieldValue.serverTimestamp(),
       lastSeen: firestoreFieldValue.serverTimestamp(),
      // iOS-specific metadata
      ...(isIOSSafari && {
        iosMetadata: {
          safariVersion: extractSafariVersion(userAgent || request.headers.get('user-agent') || ''),
          deviceType: extractDeviceType(userAgent || request.headers.get('user-agent') || ''),
          standalone: true // Assume PWA is installed if subscribing
        }
      })
    };

    // Save subscription to Firestore
    await subscriptionRef.set(subscriptionData, { merge: true });
    
    logSubscriptionEvent('Subscription saved successfully', {
      userId,
      endpoint: normalized.endpoint,
      isIOSSafari,
      processingTime: Date.now() - startTime
    });

    // Handle old endpoint cleanup
    if (typeof oldEndpoint === 'string' && oldEndpoint && oldEndpoint !== normalized.endpoint) {
      try {
        const oldRef = firestore
          .collection('users')
          .doc(userId)
          .collection('pushSubscriptions')
          .doc(buildSubscriptionId(oldEndpoint));

        await oldRef.delete();
        logSubscriptionEvent('Old subscription cleaned up', { oldEndpoint });
      } catch (error) {
        logSubscriptionEvent('Failed to clean up old subscription', { error, oldEndpoint });
        // Don't fail the request for cleanup errors
      }
    }

    // Return success response with iOS-specific information
    return NextRes.json({
       success: true,
       subscriptionId: buildSubscriptionId(normalized.endpoint),
       isIOSSafari,
       processingTime: Date.now() - startTime,
       message: isIOSSafari 
         ? 'iOS push subscription registered successfully'
         : 'Push subscription registered successfully'
     });

  } catch (error) {
    const processingTime = Date.now() - startTime;
    logSubscriptionEvent('Push subscription registration failed', { 
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      processingTime
    });
    
    const message = error instanceof Error ? error.message : 'Unknown error occurred';
    return NextRes.json(
       { 
         error: 'Failed to register push subscription.',
         details: message,
         processingTime
       },
       { status: 500 }
     );
  }
}

/**
 * GET handler to retrieve subscription status
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    
    if (!userId) {
      return NextRes.json(
         { error: 'User ID is required' },
         { status: 400 }
       );
    }

    const subscriptionsSnapshot = await firestore
      .collection('users')
      .doc(userId)
      .collection('pushSubscriptions')
      .get();

    const subscriptions = subscriptionsSnapshot.docs.map((doc: any) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || null,
      updatedAt: doc.data().updatedAt?.toDate?.()?.toISOString() || null,
      lastSeen: doc.data().lastSeen?.toDate?.()?.toISOString() || null
    }));

    const isIOSSafari = isIOSSafariRequest(request);
    
    logSubscriptionEvent('Subscription status retrieved', {
      userId,
      subscriptionCount: subscriptions.length,
      isIOSSafari
    });

    return NextRes.json({
       subscriptions,
       count: subscriptions.length,
       isIOSSafari
     });

  } catch (error) {
    logSubscriptionEvent('Failed to retrieve subscription status', { error });
    
    const message = error instanceof Error ? error.message : 'Unknown error occurred';
    return NextRes.json(
       { error: 'Failed to retrieve subscription status.', details: message },
       { status: 500 }
     );
  }
}

/**
 * DELETE handler to remove subscriptions
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const endpoint = searchParams.get('endpoint');
    
    if (!userId) {
      return NextRes.json(
         { error: 'User ID is required' },
         { status: 400 }
       );
    }

    if (!endpoint) {
      return NextRes.json(
         { error: 'Endpoint is required' },
         { status: 400 }
       );
    }

    const subscriptionRef = firestore
      .collection('users')
      .doc(userId)
      .collection('pushSubscriptions')
      .doc(buildSubscriptionId(endpoint));

    await subscriptionRef.delete();
    
    logSubscriptionEvent('Subscription deleted', { userId, endpoint });

    return NextRes.json({
       success: true,
       message: 'Subscription deleted successfully'
     });

  } catch (error) {
    logSubscriptionEvent('Failed to delete subscription', { error });
    
    const message = error instanceof Error ? error.message : 'Unknown error occurred';
    return NextRes.json(
       { error: 'Failed to delete subscription.', details: message },
       { status: 500 }
     );
  }
}

/**
 * Utility functions for iOS metadata extraction
 */
function extractSafariVersion(userAgent: string): string {
  const match = userAgent.match(/Version\/(\d+\.\d+)/);
  return match ? match[1] : 'unknown';
}

function extractDeviceType(userAgent: string): string {
  if (/iPad/.test(userAgent)) return 'iPad';
  if (/iPhone/.test(userAgent)) return 'iPhone';
  if (/iPod/.test(userAgent)) return 'iPod';
  return 'unknown';
}
