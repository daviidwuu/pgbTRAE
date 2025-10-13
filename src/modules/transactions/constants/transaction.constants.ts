/**
 * Transaction Constants
 * 
 * Constants specific to the transaction module.
 */

export const TRANSACTION_CONSTANTS = {
  PAGE_SIZE: 20,
  MAX_AMOUNT: 1000000,
  MIN_AMOUNT: 0.01,
  DEFAULT_CURRENCY: 'USD',
  MAX_NOTES_LENGTH: 500,
  MAX_CATEGORY_LENGTH: 50,
} as const;

export const TRANSACTION_TYPES = {
  INCOME: 'income',
  EXPENSE: 'expense',
} as const;

export const RECURRING_FREQUENCIES = {
  WEEKLY: 'weekly',
  MONTHLY: 'monthly',
  YEARLY: 'yearly',
} as const;

export const TRANSACTION_ERRORS = {
  INVALID_AMOUNT: 'Amount must be a positive number',
  AMOUNT_TOO_LARGE: `Amount cannot exceed ${TRANSACTION_CONSTANTS.MAX_AMOUNT.toLocaleString()}`,
  AMOUNT_TOO_SMALL: `Amount must be at least ${TRANSACTION_CONSTANTS.MIN_AMOUNT}`,
  INVALID_CATEGORY: 'Category is required',
  INVALID_DATE: 'Invalid date provided',
  TRANSACTION_NOT_FOUND: 'Transaction not found',
  UNAUTHORIZED_ACCESS: 'You are not authorized to access this transaction',
  NETWORK_ERROR: 'Network error occurred while processing transaction',
} as const;

export const TRANSACTION_SUCCESS_MESSAGES = {
  CREATED: 'Transaction created successfully',
  UPDATED: 'Transaction updated successfully',
  DELETED: 'Transaction deleted successfully',
  BULK_DELETED: 'Transactions deleted successfully',
  BULK_UPDATED: 'Transactions updated successfully',
  IMPORTED: 'Transactions imported successfully',
  EXPORTED: 'Transactions exported successfully',
} as const;

export const RECURRING_TRANSACTION_MESSAGES = {
  CREATED: 'Recurring transaction created successfully',
  UPDATED: 'Recurring transaction updated successfully',
  DELETED: 'Recurring transaction deleted successfully',
  ACTIVATED: 'Recurring transaction activated',
  DEACTIVATED: 'Recurring transaction deactivated',
  PROCESSED: 'Recurring transaction processed',
} as const;

export const TRANSACTION_FILTERS = {
  DATE_RANGES: {
    TODAY: 'today',
    YESTERDAY: 'yesterday',
    THIS_WEEK: 'thisWeek',
    LAST_WEEK: 'lastWeek',
    THIS_MONTH: 'thisMonth',
    LAST_MONTH: 'lastMonth',
    THIS_YEAR: 'thisYear',
    LAST_YEAR: 'lastYear',
    CUSTOM: 'custom',
  },
  SORT_OPTIONS: {
    DATE_DESC: 'dateDesc',
    DATE_ASC: 'dateAsc',
    AMOUNT_DESC: 'amountDesc',
    AMOUNT_ASC: 'amountAsc',
    CATEGORY: 'category',
  },
} as const;

export const EXPORT_FORMATS = {
  CSV: 'csv',
  JSON: 'json',
  XLSX: 'xlsx',
} as const;

export const IMPORT_VALIDATION = {
  REQUIRED_FIELDS: ['date', 'amount', 'description'],
  OPTIONAL_FIELDS: ['category', 'type', 'notes'],
  MAX_IMPORT_SIZE: 1000, // Maximum number of transactions per import
} as const;