// Advanced push notification optimizations
export interface PushNotificationConfig {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  data?: any;
  requireInteraction?: boolean;
  silent?: boolean;
  vibrate?: number[];
  timestamp?: number;
}

export interface NotificationSchedule {
  id: string;
  config: PushNotificationConfig;
  scheduledTime: number;
  recurring?: {
    interval: 'daily' | 'weekly' | 'monthly';
    daysOfWeek?: number[];
    time?: string;
  };
  conditions?: {
    minAmount?: number;
    categories?: string[];
    budgetThreshold?: number;
  };
}

export class AdvancedPushNotifications {
  private static instance: AdvancedPushNotifications;
  private scheduledNotifications: Map<string, NotificationSchedule> = new Map();
  private notificationHistory: Array<{ id: string; sentAt: number; opened: boolean }> = [];
  private readonly STORAGE_KEY = 'scheduled-notifications';
  private readonly HISTORY_KEY = 'notification-history';

  static getInstance(): AdvancedPushNotifications {
    if (!AdvancedPushNotifications.instance) {
      AdvancedPushNotifications.instance = new AdvancedPushNotifications();
    }
    return AdvancedPushNotifications.instance;
  }

  // Schedule a notification
  scheduleNotification(schedule: NotificationSchedule): void {
    this.scheduledNotifications.set(schedule.id, schedule);
    this.saveScheduledNotifications();
    
    console.log('[Advanced Push] Notification scheduled:', schedule.id);
    
    // Set up timer for one-time notifications
    if (!schedule.recurring) {
      const delay = schedule.scheduledTime - Date.now();
      if (delay > 0) {
        setTimeout(() => {
          this.sendScheduledNotification(schedule.id);
        }, delay);
      }
    }
  }

  // Cancel a scheduled notification
  cancelNotification(id: string): void {
    this.scheduledNotifications.delete(id);
    this.saveScheduledNotifications();
    console.log('[Advanced Push] Notification cancelled:', id);
  }

  // Send a notification immediately
  async sendNotification(config: PushNotificationConfig): Promise<boolean> {
    try {
      if (!('Notification' in window)) {
        console.warn('[Advanced Push] Notifications not supported');
        return false;
      }

      if (Notification.permission !== 'granted') {
        console.warn('[Advanced Push] Notification permission not granted');
        return false;
      }

      // Enhance config with iOS optimizations
      const enhancedConfig = this.enhanceConfigForIOS(config);

      const notification = new Notification(enhancedConfig.title, {
        body: enhancedConfig.body,
        icon: enhancedConfig.icon || '/icon.png',
        badge: enhancedConfig.badge || '/icon.png',
        tag: enhancedConfig.tag || `notification-${Date.now()}`,
        data: enhancedConfig.data,
        requireInteraction: enhancedConfig.requireInteraction || false,
        silent: enhancedConfig.silent || false,
      } as NotificationOptions);

      // Track notification
      this.trackNotification(notification.tag, false);

      // Handle notification click
      notification.onclick = () => {
        this.trackNotification(notification.tag, true);
        window.focus();
        notification.close();
        
        // Handle custom actions
        if (config.data?.url) {
          window.location.href = config.data.url;
        }
      };

      // Auto-close after delay (iOS optimization)
      if (this.isIOSSafari()) {
        setTimeout(() => {
          notification.close();
        }, 10000); // 10 seconds
      }

      console.log('[Advanced Push] Notification sent:', config.title);
      return true;
    } catch (error) {
      console.error('[Advanced Push] Failed to send notification:', error);
      return false;
    }
  }

  // Send scheduled notification
  private async sendScheduledNotification(id: string): Promise<void> {
    const schedule = this.scheduledNotifications.get(id);
    if (!schedule) return;

    // Check conditions if specified
    if (schedule.conditions && !this.checkConditions(schedule.conditions)) {
      console.log('[Advanced Push] Conditions not met for notification:', id);
      return;
    }

    const sent = await this.sendNotification(schedule.config);
    
    if (sent) {
      // Handle recurring notifications
      if (schedule.recurring) {
        this.scheduleNextRecurrence(schedule);
      } else {
        // Remove one-time notification
        this.cancelNotification(id);
      }
    }
  }

  // Schedule next recurrence
  private scheduleNextRecurrence(schedule: NotificationSchedule): void {
    if (!schedule.recurring) return;

    let nextTime = Date.now();
    
    switch (schedule.recurring.interval) {
      case 'daily':
        nextTime += 24 * 60 * 60 * 1000; // 1 day
        break;
      case 'weekly':
        nextTime += 7 * 24 * 60 * 60 * 1000; // 1 week
        break;
      case 'monthly':
        nextTime += 30 * 24 * 60 * 60 * 1000; // 30 days
        break;
    }

    const nextSchedule: NotificationSchedule = {
      ...schedule,
      scheduledTime: nextTime,
    };

    this.scheduleNotification(nextSchedule);
  }

