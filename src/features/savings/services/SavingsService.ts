import { getDaysInMonth, startOfDay, endOfDay, isAfter, isBefore, isSameDay } from 'date-fns';
import { type Transaction, type Budget } from '@/shared/types';

export interface DailySavings {
  date: Date;
  budgetPerDay: number;
  actualExpenses: number;
  actualIncome: number; // includes transfers
  dailySavings: number; // budgetPerDay - actualExpenses + actualIncome
  cumulativeSavings: number;
}

export interface SavingsCalculationResult {
  totalSavings: number;
  dailyBreakdown: DailySavings[];
  averageDailySavings: number;
  daysTracked: number;
}

export class SavingsService {
  /**
   * Calculate daily budget based on monthly budgets for a specific date
   */
  static calculateDailyBudget(budgets: Budget[], date: Date): number {
    const daysInMonth = getDaysInMonth(date);
    
    // Sum all monthly budgets (both income and expense categories)
    const totalMonthlyBudget = budgets.reduce((sum, budget) => {
      return sum + (budget.MonthlyBudget || 0);
    }, 0);
    
    return totalMonthlyBudget / daysInMonth;
  }

  /**
   * Get transactions for a specific date
   */
  static getTransactionsForDate(transactions: Transaction[], targetDate: Date): Transaction[] {
    const startOfTargetDay = startOfDay(targetDate);
    const endOfTargetDay = endOfDay(targetDate);
    
    return transactions.filter(transaction => {
      let transactionDate: Date;
      
      if (typeof transaction.Date === 'string') {
        transactionDate = new Date(transaction.Date);
      } else if (transaction.Date && typeof transaction.Date === 'object' && 'seconds' in transaction.Date) {
        transactionDate = new Date(transaction.Date.seconds * 1000);
      } else {
        return false; // Skip invalid dates
      }
      
      return transactionDate >= startOfTargetDay && transactionDate <= endOfTargetDay;
    });
  }

  /**
   * Calculate actual expenses for a specific date (excludes income and treats transfers as income)
   */
  static calculateActualExpenses(transactions: Transaction[]): number {
    return transactions
      .filter(t => t.Type === 'expense' && t.Category !== 'Transfer')
      .reduce((sum, t) => sum + t.Amount, 0);
  }

  /**
   * Calculate actual income for a specific date (includes transfers as income)
   */
  static calculateActualIncome(transactions: Transaction[]): number {
    return transactions
      .filter(t => t.Type === 'income' || t.Category === 'Transfer')
      .reduce((sum, t) => sum + t.Amount, 0);
  }

  /**
   * Find the earliest transaction date
   */
  static findEarliestTransactionDate(transactions: Transaction[]): Date | null {
    if (!transactions || transactions.length === 0) return null;
    
    let earliestDate: Date | null = null;
    
    for (const transaction of transactions) {
      let transactionDate: Date;
      
      if (typeof transaction.Date === 'string') {
        transactionDate = new Date(transaction.Date);
      } else if (transaction.Date && typeof transaction.Date === 'object' && 'seconds' in transaction.Date) {
        transactionDate = new Date(transaction.Date.seconds * 1000);
      } else {
        continue; // Skip invalid dates
      }
      
      if (!earliestDate || isBefore(transactionDate, earliestDate)) {
        earliestDate = transactionDate;
      }
    }
    
    return earliestDate;
  }

  /**
   * Generate array of dates from start date to today
   */
  static generateDateRange(startDate: Date, endDate: Date = new Date()): Date[] {
    const dates: Date[] = [];
    const currentDate = new Date(startDate);
    const finalDate = startOfDay(endDate);
    
    while (!isAfter(currentDate, finalDate)) {
      dates.push(new Date(currentDate));
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return dates;
  }

  /**
   * Calculate comprehensive savings from first transaction date to today
   */
  static calculateSavings(
    transactions: Transaction[],
    budgets: Budget[]
  ): SavingsCalculationResult {
    const earliestDate = this.findEarliestTransactionDate(transactions);
    
    if (!earliestDate) {
      return {
        totalSavings: 0,
        dailyBreakdown: [],
        averageDailySavings: 0,
        daysTracked: 0
      };
    }
    
    const dateRange = this.generateDateRange(startOfDay(earliestDate));
    const dailyBreakdown: DailySavings[] = [];
    let cumulativeSavings = 0;
    
    for (const date of dateRange) {
      const dailyBudget = this.calculateDailyBudget(budgets, date);
      const dayTransactions = this.getTransactionsForDate(transactions, date);
      const actualExpenses = this.calculateActualExpenses(dayTransactions);
      const actualIncome = this.calculateActualIncome(dayTransactions);
      
      // Daily savings = Budget per day - actual expenses + actual income
      const dailySavings = dailyBudget - actualExpenses + actualIncome;
      cumulativeSavings += dailySavings;
      
      dailyBreakdown.push({
        date,
        budgetPerDay: dailyBudget,
        actualExpenses,
        actualIncome,
        dailySavings,
        cumulativeSavings
      });
    }
    
    const averageDailySavings = dailyBreakdown.length > 0 
      ? cumulativeSavings / dailyBreakdown.length 
      : 0;
    
    return {
      totalSavings: cumulativeSavings,
      dailyBreakdown,
      averageDailySavings,
      daysTracked: dailyBreakdown.length
    };
  }

  /**
   * Get savings for today only
   */
  static getTodaysSavings(
    transactions: Transaction[],
    budgets: Budget[]
  ): DailySavings | null {
    const today = new Date();
    const dailyBudget = this.calculateDailyBudget(budgets, today);
    const todayTransactions = this.getTransactionsForDate(transactions, today);
    const actualExpenses = this.calculateActualExpenses(todayTransactions);
    const actualIncome = this.calculateActualIncome(todayTransactions);
    
    const dailySavings = dailyBudget - actualExpenses + actualIncome;
    
    return {
      date: today,
      budgetPerDay: dailyBudget,
      actualExpenses,
      actualIncome,
      dailySavings,
      cumulativeSavings: 0 // Not applicable for single day
    };
  }
}