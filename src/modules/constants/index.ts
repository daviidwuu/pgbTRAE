/**
 * Constants Module
 * 
 * Centralized application constants and configuration values.
 * Provides consistent constants across all modules.
 */

// Re-export existing constants for backward compatibility
export * from '../../shared/constants';

// Module Configuration
export const MODULE_CONFIG = {
  AUTH: {
    SESSION_TIMEOUT: 30 * 60 * 1000, // 30 minutes
    REFRESH_INTERVAL: 5 * 60 * 1000, // 5 minutes
  },
  TRANSACTIONS: {
    PAGE_SIZE: 20,
    MAX_AMOUNT: 1000000,
    MIN_AMOUNT: 0.01,
  },
  BUDGETS: {
    DEFAULT_CURRENCY: 'USD',
    MAX_CATEGORIES: 50,
    ALERT_THRESHOLD: 0.8, // 80%
  },
  DASHBOARD: {
    REFRESH_INTERVAL: 60 * 1000, // 1 minute
    CHART_COLORS: [
      '#3B82F6', '#EF4444', '#10B981', '#F59E0B',
      '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16'
    ],
  },
} as const;

// API Endpoints
export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/api/auth/login',
    LOGOUT: '/api/auth/logout',
    PROFILE: '/api/auth/profile',
  },
  TRANSACTIONS: {
    LIST: '/api/transactions',
    CREATE: '/api/transactions',
    UPDATE: '/api/transactions/:id',
    DELETE: '/api/transactions/:id',
  },
  BUDGETS: {
    LIST: '/api/budgets',
    CREATE: '/api/budgets',
    UPDATE: '/api/budgets/:id',
    DELETE: '/api/budgets/:id',
  },
} as const;

// Error Messages
export const ERROR_MESSAGES = {
  GENERIC: 'An unexpected error occurred',
  NETWORK: 'Network connection error',
  AUTH: {
    UNAUTHORIZED: 'You are not authorized to perform this action',
    SESSION_EXPIRED: 'Your session has expired',
    INVALID_CREDENTIALS: 'Invalid email or password',
  },
  VALIDATION: {
    REQUIRED_FIELD: 'This field is required',
    INVALID_EMAIL: 'Please enter a valid email address',
    INVALID_AMOUNT: 'Please enter a valid amount',
  },
} as const;

// Success Messages
export const SUCCESS_MESSAGES = {
  TRANSACTION: {
    CREATED: 'Transaction created successfully',
    UPDATED: 'Transaction updated successfully',
    DELETED: 'Transaction deleted successfully',
  },
  BUDGET: {
    CREATED: 'Budget created successfully',
    UPDATED: 'Budget updated successfully',
    DELETED: 'Budget deleted successfully',
  },
  AUTH: {
    LOGIN: 'Welcome back!',
    LOGOUT: 'Logged out successfully',
    PROFILE_UPDATED: 'Profile updated successfully',
  },
} as const;

// Feature Flags
export const FEATURE_FLAGS = {
  RECURRING_TRANSACTIONS: true,
  BUDGET_ANALYTICS: true,
  EXPORT_DATA: true,
  DARK_MODE: true,
  NOTIFICATIONS: true,
} as const;