
// iOS 26 PWA Optimized Service Worker
// Handles push notifications specifically for iOS Safari

const CACHE_NAME = 'piggybank-v1';
const PUSH_METADATA_CACHE = 'push-subscription-metadata';
const PUSH_METADATA_REQUEST = new Request('/__push_subscription_metadata__');

// iOS Safari Detection
function isIOSSafari() {
  if (typeof navigator === 'undefined') return false;
  const userAgent = navigator.userAgent || '';
  return /iPad|iPhone|iPod/.test(userAgent) && /Safari/.test(userAgent) && !/CriOS|FxiOS/.test(userAgent);
}

// Enhanced logging for iOS debugging
function logPushEvent(message, data = null) {
  console.log(`[SW Push - iOS] ${message}`, data);
  // Store logs for debugging
  if (data && data.error) {
    console.error(`[SW Push Error - iOS]`, data.error);
  }
}

// VAPID key conversion utility
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

// Enhanced metadata storage for iOS
async function storeMetadata(payload) {
  if (!payload || typeof payload !== 'object') {
    logPushEvent('Invalid metadata payload', { payload });
    return;
  }
  
  const { userId, vapidPublicKey } = payload;

  if (typeof userId !== 'string' || typeof vapidPublicKey !== 'string') {
    logPushEvent('Invalid metadata format', { userId: typeof userId, vapidPublicKey: typeof vapidPublicKey });
    return;
  }

  try {
    const cache = await caches.open(PUSH_METADATA_CACHE);
    const metadata = {
      userId,
      vapidPublicKey,
      isIOSSafari: isIOSSafari(),
      timestamp: Date.now()
    };
    
    await cache.put(
      PUSH_METADATA_REQUEST,
      new Response(JSON.stringify(metadata), {
        headers: { 'Content-Type': 'application/json' },
      })
    );
    
    logPushEvent('Metadata stored successfully', metadata);
  } catch (error) {
    logPushEvent('Failed to store metadata', { error });
  }
}

// Enhanced metadata reading with iOS support
async function readMetadata() {
  try {
    const cache = await caches.open(PUSH_METADATA_CACHE);
    const response = await cache.match(PUSH_METADATA_REQUEST);

    if (!response) {
      logPushEvent('No metadata found in cache');
      return null;
    }

    const metadata = await response.json();
    logPushEvent('Metadata read successfully', metadata);
    return metadata;
  } catch (error) {
    logPushEvent('Failed to read metadata', { error });
    return null;
  }
}

