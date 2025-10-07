/**
 * Firebase Functions for Apple Shortcuts Integration
 * Provides API endpoints for external transaction input
 */

import {onRequest} from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import {initializeApp} from "firebase-admin/app";
import {getFirestore} from "firebase-admin/firestore";
import {getAuth} from "firebase-admin/auth";
import * as webpush from "web-push";

initializeApp();

let vapidInitialized = false;

/**
 * Initialize VAPID configuration lazily when needed
 */
function initializeVapidIfNeeded() {
  if (!vapidInitialized) {
    // Use environment variables directly (Firebase Functions v2 approach)
    const publicKey = process.env.VAPID_PUBLIC_KEY;
    const privateKey = process.env.VAPID_PRIVATE_KEY;

    logger.info("DEBUG: VAPID keys from environment", {
      usingEnvVars: !!(publicKey && privateKey),
      publicKeyExists: !!publicKey,
      privateKeyExists: !!privateKey,
      publicKeyLength: publicKey?.length || 0,
      privateKeyLength: privateKey?.length || 0,
      publicKeyFirst10: publicKey?.substring(0, 10) || "N/A",
      privateKeyFirst10: privateKey?.substring(0, 10) || "N/A",
    });

    if (!publicKey || !privateKey) {
      logger.error("VAPID keys are not accessible from environment", {
        hasPublicKey: !!publicKey,
        hasPrivateKey: !!privateKey,
      });
      throw new Error(
        "VAPID keys not accessible - check .env configuration"
      );
    }

    // Check decoded lengths
    const publicKeyDecoded = Buffer.from(publicKey, "base64");
    const privateKeyDecoded = Buffer.from(privateKey, "base64");

    logger.info("DEBUG: VAPID key decoded lengths", {
      publicKeyDecodedLength: publicKeyDecoded.length,
      privateKeyDecodedLength: privateKeyDecoded.length,
      expectedPublicLength: 65,
      expectedPrivateLength: 32,
    });

    if (publicKeyDecoded.length !== 65 || privateKeyDecoded.length !== 32) {
      logger.error("VAPID keys are invalid length when decoded", {
        publicKeyDecodedLength: publicKeyDecoded.length,
        privateKeyDecodedLength: privateKeyDecoded.length,
      });
      throw new Error("Invalid VAPID key decoded lengths");
    }

    webpush.setVapidDetails(
      "mailto:davidwuguantong@gmail.com",
      publicKey,
      privateKey,
    );

    logger.info("VAPID configuration initialized successfully", {
      publicKeyLength: publicKey.length,
      privateKeyLength: privateKey.length,
      timestamp: Date.now(),
    });

    vapidInitialized = true;
  }
}
// ✅ =================================================================

// Transaction data interface matching Apple Shortcuts format
interface TransactionData {
  Amount: number;
  Category: string;
  Notes: string;
  Type: "income" | "expense";
}

interface AppleShortcutRequest {
  UserID: string;
  Data: TransactionData;
}

// CORS headers for external API access
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

/**
 * Push notification helper function
 * Sends push notifications to all user's registered devices using Web Push
 * @param {string} userId - The user ID to send notifications to
 * @param {object} notification - The notification object
 */
async function sendPushNotification(userId: string, notification: {
  title: string;
  body: string;
  data?: Record<string, string>;
}) {
  const db = getFirestore();

  const subscriptionsRef = db.collection(`users/${userId}/pushSubscriptions`);
  const subscriptionsSnapshot = await subscriptionsRef.get();

  if (subscriptionsSnapshot.empty) {
    logger.warn("No push subscriptions found for user", {userId});
    return;
  }

  // ✅ Initialize VAPID details lazily when needed
  initializeVapidIfNeeded();

  const payload = JSON.stringify({
    title: notification.title,
    body: notification.body,
    data: notification.data || {},
    timestamp: Date.now(),
    url: "/", // Default URL for notification click
  });

  logger.info("Sending push notifications", {
    userId,
    subscriptionCount: subscriptionsSnapshot.docs.length,
    payloadSize: payload.length,
  });

  const promises = subscriptionsSnapshot.docs.map(async (doc) => {
    const subscriptionData = doc.data();
    const subscription = {
      endpoint: subscriptionData.endpoint,
      keys: {
        auth: subscriptionData.keys.auth,
        p256dh: subscriptionData.keys.p256dh,
      },
    };

    // Log subscription details for debugging
    logger.info("Sending to subscription", {
      userId,
      endpoint: subscription.endpoint.substring(0, 50) + "...",
      isIOSSafari: subscriptionData.isIOSSafari || false,
      userAgent: subscriptionData.userAgent || "unknown",
    });

    try {
      const result = await webpush.sendNotification(subscription, payload, {
        TTL: 86400, // 24 hours
        urgency: "normal",
        topic: "finance-tracker",
      });

      logger.info("Notification sent successfully", {
        userId,
        endpoint: subscription.endpoint.substring(0, 50) + "...",
        statusCode: result.statusCode,
      });

      return {success: true, endpoint: subscription.endpoint};
    } catch (error) {
      logger.error("Failed to send notification to endpoint", {
        endpoint: subscription.endpoint,
        error: error instanceof Error ? error.message : String(error),
      });
      // ✅ Handle expired subscriptions by deleting them
      const errorWithStatus = error as Error & {statusCode: number};
      if (error instanceof Error && errorWithStatus.statusCode === 410) {
        logger.info("Subscription has expired. Deleting from Firestore.", {
          endpoint: subscription.endpoint,
        });
        await doc.ref.delete();
      }
      return {success: false, endpoint: subscription.endpoint, error};
    }
  });

  const results = await Promise.allSettled(promises);
  const successful = results.filter(
    (result) => result.status === "fulfilled" && result.value.success
  ).length;
  const failed = results.length - successful;

  logger.info("Push notification results", {
    userId,
    successful,
    failed,
    total: results.length,
  });
}

