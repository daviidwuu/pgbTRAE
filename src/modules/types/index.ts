/**
 * Types Module
 * 
 * Centralized type definitions and interfaces for the entire application.
 * Provides consistent typing across all modules with clear separation of concerns.
 */

// Re-export existing types for backward compatibility
export * from '../../shared/types';

// Core Entity Types
export interface ModuleInterface {
  name: string;
  version: string;
  dependencies?: string[];
}

// Auth module types
export interface AuthUserProfile {
  id: string;
  name: string;
  email?: string;
  categories?: string[];
  incomeCategories?: string[];
  income?: number;
  savings?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuthState {
  user: AuthUserProfile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error?: string;
}

// Transaction module types
export interface TransactionFilters {
  dateRange?: { start: Date; end: Date };
  categories?: string[];
  types?: ('income' | 'expense')[];
  amountRange?: { min: number; max: number };
}

export interface TransactionSummary {
  totalIncome: number;
  totalExpenses: number;
  netAmount: number;
  transactionCount: number;
}

// Budget module types
export interface BudgetStatus {
  spent: number;
  remaining: number;
  percentage: number;
  isOverBudget: boolean;
}

export interface BudgetAnalytics {
  monthlyTrend: number[];
  categoryBreakdown: Record<string, number>;
  projectedSpending: number;
}

// Dashboard module types
export interface DashboardState {
  selectedDateRange: { start: Date; end: Date };
  activeFilters: string[];
  viewMode: 'overview' | 'detailed' | 'analytics';
}

// Common utility types
export type AsyncState<T> = {
  data: T | null;
  loading: boolean;
  error: string | null;
};

export type ModuleConfig = {
  enabled: boolean;
  settings: Record<string, any>;
};

export type APIResponse<T> = {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: number;
};