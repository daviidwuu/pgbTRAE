
'use client';

import { 
  doc, 
  setDoc, 
  deleteDoc, 
  collection, 
  serverTimestamp,
  type Firestore
} from 'firebase/firestore';

// Mock toast function
const toast = (options: any) => console.log('Toast:', options);

// Extend Navigator interface for iOS PWA detection
declare global {
  interface Navigator {
    standalone?: boolean;
  }
}

/**
 * iOS Safari Detection Utility - Enhanced for better detection
 */
function isIOSSafari(): boolean {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') return false;
  
  const userAgent = navigator.userAgent || '';
  const isIOS = /iPad|iPhone|iPod/.test(userAgent);
  const isSafari = /Safari/.test(userAgent) && !/CriOS|FxiOS|EdgiOS/.test(userAgent);
  
  // Check for standalone mode (PWA)
  const isStandalone = navigator.standalone === true || 
    window.matchMedia('(display-mode: standalone)').matches;
  
  return isIOS && (isSafari || isStandalone);
}

/**
 * Enhanced logging for iOS push notification debugging
 */
function logPushMessage(message: string, data?: any) {
  // Avoid circular dependency by checking iOS status directly
  const userAgent = navigator?.userAgent || '';
  const isIOS = /iPad|iPhone|iPod/.test(userAgent);
  const prefix = isIOS ? '[iOS Push]' : '[Push]';
  console.log(`${prefix} ${message}`, data);
}

/**
 * Converts a VAPID key from a URL-safe base64 string to a Uint8Array.
 */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/\-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

/**
 * Gets the current push subscription with iOS-specific handling.
 */
export async function getSubscription(): Promise<PushSubscription | null> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    logPushMessage('Service Worker not supported');
    return null;
  }
  
  try {
    const registration = await navigator.serviceWorker.getRegistration();
    if (!registration) {
      logPushMessage('No service worker registration found');
      return null;
    }
    
    const pushManager = assertPushManager(registration);
    const subscription = await pushManager.getSubscription();
    
    logPushMessage('Current subscription retrieved', {
      hasSubscription: !!subscription,
      endpoint: subscription?.endpoint,
      isIOSSafari: isIOSSafari()
    });
    
    return subscription;
  } catch (error) {
    logPushMessage('Error getting subscription', { error });
    return null;
  }
}

/**
 * Creates a Firestore-safe document ID from a subscription endpoint.
 */
