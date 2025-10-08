import { doc, collection, setDoc, type Firestore } from 'firebase/firestore';
import { type Budget } from "@/shared/types";
import { deleteDocumentNonBlocking } from "@/firebase/non-blocking-updates";
import { getDaysInMonth, differenceInMonths } from 'date-fns';
import { type DateRange } from "@/components/dashboard/date-filter";

export interface CreateBudgetDto {
  Category: string;
  MonthlyBudget: number;
}

export interface UpdateBudgetDto extends Partial<CreateBudgetDto> {
  id?: never; // Prevent id from being updated
}

export class BudgetService {
  static async create(
    userId: string,
    firestore: Firestore,
    budgetData: CreateBudgetDto
  ): Promise<void> {
    if (!userId || !firestore) {
      throw new Error('User ID and Firestore instance are required');
    }

    const budgetRef = doc(firestore, `users/${userId}/budgets`, budgetData.Category);
    
    const budgetWithMeta = {
      ...budgetData,
      userId,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await setDoc(budgetRef, budgetWithMeta, { merge: true });
  }

  static async update(
    userId: string,
    firestore: Firestore,
    category: string,
    updates: UpdateBudgetDto
  ): Promise<void> {
    if (!userId || !firestore || !category) {
      throw new Error('User ID, Firestore instance, and category are required');
    }

    const budgetRef = doc(firestore, `users/${userId}/budgets`, category);
    
    const updatesWithMeta = {
      ...updates,
      updatedAt: new Date(),
    };

    await setDoc(budgetRef, updatesWithMeta, { merge: true });
  }

  static async delete(
    userId: string,
    firestore: Firestore,
    category: string
  ): Promise<void> {
    if (!userId || !firestore || !category) {
      throw new Error('User ID, Firestore instance, and category are required');
    }

    const budgetRef = doc(firestore, `users/${userId}/budgets`, category);
    await deleteDocumentNonBlocking(budgetRef);
  }

  static createQuery(userId: string, firestore: Firestore) {
    if (!userId || !firestore) {
      return null;
    }

    return collection(firestore, `users/${userId}/budgets`);
  }

  static calculateTotalBudget(
    userIncome: number = 0,
    userSavings: number = 0,
    dateRange: DateRange,
    transactions: any[] = []
  ): number {
    const monthlyBudget = userIncome - userSavings;
    const now = new Date();

    switch (dateRange) {
      case 'daily':
        return monthlyBudget / getDaysInMonth(now);
      case 'week':
        return (monthlyBudget / getDaysInMonth(now)) * 7;
      case 'month':
        return monthlyBudget;
      case 'yearly':
        return monthlyBudget * 12;
      case 'all':
        if (!transactions || transactions.length === 0) return monthlyBudget;
        const oldestLoaded = transactions[transactions.length - 1]?.Date;
        if (!oldestLoaded) return monthlyBudget;
        
        let oldestDate: Date;
        if (typeof oldestLoaded === 'string') {
          oldestDate = new Date(oldestLoaded);
        } else if (oldestLoaded && typeof oldestLoaded === 'object' && 'seconds' in oldestLoaded) {
          oldestDate = new Date(oldestLoaded.seconds * 1000);
        } else {
          return monthlyBudget;
        }
        
        const monthSpan = differenceInMonths(now, oldestDate) + 1;
        return monthlyBudget * Math.max(1, monthSpan);
      default:
        return monthlyBudget;
    }
  }

  static calculateBudgetProgress(spent: number, budget: number): {
    percentage: number;
    isOverBudget: boolean;
    remaining: number;
  } {
    const percentage = budget > 0 ? (spent / budget) * 100 : 0;
    const isOverBudget = percentage >= 100;
    const remaining = Math.max(0, budget - spent);

    return {
      percentage: Math.min(percentage, 100),
      isOverBudget,
      remaining,
    };
  }

  static getBudgetByCategory(budgets: Budget[], category: string): Budget | undefined {
    return budgets.find(budget => budget.Category === category);
  }

  static getTotalMonthlyBudget(budgets: Budget[]): number {
    return budgets.reduce((total, budget) => total + (budget.MonthlyBudget || 0), 0);
  }
}