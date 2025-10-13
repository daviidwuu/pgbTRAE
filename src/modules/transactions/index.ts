/**
 * Transactions Module
 * 
 * Centralized transaction management functionality.
 * Handles transaction CRUD operations, recurring transactions, and transaction analytics.
 */

// Core exports
export * from './services/TransactionService';
export * from './services/RecurringTransactionService';
export * from './hooks/useTransactions';
export * from './hooks/useRecurringTransactions';
export * from './types/transaction.types';
export * from './constants/transaction.constants';
export * from './utils/transaction.utils';

// Module interface
export const TransactionsModule = {
  name: 'Transactions',
  version: '1.0.0',
  dependencies: ['Firebase', 'Services', 'Utils'],
  
  // Module capabilities
  capabilities: {
    transactionCRUD: true,
    recurringTransactions: true,
    transactionFiltering: true,
    transactionAnalytics: true,
    bulkOperations: true,
  },
  
  // Module configuration
  config: {
    pageSize: 20,
    maxAmount: 1000000,
    minAmount: 0.01,
    defaultCurrency: 'USD',
    enableRecurring: true,
  },
} as const;