function buildSubscriptionId(endpoint: string): string {
  return endpoint.replace(/\//g, '_');
}

/**
 * Subscription payload interfaces
 */
interface SubscriptionKeys {
  auth: string;
  p256dh: string;
}

interface SubscriptionRecord {
  endpoint: string;
  keys: SubscriptionKeys;
}

type SubscriptionLike = PushSubscription | PushSubscriptionJSON;

/**
 * Normalizes subscription payload for iOS compatibility
 */
function normalizeSubscriptionPayload(payload: unknown): SubscriptionRecord | null {
  if (!payload || typeof payload !== 'object') {
    return null;
  }

  const endpoint = typeof (payload as { endpoint?: unknown }).endpoint === 'string'
    ? (payload as { endpoint: string }).endpoint
    : null;

  const keysRaw = (payload as { keys?: unknown }).keys;
  const keys = keysRaw && typeof keysRaw === 'object'
    ? keysRaw as Record<string, unknown>
    : null;

  const auth = keys && typeof keys.auth === 'string' ? keys.auth : null;
  const p256dh = keys && typeof keys.p256dh === 'string' ? keys.p256dh : null;

  if (!endpoint || !auth || !p256dh) {
    return null;
  }

  return {
    endpoint,
    keys: { auth, p256dh },
  };
}

/**
 * Normalizes subscription for storage
 */
function normalizeSubscription(subscription: SubscriptionLike | null | undefined): SubscriptionRecord | null {
  if (!subscription) return null;

  const json = typeof (subscription as PushSubscription).toJSON === 'function'
    ? (subscription as PushSubscription).toJSON()
    : (subscription as PushSubscriptionJSON);

  return normalizeSubscriptionPayload(json);
}

/**
 * Persists subscription to Firestore with iOS-specific metadata
 */
async function persistSubscription(userId: string, firestore: Firestore, subscription: SubscriptionLike) {
  const normalized = normalizeSubscription(subscription);

  if (!normalized) {
    throw new Error('Received an invalid push subscription payload.');
  }

  const subscriptionRef = doc(
    firestore,
    `users/${userId}/pushSubscriptions`,
    buildSubscriptionId(normalized.endpoint)
  );

  const subscriptionData = {
    endpoint: normalized.endpoint,
    keys: normalized.keys,
    isIOSSafari: isIOSSafari(),
    userAgent: navigator.userAgent,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  // Use merge to preserve existing metadata like updatedAt from service worker
  await setDoc(subscriptionRef, subscriptionData, { merge: true });
  
  logPushMessage('Subscription persisted to Firestore', {
    userId,
    endpoint: normalized.endpoint.substring(0, 50) + "...",
    isIOSSafari: subscriptionData.isIOSSafari,
    docId: buildSubscriptionId(normalized.endpoint)
  });
}

/**
 * Removes subscription from Firestore
 */
async function removeSubscription(userId: string, firestore: Firestore, endpoint: string | null | undefined) {
  if (!endpoint) return;

  const subscriptionRef = doc(
    firestore,
    `users/${userId}/pushSubscriptions`,
    buildSubscriptionId(endpoint)
  );

  await deleteDoc(subscriptionRef);
  logPushMessage('Subscription removed from Firestore', { userId, endpoint });
}

/**
 * Asserts that push manager is available
 */
function assertPushManager(registration: ServiceWorkerRegistration): PushManager {
  const { pushManager } = registration;
  if (!pushManager) {
    throw new Error('Push messaging is not supported in this browser.');
  }
  return pushManager;
}

/**
 * Ensures active subscription with iOS-specific handling
 */
async function ensureActiveSubscription(
  userId: string,
  firestore: Firestore,
  registration?: ServiceWorkerRegistration
) {
  if (!registration) {
    registration = await navigator.serviceWorker.getRegistration();
    if (!registration) {
      throw new Error('Service worker not registered.');
    }
  }

  const pushManager = assertPushManager(registration);
  const existingSubscription = await pushManager.getSubscription();

  if (existingSubscription) {
    logPushMessage('Using existing subscription', { endpoint: existingSubscription.endpoint });
    await persistSubscription(userId, firestore, existingSubscription);
    return existingSubscription;
  }

  return subscribeWithRegistration(registration, pushManager, userId, firestore);
}

/**
 * Creates new subscription with iOS-optimized settings
 */
async function subscribeWithRegistration(
  registration: ServiceWorkerRegistration,
  pushManager: PushManager,
  userId: string,
  firestore: Firestore
) {
  // Use the same VAPID key as the server for consistency
  const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || 
    'BGOvmY_FbbGPUZ4LrujnuHDN5NgkF_LRF1sfQJgCbFeLjKkJR3JXy1DnTh_FlHJCjOj-lZYkkrTdCbUXtWTAEPI';
  
  if (!vapidPublicKey) {
    throw new Error('VAPID public key not configured.');
  }

  const applicationServerKey = urlBase64ToUint8Array(vapidPublicKey);
  
  // iOS-specific subscription options
  const subscriptionOptions: PushSubscriptionOptions = {
    userVisibleOnly: true,
    applicationServerKey: applicationServerKey as any,
  };

  logPushMessage('Creating new subscription', {
    isIOSSafari: isIOSSafari(),
    vapidKeyLength: applicationServerKey.length
  });

  const subscription = await pushManager.subscribe(subscriptionOptions);
  await persistSubscription(userId, firestore, subscription);
  
  // Store metadata in service worker for iOS
  if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
    navigator.serviceWorker.controller.postMessage({
      type: 'STORE_PUSH_METADATA',
      payload: {
        userId,
        vapidPublicKey,
        isIOSSafari: isIOSSafari()
      }
    });
  }

  return subscription;
}

/**
 * Registers subscription change listener for iOS
 */
export function registerSubscriptionChangeListener(userId: string, firestore: Firestore) {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return;
  }

  navigator.serviceWorker.addEventListener('message', (event) => {
    if (event.data?.type === 'PUSH_SUBSCRIPTION_CHANGE') {
      const { payload } = event.data;
      
      logPushMessage('Subscription change received', payload);
      
      if (payload.type === 'subscription_renewed') {
        toast({
          title: "Push notifications updated",
          description: "Your notification settings have been refreshed.",
        });
      } else if (payload.type === 'subscription_error') {
        toast({
          variant: "destructive",
          title: "Notification error",
          description: "There was an issue with push notifications. Please try again.",
        });
      }
    }
    
    if (event.data?.type === 'NOTIFICATION_CLICKED') {
      logPushMessage('Notification clicked', event.data);
      // Handle notification click if needed
      if (event.data.url && event.data.url !== window.location.pathname) {
        window.location.href = event.data.url;
      }
    }
  });
}

