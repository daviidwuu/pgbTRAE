// iOS-specific push notification setup - DEPRECATED
// This file is no longer used as push notifications are handled by the main messaging system
// Keeping for reference but functionality moved to src/firebase/messaging.ts

export async function setupIOSPushNotifications(): Promise<void> {
  console.warn('[iOS Push Setup] This function is deprecated. Use the main messaging system instead.');
  // Functionality moved to src/firebase/messaging.ts
  // This prevents conflicts with the main push notification system
}