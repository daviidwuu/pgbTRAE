import { type CategoryType } from "@/shared/types";

/**
 * Default expense categories for new users
 */
export const DEFAULT_EXPENSE_CATEGORIES = [
  "F&B",
  "Shopping", 
  "Transport",
  "Bills"
] as const;

/**
 * Default income categories for new users
 */
export const DEFAULT_INCOME_CATEGORIES = [
  "Salary",
  "External Transfers"
] as const;

/**
 * Category type configuration
 */
export const CATEGORY_TYPE_CONFIG = {
  income: {
    label: "Income",
    color: "text-green-600",
    bgColor: "bg-green-50",
    borderColor: "border-green-200",
    icon: "TrendingUp"
  },
  expense: {
    label: "Expense", 
    color: "text-red-600",
    bgColor: "bg-red-50",
    borderColor: "border-red-200",
    icon: "TrendingDown"
  }
} as const;

/**
 * Budget status indicators
 */
export const BUDGET_STATUS = {
  surplus: {
    label: "Surplus",
    color: "text-green-600",
    bgColor: "bg-green-50",
    message: "You're on track to save money!"
  },
  deficit: {
    label: "Deficit",
    color: "text-red-600", 
    bgColor: "bg-red-50",
    message: "Your expenses exceed your income budget"
  },
  balanced: {
    label: "Balanced",
    color: "text-blue-600",
    bgColor: "bg-blue-50", 
    message: "Your budget is perfectly balanced"
  }
} as const;