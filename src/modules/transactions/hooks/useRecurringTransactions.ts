/**
 * useRecurringTransactions Hook
 * 
 * Custom hook for recurring transaction management.
 * Provides clean interface for recurring transaction operations.
 */

import { useState, useEffect, useCallback } from 'react';
import { RecurringTransactionService } from '../services/RecurringTransactionService';
import { RecurringTransaction } from '../../../shared/types';
import { RecurringTransactionState } from '../types/transaction.types';
import { useToast } from '../../../shared/hooks';

interface UseRecurringTransactionsOptions {
  recurringTransactionService: RecurringTransactionService;
  userId?: string;
  autoLoad?: boolean;
}

export function useRecurringTransactions(options: UseRecurringTransactionsOptions) {
  const { recurringTransactionService, userId, autoLoad = true } = options;
  const { toast } = useToast();

  const [state, setState] = useState<RecurringTransactionState>({
    recurringTransactions: [],
    upcomingTransactions: [],
    isLoading: false,
    error: null,
  });

  // Load recurring transactions
  const loadRecurringTransactions = useCallback(async () => {
    if (!userId) return;

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const recurringTransactions = await recurringTransactionService.getRecurringTransactions(userId);
      const upcomingTransactions = await recurringTransactionService.getUpcomingRecurringTransactions(userId);

      setState({
        recurringTransactions,
        upcomingTransactions,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load recurring transactions';
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
  }, [userId, recurringTransactionService, toast]);

  // Create recurring transaction
  const createRecurringTransaction = useCallback(async (transactionData: any) => {
    if (!userId) {
      throw new Error('User ID is required');
    }

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const newRecurringTransaction = await recurringTransactionService.createRecurringTransaction(
        userId, 
        transactionData
      );
      
      setState(prev => ({
        ...prev,
        recurringTransactions: [newRecurringTransaction, ...prev.recurringTransactions],
        isLoading: false,
      }));

      // Reload to get updated upcoming transactions
      await loadRecurringTransactions();

      toast({
        title: "Success",
        description: "Recurring transaction created successfully",
      });

      return newRecurringTransaction;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create recurring transaction';
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
  }, [userId, recurringTransactionService, loadRecurringTransactions, toast]);

  // Update recurring transaction
  const updateRecurringTransaction = useCallback(async (
    recurringTransactionId: string, 
    updates: any
  ) => {
    if (!userId) {
      throw new Error('User ID is required');
    }

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      await recurringTransactionService.updateRecurringTransaction(
        userId, 
        recurringTransactionId, 
        updates
      );
      
      setState(prev => ({
        ...prev,
        recurringTransactions: prev.recurringTransactions.map(rt => 
          rt.id === recurringTransactionId ? { ...rt, ...updates } : rt
        ),
        isLoading: false,
      }));

      // Reload to get updated upcoming transactions
      await loadRecurringTransactions();

      toast({
        title: "Success",
        description: "Recurring transaction updated successfully",
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update recurring transaction';
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
  }, [userId, recurringTransactionService, loadRecurringTransactions, toast]);

  // Delete recurring transaction
  const deleteRecurringTransaction = useCallback(async (recurringTransactionId: string) => {
    if (!userId) {
      throw new Error('User ID is required');
    }

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      await recurringTransactionService.deleteRecurringTransaction(userId, recurringTransactionId);
      
      setState(prev => ({
        ...prev,
        recurringTransactions: prev.recurringTransactions.filter(rt => rt.id !== recurringTransactionId),
        upcomingTransactions: prev.upcomingTransactions.filter(rt => rt.id !== recurringTransactionId),
        isLoading: false,
      }));

      toast({
        title: "Success",
        description: "Recurring transaction deleted successfully",
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete recurring transaction';
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
  }, [userId, recurringTransactionService, toast]);

  // Toggle recurring transaction active status
  const toggleRecurringTransaction = useCallback(async (
    recurringTransactionId: string, 
    isActive: boolean
  ) => {
    if (!userId) {
      throw new Error('User ID is required');
    }

    try {
      await recurringTransactionService.toggleRecurringTransaction(
        userId, 
        recurringTransactionId, 
        isActive
      );
      
      setState(prev => ({
        ...prev,
        recurringTransactions: prev.recurringTransactions.map(rt => 
          rt.id === recurringTransactionId ? { ...rt, isActive } : rt
        ),
      }));

      // Reload to get updated upcoming transactions
      await loadRecurringTransactions();

      toast({
        title: "Success",
        description: `Recurring transaction ${isActive ? 'activated' : 'deactivated'} successfully`,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to toggle recurring transaction';
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
      
      throw error;
    }
  }, [userId, recurringTransactionService, loadRecurringTransactions, toast]);

  // Process recurring transaction
  const processRecurringTransaction = useCallback(async (recurringTransaction: RecurringTransaction) => {
    if (!userId) {
      throw new Error('User ID is required');
    }

    try {
      await recurringTransactionService.processRecurringTransaction(userId, recurringTransaction);
      
      // Reload to get updated data
      await loadRecurringTransactions();

      toast({
        title: "Success",
        description: "Recurring transaction processed successfully",
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to process recurring transaction';
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
      
      throw error;
    }
  }, [userId, recurringTransactionService, loadRecurringTransactions, toast]);

  // Get active recurring transactions
  const getActiveRecurringTransactions = useCallback(() => {
    return state.recurringTransactions.filter(rt => rt.isActive);
  }, [state.recurringTransactions]);

  // Get due recurring transactions
  const getDueRecurringTransactions = useCallback(async () => {
    if (!userId) return [];
    
    try {
      return await recurringTransactionService.getDueRecurringTransactions(userId);
    } catch (error) {
      console.error('Failed to get due recurring transactions:', error);
      return [];
    }
  }, [userId, recurringTransactionService]);

  // Refresh recurring transactions
  const refresh = useCallback(() => {
    loadRecurringTransactions();
  }, [loadRecurringTransactions]);

  // Initial load
  useEffect(() => {
    if (autoLoad && userId) {
      loadRecurringTransactions();
    }
  }, [autoLoad, userId, loadRecurringTransactions]);

  return {
    // State
    ...state,

    // Actions
    loadRecurringTransactions,
    createRecurringTransaction,
    updateRecurringTransaction,
    deleteRecurringTransaction,
    toggleRecurringTransaction,
    processRecurringTransaction,
    refresh,

    // Utilities
    getActiveRecurringTransactions,
    getDueRecurringTransactions,
  };
}