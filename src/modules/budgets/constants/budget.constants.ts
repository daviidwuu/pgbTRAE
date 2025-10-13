/**
 * Budget Constants
 * 
 * Constants specific to the budget module.
 */

export const BUDGET_CONSTANTS = {
  DEFAULT_CURRENCY: 'USD',
  MAX_CATEGORIES: 50,
  ALERT_THRESHOLD: 0.8, // 80%
  WARNING_THRESHOLD: 0.7, // 70%
  MAX_BUDGET_AMOUNT: 1000000,
  MIN_BUDGET_AMOUNT: 0.01,
} as const;

export const BUDGET_TYPES = {
  EXPENSE: 'expense',
  INCOME: 'income',
} as const;

export const BUDGET_STATUS_TYPES = {
  UNDER: 'under',
  NEAR: 'near',
  OVER: 'over',
} as const;

export const BUDGET_ERRORS = {
  INVALID_AMOUNT: 'Budget amount must be a positive number',
  AMOUNT_TOO_LARGE: `Budget amount cannot exceed ${BUDGET_CONSTANTS.MAX_BUDGET_AMOUNT.toLocaleString()}`,
  AMOUNT_TOO_SMALL: `Budget amount must be at least ${BUDGET_CONSTANTS.MIN_BUDGET_AMOUNT}`,
  INVALID_CATEGORY: 'Category is required',
  CATEGORY_EXISTS: 'Budget already exists for this category',
  BUDGET_NOT_FOUND: 'Budget not found',
  UNAUTHORIZED_ACCESS: 'You are not authorized to access this budget',
  MAX_CATEGORIES_REACHED: `Maximum of ${BUDGET_CONSTANTS.MAX_CATEGORIES} categories allowed`,
} as const;

export const BUDGET_SUCCESS_MESSAGES = {
  CREATED: 'Budget created successfully',
  UPDATED: 'Budget updated successfully',
  DELETED: 'Budget deleted successfully',
  BULK_CREATED: 'Budgets created successfully',
  BULK_UPDATED: 'Budgets updated successfully',
  ALERT_DISMISSED: 'Budget alert dismissed',
} as const;

export const BUDGET_ALERT_TYPES = {
  WARNING: 'warning',
  EXCEEDED: 'exceeded',
  NEAR_LIMIT: 'near_limit',
} as const;

export const BUDGET_PERIODS = {
  MONTHLY: 'monthly',
  WEEKLY: 'weekly',
  YEARLY: 'yearly',
} as const;

export const BUDGET_CHART_COLORS = {
  UNDER_BUDGET: '#10B981', // Green
  NEAR_LIMIT: '#F59E0B',   // Yellow
  OVER_BUDGET: '#EF4444',  // Red
  REMAINING: '#E5E7EB',    // Gray
} as const;

export const DEFAULT_BUDGET_CATEGORIES = {
  EXPENSE: [
    'Food & Dining',
    'Transportation',
    'Shopping',
    'Entertainment',
    'Bills & Utilities',
    'Healthcare',
    'Education',
    'Travel',
    'Personal Care',
    'Home & Garden',
  ],
  INCOME: [
    'Salary',
    'Freelance',
    'Investment',
    'Business',
    'Other Income',
  ],
} as const;