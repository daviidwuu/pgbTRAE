/**
 * Dashboard Types
 * 
 * Type definitions for dashboard module.
 */

export interface DashboardState {
  selectedDateRange: { start: Date; end: Date };
  activeFilters: string[];
  viewMode: 'overview' | 'detailed' | 'analytics';
  isLoading: boolean;
  error: string | null;
}

export interface DashboardData {
  totalBalance: number;
  totalIncome: number;
  totalExpenses: number;
  recentTransactions: any[];
  budgetSummary: any;
  savingsProgress: number;
}

export interface DashboardWidget {
  id: string;
  type: 'balance' | 'transactions' | 'budget' | 'analytics';
  title: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
  visible: boolean;
  config?: Record<string, any>;
}

export interface DashboardLayout {
  widgets: DashboardWidget[];
  theme: 'light' | 'dark';
  compactMode: boolean;
}

export interface DashboardFilters {
  dateRange: { start: Date; end: Date };
  categories: string[];
  transactionTypes: ('income' | 'expense')[];
  amountRange?: { min: number; max: number };
}

export interface DashboardNotification {
  id: string;
  type: 'info' | 'warning' | 'error' | 'success';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  actionUrl?: string;
}