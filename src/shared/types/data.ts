
export interface Transaction {
  id: string;
  Date: { seconds: number; nanoseconds: number; } | string | null;
  Amount: number;
  Type: string;
  Category: string;
  Notes: string;
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
  income?: number;
  savings?: number;
}
