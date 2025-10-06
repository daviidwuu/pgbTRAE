// Comprehensive analytics and monitoring system
export interface AnalyticsEvent {
  name: string;
  category: string;
  action: string;
  label?: string;
  value?: number;
  timestamp: number;
  userId?: string;
  sessionId: string;
  metadata?: Record<string, any>;
}

export interface PerformanceMetric {
  name: string;
  value: number;
  unit: string;
  timestamp: number;
  context?: Record<string, any>;
}

export class AnalyticsMonitor {
  private static instance: AnalyticsMonitor;
  private events: AnalyticsEvent[] = [];
  private metrics: PerformanceMetric[] = [];
  private sessionId: string;
  private userId?: string;
  private readonly MAX_EVENTS = 1000;
  private readonly MAX_METRICS = 500;

  constructor() {
    this.sessionId = this.generateSessionId();
  }

  static getInstance(): AnalyticsMonitor {
    if (!AnalyticsMonitor.instance) {
      AnalyticsMonitor.instance = new AnalyticsMonitor();
    }
    return AnalyticsMonitor.instance;
  }

  // Generate unique session ID
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Set user ID for tracking
  setUserId(userId: string): void {
    this.userId = userId;
    console.log('[Analytics] User ID set:', userId);
  }

  // Track custom event
  trackEvent(event: Omit<AnalyticsEvent, 'timestamp' | 'sessionId'>): void {
    const analyticsEvent: AnalyticsEvent = {
      ...event,
      timestamp: Date.now(),
      sessionId: this.sessionId,
      userId: this.userId,
    };

    this.events.push(analyticsEvent);

    // Keep only recent events
    if (this.events.length > this.MAX_EVENTS) {
      this.events = this.events.slice(-this.MAX_EVENTS);
    }

    // Send to external analytics if available
    this.sendToExternalAnalytics(analyticsEvent);

    console.log('[Analytics] Event tracked:', event.name);
  }

  // Track performance metric
  trackMetric(metric: Omit<PerformanceMetric, 'timestamp'>): void {
    const performanceMetric: PerformanceMetric = {
      ...metric,
      timestamp: Date.now(),
    };

    this.metrics.push(performanceMetric);

    // Keep only recent metrics
    if (this.metrics.length > this.MAX_METRICS) {
      this.metrics = this.metrics.slice(-this.MAX_METRICS);
    }

    console.log('[Analytics] Metric tracked:', metric.name, metric.value, metric.unit);
  }

  // Track page view
  trackPageView(page: string, title?: string): void {
    this.trackEvent({
      name: 'page_view',
      category: 'Navigation',
      action: 'view',
      label: page,
      metadata: {
        title: title || document.title,
        url: window.location.href,
        referrer: document.referrer,
      },
    });
  }

  // Track user interaction
  trackInteraction(element: string, action: string, context?: Record<string, any>): void {
    this.trackEvent({
      name: 'user_interaction',
      category: 'Engagement',
      action: action,
      label: element,
      metadata: context,
    });
  }

  // Track transaction events
  trackTransaction(type: 'create' | 'update' | 'delete', amount?: number): void {
    this.trackEvent({
      name: 'transaction',
      category: 'Finance',
      action: type,
      value: amount,
      metadata: {
        currency: 'USD',
        timestamp: Date.now(),
      },
    });
  }

  // Track PWA events
  trackPWAEvent(event: 'install' | 'launch' | 'offline' | 'online'): void {
    this.trackEvent({
      name: 'pwa_event',
      category: 'PWA',
      action: event,
      metadata: {
        isStandalone: window.matchMedia('(display-mode: standalone)').matches,
        isOnline: navigator.onLine,
      },
    });
  }

