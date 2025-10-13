/**
 * Utils Module
 * 
 * Centralized utility functions and helpers.
 * Provides consistent utilities across all modules.
 */

// Re-export existing utils for backward compatibility
export * from '../../shared/utils';

// Date utilities
export const DateUtils = {
  formatDate: (date: Date | string | null): string => {
    if (!date) return '';
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString();
  },

  formatDateTime: (date: Date | string | null): string => {
    if (!date) return '';
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleString();
  },

  isToday: (date: Date | string): boolean => {
    const d = typeof date === 'string' ? new Date(date) : date;
    const today = new Date();
    return d.toDateString() === today.toDateString();
  },

  getMonthRange: (date: Date = new Date()): { start: Date; end: Date } => {
    const start = new Date(date.getFullYear(), date.getMonth(), 1);
    const end = new Date(date.getFullYear(), date.getMonth() + 1, 0);
    return { start, end };
  },
};

// Currency utilities
export const CurrencyUtils = {
  format: (amount: number, currency: string = 'USD'): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
    }).format(amount);
  },

  parse: (value: string): number => {
    const cleaned = value.replace(/[^0-9.-]/g, '');
    return parseFloat(cleaned) || 0;
  },
};

// Validation utilities
export const ValidationUtils = {
  isEmail: (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },

  isPositiveNumber: (value: number): boolean => {
    return typeof value === 'number' && value > 0 && !isNaN(value);
  },

  isValidAmount: (amount: number): boolean => {
    return ValidationUtils.isPositiveNumber(amount) && amount <= 1000000;
  },

  isEmpty: (value: any): boolean => {
    if (value === null || value === undefined) return true;
    if (typeof value === 'string') return value.trim().length === 0;
    if (Array.isArray(value)) return value.length === 0;
    if (typeof value === 'object') return Object.keys(value).length === 0;
    return false;
  },
};

// Array utilities
export const ArrayUtils = {
  unique: <T>(array: T[]): T[] => {
    return [...new Set(array)];
  },

  groupBy: <T, K extends keyof T>(array: T[], key: K): Record<string, T[]> => {
    return array.reduce((groups, item) => {
      const group = String(item[key]);
      groups[group] = groups[group] || [];
      groups[group].push(item);
      return groups;
    }, {} as Record<string, T[]>);
  },

  sortBy: <T>(array: T[], key: keyof T, direction: 'asc' | 'desc' = 'asc'): T[] => {
    return [...array].sort((a, b) => {
      const aVal = a[key];
      const bVal = b[key];
      if (aVal < bVal) return direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return direction === 'asc' ? 1 : -1;
      return 0;
    });
  },
};

// Storage utilities
export const StorageUtils = {
  get: <T>(key: string, defaultValue?: T): T | null => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue || null;
    } catch {
      return defaultValue || null;
    }
  },

  set: <T>(key: string, value: T): void => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error('Failed to save to localStorage:', error);
    }
  },

  remove: (key: string): void => {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error('Failed to remove from localStorage:', error);
    }
  },
};

// Async utilities
export const AsyncUtils = {
  delay: (ms: number): Promise<void> => {
    return new Promise(resolve => setTimeout(resolve, ms));
  },

  retry: async <T>(
    fn: () => Promise<T>,
    maxAttempts: number = 3,
    delayMs: number = 1000
  ): Promise<T> => {
    let lastError: Error;
    
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error as Error;
        if (attempt < maxAttempts) {
          await AsyncUtils.delay(delayMs * attempt);
        }
      }
    }
    
    throw lastError!;
  },
};