// Chart colors for categories
export const CHART_COLORS = [
  "#2563eb", "#f97316", "#22c55e", "#ef4444", "#8b5cf6",
  "#78350f", "#ec4899", "#64748b", "#f59e0b"
];

// Default categories for new users
export const DEFAULT_CATEGORIES = [
  "F&B", "Shopping", "Transport", "Bills", "Others",
];

// Default income categories for new users
export const DEFAULT_INCOME_CATEGORIES = [
  "Salary", "Transfer",
];

// Local storage keys
export const STORAGE_KEYS = {
  USER_ID_COPIED: 'userIdCopied',
  NOTIFICATION_PROMPT_SHOWN: 'notificationPromptShown',
} as const;

// Pagination
export const PAGINATION = {
  INITIAL_TRANSACTIONS: 20,
  LOAD_MORE_INCREMENT: 20,
} as const;

// Date formats
export const DATE_FORMATS = {
  DISPLAY_DATE: 'MMM d, yyyy',
  WEEK_RANGE: 'MMM d',
  MONTH_YEAR: 'MMMM yyyy',
  YEAR_ONLY: 'yyyy',
} as const;