// iOS-optimized subscription persistence
async function persistSubscriptionToServer(metadata, subscription, oldEndpoint) {
  if (!metadata || typeof metadata.userId !== 'string') {
    throw new Error('Missing user metadata for push subscription persistence.');
  }

  const subscriptionData = subscription.toJSON();
  const body = {
    userId: metadata.userId,
    subscription: subscriptionData,
    isIOSSafari: isIOSSafari(),
    userAgent: navigator.userAgent,
    timestamp: Date.now()
  };

  if (oldEndpoint) {
    body.oldEndpoint = oldEndpoint;
  }

  logPushEvent('Persisting subscription to server', { userId: metadata.userId, isIOSSafari: body.isIOSSafari });

  try {
    const response = await fetch('/api/push-subscriptions', {
      method: 'POST',
      credentials: 'include',
      headers: { 
        'Content-Type': 'application/json',
        'X-iOS-Safari': isIOSSafari() ? 'true' : 'false'
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new Error(`Failed to persist subscription: ${response.status} - ${response.statusText}`);
    }
    
    logPushEvent('Subscription persisted successfully');
  } catch (error) {
    logPushEvent('Failed to persist subscription', { error });
    throw error;
  }
}

// Enhanced client broadcasting for iOS
async function broadcastSubscriptionChange(payload) {
  try {
    const clientsArr = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    const message = {
      type: 'PUSH_SUBSCRIPTION_CHANGE',
      payload: {
        ...payload,
        isIOSSafari: isIOSSafari(),
        timestamp: Date.now()
      }
    };
    
    logPushEvent(`Broadcasting to ${clientsArr.length} clients`, message);
    
    for (const client of clientsArr) {
      client.postMessage(message);
    }
  } catch (error) {
    logPushEvent('Failed to broadcast subscription change', { error });
  }
}

// Service Worker Installation
self.addEventListener('install', (event) => {
  logPushEvent('Service Worker installing');
  self.skipWaiting();
});

// Service Worker Activation
self.addEventListener('activate', (event) => {
  logPushEvent('Service Worker activating');
  event.waitUntil(self.clients.claim());
});

// iOS-optimized Push Event Handler
self.addEventListener('push', (event) => {
  logPushEvent('Push event received', { hasData: !!event.data });
  
  let data;
  try {
    data = event.data ? event.data.json() : {};
    logPushEvent('Push data parsed', data);
  } catch (error) {
    logPushEvent('Failed to parse push data', { error });
    data = { title: 'piggybank', body: 'New notification' };
  }

  // iOS-specific notification options
  const notificationOptions = {
    body: data.body || 'New transaction recorded',
    icon: '/icon.png',
    badge: '/icon.png',
    tag: 'piggybank-notification',
    requireInteraction: false, // iOS handles this differently
    silent: false,
    data: {
      url: data.url || '/',
      timestamp: Date.now(),
      isIOSSafari: isIOSSafari()
    }
  };

  // Add iOS-specific options
  if (isIOSSafari()) {
    notificationOptions.actions = [
      {
        action: 'view',
        title: 'View Transaction'
      }
    ];
  }

  const title = data.title || 'piggybank';
  
  logPushEvent('Showing notification', { title, options: notificationOptions });
  
  event.waitUntil(
    self.registration.showNotification(title, notificationOptions)
      .then(() => {
        logPushEvent('Notification shown successfully');
      })
      .catch((error) => {
        logPushEvent('Failed to show notification', { error });
      })
  );
});

// iOS-optimized Notification Click Handler
self.addEventListener('notificationclick', (event) => {
  logPushEvent('Notification clicked', { action: event.action, data: event.notification.data });
  
  event.notification.close();

  const urlToOpen = event.notification.data?.url || '/';
  
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientsArr) => {
        // Check if app is already open
        const existingClient = clientsArr.find(client => 
          client.url.includes(self.location.origin)
        );
        
        if (existingClient) {
          logPushEvent('Focusing existing client');
          return existingClient.focus().then(() => {
            existingClient.postMessage({
              type: 'NOTIFICATION_CLICKED',
              url: urlToOpen,
              isIOSSafari: isIOSSafari()
            });
          });
        } else {
          logPushEvent('Opening new client', { url: urlToOpen });
          return self.clients.openWindow(urlToOpen);
        }
      })
      .catch((error) => {
        logPushEvent('Failed to handle notification click', { error });
      })
  );
});

// Enhanced Push Subscription Change Handler for iOS
self.addEventListener('pushsubscriptionchange', (event) => {
  logPushEvent('Push subscription changed');
  
  event.waitUntil(
    readMetadata()
      .then((metadata) => {
        if (!metadata) {
          logPushEvent('No metadata available for subscription change');
          return;
        }
        
        const vapidKey = urlBase64ToUint8Array(metadata.vapidPublicKey);
        
        return self.registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: vapidKey,
        })
        .then((newSubscription) => {
          logPushEvent('New subscription created', { endpoint: newSubscription.endpoint });
          
          const oldEndpoint = event.oldSubscription?.endpoint;
          return persistSubscriptionToServer(metadata, newSubscription, oldEndpoint);
        })
        .then(() => {
          return broadcastSubscriptionChange({
            type: 'subscription_renewed',
            isIOSSafari: isIOSSafari()
          });
        });
      })
      .catch((error) => {
        logPushEvent('Failed to handle subscription change', { error });
        
        return broadcastSubscriptionChange({
          type: 'subscription_error',
          error: error.message,
          isIOSSafari: isIOSSafari()
        });
      })
  );
});

// Message handler for metadata updates
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'STORE_PUSH_METADATA') {
    logPushEvent('Received metadata storage request', event.data.payload);
    event.waitUntil(storeMetadata(event.data.payload));
  }
});

// Error handler
self.addEventListener('error', (event) => {
  logPushEvent('Service Worker error', { error: event.error, filename: event.filename, lineno: event.lineno });
});

// Unhandled rejection handler
self.addEventListener('unhandledrejection', (event) => {
  logPushEvent('Unhandled promise rejection', { reason: event.reason });
});
