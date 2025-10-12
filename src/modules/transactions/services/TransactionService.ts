/**
 * Transaction Service
 * 
 * Handles transaction CRUD operations with Firestore.
 * Single responsibility: Transaction data management.
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
  limit,
  Firestore 
} from 'firebase/firestore';
import { BaseService } from '../../services';
import { Transaction } from '../../../shared/types';
import { CreateTransactionDto, UpdateTransactionDto, TransactionFilters } from '../types/transaction.types';
import { TransactionUtils } from '../utils/transaction.utils';

export class TransactionService extends BaseService {
  private firestore: Firestore;

  constructor(firestore: Firestore) {
    super();
    this.firestore = firestore;
  }

  /**
   * Create a new transaction
   */
  async createTransaction(userId: string, transactionData: CreateTransactionDto): Promise<Transaction> {
    if (!userId) {
      throw new Error('User ID is required');
    }

    const transactionsRef = collection(this.firestore, 'users', userId, 'transactions');
    
    // Handle Date conversion properly for Firestore
    let dateValue: string | { seconds: number; nanoseconds: number } | null = null;
    if (transactionData.Date) {
      if (transactionData.Date instanceof Date) {
        dateValue = transactionData.Date.toISOString();
      } else {
        dateValue = transactionData.Date;
      }
    }
    
    const transactionWithDefaults = {
      Amount: transactionData.Amount,
      Type: transactionData.Type,
      Category: transactionData.Category,
      Notes: transactionData.Notes,
      Date: dateValue,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const docRef = await addDoc(transactionsRef, transactionWithDefaults);
    
    return {
      id: docRef.id,
      Amount: transactionWithDefaults.Amount,
      Type: transactionWithDefaults.Type,
      Category: transactionWithDefaults.Category,
      Notes: transactionWithDefaults.Notes,
      Date: dateValue,
    };
  }

  /**
   * Get transactions for a user
   */
  async getTransactions(
    userId: string, 
    filters?: TransactionFilters,
    limitCount?: number
  ): Promise<Transaction[]> {
    if (!userId) {
      throw new Error('User ID is required');
    }

    const transactionsRef = collection(this.firestore, 'users', userId, 'transactions');
    let q = query(transactionsRef, orderBy('Date', 'desc'));

    // Apply filters
    if (filters?.types && filters.types.length > 0) {
      q = query(q, where('Type', 'in', filters.types));
    }

    if (filters?.categories && filters.categories.length > 0) {
      q = query(q, where('Category', 'in', filters.categories));
    }

    if (limitCount) {
      q = query(q, limit(limitCount));
    }

    const querySnapshot = await getDocs(q);
    const transactions: Transaction[] = [];

    querySnapshot.forEach((doc) => {
      transactions.push({
        id: doc.id,
        ...doc.data(),
      } as Transaction);
    });

    // Apply client-side filters for complex filtering
    let filteredTransactions = transactions;
    
    if (filters) {
      filteredTransactions = TransactionUtils.filterTransactions(transactions, filters);
    }

    return filteredTransactions;
  }

  /**
   * Update a transaction
   */
  async updateTransaction(
    userId: string, 
    transactionId: string, 
    updates: UpdateTransactionDto
  ): Promise<void> {
    if (!userId || !transactionId) {
      throw new Error('User ID and transaction ID are required');
    }

    const transactionRef = doc(this.firestore, 'users', userId, 'transactions', transactionId);
    
    const updateData = {
      ...updates,
      updatedAt: new Date(),
    };

    await updateDoc(transactionRef, updateData);
  }

  /**
   * Delete a transaction
   */
  async deleteTransaction(userId: string, transactionId: string): Promise<void> {
    if (!userId || !transactionId) {
      throw new Error('User ID and transaction ID are required');
    }

    const transactionRef = doc(this.firestore, 'users', userId, 'transactions', transactionId);
    await deleteDoc(transactionRef);
  }

  /**
   * Get transaction by ID
   */
  async getTransactionById(userId: string, transactionId: string): Promise<Transaction | null> {
    if (!userId || !transactionId) {
      throw new Error('User ID and transaction ID are required');
    }

    const transactions = await this.getTransactions(userId);
    return transactions.find(t => t.id === transactionId) || null;
  }

  /**
   * Bulk delete transactions
   */
  async bulkDeleteTransactions(userId: string, transactionIds: string[]): Promise<void> {
    if (!userId || !transactionIds.length) {
      throw new Error('User ID and transaction IDs are required');
    }

    const deletePromises = transactionIds.map(id => 
      this.deleteTransaction(userId, id)
    );

    await Promise.all(deletePromises);
  }

  /**
   * Get transactions by date range
   */
  async getTransactionsByDateRange(
    userId: string, 
    startDate: Date, 
    endDate: Date
  ): Promise<Transaction[]> {
    const filters: TransactionFilters = {
      dateRange: { start: startDate, end: endDate }
    };

    return this.getTransactions(userId, filters);
  }

  /**
   * Get transactions by category
   */
  async getTransactionsByCategory(
    userId: string, 
    category: string
  ): Promise<Transaction[]> {
    const filters: TransactionFilters = {
      categories: [category]
    };

    return this.getTransactions(userId, filters);
  }
}