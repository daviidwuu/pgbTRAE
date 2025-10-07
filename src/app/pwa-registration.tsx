
'use client';

import { useEffect } from 'react';

/**
 * A client component that handles the registration of the PWA service worker.
 * This runs once when the app mounts to ensure the service worker is ready.
 */
export function PWAServiceWorkerRegistration() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      // Register service worker in both development and production
      navigator.serviceWorker
        .register('/sw.js', { scope: '/' })
        .then((registration) => {
          console.log('✅ Service Worker registered with scope:', registration.scope);
          console.log('Service Worker state:', registration.active?.state);
          
          // Wait for service worker to be ready
          return navigator.serviceWorker.ready;
        })
        .then((registration) => {
          console.log('✅ Service Worker is ready:', registration);
        })
        .catch((error) => {
          console.error('❌ Service Worker registration failed:', error);
        });
    } else {
      console.warn('⚠️ Service Worker not supported in this browser');
    }
  }, []);

  // This component renders nothing.
  return null;
}
