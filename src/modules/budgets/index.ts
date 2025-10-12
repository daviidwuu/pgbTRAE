/**
 * Budgets Module
 * 
 * Centralized budget management functionality.
 * Handles budget CRUD operations, budget tracking, and budget analytics.
 */

// Core exports
export * from './services/BudgetService';
export * from './hooks/useBudgets';
export * from './types/budget.types';
export * from './constants/budget.constants';
export * from './utils/budget.utils';

// Module interface
export const BudgetsModule = {
  name: 'Budgets',
  version: '1.0.0',
  dependencies: ['Firebase', 'Services', 'Utils', 'Transactions'],
  
  // Module capabilities
  capabilities: {
    budgetCRUD: true,
    budgetTracking: true,
    budgetAnalytics: true,
    budgetAlerts: true,
    categoryBudgets: true,
  },
  
  // Module configuration
  config: {
    defaultCurrency: 'USD',
    maxCategories: 50,
    alertThreshold: 0.8, // 80%
    warningThreshold: 0.7, // 70%
  },
} as const;