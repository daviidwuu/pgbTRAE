/**
 * useTransactions Hook
 * 
 * Custom hook for transaction management.
 * Provides clean interface for transaction operations.
 */

import { useState, useEffect, useCallback } from 'react';
import { TransactionService } from '../services/TransactionService';
import { Transaction } from '../../../shared/types';
import { 
  CreateTransactionDto, 
  UpdateTransactionDto, 
  TransactionFilters, 
  TransactionSummary
} from '../types/transaction.types';
import { TransactionUtils } from '../utils/transaction.utils';
import { useToast } from '../../../shared/hooks';

interface UseTransactionsState {
  transactions: Transaction[];
  isLoading: boolean;
  error: string | null;
  filters: TransactionFilters;
  summary: TransactionSummary | null;
  analytics: any | null;
}

interface UseTransactionsOptions {
  transactionService: TransactionService;
  userId?: string;
  autoLoad?: boolean;
  initialFilters?: TransactionFilters;
}

export function useTransactions(options: UseTransactionsOptions) {
  const { transactionService, userId, autoLoad = true, initialFilters } = options;
  const { toast } = useToast();

  const [state, setState] = useState<UseTransactionsState>({
    transactions: [],
    isLoading: false,
    error: null,
    filters: initialFilters || {},
    summary: null,
    analytics: null,
  });

  // Load transactions
  const loadTransactions = useCallback(async (filters?: TransactionFilters) => {
    if (!userId) return;

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const transactions = await transactionService.getTransactions(userId, filters);
      const summary = TransactionUtils.calculateSummary(transactions);
      const analytics = TransactionUtils.generateAnalytics(transactions);

      setState(prev => ({
        ...prev,
        transactions,
        summary,
        analytics,
        isLoading: false,
        filters: filters || prev.filters,
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load transactions';
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }));
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    }
  }, [userId, transactionService, toast]);

  // Create transaction
  const createTransaction = useCallback(async (transactionData: CreateTransactionDto) => {
    if (!userId) {
      throw new Error('User ID is required');
    }

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      await transactionService.createTransaction(userId, transactionData);
      
      // Reload transactions to ensure consistency
      await loadTransactions(state.filters);

      toast({
        title: "Success",
        description: "Transaction created successfully",
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create transaction';
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }));
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
      
      throw error;
    }
  }, [userId, transactionService, state.filters, loadTransactions, toast]);

  // Update transaction
  const updateTransaction = useCallback(async (
    transactionId: string, 
    updates: UpdateTransactionDto
  ) => {
    if (!userId) {
      throw new Error('User ID is required');
    }

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      await transactionService.updateTransaction(userId, transactionId, updates);
      
      // Reload transactions to ensure consistency
      await loadTransactions(state.filters);

      toast({
        title: "Success",
        description: "Transaction updated successfully",
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update transaction';
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }));
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
      
      throw error;
    }
  }, [userId, transactionService, state.filters, loadTransactions, toast]);

  // Delete transaction
  const deleteTransaction = useCallback(async (transactionId: string) => {
    if (!userId) {
      throw new Error('User ID is required');
    }

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      await transactionService.deleteTransaction(userId, transactionId);
      
      // Reload transactions to ensure consistency
      await loadTransactions(state.filters);

      toast({
        title: "Success",
        description: "Transaction deleted successfully",
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete transaction';
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }));
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
      
      throw error;
    }
  }, [userId, transactionService, state.filters, loadTransactions, toast]);

  // Bulk delete transactions
  const bulkDeleteTransactions = useCallback(async (transactionIds: string[]) => {
    if (!userId) {
      throw new Error('User ID is required');
    }

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      await transactionService.bulkDeleteTransactions(userId, transactionIds);
      
      // Reload transactions to ensure consistency
      await loadTransactions(state.filters);

      toast({
        title: "Success",
        description: `${transactionIds.length} transactions deleted successfully`,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete transactions';
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }));
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
      
      throw error;
    }
  }, [userId, transactionService, state.filters, loadTransactions, toast]);

  // Apply filters
  const applyFilters = useCallback((filters: TransactionFilters) => {
    loadTransactions(filters);
  }, [loadTransactions]);

  // Clear filters
  const clearFilters = useCallback(() => {
    loadTransactions({});
  }, [loadTransactions]);

  // Refresh transactions
  const refresh = useCallback(() => {
    loadTransactions(state.filters);
  }, [loadTransactions, state.filters]);

  // Get filtered transactions
  const getFilteredTransactions = useCallback((additionalFilters?: TransactionFilters) => {
    const filters = { ...state.filters, ...additionalFilters };
    return TransactionUtils.filterTransactions(state.transactions, filters);
  }, [state.transactions, state.filters]);

  // Initial load
  useEffect(() => {
    if (autoLoad && userId) {
      loadTransactions(initialFilters);
    }
  }, [autoLoad, userId, loadTransactions, initialFilters]);

  return {
    // State
    ...state,

    // Actions
    loadTransactions,
    createTransaction,
    updateTransaction,
    deleteTransaction,
    bulkDeleteTransactions,
    applyFilters,
    clearFilters,
    refresh,

    // Utilities
    getFilteredTransactions,
  };
}