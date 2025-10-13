/**
 * Recurring Transaction Service
 * 
 * Handles recurring transaction operations with Firestore.
 * Single responsibility: Recurring transaction management.
 */

import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  getDocs, 
  query, 
  where, 
  orderBy,
  Firestore 
} from 'firebase/firestore';
import { BaseService } from '../../services';
import { RecurringTransaction } from '../../../shared/types';
import { TransactionUtils } from '../utils/transaction.utils';

export interface CreateRecurringTransactionDto {
  Amount: number;
  Type: 'income' | 'expense';
  Category: string;
  Notes: string;
  frequency: 'weekly' | 'monthly' | 'yearly';
  nextDueDate: Date;
  isActive?: boolean;
}

export interface UpdateRecurringTransactionDto extends Partial<CreateRecurringTransactionDto> {
  id?: never; // Prevent id from being updated
  lastProcessed?: Date; // Allow updating lastProcessed
}

export class RecurringTransactionService extends BaseService {
  private firestore: Firestore;

  constructor(firestore: Firestore) {
    super();
    this.firestore = firestore;
  }

  /**
   * Create a new recurring transaction
   */
  async createRecurringTransaction(
    userId: string, 
    transactionData: CreateRecurringTransactionDto
  ): Promise<RecurringTransaction> {
    if (!userId) {
      throw new Error('User ID is required');
    }

    const recurringTransactionsRef = collection(
      this.firestore, 
      'users', 
      userId, 
      'recurringTransactions'
    );
    
    const recurringTransactionWithDefaults = {
      ...transactionData,
      isActive: transactionData.isActive ?? true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const docRef = await addDoc(recurringTransactionsRef, recurringTransactionWithDefaults);
    
    return {
      id: docRef.id,
      ...recurringTransactionWithDefaults,
    } as RecurringTransaction;
  }

  /**
   * Get recurring transactions for a user
   */
  async getRecurringTransactions(userId: string): Promise<RecurringTransaction[]> {
    if (!userId) {
      throw new Error('User ID is required');
    }

    const recurringTransactionsRef = collection(
      this.firestore, 
      'users', 
      userId, 
      'recurringTransactions'
    );
    
    const q = query(recurringTransactionsRef, orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    const recurringTransactions: RecurringTransaction[] = [];

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      recurringTransactions.push({
        id: doc.id,
        ...data,
        nextDueDate: data.nextDueDate?.toDate() || new Date(),
        createdAt: data.createdAt?.toDate() || new Date(),
        lastProcessed: data.lastProcessed?.toDate(),
      } as RecurringTransaction);
    });

    return recurringTransactions;
  }

  /**
   * Get active recurring transactions
   */
  async getActiveRecurringTransactions(userId: string): Promise<RecurringTransaction[]> {
    const allRecurring = await this.getRecurringTransactions(userId);
    return allRecurring.filter(rt => rt.isActive);
  }

  /**
   * Get due recurring transactions
   */
  async getDueRecurringTransactions(userId: string): Promise<RecurringTransaction[]> {
    const activeRecurring = await this.getActiveRecurringTransactions(userId);
    return activeRecurring.filter(rt => TransactionUtils.isRecurringTransactionDue(rt));
  }

  /**
   * Get upcoming recurring transactions (next 7 days)
   */
  async getUpcomingRecurringTransactions(userId: string): Promise<RecurringTransaction[]> {
    const activeRecurring = await this.getActiveRecurringTransactions(userId);
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

    return activeRecurring.filter(rt => {
      const nextDue = new Date(rt.nextDueDate);
      const now = new Date();
      return nextDue >= now && nextDue <= sevenDaysFromNow;
    });
  }

  /**
   * Update a recurring transaction
   */
  async updateRecurringTransaction(
    userId: string, 
    recurringTransactionId: string, 
    updates: UpdateRecurringTransactionDto
  ): Promise<void> {
    if (!userId || !recurringTransactionId) {
      throw new Error('User ID and recurring transaction ID are required');
    }

    const recurringTransactionRef = doc(
      this.firestore, 
      'users', 
      userId, 
      'recurringTransactions', 
      recurringTransactionId
    );
    
    const updateData = {
      ...updates,
      updatedAt: new Date(),
    };

    await updateDoc(recurringTransactionRef, updateData);
  }

  /**
   * Delete a recurring transaction
   */
  async deleteRecurringTransaction(userId: string, recurringTransactionId: string): Promise<void> {
    if (!userId || !recurringTransactionId) {
      throw new Error('User ID and recurring transaction ID are required');
    }

    const recurringTransactionRef = doc(
      this.firestore, 
      'users', 
      userId, 
      'recurringTransactions', 
      recurringTransactionId
    );
    
    await deleteDoc(recurringTransactionRef);
  }

  /**
   * Activate/Deactivate recurring transaction
   */
  async toggleRecurringTransaction(
    userId: string, 
    recurringTransactionId: string, 
    isActive: boolean
  ): Promise<void> {
    await this.updateRecurringTransaction(userId, recurringTransactionId, { isActive });
  }

  /**
   * Process due recurring transaction
   */
  async processRecurringTransaction(
    userId: string, 
    recurringTransaction: RecurringTransaction
  ): Promise<void> {
    if (!TransactionUtils.isRecurringTransactionDue(recurringTransaction)) {
      throw new Error('Recurring transaction is not due for processing');
    }

    // Calculate next due date
    const nextDueDate = TransactionUtils.calculateNextDueDate(recurringTransaction);

    // Update the recurring transaction with new due date and last processed timestamp
    await this.updateRecurringTransaction(userId, recurringTransaction.id, {
      nextDueDate,
      lastProcessed: new Date(),
    });
  }

  /**
   * Get recurring transaction by ID
   */
  async getRecurringTransactionById(
    userId: string, 
    recurringTransactionId: string
  ): Promise<RecurringTransaction | null> {
    const recurringTransactions = await this.getRecurringTransactions(userId);
    return recurringTransactions.find(rt => rt.id === recurringTransactionId) || null;
  }
}