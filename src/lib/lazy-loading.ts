// Lazy loading system for iOS-specific features
export interface LazyLoadableFeature {
  name: string;
  condition: () => boolean;
  loader: () => Promise<any>;
  priority: 'high' | 'medium' | 'low';
  loaded: boolean;
}

export class LazyLoadingManager {
  private static instance: LazyLoadingManager;
  private features: Map<string, LazyLoadableFeature> = new Map();
  private loadingPromises: Map<string, Promise<any>> = new Map();

  static getInstance(): LazyLoadingManager {
    if (!LazyLoadingManager.instance) {
      LazyLoadingManager.instance = new LazyLoadingManager();
    }
    return LazyLoadingManager.instance;
  }

  // Register a feature for lazy loading
  registerFeature(feature: Omit<LazyLoadableFeature, 'loaded'>): void {
    const lazyFeature: LazyLoadableFeature = {
      ...feature,
      loaded: false,
    };
    
    this.features.set(feature.name, lazyFeature);
    console.log(`[Lazy Loading] Registered feature: ${feature.name}`);
  }

  // Load a specific feature
  async loadFeature(name: string): Promise<any> {
    const feature = this.features.get(name);
    if (!feature) {
      throw new Error(`Feature ${name} not registered`);
    }

    if (feature.loaded) {
      console.log(`[Lazy Loading] Feature ${name} already loaded`);
      return;
    }

    // Check if already loading
    if (this.loadingPromises.has(name)) {
      return this.loadingPromises.get(name);
    }

    // Check condition before loading
    if (!feature.condition()) {
      console.log(`[Lazy Loading] Condition not met for feature: ${name}`);
      return;
    }

    console.log(`[Lazy Loading] Loading feature: ${name}`);
    
    const loadingPromise = feature.loader()
      .then((result) => {
        feature.loaded = true;
        this.loadingPromises.delete(name);
        console.log(`[Lazy Loading] Feature loaded successfully: ${name}`);
        return result;
      })
      .catch((error) => {
        this.loadingPromises.delete(name);
        console.error(`[Lazy Loading] Failed to load feature ${name}:`, error);
        throw error;
      });

    this.loadingPromises.set(name, loadingPromise);
    return loadingPromise;
  }

  // Load features by priority
  async loadFeaturesByPriority(priority: 'high' | 'medium' | 'low'): Promise<void> {
    const featuresOfPriority = Array.from(this.features.values())
      .filter(f => f.priority === priority && !f.loaded && f.condition());

    if (featuresOfPriority.length === 0) {
      console.log(`[Lazy Loading] No ${priority} priority features to load`);
      return;
    }

    console.log(`[Lazy Loading] Loading ${featuresOfPriority.length} ${priority} priority features`);

    const loadPromises = featuresOfPriority.map(feature => 
      this.loadFeature(feature.name).catch(error => {
        console.warn(`[Lazy Loading] Failed to load ${feature.name}:`, error);
      })
    );

    await Promise.allSettled(loadPromises);
  }

  // Load all applicable features
  async loadAllFeatures(): Promise<void> {
    // Load in priority order
    await this.loadFeaturesByPriority('high');
    await this.loadFeaturesByPriority('medium');
    await this.loadFeaturesByPriority('low');
  }

  // Check if a feature is loaded
  isFeatureLoaded(name: string): boolean {
    const feature = this.features.get(name);
    return feature ? feature.loaded : false;
  }

  // Get loading status
  getLoadingStatus(): { [key: string]: boolean } {
    const status: { [key: string]: boolean } = {};
    this.features.forEach((feature, name) => {
      status[name] = feature.loaded;
    });
    return status;
  }

  // Initialize with iOS-specific features
  initIOSFeatures(): void {
    // iOS Push Notifications
    this.registerFeature({
      name: 'ios-push-notifications',
      condition: () => {
        const userAgent = navigator.userAgent || '';
        return /iPad|iPhone|iPod/.test(userAgent) && 
               /Safari/.test(userAgent) && 
               !/CriOS|FxiOS/.test(userAgent);
      },
      loader: async () => {
        // Lazy load iOS push notification setup
        const { setupIOSPushNotifications } = await import('@/lib/ios-push-setup');
        return setupIOSPushNotifications();
      },
      priority: 'high',
    });

    // iOS Haptic Feedback
    this.registerFeature({
      name: 'ios-haptic-feedback',
      condition: () => {
        return 'vibrate' in navigator && /iPad|iPhone|iPod/.test(navigator.userAgent);
      },
      loader: async () => {
        const { IOSHapticFeedback } = await import('@/lib/ios-haptic-feedback');
        return new IOSHapticFeedback();
      },
      priority: 'medium',
    });

    // iOS Camera Integration
    this.registerFeature({
      name: 'ios-camera-integration',
      condition: () => {
        return 'mediaDevices' in navigator && 
               'getUserMedia' in navigator.mediaDevices &&
               /iPad|iPhone|iPod/.test(navigator.userAgent);
      },
      loader: async () => {
        const { IOSCameraIntegration } = await import('@/lib/ios-camera-integration');
        return new IOSCameraIntegration();
      },
      priority: 'low',
    });

    // iOS Share API
    this.registerFeature({
      name: 'ios-share-api',
      condition: () => {
        return 'share' in navigator && /iPad|iPhone|iPod/.test(navigator.userAgent);
      },
      loader: async () => {
        const { IOSShareAPI } = await import('@/lib/ios-share-api');
        return new IOSShareAPI();
      },
      priority: 'medium',
    });

    // iOS Biometric Authentication
    this.registerFeature({
      name: 'ios-biometric-auth',
      condition: () => {
        return 'credentials' in navigator && 
               'create' in navigator.credentials &&
               /iPad|iPhone|iPod/.test(navigator.userAgent);
      },
      loader: async () => {
        const { IOSBiometricAuth } = await import('@/lib/ios-biometric-auth');
        return new IOSBiometricAuth();
      },
      priority: 'low',
    });

    console.log('[Lazy Loading] iOS-specific features registered');
  }

  // Initialize lazy loading with intersection observer for performance
  init(): void {
    this.initIOSFeatures();

    // Load high priority features immediately
    setTimeout(() => {
      this.loadFeaturesByPriority('high');
    }, 100);

    // Load medium priority features after initial load
    setTimeout(() => {
      this.loadFeaturesByPriority('medium');
    }, 2000);

    // Load low priority features when idle
    if ('requestIdleCallback' in window) {
      requestIdleCallback(() => {
        this.loadFeaturesByPriority('low');
      });
    } else {
      setTimeout(() => {
        this.loadFeaturesByPriority('low');
      }, 5000);
    }

    // Load remaining features on user interaction
    const loadOnInteraction = () => {
      this.loadAllFeatures();
      document.removeEventListener('click', loadOnInteraction);
      document.removeEventListener('touchstart', loadOnInteraction);
      document.removeEventListener('keydown', loadOnInteraction);
    };

    document.addEventListener('click', loadOnInteraction, { once: true });
    document.addEventListener('touchstart', loadOnInteraction, { once: true });
    document.addEventListener('keydown', loadOnInteraction, { once: true });

    console.log('[Lazy Loading] Initialized with iOS-specific features');
  }
}

// Export singleton instance
export const lazyLoadingManager = LazyLoadingManager.getInstance();