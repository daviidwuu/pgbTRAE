/**
 * Dashboard Constants
 * 
 * Constants specific to the dashboard module.
 */

export const DASHBOARD_CONSTANTS = {
  REFRESH_INTERVAL: 60 * 1000, // 1 minute
  MAX_WIDGETS: 12,
  DEFAULT_DATE_RANGE: 'thisMonth',
  MAX_RECENT_TRANSACTIONS: 10,
  CHART_ANIMATION_DURATION: 300,
} as const;

export const DASHBOARD_VIEW_MODES = {
  OVERVIEW: 'overview',
  DETAILED: 'detailed',
  ANALYTICS: 'analytics',
} as const;

export const DASHBOARD_WIDGET_TYPES = {
  BALANCE: 'balance',
  TRANSACTIONS: 'transactions',
  BUDGET: 'budget',
  ANALYTICS: 'analytics',
  SAVINGS: 'savings',
  GOALS: 'goals',
} as const;

export const DASHBOARD_THEMES = {
  LIGHT: 'light',
  DARK: 'dark',
  AUTO: 'auto',
} as const;

export const DASHBOARD_ERRORS = {
  LOAD_FAILED: 'Failed to load dashboard data',
  WIDGET_ERROR: 'Widget failed to load',
  FILTER_ERROR: 'Failed to apply filters',
  SAVE_LAYOUT_ERROR: 'Failed to save dashboard layout',
} as const;

export const DASHBOARD_SUCCESS_MESSAGES = {
  LAYOUT_SAVED: 'Dashboard layout saved successfully',
  WIDGET_ADDED: 'Widget added successfully',
  WIDGET_REMOVED: 'Widget removed successfully',
  FILTERS_APPLIED: 'Filters applied successfully',
} as const;

export const DASHBOARD_CHART_COLORS = [
  '#3B82F6', '#EF4444', '#10B981', '#F59E0B',
  '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16'
] as const;