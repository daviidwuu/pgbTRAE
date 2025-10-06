
'use client';

import { useEffect } from 'react';

/**
 * A client component that handles the registration of the PWA service worker.
 * This runs once when the app mounts to ensure the service worker is ready.
 */
export function PWAServiceWorkerRegistration() {
  useEffect(() => {
    if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
      navigator.serviceWorker
        .register('/sw.js', { scope: '/' })
        .then((registration) => {
          console.log('Service Worker registered with scope:', registration.scope);
        })
        .catch((error) => {
          console.error('Service Worker registration failed:', error);
        });
    }
  }, []);

  // This component renders nothing.
  return null;
}
