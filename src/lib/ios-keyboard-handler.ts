'use client';

/**
 * iOS PWA Keyboard Handler
 * Manages keyboard behavior in iOS PWA standalone mode using visualViewport API
 */

export interface KeyboardState {
  isVisible: boolean;
  height: number;
  offset: number;
}

export class IOSKeyboardHandler {
  private listeners: Set<(state: KeyboardState) => void> = new Set();
  private currentState: KeyboardState = {
    isVisible: false,
    height: 0,
    offset: 0,
  };
  private isStandalone = false;
  private isIOS = false;

  constructor() {
    this.isStandalone = typeof window !== 'undefined' && 
      (window.navigator as any)?.standalone === true;
    
    this.isIOS = typeof window !== 'undefined' && 
      /iPad|iPhone|iPod/.test(window.navigator.userAgent);

    if (this.shouldActivate()) {
      this.initialize();
    }
  }

  private shouldActivate(): boolean {
    return this.isIOS && this.isStandalone && 
      typeof window !== 'undefined' && 
      'visualViewport' in window;
  }

  private initialize(): void {
    if (!window.visualViewport) return;

    const handleViewportChange = () => {
      if (!window.visualViewport) return;

      const windowHeight = window.innerHeight;
      const viewportHeight = window.visualViewport.height;
      const keyboardHeight = windowHeight - viewportHeight;
      const isKeyboardVisible = keyboardHeight > 50; // Threshold for keyboard detection

      this.currentState = {
        isVisible: isKeyboardVisible,
        height: isKeyboardVisible ? keyboardHeight : 0,
        offset: isKeyboardVisible ? keyboardHeight : 0,
      };

      this.notifyListeners();
    };

    // Listen to viewport changes
    window.visualViewport.addEventListener('resize', handleViewportChange);
    window.visualViewport.addEventListener('scroll', handleViewportChange);

    // Initial state
    handleViewportChange();
  }

  public subscribe(callback: (state: KeyboardState) => void): () => void {
    this.listeners.add(callback);
    
    // Immediately call with current state
    callback(this.currentState);

    // Return unsubscribe function
    return () => {
      this.listeners.delete(callback);
    };
  }

  private notifyListeners(): void {
    this.listeners.forEach(callback => callback(this.currentState));
  }

  public getCurrentState(): KeyboardState {
    return { ...this.currentState };
  }

  public isActive(): boolean {
    return this.shouldActivate();
  }
}

// Singleton instance
let keyboardHandler: IOSKeyboardHandler | null = null;

export function getIOSKeyboardHandler(): IOSKeyboardHandler {
  if (!keyboardHandler) {
    keyboardHandler = new IOSKeyboardHandler();
  }
  return keyboardHandler;
}

/**
 * React hook for iOS keyboard state
 */
export function useIOSKeyboard(): KeyboardState {
  const [state, setState] = React.useState<KeyboardState>({
    isVisible: false,
    height: 0,
    offset: 0,
  });

  React.useEffect(() => {
    const handler = getIOSKeyboardHandler();
    const unsubscribe = handler.subscribe(setState);
    return unsubscribe;
  }, []);

  return state;
}

// Import React for the hook
import * as React from 'react';