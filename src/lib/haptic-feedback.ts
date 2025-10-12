/**
 * Haptic Feedback Utility for Mobile Interactions
 * Provides tactile feedback for various user interactions
 */

export type HapticPattern = 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error' | 'selection';

interface HapticConfig {
  pattern: number | number[];
  description: string;
}

const HAPTIC_PATTERNS: Record<HapticPattern, HapticConfig> = {
  light: { pattern: 10, description: 'Light tap feedback' },
  medium: { pattern: 25, description: 'Medium tap feedback' },
  heavy: { pattern: 50, description: 'Heavy tap feedback' },
  success: { pattern: [10, 50, 10], description: 'Success confirmation' },
  warning: { pattern: [25, 100, 25], description: 'Warning alert' },
  error: { pattern: [50, 100, 50, 100, 50], description: 'Error notification' },
  selection: { pattern: 5, description: 'Selection feedback' },
};

/**
 * Triggers haptic feedback if supported by the device
 * @param pattern - The haptic pattern to play
 * @param fallback - Whether to use fallback vibration if haptic API is not available
 */
export const triggerHaptic = (pattern: HapticPattern = 'light', fallback: boolean = true): void => {
  try {
    const config = HAPTIC_PATTERNS[pattern];
    
    // Check for Haptic Feedback API (iOS Safari)
    if ('vibrate' in navigator && typeof (navigator as any).vibrate === 'function') {
      const vibrationPattern = Array.isArray(config.pattern) ? config.pattern : [config.pattern];
      (navigator as any).vibrate(vibrationPattern);
      return;
    }
    
    // Fallback for devices without haptic support
    if (fallback && 'vibrate' in navigator && typeof (navigator as any).vibrate === 'function') {
      (navigator as any).vibrate(10);
    }
  } catch (error) {
    // Silently fail if haptic feedback is not supported
    console.debug('Haptic feedback not supported:', error);
  }
};

/**
 * Enhanced haptic feedback for specific UI interactions
 */
export const hapticFeedback = {
  // Button interactions
  buttonPress: () => triggerHaptic('light'),
  buttonLongPress: () => triggerHaptic('medium'),
  
  // Form interactions
  inputFocus: () => triggerHaptic('selection'),
  inputError: () => triggerHaptic('error'),
  formSubmit: () => triggerHaptic('success'),
  
  // Navigation
  swipeGesture: () => triggerHaptic('light'),
  dragStart: () => triggerHaptic('medium'),
  dragEnd: () => triggerHaptic('light'),
  
  // Drawer interactions
  drawerOpen: () => triggerHaptic('light'),
  drawerClose: () => triggerHaptic('light'),
  drawerResize: () => triggerHaptic('selection'),
  drawerDismiss: () => triggerHaptic('medium'),
  
  // Transaction actions
  transactionAdd: () => triggerHaptic('success'),
  transactionEdit: () => triggerHaptic('medium'),
  transactionDelete: () => triggerHaptic('warning'),
  
  // Category selection
  categorySelect: () => triggerHaptic('selection'),
  categoryAdd: () => triggerHaptic('success'),
  
  // Error states
  validationError: () => triggerHaptic('error'),
  networkError: () => triggerHaptic('warning'),
  
  // Success states
  saveSuccess: () => triggerHaptic('success'),
  loadComplete: () => triggerHaptic('light'),
};

/**
 * Check if haptic feedback is supported on the current device
 */
export const isHapticSupported = (): boolean => {
  return 'vibrate' in navigator;
};

/**
 * Hook for using haptic feedback in React components
 */
export const useHapticFeedback = () => {
  return {
    triggerHaptic,
    hapticFeedback,
    isSupported: isHapticSupported(),
  };
};