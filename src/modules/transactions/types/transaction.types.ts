/**
 * Transaction Types
 * 
 * Type definitions for transaction module.
 */

// Re-export existing types for backward compatibility
export * from '../../../shared/types';
import { Transaction, RecurringTransaction } from '../../../shared/types';

export interface TransactionFilters {
  dateRange?: { start: Date; end: Date };
  categories?: string[];
  types?: ('income' | 'expense')[];
  amountRange?: { min: number; max: number };
  searchTerm?: string;
}

export interface TransactionSummary {
  totalIncome: number;
  totalExpenses: number;
  netAmount: number;
  transactionCount: number;
  averageTransaction: number;
  largestTransaction: number;
  smallestTransaction: number;
}

export interface TransactionAnalytics {
  monthlyTrend: Array<{
    month: string;
    income: number;
    expenses: number;
    net: number;
  }>;
  categoryBreakdown: Array<{
    category: string;
    amount: number;
    percentage: number;
    transactionCount: number;
  }>;
  dailySpending: Array<{
    date: string;
    amount: number;
  }>;
}

export interface CreateTransactionDto {
  Amount: number;
  Type: 'income' | 'expense';
  Category: string;
  Notes: string;
  Date?: Date | string;
}

export interface UpdateTransactionDto extends Partial<CreateTransactionDto> {
  id?: never; // Prevent id from being updated
}

export interface TransactionState {
  transactions: Transaction[];
  isLoading: boolean;
  error: string | null;
  filters: TransactionFilters;
  summary: TransactionSummary | null;
  analytics: TransactionAnalytics | null;
}

export interface RecurringTransactionState {
  recurringTransactions: RecurringTransaction[];
  upcomingTransactions: RecurringTransaction[];
  isLoading: boolean;
  error: string | null;
}

export interface TransactionFormData {
  amount: string;
  type: 'income' | 'expense';
  category: string;
  notes: string;
  date: Date;
}

export interface BulkTransactionOperation {
  type: 'delete' | 'update' | 'categorize';
  transactionIds: string[];
  updateData?: Partial<UpdateTransactionDto>;
}

// Import/Export types
export interface TransactionImportData {
  date: string;
  amount: number;
  description: string;
  category?: string;
  type?: 'income' | 'expense';
}

export interface TransactionExportOptions {
  format: 'csv' | 'json' | 'xlsx';
  dateRange?: { start: Date; end: Date };
  categories?: string[];
  includeRecurring?: boolean;
}