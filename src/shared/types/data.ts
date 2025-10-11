
export interface Transaction {
  id: string;
  Date: { seconds: number; nanoseconds: number; } | string | null;
  Amount: number;
  Type: 'income' | 'expense';
  Category: string;
  Notes: string;
}

export interface RecurringTransaction {
  id: string;
  Amount: number;
  Type: 'income' | 'expense';
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
}

export interface User {
  id: string;
  name: string;
  categories?: string[];
  incomeCategories?: string[];
  income?: number;
  savings?: number;
}
