// Service Worker Source - Readable Version for Development
// This is the source code that gets compiled into sw.js

// Cache names
const PRECACHE_NAME = 'precache-v1';
const GOOGLE_FONTS_CACHE = 'google-fonts-cache';
const IMAGES_CACHE = 'images-cache';
const API_CACHE = 'api-cache';

// Install event - precache resources
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker with precache manifest');
  
  // Skip waiting to activate immediately
  self.skipWaiting();
  
  event.waitUntil(
    caches.open(PRECACHE_NAME).then((cache) => {
      // Add precache manifest files here
      return cache.addAll([
        '/',
        '/manifest.json',
        '/icon.png'
      ]);
    })
  );
});

// Activate event
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker');
  event.waitUntil(self.clients.claim());
});

// Fetch event - handle different types of requests
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Handle Google Fonts
  if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
    event.respondWith(
      caches.open(GOOGLE_FONTS_CACHE).then((cache) =>
        cache.match(request).then((response) =>
          response || fetch(request).then((response) => {
            cache.put(request, response.clone());
            return response;
          })
        )
      )
    );
    return;
  }

  // Handle images
  if (request.destination === 'image') {
    event.respondWith(
      caches.open(IMAGES_CACHE).then((cache) =>
        cache.match(request).then((response) => {
          const fetchPromise = fetch(request).then((response) => {
            cache.put(request, response.clone());
            return response;
          });
          return response || fetchPromise;
        })
      )
    );
    return;
  }

  // Handle API requests
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            const responseClone = response.clone();
            caches.open(API_CACHE).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          return response;
        })
        .catch(() => caches.match(request))
    );
    return;
  }

  // Handle Firestore requests (don't cache)
  if (url.hostname === 'firestore.googleapis.com') {
    event.respondWith(fetch(request));
    return;
  }

  // Default: cache first strategy
  event.respondWith(
    caches.match(request).then((response) => response || fetch(request))
  );
});

// ============================================================================
// PUSH NOTIFICATION HANDLING
// ============================================================================

// iOS Safari detection
function isIOSSafari() {
  if (typeof navigator === 'undefined') return false;
  const userAgent = navigator.userAgent || '';
  return /iPad|iPhone|iPod/.test(userAgent) && /Safari/.test(userAgent) && !/CriOS|FxiOS/.test(userAgent);
}

// Enhanced logging for iOS
function logPushMessage(message, data = null) {
  const prefix = isIOSSafari() ? '[SW Push - iOS]' : '[SW Push]';
  console.log(`${prefix} ${message}`, data);
  if (data && data.error) {
    console.error('[SW Push Error]', data.error);
  }
}

// Push event handler
self.addEventListener('push', (event) => {
  let data;
  
  logPushMessage('Push event received', { hasData: !!event.data });

  try {
    data = event.data ? event.data.json() : {};
    logPushMessage('Push data parsed', data);
  } catch (error) {
    logPushMessage('Failed to parse push data', { error });
    data = {
      title: 'Finance Tracker',
      body: 'New notification'
    };
  }

  // Notification options
  const options = {
    body: data.body || 'New transaction recorded',
    icon: '/icon.png',
    badge: '/icon.png',
    tag: 'finance-tracker-notification',
    requireInteraction: false,
    silent: false,
    data: {
      url: data.url || '/',
      timestamp: Date.now(),
      isIOSSafari: isIOSSafari(),
      originalData: data
    }
  };

  // iOS-specific options
  if (isIOSSafari()) {
    options.actions = [
      { action: 'view', title: 'View Transaction' }
    ];
  }

  const title = data.title || 'Finance Tracker';
  
  logPushMessage('Showing notification', { title, options });

  event.waitUntil(
    self.registration.showNotification(title, options)
      .then(() => {
        logPushMessage('Notification shown successfully');
      })
      .catch((error) => {
        logPushMessage('Failed to show notification', { error });
      })
  );
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  logPushMessage('Notification clicked', {
    action: event.action,
    data: event.notification.data
  });

  event.notification.close();

  const url = event.notification.data?.url || '/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clients) => {
        // Try to focus existing client
        const existingClient = clients.find(client => 
          client.url.includes(self.location.origin)
        );

        if (existingClient) {
          logPushMessage('Focusing existing client');
          return existingClient.focus().then(() => {
            existingClient.postMessage({
              type: 'NOTIFICATION_CLICKED',
              url: url,
              isIOSSafari: isIOSSafari()
            });
          });
        } else {
          logPushMessage('Opening new client', { url });
          return self.clients.openWindow(url);
        }
      })
      .catch((error) => {
        logPushMessage('Failed to handle notification click', { error });
      })
  );
});

