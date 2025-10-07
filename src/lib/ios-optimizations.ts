// iOS-specific optimizations for PWA performance
export class IOSOptimizations {
  private static instance: IOSOptimizations;

  static getInstance(): IOSOptimizations {
    if (!IOSOptimizations.instance) {
      IOSOptimizations.instance = new IOSOptimizations();
    }
    return IOSOptimizations.instance;
  }

  // Detect if running on iOS Safari
  isIOSSafari(): boolean {
    if (typeof navigator === 'undefined') return false;
    
    const userAgent = navigator.userAgent || '';
    return /iPad|iPhone|iPod/.test(userAgent) && 
           /Safari/.test(userAgent) && 
           !/CriOS|FxiOS/.test(userAgent);
  }

  // Detect if running as PWA (standalone mode)
  isPWAMode(): boolean {
    return window.matchMedia('(display-mode: standalone)').matches ||
           (window.navigator as any).standalone === true;
  }

  // Optimize viewport for iOS
  optimizeViewport(): void {
    if (!this.isIOSSafari()) return;

    // Prevent zoom on input focus and handle virtual keyboard
    const viewportMeta = document.querySelector('meta[name="viewport"]');
    if (viewportMeta) {
      viewportMeta.setAttribute('content', 
        'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover, interactive-widget=resizes-content'
      );
    }

    // Add iOS-specific CSS variables
    document.documentElement.style.setProperty('--ios-safe-area-top', 'env(safe-area-inset-top)');
    document.documentElement.style.setProperty('--ios-safe-area-bottom', 'env(safe-area-inset-bottom)');
    document.documentElement.style.setProperty('--ios-safe-area-left', 'env(safe-area-inset-left)');
    document.documentElement.style.setProperty('--ios-safe-area-right', 'env(safe-area-inset-right)');

    // Handle virtual keyboard appearance
    this.handleVirtualKeyboard();
  }

  // Handle virtual keyboard behavior on iOS
  private handleVirtualKeyboard(): void {
    if (!this.isIOSSafari()) return;

    // Use Visual Viewport API if available
    if ('visualViewport' in window && window.visualViewport) {
      const visualViewport = window.visualViewport;
      
      const handleViewportChange = () => {
        // Update CSS custom property for dynamic viewport height
        document.documentElement.style.setProperty(
          '--viewport-height', 
          `${visualViewport.height}px`
        );
        
        // Add class to body when keyboard is open
        const keyboardOpen = visualViewport.height < window.innerHeight * 0.75;
        document.body.classList.toggle('keyboard-open', keyboardOpen);
      };

      visualViewport.addEventListener('resize', handleViewportChange);
      visualViewport.addEventListener('scroll', handleViewportChange);
      
      // Initial call
      handleViewportChange();
    } else {
      // Fallback for older iOS versions
      let initialViewportHeight = window.innerHeight;
      
      const handleResize = () => {
        const currentHeight = window.innerHeight;
        const keyboardOpen = currentHeight < initialViewportHeight * 0.75;
        document.body.classList.toggle('keyboard-open', keyboardOpen);
        
        document.documentElement.style.setProperty(
          '--viewport-height', 
          `${currentHeight}px`
        );
      };

      window.addEventListener('resize', handleResize);
      
      // Update initial height on orientation change
      window.addEventListener('orientationchange', () => {
        setTimeout(() => {
          initialViewportHeight = window.innerHeight;
          handleResize();
        }, 500);
      });
    }
  }

  // Optimize touch interactions for iOS
  optimizeTouchInteractions(): void {
    if (!this.isIOSSafari()) return;

    // Prevent default touch behaviors that can cause issues
    document.addEventListener('touchstart', (e) => {
      // Allow scrolling but prevent unwanted behaviors
      if (e.touches.length > 1) {
        e.preventDefault(); // Prevent pinch zoom
      }
    }, { passive: false });

    // Optimize scroll performance
    document.addEventListener('touchmove', (e) => {
      // Allow normal scrolling
    }, { passive: true });

    // Add iOS-specific touch styles
    const style = document.createElement('style');
    style.textContent = `
      /* iOS-specific optimizations */
      * {
        -webkit-tap-highlight-color: transparent;
        -webkit-touch-callout: none;
      }
      
      body {
        -webkit-overflow-scrolling: touch;
        overscroll-behavior: none;
      }
      
      input, textarea, select {
        -webkit-appearance: none;
        border-radius: 0;
      }
      
      /* PWA-specific styles */
      @media (display-mode: standalone) {
        body {
          padding-top: var(--ios-safe-area-top, 0);
          padding-bottom: var(--ios-safe-area-bottom, 0);
          padding-left: var(--ios-safe-area-left, 0);
          padding-right: var(--ios-safe-area-right, 0);
        }
      }
    `;
    document.head.appendChild(style);
  }

