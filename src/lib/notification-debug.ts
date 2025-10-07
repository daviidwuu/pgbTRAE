/**
 * Notification Debug Utilities for iOS PWA
 * Provides comprehensive debugging tools for push notification issues
 */

export interface NotificationDebugInfo {
  browser: {
    userAgent: string;
    isIOSSafari: boolean;
    isStandalone: boolean;
    notificationSupport: boolean;
    serviceWorkerSupport: boolean;
  };
  permissions: {
    notification: NotificationPermission;
    canRequestPermission: boolean;
  };
  serviceWorker: {
    isRegistered: boolean;
    isActive: boolean;
    pushManagerAvailable: boolean;
    currentSubscription: PushSubscription | null;
  };
  vapid: {
    publicKey: string;
    keyLength: number;
  };
  firestore: {
    connected: boolean;
    subscriptionCount?: number;
  };
}

/**
 * Comprehensive notification system debug check
 */
export async function debugNotificationSystem(): Promise<NotificationDebugInfo> {
  const info: NotificationDebugInfo = {
    browser: {
      userAgent: navigator.userAgent,
      isIOSSafari: isIOSSafari(),
      isStandalone: isStandalone(),
      notificationSupport: 'Notification' in window,
      serviceWorkerSupport: 'serviceWorker' in navigator,
    },
    permissions: {
      notification: Notification.permission,
      canRequestPermission: typeof Notification.requestPermission === 'function',
    },
    serviceWorker: {
      isRegistered: false,
      isActive: false,
      pushManagerAvailable: false,
      currentSubscription: null,
    },
    vapid: {
      publicKey: getVapidPublicKey(),
      keyLength: getVapidPublicKey().length,
    },
    firestore: {
      connected: true, // Assume connected for now
    },
  };

  // Check service worker status
  if (info.browser.serviceWorkerSupport) {
    try {
      const registration = await navigator.serviceWorker.getRegistration();
      if (registration) {
        info.serviceWorker.isRegistered = true;
        info.serviceWorker.isActive = registration.active !== null;
        info.serviceWorker.pushManagerAvailable = 'pushManager' in registration;
        
        if (registration.pushManager) {
          info.serviceWorker.currentSubscription = await registration.pushManager.getSubscription();
        }
      }
    } catch (error) {
      console.error('[Debug] Service worker check failed:', error);
    }
  }

  return info;
}

/**
 * Test notification functionality
 */
export async function testNotification(): Promise<boolean> {
  if (!('Notification' in window)) {
    console.error('[Debug] Notifications not supported');
    return false;
  }

  if (Notification.permission !== 'granted') {
    console.error('[Debug] Notification permission not granted');
    return false;
  }

  try {
    const notification = new Notification('Test Notification', {
      body: 'This is a test notification from your PWA',
      icon: '/icon.png',
      badge: '/icon.png',
      tag: 'test-notification',
    });

    // Auto-close after 5 seconds
    setTimeout(() => notification.close(), 5000);
    
    console.log('[Debug] Test notification sent successfully');
    return true;
  } catch (error) {
    console.error('[Debug] Test notification failed:', error);
    return false;
  }
}

/**
 * Log comprehensive debug information
 */
export async function logDebugInfo(): Promise<void> {
  const info = await debugNotificationSystem();
  
  console.group('[Notification Debug] System Information');
  console.log('Browser:', info.browser);
  console.log('Permissions:', info.permissions);
  console.log('Service Worker:', info.serviceWorker);
  console.log('VAPID:', info.vapid);
  console.log('Firestore:', info.firestore);
  console.groupEnd();

  // Additional checks
  if (info.browser.isIOSSafari && !info.browser.isStandalone) {
    console.warn('[Debug] iOS Safari detected but not in standalone mode. Consider adding to home screen.');
  }

  if (info.vapid.keyLength !== 87) {
    console.warn('[Debug] VAPID public key length is unusual:', info.vapid.keyLength);
  }

  if (!info.serviceWorker.isActive) {
    console.error('[Debug] Service worker is not active');
  }

  if (!info.serviceWorker.currentSubscription) {
    console.warn('[Debug] No active push subscription found');
  }
}

// Helper functions
function isIOSSafari(): boolean {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') return false;
  
  const userAgent = navigator.userAgent || '';
  const isIOS = /iPad|iPhone|iPod/.test(userAgent);
  const isSafari = /Safari/.test(userAgent) && !/CriOS|FxiOS|EdgiOS/.test(userAgent);
  const isStandaloneMode = isStandalone();
  
  return isIOS && (isSafari || isStandaloneMode);
}

function isStandalone(): boolean {
  return (navigator as any).standalone === true || 
    window.matchMedia('(display-mode: standalone)').matches;
}

function getVapidPublicKey(): string {
  return process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || 
    'BDaR2LHlKHBdEgxJe4jCtpuMEdVsy3hVprllCQ0PpMw-sUR123gkAY145aIOH4Wuma0j4T08iRrqZpTSjFmjkGA';
}

// Global debug function
if (typeof window !== 'undefined') {
  (window as any).debugNotifications = {
    logInfo: logDebugInfo,
    test: testNotification,
    getInfo: debugNotificationSystem,
  };
}