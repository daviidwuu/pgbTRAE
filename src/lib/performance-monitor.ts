// Performance monitoring utilities for PWA optimization
export interface PerformanceMetrics {
  cacheHitRate: number;
  loadTime: number;
  offlineCapability: boolean;
  pushNotificationDelivery: number;
  timestamp: number;
}

export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: PerformanceMetrics[] = [];
  private cacheHits = 0;
  private cacheRequests = 0;

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  // Track cache performance
  recordCacheHit(): void {
    this.cacheHits++;
    this.cacheRequests++;
  }

  recordCacheMiss(): void {
    this.cacheRequests++;
  }

  getCacheHitRate(): number {
    return this.cacheRequests > 0 ? (this.cacheHits / this.cacheRequests) * 100 : 0;
  }

  // Track load times
  recordLoadTime(startTime: number): void {
    const loadTime = performance.now() - startTime;
    this.logMetric('load_time', loadTime);
  }

  // Track offline capability
  recordOfflineEvent(isOffline: boolean): void {
    this.logMetric('offline_capability', isOffline ? 1 : 0);
  }

  // Track push notification delivery
  recordPushNotificationDelivery(delivered: boolean): void {
    this.logMetric('push_notification_delivery', delivered ? 1 : 0);
  }

  private logMetric(type: string, value: number): void {
    if (typeof window !== 'undefined' && 'gtag' in window) {
      // Send to Google Analytics if available
      (window as any).gtag('event', 'pwa_performance', {
        event_category: 'Performance',
        event_label: type,
        value: value,
      });
    }

    // Store locally for analysis
    const metric: PerformanceMetrics = {
      cacheHitRate: this.getCacheHitRate(),
      loadTime: type === 'load_time' ? value : 0,
      offlineCapability: type === 'offline_capability' ? value === 1 : false,
      pushNotificationDelivery: type === 'push_notification_delivery' ? value : 0,
      timestamp: Date.now(),
    };

    this.metrics.push(metric);

    // Keep only last 100 metrics
    if (this.metrics.length > 100) {
      this.metrics = this.metrics.slice(-100);
    }
  }

  // Get performance summary
  getPerformanceSummary(): {
    averageCacheHitRate: number;
    averageLoadTime: number;
    offlineSuccessRate: number;
    pushDeliveryRate: number;
  } {
    if (this.metrics.length === 0) {
      return {
        averageCacheHitRate: 0,
        averageLoadTime: 0,
        offlineSuccessRate: 0,
        pushDeliveryRate: 0,
      };
    }

    const loadTimeMetrics = this.metrics.filter(m => m.loadTime > 0);
    const offlineMetrics = this.metrics.filter(m => m.offlineCapability !== undefined);
    const pushMetrics = this.metrics.filter(m => m.pushNotificationDelivery > 0);

    return {
      averageCacheHitRate: this.getCacheHitRate(),
      averageLoadTime: loadTimeMetrics.length > 0 
        ? loadTimeMetrics.reduce((sum, m) => sum + m.loadTime, 0) / loadTimeMetrics.length 
        : 0,
      offlineSuccessRate: offlineMetrics.length > 0
        ? (offlineMetrics.filter(m => m.offlineCapability).length / offlineMetrics.length) * 100
        : 0,
      pushDeliveryRate: pushMetrics.length > 0
        ? (pushMetrics.length / this.metrics.length) * 100
        : 0,
    };
  }

  // Initialize performance monitoring
  init(): void {
    if (typeof window === 'undefined') return;

    // Monitor page load performance
    window.addEventListener('load', () => {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      if (navigation) {
        this.recordLoadTime(navigation.loadEventStart - navigation.fetchStart);
      }
    });

    // Monitor online/offline status
    window.addEventListener('online', () => this.recordOfflineEvent(false));
    window.addEventListener('offline', () => this.recordOfflineEvent(true));

    // Monitor service worker cache events
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data?.type === 'CACHE_HIT') {
          this.recordCacheHit();
        } else if (event.data?.type === 'CACHE_MISS') {
          this.recordCacheMiss();
        }
      });
    }

    console.log('[Performance Monitor] Initialized');
  }
}

// Export singleton instance
export const performanceMonitor = PerformanceMonitor.getInstance();