// Initialize user document endpoint
export const initializeUser = onRequest({
  cors: true,
  timeoutSeconds: 60,
  memory: "512MiB",
}, async (req, res) => {
  // Handle preflight OPTIONS request
  if (req.method === "OPTIONS") {
    res.set(corsHeaders);
    res.status(204).send("");
    return;
  }

  // Only allow POST requests
  if (req.method !== "POST") {
    res.set(corsHeaders);
    res.status(405).json({error: "Method not allowed"});
    return;
  }

  try {
    const {UserID, Name} = req.body as {UserID: string; Name?: string};

    if (!UserID) {
      res.set(corsHeaders);
      res.status(400).json({error: "UserID is required"});
      return;
    }

    // Verify user exists in Firebase Auth
    const auth = getAuth();
    try {
      await auth.getUser(UserID);
    } catch (error) {
      logger.error("User verification failed:", error);
      res.set(corsHeaders);
      res.status(400).json({error: "Invalid UserID"});
      return;
    }

    const db = getFirestore();
    const userRef = db.collection("users").doc(UserID);

    // Check if user document already exists
    const userDoc = await userRef.get();
    if (userDoc.exists) {
      res.set(corsHeaders);
      res.status(200).json({
        success: true,
        message: "User already initialized",
        userData: userDoc.data(),
      });
      return;
    }

    // Create user document
    const defaultCategories = ["F&B", "Shopping", "Transport", "Bills"];
    const userData = {
      userId: UserID,
      name: Name || "User",
      categories: defaultCategories,
      income: 0,
      savings: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await userRef.set(userData);

    // Create default budget documents
    const budgetPromises = defaultCategories.map((category) =>
      db.collection(`users/${UserID}/budgets`).doc(category).set({
        category: category,
        budgetAmount: 0,
        spent: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
    );

    await Promise.all(budgetPromises);

    logger.info(`User initialized successfully: ${UserID}`);
    res.set(corsHeaders);
    res.status(200).json({
      success: true,
      message: "User initialized successfully",
      userData: userData,
    });
  } catch (error) {
    logger.error("Error initializing user:", error);
    res.set(corsHeaders);
    res.status(500).json({error: "Internal server error"});
  }
});

export const transactions = onRequest({
  cors: true,
  timeoutSeconds: 60,
  memory: "512MiB",
}, async (req, res) => {
  // Handle preflight OPTIONS request
  if (req.method === "OPTIONS") {
    res.set(corsHeaders);
    res.status(204).send("");
    return;
  }

  // Only allow POST requests
  if (req.method !== "POST") {
    res.set(corsHeaders);
    res.status(405).json({error: "Method not allowed"});
    return;
  }

  try {
    const body = req.body as AppleShortcutRequest;

    // Validate request body
    if (!body.UserID || !body.Data) {
      res.set(corsHeaders);
      res.status(400).json({error: "Missing UserID or Data"});
      return;
    }

    const {UserID, Data} = body;
    const {Amount, Category, Notes, Type} = Data;

    // Validate transaction data
    if (!Amount || !Category || !Type) {
      res.set(corsHeaders);
      res.status(400).json({
        error: "Missing required fields: Amount, Category, Type",
      });
      return;
    }

    if (!["income", "expense"].includes(Type)) {
      res.set(corsHeaders);
      res.status(400).json({error: "Type must be 'income' or 'expense'"});
      return;
    }

    // Verify user exists in Firebase Auth
    const auth = getAuth();
    try {
      await auth.getUser(UserID);
    } catch (error) {
      logger.error("User verification failed:", error);
      res.set(corsHeaders);
      res.status(401).json({error: "Invalid UserID"});
      return;
    }

    // Create transaction document
    const db = getFirestore();
    const transactionData = {
      Amount: Math.abs(Amount), // Ensure positive number
      Category: Category,
      Notes: Notes || "",
      Type: Type,
      Date: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
      userId: UserID,
    };

    // Add transaction to user's subcollection
    const transactionRef = await db
      .collection("users")
      .doc(UserID)
      .collection("transactions")
      .add(transactionData);

    logger.info("Transaction created via Apple Shortcuts", {
      transactionId: transactionRef.id,
      userId: UserID,
      amount: Amount,
      category: Category,
      type: Type,
    });

    // Send push notification
    try {
      await sendPushNotification(UserID, {
        title: "Transaction Added",
        body: `${Type === "expense" ? "-" : "+"}$${Amount} - ${Category}`,
        data: {
          transactionId: transactionRef.id,
          amount: Amount.toString(),
          category: Category,
          type: Type,
        },
      });
      logger.info("Push notification sent successfully", {userId: UserID});
    } catch (notificationError) {
      logger.error("Failed to send push notification:", notificationError);
      // Don't fail the transaction creation if notification fails
    }

    res.set(corsHeaders);
    res.status(201).json({
      success: true,
      transactionId: transactionRef.id,
      message: "Transaction created successfully",
    });
  } catch (error) {
    logger.error("Error creating transaction:", error);
    res.set(corsHeaders);
    res.status(500).json({error: "Internal server error"});
  }
});
