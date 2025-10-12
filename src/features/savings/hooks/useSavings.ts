import { useMemo } from 'react';
import { SavingsService, type SavingsCalculationResult, type DailySavings } from '../services/SavingsService';
import { type Transaction, type Budget } from '@/shared/types';

export interface UseSavingsResult {
  totalSavings: number;
  dailyBreakdown: DailySavings[];
  averageDailySavings: number;
  daysTracked: number;
  todaysSavings: DailySavings | null;
  isLoading: boolean;
  hasData: boolean;
}

export function useSavings(
  transactions: Transaction[] | undefined,
  budgets: Budget[] | undefined,
  isTransactionsLoading: boolean = false,
  isBudgetsLoading: boolean = false
): UseSavingsResult {
  
  const savingsCalculation = useMemo((): SavingsCalculationResult => {
    if (!transactions || !budgets || transactions.length === 0 || budgets.length === 0) {
      return {
        totalSavings: 0,
        dailyBreakdown: [],
        averageDailySavings: 0,
        daysTracked: 0
      };
    }
    
    return SavingsService.calculateSavings(transactions, budgets);
  }, [transactions, budgets]);
  
  const todaysSavings = useMemo((): DailySavings | null => {
    if (!transactions || !budgets) {
      return null;
    }
    
    return SavingsService.getTodaysSavings(transactions, budgets);
  }, [transactions, budgets]);
  
  const isLoading = isTransactionsLoading || isBudgetsLoading;
  const hasData = Boolean(transactions && budgets && transactions.length > 0 && budgets.length > 0);
  
  return {
    totalSavings: savingsCalculation.totalSavings,
    dailyBreakdown: savingsCalculation.dailyBreakdown,
    averageDailySavings: savingsCalculation.averageDailySavings,
    daysTracked: savingsCalculation.daysTracked,
    todaysSavings,
    isLoading,
    hasData
  };
}