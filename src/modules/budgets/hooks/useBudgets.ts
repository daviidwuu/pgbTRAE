/**
 * useBudgets Hook
 * 
 * Custom hook for budget management.
 * Provides clean interface for budget operations.
 */

import { useState, useEffect, useCallback } from 'react';
import { BudgetService } from '../services/BudgetService';
import { Budget } from '../../../shared/types';
import { 
  CreateBudgetDto, 
  UpdateBudgetDto, 
  BudgetState, 
  BudgetStatus,
  BudgetSummary 
} from '../types/budget.types';
import { useToast } from '../../../shared/hooks';

interface UseBudgetsOptions {
  budgetService: BudgetService;
  userId?: string;
  autoLoad?: boolean;
}

export function useBudgets(options: UseBudgetsOptions) {
  const { budgetService, userId, autoLoad = true } = options;
  const { toast } = useToast();

  const [state, setState] = useState<BudgetState>({
    budgets: [],
    budgetStatuses: {},
    analytics: null,
    isLoading: false,
    error: null,
  });

  // Load budgets
  const loadBudgets = useCallback(async () => {
    if (!userId) return;

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const budgets = await budgetService.getBudgets(userId);
      
      setState(prev => ({
        ...prev,
        budgets,
        isLoading: false,
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load budgets';
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
  }, [userId, budgetService, toast]);

  // Create budget
  const createBudget = useCallback(async (budgetData: CreateBudgetDto) => {
    if (!userId) {
      throw new Error('User ID is required');
    }

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const newBudget = await budgetService.createBudget(userId, budgetData);
      
      setState(prev => ({
        ...prev,
        budgets: [...prev.budgets, newBudget],
        isLoading: false,
      }));

      toast({
        title: "Success",
        description: "Budget created successfully",
      });

      return newBudget;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create budget';
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
  }, [userId, budgetService, toast]);

  // Update budget
  const updateBudget = useCallback(async (
    budgetId: string, 
    updates: UpdateBudgetDto
  ) => {
    if (!userId) {
      throw new Error('User ID is required');
    }

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      await budgetService.updateBudget(userId, budgetId, updates);
      
      setState(prev => ({
        ...prev,
        budgets: prev.budgets.map(b => 
          b.id === budgetId ? { ...b, ...updates } : b
        ),
        isLoading: false,
      }));

      toast({
        title: "Success",
        description: "Budget updated successfully",
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update budget';
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
  }, [userId, budgetService, toast]);

  // Delete budget
  const deleteBudget = useCallback(async (budgetId: string) => {
    if (!userId) {
      throw new Error('User ID is required');
    }

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      await budgetService.deleteBudget(userId, budgetId);
      
      setState(prev => ({
        ...prev,
        budgets: prev.budgets.filter(b => b.id !== budgetId),
        isLoading: false,
      }));

      toast({
        title: "Success",
        description: "Budget deleted successfully",
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete budget';
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
  }, [userId, budgetService, toast]);

  // Calculate budget status
  const calculateBudgetStatus = useCallback((budget: Budget, spent: number): BudgetStatus => {
    return budgetService.calculateBudgetStatus(budget, spent);
  }, [budgetService]);

  // Update budget statuses
  const updateBudgetStatuses = useCallback((spentByCategory: Record<string, number>) => {
    const budgetStatuses: Record<string, BudgetStatus> = {};
    
    state.budgets.forEach(budget => {
      const spent = spentByCategory[budget.Category] || 0;
      budgetStatuses[budget.Category] = calculateBudgetStatus(budget, spent);
    });

    setState(prev => ({
      ...prev,
      budgetStatuses,
    }));
  }, [state.budgets, calculateBudgetStatus]);

  // Get budget by category
  const getBudgetByCategory = useCallback((category: string): Budget | undefined => {
    return state.budgets.find(b => b.Category === category);
  }, [state.budgets]);

  // Get budgets by type
  const getBudgetsByType = useCallback((type: 'expense' | 'income'): Budget[] => {
    return state.budgets.filter(b => (b.type || 'expense') === type);
  }, [state.budgets]);

  // Get total budgeted amount
  const getTotalBudgetedAmount = useCallback((type?: 'expense' | 'income'): number => {
    const budgets = type ? getBudgetsByType(type) : state.budgets;
    return budgets.reduce((total, budget) => total + budget.MonthlyBudget, 0);
  }, [state.budgets, getBudgetsByType]);

  // Get budget summary
  const getBudgetSummary = useCallback((): BudgetSummary => {
    const totalBudgeted = getTotalBudgetedAmount();
    const totalSpent = Object.values(state.budgetStatuses).reduce(
      (sum, status) => sum + status.spent, 0
    );
    const totalRemaining = Object.values(state.budgetStatuses).reduce(
      (sum, status) => sum + status.remaining, 0
    );
    const overBudgetCategories = Object.values(state.budgetStatuses).filter(
      status => status.isOverBudget
    ).length;
    const nearLimitCategories = Object.values(state.budgetStatuses).filter(
      status => status.isNearLimit
    ).length;
    const averageUtilization = state.budgets.length > 0 
      ? Object.values(state.budgetStatuses).reduce(
          (sum, status) => sum + status.percentage, 0
        ) / state.budgets.length
      : 0;

    return {
      totalBudgeted,
      totalSpent,
      totalRemaining,
      overBudgetCategories,
      nearLimitCategories,
      averageUtilization,
    };
  }, [state.budgets, state.budgetStatuses, getTotalBudgetedAmount]);

  // Check if budget exists for category
  const budgetExistsForCategory = useCallback((category: string): boolean => {
    return state.budgets.some(b => b.Category === category);
  }, [state.budgets]);

  // Refresh budgets
  const refresh = useCallback(() => {
    loadBudgets();
  }, [loadBudgets]);

  // Initial load
  useEffect(() => {
    if (autoLoad && userId) {
      loadBudgets();
    }
  }, [autoLoad, userId, loadBudgets]);

  return {
    // State
    ...state,

    // Actions
    loadBudgets,
    createBudget,
    updateBudget,
    deleteBudget,
    updateBudgetStatuses,
    refresh,

    // Utilities
    calculateBudgetStatus,
    getBudgetByCategory,
    getBudgetsByType,
    getTotalBudgetedAmount,
    getBudgetSummary,
    budgetExistsForCategory,
  };
}