// Push subscription change handler (important for iOS)
self.addEventListener('pushsubscriptionchange', (event) => {
  logPushMessage('Push subscription changed');

  event.waitUntil(
    getStoredMetadata()
      .then((metadata) => {
        if (!metadata) {
          logPushMessage('No metadata available for subscription change');
          return;
        }

        const applicationServerKey = urlBase64ToUint8Array(metadata.vapidPublicKey);
        
        return self.registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: applicationServerKey
        }).then((newSubscription) => {
          logPushMessage('New subscription created', {
            endpoint: newSubscription.endpoint
          });

          return persistSubscriptionToServer(
            metadata,
            newSubscription,
            event.oldSubscription?.endpoint
          );
        }).then(() => {
          broadcastToClients({
            type: 'subscription_renewed',
            isIOSSafari: isIOSSafari()
          });
        });
      })
      .catch((error) => {
        logPushMessage('Failed to handle subscription change', { error });
        broadcastToClients({
          type: 'subscription_error',
          error: error.message,
          isIOSSafari: isIOSSafari()
        });
      })
  );
});

// Message handler for storing metadata
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'STORE_PUSH_METADATA') {
    logPushMessage('Received metadata storage request', event.data.payload);
    event.waitUntil(storeMetadata(event.data.payload));
  }
});

// Error handlers
self.addEventListener('error', (event) => {
  logPushMessage('Service Worker error', {
    error: event.error,
    filename: event.filename,
    lineno: event.lineno
  });
});

self.addEventListener('unhandledrejection', (event) => {
  logPushMessage('Unhandled promise rejection', {
    reason: event.reason
  });
});

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

// Convert VAPID key
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

// Metadata storage
const METADATA_CACHE_NAME = 'push-subscription-metadata';
const METADATA_REQUEST = new Request('/__push_subscription_metadata__');

async function storeMetadata(payload) {
  if (!payload || typeof payload !== 'object') {
    logPushMessage('Invalid metadata payload', { payload });
    return;
  }

  const { userId, vapidPublicKey } = payload;
  if (typeof userId !== 'string' || typeof vapidPublicKey !== 'string') {
    logPushMessage('Invalid metadata format', {
      userId: typeof userId,
      vapidPublicKey: typeof vapidPublicKey
    });
    return;
  }

  try {
    const cache = await caches.open(METADATA_CACHE_NAME);
    const metadata = {
      userId,
      vapidPublicKey,
      isIOSSafari: isIOSSafari(),
      timestamp: Date.now()
    };

    await cache.put(METADATA_REQUEST, new Response(JSON.stringify(metadata), {
      headers: { 'Content-Type': 'application/json' }
    }));

    logPushMessage('Metadata stored successfully', metadata);
  } catch (error) {
    logPushMessage('Failed to store metadata', { error });
  }
}

async function getStoredMetadata() {
  try {
    const cache = await caches.open(METADATA_CACHE_NAME);
    const response = await cache.match(METADATA_REQUEST);
    
    if (!response) {
      logPushMessage('No metadata found in cache');
      return null;
    }

    const metadata = await response.json();
    logPushMessage('Metadata read successfully', metadata);
    return metadata;
  } catch (error) {
    logPushMessage('Failed to read metadata', { error });
    return null;
  }
}

// Persist subscription to server
async function persistSubscriptionToServer(metadata, subscription, oldEndpoint) {
  if (!metadata || typeof metadata.userId !== 'string') {
    throw new Error('Missing user metadata for push subscription persistence.');
  }

  const subscriptionData = subscription.toJSON();
  const payload = {
    userId: metadata.userId,
    subscription: subscriptionData,
    isIOSSafari: isIOSSafari(),
    userAgent: navigator.userAgent,
    timestamp: Date.now()
  };

  if (oldEndpoint) {
    payload.oldEndpoint = oldEndpoint;
  }

  logPushMessage('Persisting subscription to server', {
    userId: metadata.userId,
    isIOSSafari: payload.isIOSSafari
  });

  try {
    const response = await fetch('/api/push-subscriptions', {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        'X-iOS-Safari': isIOSSafari() ? 'true' : 'false'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`Failed to persist subscription: ${response.status} - ${response.statusText}`);
    }

    logPushMessage('Subscription persisted successfully');
  } catch (error) {
    logPushMessage('Failed to persist subscription', { error });
    throw error;
  }
}

// Broadcast to clients
async function broadcastToClients(message) {
  try {
    const clients = await self.clients.matchAll({
      type: 'window',
      includeUncontrolled: true
    });

    const broadcastMessage = {
      type: 'PUSH_SUBSCRIPTION_CHANGE',
      payload: {
        ...message,
        isIOSSafari: isIOSSafari(),
        timestamp: Date.now()
      }
    };

    logPushMessage(`Broadcasting to ${clients.length} clients`, broadcastMessage);

    for (const client of clients) {
      client.postMessage(broadcastMessage);
    }
  } catch (error) {
    logPushMessage('Failed to broadcast subscription change', { error });
  }
}