const CACHE_NAME = 'pwa-starter-v1';

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      // Pre-caching can be done here, but we'll cache on-the-fly.
      return cache.addAll([]);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  return self.clients.claim();
});

self.addEventListener('fetch', event => {
  // Only handle GET requests
  if (event.request.method !== 'GET') {
    return;
  }
  
  event.respondWith(
    caches.open(CACHE_NAME).then(async (cache) => {
      const cachedResponse = await cache.match(event.request);

      const fetchPromise = fetch(event.request).then(networkResponse => {
        // If we get a valid response, we cache it.
        if (networkResponse && networkResponse.status === 200) {
          cache.put(event.request, networkResponse.clone());
        }
        return networkResponse;
      }).catch(err => {
        // This will be triggered when the network is down.
        // The cachedResponse will be served if it exists.
        console.error('Service Worker fetch failed:', err);
      });

      // Return from cache first, then from network.
      // This is a stale-while-revalidate-like strategy.
      // It serves cached content immediately and updates the cache in the background.
      // If offline, it will just serve the cached content if available.
      return cachedResponse || fetchPromise;
    })
  );
});
