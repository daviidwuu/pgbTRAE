// Workbox precache manifest placeholder - this will be replaced during build
const precacheManifest = self.__WB_MANIFEST || [];

// Install precached assets
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker with precache manifest');
  event.waitUntil(
    caches.open('precache-v1').then((cache) => {
      return cache.addAll(precacheManifest.map(entry => entry.url));
    })
  );
  self.skipWaiting();
});

// Activate and clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker');
  event.waitUntil(self.clients.claim());
});

// Runtime caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Cache Google Fonts
  if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
    event.respondWith(
      caches.open('google-fonts-cache').then((cache) => {
        return cache.match(request).then((response) => {
          if (response) {
            return response;
          }
          return fetch(request).then((fetchResponse) => {
            cache.put(request, fetchResponse.clone());
            return fetchResponse;
          });
        });
      })
    );
    return;
  }

  // Cache images with stale-while-revalidate
  if (request.destination === 'image') {
    event.respondWith(
      caches.open('images-cache').then((cache) => {
        return cache.match(request).then((response) => {
          const fetchPromise = fetch(request).then((fetchResponse) => {
            cache.put(request, fetchResponse.clone());
            return fetchResponse;
          });
          return response || fetchPromise;
        });
      })
    );
    return;
  }

  // Cache API calls with network-first
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request).then((response) => {
        if (response.ok) {
          const responseClone = response.clone();
          caches.open('api-cache').then((cache) => {
            cache.put(request, responseClone);
          });
        }
        return response;
      }).catch(() => {
        return caches.match(request);
      })
    );
    return;
  }

  // Don't cache Firestore API calls - always use network for real-time data
  if (url.hostname === 'firestore.googleapis.com') {
    event.respondWith(fetch(request));
    return;
  }

  // Default: try cache first, then network
  event.respondWith(
    caches.match(request).then((response) => {
      return response || fetch(request);
    })
  );
});

