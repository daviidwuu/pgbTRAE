import { useState, useEffect } from "react";
import { useUser, useFirestore } from "@/firebase";
import {
  requestNotificationPermission,
  unsubscribeFromNotifications,
  getSubscription,
  syncSubscriptionWithFirestore,
} from "@/firebase/messaging";
import { useToast } from "@/shared/hooks";

const NOTIFICATION_PROMPT_KEY = 'notificationPromptShown';

export function useNotifications() {
  const [isPushSubscribed, setIsPushSubscribed] = useState(false);
  const [showNotificationPrompt, setShowNotificationPrompt] = useState(false);
  const [showIosPwaInstructions, setShowIosPwaInstructions] = useState(false);

  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();

  useEffect(() => {
    const checkSubscription = async () => {
      if (typeof window === 'undefined' || !('serviceWorker' in navigator) || !('PushManager' in window)) {
        console.log('[Push Debug] Service worker or PushManager not supported');
        return;
      }

      console.log('[Push Debug] Checking notification permission:', Notification.permission);
      console.log('[Push Debug] Checking existing subscription...');
      
      const sub = await getSubscription();
      console.log('[Push Debug] Current subscription:', sub ? 'Found' : 'None');
      
      setIsPushSubscribed(!!sub);
      const promptShown = localStorage.getItem(NOTIFICATION_PROMPT_KEY);
      console.log('[Push Debug] Prompt previously shown:', promptShown);
      
      if (!promptShown && !sub) {
        console.log('[Push Debug] Showing notification prompt');
        setShowNotificationPrompt(true);
      }
    };

    void checkSubscription();
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined' || !user || !firestore) return;

    // @ts-ignore - Firebase Firestore type compatibility
    void syncSubscriptionWithFirestore(user.uid, firestore);
  }, [user, firestore]);

  const handleNotificationToggle = async (checked: boolean) => {
    console.log('[Push Debug] Toggle clicked:', checked);
    console.log('[Push Debug] Current permission:', Notification.permission);
    
    if (checked) {
        await handleAllowNotifications();
    } else {
        await handleDenyNotifications(true); // true to indicate it's from the toggle
    }
  };

  const handleAllowNotifications = async () => {
    console.log('[Push Debug] handleAllowNotifications called');
    
    if (!user || !firestore || typeof window === 'undefined') {
      console.log('[Push Debug] Missing requirements:', { user: !!user, firestore: !!firestore, window: typeof window !== 'undefined' });
      return;
    }

    localStorage.setItem(NOTIFICATION_PROMPT_KEY, 'true');
    setShowNotificationPrompt(false);

    const isIos = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isStandalone = (navigator as any).standalone === true || 
      window.matchMedia('(display-mode: standalone)').matches;
    
    console.log('[Push Debug] Device info:', { 
      isIos, 
      isStandalone, 
      userAgent: navigator.userAgent.substring(0, 100),
      notificationPermission: Notification.permission
    });

    if (isIos && !isStandalone) {
        console.log('[Push Debug] iOS device not in standalone mode, showing PWA instructions');
        setShowIosPwaInstructions(true);
        return;
    }

    console.log('[Push Debug] Attempting to request notification permission...');
    setIsPushSubscribed(true);
    try {
        // @ts-ignore - Firebase Firestore type compatibility
        const subscription = await requestNotificationPermission(user.uid, firestore);
        
        if (subscription) {
          console.log('[Push Debug] Subscription successful');
          setIsPushSubscribed(true);
        } else {
          console.log('[Push Debug] Subscription failed or was denied');
          setIsPushSubscribed(false);
        }
    } catch (error) {
        console.error('[Push Debug] Error requesting notification permission:', error);
        setIsPushSubscribed(false);
    }
  };

  const handleDenyNotifications = async (fromToggle = false) => {
    console.log('[Push Debug] handleDenyNotifications called, fromToggle:', fromToggle);
    
    localStorage.setItem(NOTIFICATION_PROMPT_KEY, 'true');
    setShowNotificationPrompt(false);
    
    if (fromToggle && user && firestore) {
        console.log('[Push Debug] Unsubscribing from notifications...');
        try {
            // @ts-ignore - Firebase Firestore type compatibility
            await unsubscribeFromNotifications(user.uid, firestore);
            setIsPushSubscribed(false);
        } catch (error) {
            console.error('[Push Debug] Error unsubscribing:', error);
        }
    }
  };

  return {
    // State
    isPushSubscribed,
    showNotificationPrompt,
    showIosPwaInstructions,
    
    // Actions
    setIsPushSubscribed,
    setShowNotificationPrompt,
    setShowIosPwaInstructions,
    handleNotificationToggle,
    handleAllowNotifications,
    handleDenyNotifications,
  };
}