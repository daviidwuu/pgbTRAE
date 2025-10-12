
export type CategoryType = 'income' | 'expense';
export type TransactionType = 'income' | 'expense';

export interface Transaction {
  id: string;
  Date: { seconds: number; nanoseconds: number; } | string | null;
  Amount: number;
  Type: TransactionType;
  Category: string;
  Notes: string;
}

export interface RecurringTransaction {
  id: string;
  Amount: number;
  Type: TransactionType;
  Category: string;
  Notes: string;
  frequency: 'weekly' | 'monthly' | 'yearly';
  nextDueDate: Date;
  isActive: boolean;
  createdAt: Date;
  lastProcessed?: Date;
}

export interface Budget {
  id: string;
  Category: string;
  MonthlyBudget: number;
  type?: CategoryType; // Optional for backward compatibility, defaults to 'expense'
}

export interface CategoryInfo {
  name: string;
  type: CategoryType;
  status: 'active' | 'archived';
  aliases?: string[]; // For handling renames
}

export interface User {
  id: string;
  name: string;
  categories?: string[];
  incomeCategories?: string[];
  income?: number; // Deprecated - will be removed in favor of budget-based income
  savings?: number; // Deprecated - will be calculated from budgets
  onboardingCompleted?: boolean; // Flag to track if user has completed onboarding
}