  // Track performance metrics automatically
  trackPerformanceMetrics(): void {
    // Core Web Vitals
    if ('web-vitals' in window) {
      // This would integrate with web-vitals library
      console.log('[Analytics] Web Vitals tracking enabled');
    }

    // Navigation timing
    if ('performance' in window && 'getEntriesByType' in performance) {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      if (navigation) {
        this.trackMetric({
          name: 'page_load_time',
          value: navigation.loadEventEnd - navigation.fetchStart,
          unit: 'ms',
          context: { type: 'navigation' },
        });

        this.trackMetric({
          name: 'dom_content_loaded',
          value: navigation.domContentLoadedEventEnd - navigation.fetchStart,
          unit: 'ms',
          context: { type: 'navigation' },
        });
      }
    }

    // Memory usage (if available)
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      this.trackMetric({
        name: 'memory_usage',
        value: memory.usedJSHeapSize / 1024 / 1024,
        unit: 'MB',
        context: { total: memory.totalJSHeapSize / 1024 / 1024 },
      });
    }
  }

  // Send to external analytics services
  private sendToExternalAnalytics(event: AnalyticsEvent): void {
    // Google Analytics 4
    if (typeof window !== 'undefined' && 'gtag' in window) {
      (window as any).gtag('event', event.action, {
        event_category: event.category,
        event_label: event.label,
        value: event.value,
        custom_parameter_1: event.metadata,
      });
    }

    // Custom analytics endpoint
    if (navigator.onLine) {
      fetch('/api/analytics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(event),
      }).catch(error => {
        console.warn('[Analytics] Failed to send event to server:', error);
      });
    }
  }

  // Get analytics summary
  getAnalyticsSummary(): {
    totalEvents: number;
    totalMetrics: number;
    sessionDuration: number;
    topEvents: { name: string; count: number }[];
    averageMetrics: { name: string; average: number; unit: string }[];
  } {
    const now = Date.now();
    const sessionStart = Math.min(...this.events.map(e => e.timestamp));
    
    // Count events by name
    const eventCounts = this.events.reduce((acc, event) => {
      acc[event.name] = (acc[event.name] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const topEvents = Object.entries(eventCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([name, count]) => ({ name, count }));

    // Average metrics by name
    const metricGroups = this.metrics.reduce((acc, metric) => {
      if (!acc[metric.name]) {
        acc[metric.name] = { values: [], unit: metric.unit };
      }
      acc[metric.name].values.push(metric.value);
      return acc;
    }, {} as Record<string, { values: number[]; unit: string }>);

    const averageMetrics = Object.entries(metricGroups).map(([name, data]) => ({
      name,
      average: data.values.reduce((sum, val) => sum + val, 0) / data.values.length,
      unit: data.unit,
    }));

    return {
      totalEvents: this.events.length,
      totalMetrics: this.metrics.length,
      sessionDuration: now - sessionStart,
      topEvents,
      averageMetrics,
    };
  }

  // Export data for analysis
  exportData(): { events: AnalyticsEvent[]; metrics: PerformanceMetric[] } {
    return {
      events: [...this.events],
      metrics: [...this.metrics],
    };
  }

  // Initialize analytics monitoring
  init(): void {
    // Track initial page view
    this.trackPageView(window.location.pathname);

    // Track PWA launch
    if (window.matchMedia('(display-mode: standalone)').matches) {
      this.trackPWAEvent('launch');
    }

    // Track online/offline events
    window.addEventListener('online', () => this.trackPWAEvent('online'));
    window.addEventListener('offline', () => this.trackPWAEvent('offline'));

    // Track performance metrics
    window.addEventListener('load', () => {
      setTimeout(() => this.trackPerformanceMetrics(), 1000);
    });

    // Track page visibility changes
    document.addEventListener('visibilitychange', () => {
      this.trackEvent({
        name: 'page_visibility',
        category: 'Engagement',
        action: document.hidden ? 'hidden' : 'visible',
      });
    });

    // Track unload for session duration
    window.addEventListener('beforeunload', () => {
      const summary = this.getAnalyticsSummary();
      this.trackMetric({
        name: 'session_duration',
        value: summary.sessionDuration,
        unit: 'ms',
      });
    });

    console.log('[Analytics] Comprehensive analytics monitoring initialized');
  }
}

// Export singleton instance
export const analyticsMonitor = AnalyticsMonitor.getInstance();