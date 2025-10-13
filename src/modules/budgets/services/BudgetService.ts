/**
 * Budget Service
 * 
 * Handles budget CRUD operations with Firestore.
 * Single responsibility: Budget data management.
 */

import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  getDocs, 
  query, 
  orderBy,
  Firestore 
} from 'firebase/firestore';
import { BaseService } from '../../services';
import { Budget } from '../../../shared/types';
import { CreateBudgetDto, UpdateBudgetDto, BudgetStatus } from '../types/budget.types';

export class BudgetService extends BaseService {
  private firestore: Firestore;

  constructor(firestore: Firestore) {
    super();
    this.firestore = firestore;
  }

  /**
   * Create a new budget
   */
  async createBudget(userId: string, budgetData: CreateBudgetDto): Promise<Budget> {
    if (!userId) {
      throw new Error('User ID is required');
    }

    const budgetsRef = collection(this.firestore, 'users', userId, 'budgets');
    
    const budgetWithDefaults = {
      ...budgetData,
      type: budgetData.type || 'expense',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const docRef = await addDoc(budgetsRef, budgetWithDefaults);
    
    return {
      id: docRef.id,
      ...budgetWithDefaults,
    } as Budget;
  }

  /**
   * Get budgets for a user
   */
  async getBudgets(userId: string): Promise<Budget[]> {
    if (!userId) {
      throw new Error('User ID is required');
    }

    const budgetsRef = collection(this.firestore, 'users', userId, 'budgets');
    const q = query(budgetsRef, orderBy('Category', 'asc'));
    
    const querySnapshot = await getDocs(q);
    const budgets: Budget[] = [];

    querySnapshot.forEach((doc) => {
      budgets.push({
        id: doc.id,
        ...doc.data(),
      } as Budget);
    });

    return budgets;
  }

  /**
   * Update a budget
   */
  async updateBudget(
    userId: string, 
    budgetId: string, 
    updates: UpdateBudgetDto
  ): Promise<void> {
    if (!userId || !budgetId) {
      throw new Error('User ID and budget ID are required');
    }

    const budgetRef = doc(this.firestore, 'users', userId, 'budgets', budgetId);
    
    const updateData = {
      ...updates,
      updatedAt: new Date(),
    };

    await updateDoc(budgetRef, updateData);
  }

  /**
   * Delete a budget
   */
  async deleteBudget(userId: string, budgetId: string): Promise<void> {
    if (!userId || !budgetId) {
      throw new Error('User ID and budget ID are required');
    }

    const budgetRef = doc(this.firestore, 'users', userId, 'budgets', budgetId);
    await deleteDoc(budgetRef);
  }

  /**
   * Get budget by category
   */
  async getBudgetByCategory(userId: string, category: string): Promise<Budget | null> {
    const budgets = await this.getBudgets(userId);
    return budgets.find(b => b.Category === category) || null;
  }

  /**
   * Get budgets by type
   */
  async getBudgetsByType(userId: string, type: 'expense' | 'income'): Promise<Budget[]> {
    const budgets = await this.getBudgets(userId);
    return budgets.filter(b => (b.type || 'expense') === type);
  }

  /**
   * Calculate budget status
   */
  calculateBudgetStatus(budget: Budget, spent: number): BudgetStatus {
    const remaining = Math.max(0, budget.MonthlyBudget - spent);
    const percentage = budget.MonthlyBudget > 0 ? (spent / budget.MonthlyBudget) * 100 : 0;
    const isOverBudget = spent > budget.MonthlyBudget;
    const isNearLimit = percentage >= 70 && !isOverBudget; // 70% threshold

    return {
      spent,
      remaining,
      percentage,
      isOverBudget,
      isNearLimit,
    };
  }

  /**
   * Get total budgeted amount
   */
  async getTotalBudgetedAmount(userId: string, type?: 'expense' | 'income'): Promise<number> {
    const budgets = type 
      ? await this.getBudgetsByType(userId, type)
      : await this.getBudgets(userId);
    
    return budgets.reduce((total, budget) => total + budget.MonthlyBudget, 0);
  }

  /**
   * Check if budget exists for category
   */
  async budgetExistsForCategory(userId: string, category: string): Promise<boolean> {
    const budget = await this.getBudgetByCategory(userId, category);
    return budget !== null;
  }

  /**
   * Bulk create budgets
   */
  async bulkCreateBudgets(userId: string, budgetsData: CreateBudgetDto[]): Promise<Budget[]> {
    const createPromises = budgetsData.map(budgetData => 
      this.createBudget(userId, budgetData)
    );

    return Promise.all(createPromises);
  }

  /**
   * Bulk update budgets
   */
  async bulkUpdateBudgets(
    userId: string, 
    updates: Array<{ budgetId: string; updates: UpdateBudgetDto }>
  ): Promise<void> {
    const updatePromises = updates.map(({ budgetId, updates: budgetUpdates }) => 
      this.updateBudget(userId, budgetId, budgetUpdates)
    );

    await Promise.all(updatePromises);
  }
}