  // Optimize memory usage for iOS
  optimizeMemoryUsage(): void {
    if (!this.isIOSSafari()) return;

    // Clean up unused resources periodically
    setInterval(() => {
      // Force garbage collection hint
      if ((window as any).gc) {
        (window as any).gc();
      }
      
      // Clean up old cache entries
      this.cleanupOldCacheEntries();
    }, 5 * 60 * 1000); // Every 5 minutes

    // Listen for memory warnings
    window.addEventListener('pagehide', () => {
      this.cleanupOnPageHide();
    });
  }

  // Clean up old cache entries
  private async cleanupOldCacheEntries(): Promise<void> {
    try {
      const cacheNames = await caches.keys();
      const oldCaches = cacheNames.filter(name => 
        name.includes('old-') || name.includes('temp-')
      );

      await Promise.all(
        oldCaches.map(cacheName => caches.delete(cacheName))
      );
    } catch (error) {
      console.warn('[iOS Optimizations] Failed to cleanup old caches:', error);
    }
  }

  // Cleanup on page hide
  private cleanupOnPageHide(): void {
    // Cancel any pending requests
    if ('AbortController' in window) {
      // This would be used with fetch requests that have AbortController
      console.log('[iOS Optimizations] Page hidden, cleaning up resources');
    }
  }

  // Optimize push notifications for iOS
  optimizePushNotifications(): void {
    if (!this.isIOSSafari()) return;

    // iOS Safari has specific requirements for push notifications
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      // Ensure proper permission handling
      this.handleIOSPushPermissions();
    }
  }

  // Handle iOS-specific push permission flow
  private async handleIOSPushPermissions(): Promise<void> {
    try {
      // iOS requires user gesture for permission request
      const permission = await Notification.requestPermission();
      
      if (permission === 'granted') {
        console.log('[iOS Optimizations] Push notifications enabled');
        
        // Store iOS-specific metadata
        localStorage.setItem('ios-push-enabled', 'true');
        localStorage.setItem('ios-push-timestamp', Date.now().toString());
      }
    } catch (error) {
      console.warn('[iOS Optimizations] Push notification setup failed:', error);
    }
  }

  // Optimize network requests for iOS
  optimizeNetworkRequests(): void {
    if (!this.isIOSSafari()) return;

    // Override fetch to add iOS-specific optimizations
    const originalFetch = window.fetch;
    window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
      const options: RequestInit = {
        ...init,
        // Add iOS-specific headers
        headers: {
          ...init?.headers,
          'X-iOS-Safari': 'true',
          'X-PWA-Mode': this.isPWAMode() ? 'true' : 'false',
        },
      };

      // Add timeout for iOS (Safari can be slow)
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

      try {
        const response = await originalFetch(input, {
          ...options,
          signal: controller.signal,
        });
        clearTimeout(timeoutId);
        return response;
      } catch (error) {
        clearTimeout(timeoutId);
        throw error;
      }
    };
  }

  // Initialize all iOS optimizations
  init(): void {
    if (!this.isIOSSafari()) {
      console.log('[iOS Optimizations] Not running on iOS Safari, skipping optimizations');
      return;
    }

    console.log('[iOS Optimizations] Initializing iOS-specific optimizations');
    
    this.optimizeViewport();
    this.optimizeTouchInteractions();
    this.optimizeMemoryUsage();
    this.optimizePushNotifications();
    this.optimizeNetworkRequests();

    // Log PWA mode status
    if (this.isPWAMode()) {
      console.log('[iOS Optimizations] Running in PWA mode');
    } else {
      console.log('[iOS Optimizations] Running in browser mode');
    }
  }
}

// Export singleton instance
export const iosOptimizations = IOSOptimizations.getInstance();