/**
 * Requests notification permission with iOS-specific handling
 */
export async function requestNotificationPermission(userId: string, firestore: Firestore) {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    throw new Error('Notifications are not supported in this browser.');
  }

  const isIOS = isIOSSafari();
  
  logPushMessage('Requesting notification permission', { 
    currentPermission: Notification.permission,
    isIOSSafari: isIOS,
    isPWAInstalled: isPWAInstalled(),
    userAgent: navigator.userAgent.substring(0, 100)
  });

  // Check if already granted
  if (Notification.permission === 'granted') {
    logPushMessage('Permission already granted, ensuring active subscription');
    return ensureActiveSubscription(userId, firestore);
  }

  // For iOS, provide specific guidance
  if (isIOS && Notification.permission === 'default') {
    logPushMessage('iOS detected - requesting permission with user gesture');
    
    // Ensure this is called from a user gesture
    if (!document.hasFocus()) {
      logPushMessage('Warning: Permission request not from user gesture');
    }
  }

  // Request permission
  const permission = await Notification.requestPermission();
  
  logPushMessage('Permission request result', { 
    permission,
    isIOS,
    timestamp: Date.now()
  });

  if (permission === 'granted') {
    toast({
      title: "Notifications enabled",
      description: isIOS 
        ? "Great! You'll receive notifications for new transactions. Make sure this PWA is added to your home screen for best experience."
        : "You'll receive notifications for new transactions.",
    });
    
    return ensureActiveSubscription(userId, firestore);
  } else if (permission === 'denied') {
    const errorMessage = isIOS 
      ? "To enable notifications, go to Safari Settings > Notifications and allow notifications for this site, or check your device's notification settings."
      : "Notifications have been blocked. Please enable them in your browser settings.";
      
    toast({
      variant: "destructive",
      title: "Notifications blocked",
      description: errorMessage,
    });
    
    logPushMessage('Permission denied', { isIOS, permission });
    throw new Error('Notification permission denied.');
  } else {
    toast({
      variant: "destructive",
      title: "Notifications not available",
      description: isIOS 
        ? "Notification permission was not granted. Try again and make sure to allow notifications when prompted."
        : "Notification permission was not granted.",
    });
    
    logPushMessage('Permission not granted', { isIOS, permission });
    throw new Error('Notification permission not granted.');
  }
}

/**
 * Unsubscribes from notifications with iOS cleanup
 */
export async function unsubscribeFromNotifications(userId: string, firestore: Firestore) {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return;
  }

  try {
    const registration = await navigator.serviceWorker.getRegistration();
    if (!registration) {
      logPushMessage('No service worker registration for unsubscribe');
      return;
    }

    const pushManager = assertPushManager(registration);
    const subscription = await pushManager.getSubscription();

    if (subscription) {
      const endpoint = subscription.endpoint;
      await subscription.unsubscribe();
      await removeSubscription(userId, firestore, endpoint);
      
      logPushMessage('Successfully unsubscribed', { endpoint });
      
      toast({
        title: "Notifications disabled",
        description: "You will no longer receive push notifications.",
      });
    } else {
      logPushMessage('No active subscription to unsubscribe');
    }
  } catch (error) {
    logPushMessage('Error during unsubscribe', { error });
    toast({
      variant: "destructive",
      title: "Error",
      description: "Failed to disable notifications. Please try again.",
    });
    throw error;
  }
}

/**
 * Syncs subscription with Firestore (iOS-optimized)
 */
export async function syncSubscriptionWithFirestore(userId: string, firestore: Firestore) {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return;
  }

  try {
    const subscription = await getSubscription();
    if (subscription) {
      await persistSubscription(userId, firestore, subscription);
      logPushMessage('Subscription synced with Firestore');
    } else {
      logPushMessage('No subscription to sync');
    }
  } catch (error) {
    logPushMessage('Error syncing subscription', { error });
  }
}

/**
 * Checks if PWA is installed (iOS-specific)
 */
export function isPWAInstalled(): boolean {
  if (typeof window === 'undefined') return false;
  
  // Check for iOS PWA installation
  if (isIOSSafari()) {
    return window.navigator.standalone === true;
  }
  
  // Check for other browsers
  return window.matchMedia('(display-mode: standalone)').matches;
}

/**
 * Shows PWA installation prompt for iOS
 */
export function showIOSInstallPrompt() {
  if (!isIOSSafari()) return;
  
  toast({
    title: "Install App",
    description: "To receive push notifications, add this app to your home screen. Tap the Share button and select 'Add to Home Screen'.",
    duration: 10000,
  });
}
