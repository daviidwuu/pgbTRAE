import { type Budget, type CategoryType } from "@/shared/types";
import { BUDGET_STATUS } from "@/shared/constants/budget";

/**
 * Calculate budget status based on income vs expense budgets
 */
export function getBudgetStatus(incomeBudget: number, expenseBudget: number) {
  const difference = incomeBudget - expenseBudget;
  
  if (difference > 0) {
    return BUDGET_STATUS.surplus;
  } else if (difference < 0) {
    return BUDGET_STATUS.deficit;
  } else {
    return BUDGET_STATUS.balanced;
  }
}

/**
 * Format budget amount with currency symbol
 */
export function formatBudgetAmount(amount: number, showSign: boolean = false): string {
  const formatted = Math.abs(amount).toFixed(2);
  const sign = showSign && amount !== 0 ? (amount > 0 ? '+' : '-') : '';
  return `${sign}$${formatted}`;
}

/**
 * Calculate budget progress percentage
 */
export function calculateBudgetProgress(spent: number, budget: number): {
  percentage: number;
  isOverBudget: boolean;
  remaining: number;
} {
  const percentage = budget > 0 ? (spent / budget) * 100 : 0;
  const isOverBudget = percentage >= 100;
  const remaining = Math.max(0, budget - spent);

  return {
    percentage: Math.min(percentage, 100),
    isOverBudget,
    remaining,
  };
}

/**
 * Validate category name
 */
export function validateCategoryName(name: string, existingCategories: string[]): {
  isValid: boolean;
  error?: string;
} {
  const trimmedName = name.trim();
  
  if (!trimmedName) {
    return { isValid: false, error: "Category name cannot be empty" };
  }
  
  if (trimmedName.length > 50) {
    return { isValid: false, error: "Category name must be 50 characters or less" };
  }
  
  if (existingCategories.some(cat => cat.toLowerCase() === trimmedName.toLowerCase())) {
    return { isValid: false, error: "Category already exists" };
  }
  
  return { isValid: true };
}

/**
 * Get category type display info
 */
export function getCategoryTypeInfo(type: CategoryType) {
  return type === 'income' 
    ? { label: 'Income', color: 'text-green-600', icon: '↗️' }
    : { label: 'Expense', color: 'text-red-600', icon: '↘️' };
}

/**
 * Sort budgets by type and amount
 */
export function sortBudgets(budgets: Budget[]): Budget[] {
  return [...budgets].sort((a, b) => {
    // First sort by type (income first)
    const aType = a.type || 'expense';
    const bType = b.type || 'expense';
    
    if (aType !== bType) {
      return aType === 'income' ? -1 : 1;
    }
    
    // Then sort by amount (descending)
    return b.MonthlyBudget - a.MonthlyBudget;
  });
}