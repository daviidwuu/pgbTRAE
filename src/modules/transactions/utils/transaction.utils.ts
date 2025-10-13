/**
 * Transaction Utilities
 * 
 * Utility functions specific to transaction operations.
 */

import { Transaction, RecurringTransaction } from '../../../shared/types';
import { TransactionFilters, TransactionSummary, TransactionAnalytics } from '../types/transaction.types';
import { TRANSACTION_CONSTANTS, TRANSACTION_FILTERS } from '../constants/transaction.constants';

export const TransactionUtils = {
  /**
   * Validate transaction amount
   */
  validateAmount: (amount: number): string | null => {
    if (isNaN(amount) || amount <= 0) {
      return 'Amount must be a positive number';
    }
    if (amount < TRANSACTION_CONSTANTS.MIN_AMOUNT) {
      return `Amount must be at least ${TRANSACTION_CONSTANTS.MIN_AMOUNT}`;
    }
    if (amount > TRANSACTION_CONSTANTS.MAX_AMOUNT) {
      return `Amount cannot exceed ${TRANSACTION_CONSTANTS.MAX_AMOUNT.toLocaleString()}`;
    }
    return null;
  },

  /**
   * Format transaction amount with currency
   */
  formatAmount: (amount: number, currency: string = TRANSACTION_CONSTANTS.DEFAULT_CURRENCY): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
    }).format(amount);
  },

  /**
   * Parse transaction date
   */
  parseDate: (date: Date | string | { seconds: number; nanoseconds: number } | null): Date => {
    if (!date) return new Date();
    
    if (date instanceof Date) return date;
    
    if (typeof date === 'string') return new Date(date);
    
    if (typeof date === 'object' && 'seconds' in date) {
      return new Date(date.seconds * 1000);
    }
    
    return new Date();
  },

  /**
   * Filter transactions based on criteria
   */
  filterTransactions: (transactions: Transaction[], filters: TransactionFilters): Transaction[] => {
    return transactions.filter(transaction => {
      // Date range filter
      if (filters.dateRange) {
        const transactionDate = TransactionUtils.parseDate(transaction.Date);
        if (transactionDate < filters.dateRange.start || transactionDate > filters.dateRange.end) {
          return false;
        }
      }

      // Category filter
      if (filters.categories && filters.categories.length > 0) {
        if (!filters.categories.includes(transaction.Category)) {
          return false;
        }
      }

      // Type filter
      if (filters.types && filters.types.length > 0) {
        if (!filters.types.includes(transaction.Type)) {
          return false;
        }
      }

      // Amount range filter
      if (filters.amountRange) {
        if (transaction.Amount < filters.amountRange.min || transaction.Amount > filters.amountRange.max) {
          return false;
        }
      }

      // Search term filter
      if (filters.searchTerm) {
        const searchTerm = filters.searchTerm.toLowerCase();
        const searchableText = `${transaction.Category} ${transaction.Notes}`.toLowerCase();
        if (!searchableText.includes(searchTerm)) {
          return false;
        }
      }

      return true;
    });
  },

  /**
   * Calculate transaction summary
   */
  calculateSummary: (transactions: Transaction[]): TransactionSummary => {
    const income = transactions
      .filter(t => t.Type === 'income')
      .reduce((sum, t) => sum + t.Amount, 0);

    const expenses = transactions
      .filter(t => t.Type === 'expense')
      .reduce((sum, t) => sum + t.Amount, 0);

    const amounts = transactions.map(t => t.Amount);

    return {
      totalIncome: income,
      totalExpenses: expenses,
      netAmount: income - expenses,
      transactionCount: transactions.length,
      averageTransaction: transactions.length > 0 ? amounts.reduce((sum, amount) => sum + amount, 0) / transactions.length : 0,
      largestTransaction: amounts.length > 0 ? Math.max(...amounts) : 0,
      smallestTransaction: amounts.length > 0 ? Math.min(...amounts) : 0,
    };
  },

  /**
   * Generate transaction analytics
   */
  generateAnalytics: (transactions: Transaction[]): TransactionAnalytics => {
    // Monthly trend
    const monthlyData = new Map<string, { income: number; expenses: number }>();
    
    transactions.forEach(transaction => {
      const date = TransactionUtils.parseDate(transaction.Date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (!monthlyData.has(monthKey)) {
        monthlyData.set(monthKey, { income: 0, expenses: 0 });
      }
      
      const monthData = monthlyData.get(monthKey)!;
      if (transaction.Type === 'income') {
        monthData.income += transaction.Amount;
      } else {
        monthData.expenses += transaction.Amount;
      }
    });

    const monthlyTrend = Array.from(monthlyData.entries()).map(([month, data]) => ({
      month,
      income: data.income,
      expenses: data.expenses,
      net: data.income - data.expenses,
    }));

    // Category breakdown
    const categoryData = new Map<string, { amount: number; count: number }>();
    
    transactions.forEach(transaction => {
      if (!categoryData.has(transaction.Category)) {
        categoryData.set(transaction.Category, { amount: 0, count: 0 });
      }
      
      const catData = categoryData.get(transaction.Category)!;
      catData.amount += transaction.Amount;
      catData.count += 1;
    });

    const totalAmount = transactions.reduce((sum, t) => sum + t.Amount, 0);
    const categoryBreakdown = Array.from(categoryData.entries()).map(([category, data]) => ({
      category,
      amount: data.amount,
      percentage: totalAmount > 0 ? (data.amount / totalAmount) * 100 : 0,
      transactionCount: data.count,
    }));

    // Daily spending (last 30 days)
    const dailyData = new Map<string, number>();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    transactions
      .filter(t => t.Type === 'expense' && TransactionUtils.parseDate(t.Date) >= thirtyDaysAgo)
      .forEach(transaction => {
        const date = TransactionUtils.parseDate(transaction.Date);
        const dateKey = date.toISOString().split('T')[0];
        
        dailyData.set(dateKey, (dailyData.get(dateKey) || 0) + transaction.Amount);
      });

    const dailySpending = Array.from(dailyData.entries()).map(([date, amount]) => ({
      date,
      amount,
    }));

    return {
      monthlyTrend,
      categoryBreakdown,
      dailySpending,
    };
  },

  /**
   * Get date range for predefined filters
   */
  getDateRange: (filterType: string): { start: Date; end: Date } => {
    const now = new Date();
    const start = new Date();
    const end = new Date();

    switch (filterType) {
      case TRANSACTION_FILTERS.DATE_RANGES.TODAY:
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);
        break;
      case TRANSACTION_FILTERS.DATE_RANGES.YESTERDAY:
        start.setDate(now.getDate() - 1);
        start.setHours(0, 0, 0, 0);
        end.setDate(now.getDate() - 1);
        end.setHours(23, 59, 59, 999);
        break;
      case TRANSACTION_FILTERS.DATE_RANGES.THIS_WEEK:
        const dayOfWeek = now.getDay();
        start.setDate(now.getDate() - dayOfWeek);
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);
        break;
      case TRANSACTION_FILTERS.DATE_RANGES.THIS_MONTH:
        start.setDate(1);
        start.setHours(0, 0, 0, 0);
        end.setMonth(now.getMonth() + 1, 0);
        end.setHours(23, 59, 59, 999);
        break;
      case TRANSACTION_FILTERS.DATE_RANGES.LAST_MONTH:
        start.setMonth(now.getMonth() - 1, 1);
        start.setHours(0, 0, 0, 0);
        end.setMonth(now.getMonth(), 0);
        end.setHours(23, 59, 59, 999);
        break;
      default:
        start.setFullYear(now.getFullYear(), 0, 1);
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);
    }

    return { start, end };
  },

  /**
   * Sort transactions
   */
  sortTransactions: (transactions: Transaction[], sortBy: string): Transaction[] => {
    return [...transactions].sort((a, b) => {
      switch (sortBy) {
        case TRANSACTION_FILTERS.SORT_OPTIONS.DATE_DESC:
          return TransactionUtils.parseDate(b.Date).getTime() - TransactionUtils.parseDate(a.Date).getTime();
        case TRANSACTION_FILTERS.SORT_OPTIONS.DATE_ASC:
          return TransactionUtils.parseDate(a.Date).getTime() - TransactionUtils.parseDate(b.Date).getTime();
        case TRANSACTION_FILTERS.SORT_OPTIONS.AMOUNT_DESC:
          return b.Amount - a.Amount;
        case TRANSACTION_FILTERS.SORT_OPTIONS.AMOUNT_ASC:
          return a.Amount - b.Amount;
        case TRANSACTION_FILTERS.SORT_OPTIONS.CATEGORY:
          return a.Category.localeCompare(b.Category);
        default:
          return 0;
      }
    });
  },

  /**
   * Check if recurring transaction is due
   */
  isRecurringTransactionDue: (recurringTransaction: RecurringTransaction): boolean => {
    if (!recurringTransaction.isActive) return false;
    
    const now = new Date();
    const nextDue = new Date(recurringTransaction.nextDueDate);
    
    return now >= nextDue;
  },

  /**
   * Calculate next due date for recurring transaction
   */
  calculateNextDueDate: (recurringTransaction: RecurringTransaction): Date => {
    const currentDue = new Date(recurringTransaction.nextDueDate);
    const nextDue = new Date(currentDue);

    switch (recurringTransaction.frequency) {
      case 'weekly':
        nextDue.setDate(currentDue.getDate() + 7);
        break;
      case 'monthly':
        nextDue.setMonth(currentDue.getMonth() + 1);
        break;
      case 'yearly':
        nextDue.setFullYear(currentDue.getFullYear() + 1);
        break;
    }

    return nextDue;
  },
};