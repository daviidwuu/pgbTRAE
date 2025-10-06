// iOS-specific push notification setup
export async function setupIOSPushNotifications(): Promise<void> {
  console.log('[iOS Push Setup] Initializing iOS push notifications');
  
  try {
    // Request notification permission
    const permission = await Notification.requestPermission();
    
    if (permission !== 'granted') {
      console.warn('[iOS Push Setup] Notification permission denied');
      return;
    }

    // Register service worker for push notifications
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.ready;
      
      // Subscribe to push notifications
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
      });

      console.log('[iOS Push Setup] Push subscription created:', subscription.endpoint);
      
      // Send subscription to server
      await fetch('/api/push-subscriptions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-iOS-Safari': 'true',
        },
        body: JSON.stringify({
          subscription: subscription.toJSON(),
          isIOSSafari: true,
          userAgent: navigator.userAgent,
        }),
      });

      console.log('[iOS Push Setup] Push notifications setup complete');
    }
  } catch (error) {
    console.error('[iOS Push Setup] Failed to setup push notifications:', error);
  }
}