  // Check notification conditions
  private checkConditions(conditions: NotificationSchedule['conditions']): boolean {
    // This would integrate with your app's data
    // For now, return true as a placeholder
    console.log('[Advanced Push] Checking conditions:', conditions);
    return true;
  }

  // Enhance config for iOS
  private enhanceConfigForIOS(config: PushNotificationConfig): PushNotificationConfig {
    if (!this.isIOSSafari()) return config;

    return {
      ...config,
      // iOS-specific optimizations
      requireInteraction: false, // iOS handles this automatically
      vibrate: config.vibrate || [200, 100, 200], // Default vibration pattern
    };
  }

  // Check if running on iOS Safari
  private isIOSSafari(): boolean {
    if (typeof navigator === 'undefined') return false;
    const userAgent = navigator.userAgent || '';
    return /iPad|iPhone|iPod/.test(userAgent) && 
           /Safari/.test(userAgent) && 
           !/CriOS|FxiOS/.test(userAgent);
  }

  // Track notification metrics
  private trackNotification(tag: string, opened: boolean): void {
    this.notificationHistory.push({
      id: tag,
      sentAt: Date.now(),
      opened,
    });

    // Keep only recent history
    if (this.notificationHistory.length > 100) {
      this.notificationHistory = this.notificationHistory.slice(-100);
    }

    this.saveNotificationHistory();
  }

  // Get notification analytics
  getNotificationAnalytics(): {
    totalSent: number;
    totalOpened: number;
    openRate: number;
    recentNotifications: Array<{ id: string; sentAt: number; opened: boolean }>;
  } {
    const totalSent = this.notificationHistory.length;
    const totalOpened = this.notificationHistory.filter(n => n.opened).length;
    const openRate = totalSent > 0 ? (totalOpened / totalSent) * 100 : 0;

    return {
      totalSent,
      totalOpened,
      openRate,
      recentNotifications: this.notificationHistory.slice(-10),
    };
  }

  // Smart notification timing
  getOptimalNotificationTime(): number {
    // Analyze user's interaction patterns to find optimal time
    // For now, return a default time (9 AM)
    const now = new Date();
    const optimal = new Date(now);
    optimal.setHours(9, 0, 0, 0);
    
    // If 9 AM has passed today, schedule for tomorrow
    if (optimal.getTime() <= now.getTime()) {
      optimal.setDate(optimal.getDate() + 1);
    }
    
    return optimal.getTime();
  }

  // Batch notifications for better performance
  async sendBatchNotifications(configs: PushNotificationConfig[]): Promise<number> {
    let successCount = 0;
    
    for (const config of configs) {
      const sent = await this.sendNotification(config);
      if (sent) successCount++;
      
      // Small delay between notifications to avoid overwhelming
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    console.log(`[Advanced Push] Sent ${successCount}/${configs.length} batch notifications`);
    return successCount;
  }

  // Save/load scheduled notifications
  private saveScheduledNotifications(): void {
    try {
      const data = Array.from(this.scheduledNotifications.entries());
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.error('[Advanced Push] Failed to save scheduled notifications:', error);
    }
  }

  private loadScheduledNotifications(): void {
    try {
      const data = localStorage.getItem(this.STORAGE_KEY);
      if (data) {
        const entries = JSON.parse(data);
        this.scheduledNotifications = new Map(entries);
      }
    } catch (error) {
      console.error('[Advanced Push] Failed to load scheduled notifications:', error);
    }
  }

  private saveNotificationHistory(): void {
    try {
      localStorage.setItem(this.HISTORY_KEY, JSON.stringify(this.notificationHistory));
    } catch (error) {
      console.error('[Advanced Push] Failed to save notification history:', error);
    }
  }

  private loadNotificationHistory(): void {
    try {
      const data = localStorage.getItem(this.HISTORY_KEY);
      if (data) {
        this.notificationHistory = JSON.parse(data);
      }
    } catch (error) {
      console.error('[Advanced Push] Failed to load notification history:', error);
    }
  }

  // Initialize advanced push notifications
  init(): void {
    this.loadScheduledNotifications();
    this.loadNotificationHistory();

    // Set up recurring notification checker
    setInterval(() => {
      this.checkRecurringNotifications();
    }, 60000); // Check every minute

    console.log('[Advanced Push] Advanced push notifications initialized');
  }

  // Check and send recurring notifications
  private checkRecurringNotifications(): void {
    const now = Date.now();
    
    this.scheduledNotifications.forEach((schedule) => {
      if (schedule.recurring && schedule.scheduledTime <= now) {
        this.sendScheduledNotification(schedule.id);
      }
    });
  }
}

// Export singleton instance
export const advancedPushNotifications = AdvancedPushNotifications.getInstance();