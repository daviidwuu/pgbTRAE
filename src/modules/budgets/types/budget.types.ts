/**
 * Budget Types
 * 
 * Type definitions for budget module.
 */

// Re-export existing types for backward compatibility
export * from '../../../shared/types';
import { Budget } from '../../../shared/types';

export interface BudgetStatus {
  spent: number;
  remaining: number;
  percentage: number;
  isOverBudget: boolean;
  isNearLimit: boolean; // Within warning threshold
}

export interface BudgetAnalytics {
  monthlyTrend: Array<{
    month: string;
    budgeted: number;
    spent: number;
    remaining: number;
  }>;
  categoryBreakdown: Array<{
    category: string;
    budgeted: number;
    spent: number;
    percentage: number;
    status: 'under' | 'near' | 'over';
  }>;
  projectedSpending: number;
  savingsRate: number;
}

export interface CreateBudgetDto {
  Category: string;
  MonthlyBudget: number;
  type?: 'expense' | 'income';
}

export interface UpdateBudgetDto extends Partial<CreateBudgetDto> {
  id?: never; // Prevent id from being updated
}

export interface BudgetState {
  budgets: Budget[];
  budgetStatuses: Record<string, BudgetStatus>;
  analytics: BudgetAnalytics | null;
  isLoading: boolean;
  error: string | null;
}

export interface BudgetFormData {
  category: string;
  monthlyBudget: string;
  type: 'expense' | 'income';
}

export interface BudgetAlert {
  id: string;
  category: string;
  type: 'warning' | 'exceeded';
  message: string;
  percentage: number;
  timestamp: Date;
}

export interface BudgetSummary {
  totalBudgeted: number;
  totalSpent: number;
  totalRemaining: number;
  overBudgetCategories: number;
  nearLimitCategories: number;
  averageUtilization: number;
}