// Push notification and iOS-specific code
(() => {
  let metadataCacheName = "push-subscription-metadata";
  let metadataRequest = new Request("/__push_subscription_metadata__");
  
  function isIOSSafari() {
    if (typeof navigator === 'undefined') return false;
    const userAgent = navigator.userAgent || '';
    return /iPad|iPhone|iPod/.test(userAgent) && /Safari/.test(userAgent) && !/CriOS|FxiOS/.test(userAgent);
  }
  
  function logPushEvent(message, data = null) {
    console.log(`[SW Push - iOS] ${message}`, data);
    if (data && data.error) {
      console.error('[SW Push Error - iOS]', data.error);
    }
  }
  
  async function storeMetadata(metadata) {
    if (!metadata || typeof metadata !== 'object') {
      logPushEvent('Invalid metadata payload', { payload: metadata });
      return;
    }
    
    const { userId, vapidPublicKey } = metadata;
    if (typeof userId !== 'string' || typeof vapidPublicKey !== 'string') {
      logPushEvent('Invalid metadata format', { 
        userId: typeof userId, 
        vapidPublicKey: typeof vapidPublicKey 
      });
      return;
    }
    
    try {
      const cache = await caches.open(metadataCacheName);
      const data = {
        userId,
        vapidPublicKey,
        isIOSSafari: isIOSSafari(),
        timestamp: Date.now()
      };
      
      await cache.put(metadataRequest, new Response(JSON.stringify(data), {
        headers: { 'Content-Type': 'application/json' }
      }));
      
      logPushEvent('Metadata stored successfully', data);
    } catch (error) {
      logPushEvent('Failed to store metadata', { error });
    }
  }
  
  async function getMetadata() {
    try {
      const cache = await caches.open(metadataCacheName);
      const response = await cache.match(metadataRequest);
      
      if (!response) {
        logPushEvent('No metadata found in cache');
        return null;
      }
      
      const data = await response.json();
      logPushEvent('Metadata read successfully', data);
      return data;
    } catch (error) {
      logPushEvent('Failed to read metadata', { error });
      return null;
    }
  }
  
  async function persistSubscription(metadata, subscription, oldEndpoint) {
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
    
    logPushEvent('Persisting subscription to server', {
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
      
      logPushEvent('Subscription persisted successfully');
    } catch (error) {
      logPushEvent('Failed to persist subscription', { error });
      throw error;
    }
  }
  
  async function broadcastSubscriptionChange(eventData) {
    try {
      const clients = await self.clients.matchAll({
        type: 'window',
        includeUncontrolled: true
      });
      
      const message = {
        type: 'PUSH_SUBSCRIPTION_CHANGE',
        payload: {
          ...eventData,
          isIOSSafari: isIOSSafari(),
          timestamp: Date.now()
        }
      };
      
      logPushEvent(`Broadcasting to ${clients.length} clients`, message);
      
      for (const client of clients) {
        client.postMessage(message);
      }
    } catch (error) {
      logPushEvent('Failed to broadcast subscription change', { error });
    }
  }
  
  // Push event handler
  self.addEventListener('push', (event) => {
    let data;
    logPushEvent('Push event received', { hasData: !!event.data });
    
    try {
      data = event.data ? event.data.json() : {};
      logPushEvent('Push data parsed', data);
    } catch (error) {
      logPushEvent('Failed to parse push data', { error });
      data = { title: 'Finance Tracker', body: 'New notification' };
    }
    
    const notificationOptions = {
      body: data.body || 'New transaction recorded',
      icon: '/icon.png',
      badge: '/icon.png',
      tag: 'finance-tracker-notification',
      requireInteraction: false,
      silent: false,
      data: {
        url: data.url || '/',
        timestamp: Date.now(),
        isIOSSafari: isIOSSafari()
      }
    };
    
    if (isIOSSafari()) {
      notificationOptions.actions = [
        { action: 'view', title: 'View Transaction' }
      ];
    }
    
    const title = data.title || 'Finance Tracker';
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
  
  // Notification click handler
  self.addEventListener('notificationclick', (event) => {
    logPushEvent('Notification clicked', {
      action: event.action,
      data: event.notification.data
    });
    
    event.notification.close();
    
    const url = event.notification.data?.url || '/';
    
    event.waitUntil(
      self.clients.matchAll({
        type: 'window',
        includeUncontrolled: true
      }).then((clients) => {
        const existingClient = clients.find(client => 
          client.url.includes(self.location.origin)
        );
        
        if (existingClient) {
          logPushEvent('Focusing existing client');
          return existingClient.focus().then(() => {
            existingClient.postMessage({
              type: 'NOTIFICATION_CLICKED',
              url: url,
              isIOSSafari: isIOSSafari()
            });
          });
        } else {
          logPushEvent('Opening new client', { url });
          return self.clients.openWindow(url);
        }
      }).catch((error) => {
        logPushEvent('Failed to handle notification click', { error });
      })
    );
  });
  
  // Push subscription change handler
  self.addEventListener('pushsubscriptionchange', (event) => {
    logPushEvent('Push subscription changed');
    
    event.waitUntil(
      getMetadata().then((metadata) => {
        if (!metadata) {
          logPushEvent('No metadata available for subscription change');
          return;
        }
        
        // Convert VAPID key from base64url to Uint8Array
        function urlBase64ToUint8Array(base64String) {
          const padding = '='.repeat((4 - base64String.length % 4) % 4);
          const base64 = (base64String + padding)
            .replace(/-/g, '+')
            .replace(/_/g, '/');
          
          const rawData = atob(base64);
          const outputArray = new Uint8Array(rawData.length);
          
          for (let i = 0; i < rawData.length; ++i) {
            outputArray[i] = rawData.charCodeAt(i);
          }
          return outputArray;
        }
        
        const applicationServerKey = urlBase64ToUint8Array(metadata.vapidPublicKey);
        
        return self.registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: applicationServerKey
        }).then((newSubscription) => {
          logPushEvent('New subscription created', {
            endpoint: newSubscription.endpoint
          });
          
          return persistSubscription(
            metadata, 
            newSubscription, 
            event.oldSubscription?.endpoint
          );
        }).then(() => {
          return broadcastSubscriptionChange({
            type: 'subscription_renewed',
            isIOSSafari: isIOSSafari()
          });
        });
      }).catch((error) => {
        logPushEvent('Failed to handle subscription change', { error });
        return broadcastSubscriptionChange({
          type: 'subscription_error',
          error: error.message,
          isIOSSafari: isIOSSafari()
        });
      })
    );
  });
  
  // Message handler for metadata storage
  self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'STORE_PUSH_METADATA') {
      logPushEvent('Received metadata storage request', event.data.payload);
      event.waitUntil(storeMetadata(event.data.payload));
    }
  });
  
  // Error handlers
  self.addEventListener('error', (event) => {
    logPushEvent('Service Worker error', {
      error: event.error,
      filename: event.filename,
      lineno: event.lineno
    });
  });
  
  self.addEventListener('unhandledrejection', (event) => {
    logPushEvent('Unhandled promise rejection', {
      reason: event.reason
    });
  });
})();