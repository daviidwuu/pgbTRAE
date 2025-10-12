/**
 * Budget Utilities
 * 
 * Utility functions specific to budget operations.
 */

import { Budget } from '../../../shared/types';
import { BudgetStatus, BudgetAnalytics } from '../types/budget.types';
import { BUDGET_CONSTANTS, BUDGET_STATUS_TYPES } from '../constants/budget.constants';

export const BudgetUtils = {
  /**
   * Validate budget amount
   */
  validateBudgetAmount: (amount: number): string | null => {
    if (isNaN(amount) || amount <= 0) {
      return 'Budget amount must be a positive number';
    }
    if (amount < BUDGET_CONSTANTS.MIN_BUDGET_AMOUNT) {
      return `Budget amount must be at least ${BUDGET_CONSTANTS.MIN_BUDGET_AMOUNT}`;
    }
    if (amount > BUDGET_CONSTANTS.MAX_BUDGET_AMOUNT) {
      return `Budget amount cannot exceed ${BUDGET_CONSTANTS.MAX_BUDGET_AMOUNT.toLocaleString()}`;
    }
    return null;
  },

  /**
   * Calculate budget status
   */
  calculateBudgetStatus: (budget: Budget, spent: number): BudgetStatus => {
    const remaining = Math.max(0, budget.MonthlyBudget - spent);
    const percentage = budget.MonthlyBudget > 0 ? (spent / budget.MonthlyBudget) * 100 : 0;
    const isOverBudget = spent > budget.MonthlyBudget;
    const isNearLimit = percentage >= (BUDGET_CONSTANTS.WARNING_THRESHOLD * 100) && !isOverBudget;

    return {
      spent,
      remaining,
      percentage,
      isOverBudget,
      isNearLimit,
    };
  },

  /**
   * Get budget status type
   */
  getBudgetStatusType: (budgetStatus: BudgetStatus): 'under' | 'near' | 'over' => {
    if (budgetStatus.isOverBudget) {
      return BUDGET_STATUS_TYPES.OVER;
    }
    if (budgetStatus.isNearLimit) {
      return BUDGET_STATUS_TYPES.NEAR;
    }
    return BUDGET_STATUS_TYPES.UNDER;
  },

  /**
   * Format budget amount with currency
   */
  formatBudgetAmount: (amount: number, currency: string = BUDGET_CONSTANTS.DEFAULT_CURRENCY): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
    }).format(amount);
  },

  /**
   * Calculate budget utilization percentage
   */
  calculateUtilization: (budget: Budget, spent: number): number => {
    return budget.MonthlyBudget > 0 ? (spent / budget.MonthlyBudget) * 100 : 0;
  },

  /**
   * Get budget color based on status
   */
  getBudgetStatusColor: (budgetStatus: BudgetStatus): string => {
    if (budgetStatus.isOverBudget) {
      return '#EF4444'; // Red
    }
    if (budgetStatus.isNearLimit) {
      return '#F59E0B'; // Yellow
    }
    return '#10B981'; // Green
  },

  /**
   * Calculate total budget amount
   */
  calculateTotalBudget: (budgets: Budget[]): number => {
    return budgets.reduce((total, budget) => total + budget.MonthlyBudget, 0);
  },

  /**
   * Calculate total spent amount
   */
  calculateTotalSpent: (budgetStatuses: Record<string, BudgetStatus>): number => {
    return Object.values(budgetStatuses).reduce((total, status) => total + status.spent, 0);
  },

  /**
   * Calculate total remaining amount
   */
  calculateTotalRemaining: (budgetStatuses: Record<string, BudgetStatus>): number => {
    return Object.values(budgetStatuses).reduce((total, status) => total + status.remaining, 0);
  },

  /**
   * Get over-budget categories
   */
  getOverBudgetCategories: (budgetStatuses: Record<string, BudgetStatus>): string[] => {
    return Object.entries(budgetStatuses)
      .filter(([_, status]) => status.isOverBudget)
      .map(([category, _]) => category);
  },

  /**
   * Get near-limit categories
   */
  getNearLimitCategories: (budgetStatuses: Record<string, BudgetStatus>): string[] => {
    return Object.entries(budgetStatuses)
      .filter(([_, status]) => status.isNearLimit)
      .map(([category, _]) => category);
  },

  /**
   * Calculate average utilization
   */
  calculateAverageUtilization: (budgetStatuses: Record<string, BudgetStatus>): number => {
    const statuses = Object.values(budgetStatuses);
    if (statuses.length === 0) return 0;
    
    const totalPercentage = statuses.reduce((sum, status) => sum + status.percentage, 0);
    return totalPercentage / statuses.length;
  },

  /**
   * Sort budgets by utilization
   */
  sortBudgetsByUtilization: (
    budgets: Budget[], 
    budgetStatuses: Record<string, BudgetStatus>,
    direction: 'asc' | 'desc' = 'desc'
  ): Budget[] => {
    return [...budgets].sort((a, b) => {
      const aStatus = budgetStatuses[a.Category];
      const bStatus = budgetStatuses[b.Category];
      
      if (!aStatus || !bStatus) return 0;
      
      const aPercentage = aStatus.percentage;
      const bPercentage = bStatus.percentage;
      
      return direction === 'desc' ? bPercentage - aPercentage : aPercentage - bPercentage;
    });
  },

  /**
   * Filter budgets by status
   */
  filterBudgetsByStatus: (
    budgets: Budget[],
    budgetStatuses: Record<string, BudgetStatus>,
    statusType: 'under' | 'near' | 'over'
  ): Budget[] => {
    return budgets.filter(budget => {
      const status = budgetStatuses[budget.Category];
      if (!status) return false;
      
      const budgetStatusType = BudgetUtils.getBudgetStatusType(status);
      return budgetStatusType === statusType;
    });
  },

  /**
   * Generate budget analytics
   */
  generateBudgetAnalytics: (
    budgets: Budget[],
    budgetStatuses: Record<string, BudgetStatus>,
    historicalData?: any[]
  ): BudgetAnalytics => {
    // Monthly trend (placeholder - would need historical data)
    const monthlyTrend = historicalData || [];

    // Category breakdown
    const categoryBreakdown = budgets.map(budget => {
      const status = budgetStatuses[budget.Category];
      return {
        category: budget.Category,
        budgeted: budget.MonthlyBudget,
        spent: status?.spent || 0,
        percentage: status?.percentage || 0,
        status: status ? BudgetUtils.getBudgetStatusType(status) : 'under',
      };
    });

    // Projected spending (simple calculation based on current utilization)
    const totalBudgeted = BudgetUtils.calculateTotalBudget(budgets);
    const averageUtilization = BudgetUtils.calculateAverageUtilization(budgetStatuses);
    const projectedSpending = (totalBudgeted * averageUtilization) / 100;

    // Savings rate (placeholder calculation)
    const totalSpent = BudgetUtils.calculateTotalSpent(budgetStatuses);
    const savingsRate = totalBudgeted > 0 ? ((totalBudgeted - totalSpent) / totalBudgeted) * 100 : 0;

    return {
      monthlyTrend,
      categoryBreakdown,
      projectedSpending,
      savingsRate,
    };
  },

  /**
   * Check if budget needs attention
   */
  budgetNeedsAttention: (budgetStatus: BudgetStatus): boolean => {
    return budgetStatus.isOverBudget || budgetStatus.isNearLimit;
  },

  /**
   * Get budget recommendation
   */
  getBudgetRecommendation: (budget: Budget, budgetStatus: BudgetStatus): string => {
    if (budgetStatus.isOverBudget) {
      const overage = budgetStatus.spent - budget.MonthlyBudget;
      return `You've exceeded your budget by ${BudgetUtils.formatBudgetAmount(overage)}. Consider reducing spending in this category.`;
    }
    
    if (budgetStatus.isNearLimit) {
      return `You're approaching your budget limit (${budgetStatus.percentage.toFixed(1)}% used). Monitor your spending carefully.`;
    }
    
    if (budgetStatus.percentage < 50) {
      return `You're doing well! Only ${budgetStatus.percentage.toFixed(1)}% of your budget used.`;
    }
    
    return `You're on track with ${budgetStatus.percentage.toFixed(1)}% of your budget used.`;
  },

  /**
   * Calculate days remaining in month
   */
  getDaysRemainingInMonth: (): number => {
    const now = new Date();
    const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    const daysRemaining = lastDayOfMonth.getDate() - now.getDate();
    return Math.max(0, daysRemaining);
  },

  /**
   * Calculate daily spending allowance
   */
  calculateDailyAllowance: (budget: Budget, budgetStatus: BudgetStatus): number => {
    const daysRemaining = BudgetUtils.getDaysRemainingInMonth();
    if (daysRemaining <= 0) return 0;
    
    return budgetStatus.remaining / daysRemaining;
  },
};