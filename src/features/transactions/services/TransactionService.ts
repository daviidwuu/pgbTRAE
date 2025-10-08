import { doc, collection, setDoc, query, orderBy, limit, type Firestore } from 'firebase/firestore';
import { type Transaction } from "@/shared/types";
import { deleteDocumentNonBlocking, updateDocumentNonBlocking } from "@/firebase/non-blocking-updates";

export interface CreateTransactionDto {
  Date: Date | string;
  Amount: number;
  Type: 'income' | 'expense' | 'Income' | 'Expense';
  Category: string;
  Notes?: string;
}

export interface UpdateTransactionDto extends Partial<CreateTransactionDto> {
  id?: never; // Prevent id from being updated
}

export class TransactionService {
  static async create(
    userId: string, 
    firestore: Firestore, 
    transactionData: CreateTransactionDto
  ): Promise<void> {
    if (!userId || !firestore) {
      throw new Error('User ID and Firestore instance are required');
    }

    const transactionsCollection = collection(firestore, `users/${userId}/transactions`);
    const newTransactionRef = doc(transactionsCollection);
    
    const transactionWithMeta = {
      ...transactionData,
      userId,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await setDoc(newTransactionRef, transactionWithMeta);
  }

  static async update(
    userId: string,
    firestore: Firestore,
    transactionId: string,
    updates: UpdateTransactionDto
  ): Promise<void> {
    if (!userId || !firestore || !transactionId) {
      throw new Error('User ID, Firestore instance, and transaction ID are required');
    }

    const transactionRef = doc(firestore, `users/${userId}/transactions`, transactionId);
    
    const updatesWithMeta = {
      ...updates,
      updatedAt: new Date(),
    };

    await updateDocumentNonBlocking(transactionRef, updatesWithMeta);
  }

  static async delete(
    userId: string,
    firestore: Firestore,
    transactionId: string
  ): Promise<void> {
    if (!userId || !firestore || !transactionId) {
      throw new Error('User ID, Firestore instance, and transaction ID are required');
    }

    const transactionRef = doc(firestore, `users/${userId}/transactions`, transactionId);
    await deleteDocumentNonBlocking(transactionRef);
  }

  static createQuery(userId: string, firestore: Firestore, limitCount: number = 20) {
    if (!userId || !firestore) {
      return null;
    }

    return query(
      collection(firestore, `users/${userId}/transactions`),
      orderBy('Date', 'desc'),
      limit(limitCount)
    );
  }

  static filterByDateRange(
    transactions: Transaction[],
    startDate: Date,
    endDate: Date
  ): Transaction[] {
    return transactions.filter(transaction => {
      let transactionDate: Date;
      
      if (typeof transaction.Date === 'string') {
        transactionDate = new Date(transaction.Date);
      } else if (transaction.Date && typeof transaction.Date === 'object' && 'seconds' in transaction.Date) {
        transactionDate = new Date(transaction.Date.seconds * 1000);
      } else {
        return false;
      }
      
      if (isNaN(transactionDate.getTime())) return false;
      
      return transactionDate >= startDate && transactionDate <= endDate;
    });
  }

  static filterByType(
    transactions: Transaction[],
    type: 'income' | 'expense'
  ): Transaction[] {
    return transactions.filter(t => 
      t.Type === type || t.Type === (type.charAt(0).toUpperCase() + type.slice(1))
    );
  }

  static sortTransactions(
    transactions: Transaction[],
    sortBy: 'latest' | 'highest' | 'category'
  ): Transaction[] {
    const sorted = [...transactions];
    
    switch (sortBy) {
      case 'highest':
        return sorted.sort((a, b) => b.Amount - a.Amount);
      case 'category':
        return sorted.sort((a, b) => a.Category.localeCompare(b.Category));
      case 'latest':
      default:
        // Data is already sorted by date descending from Firestore
        return sorted;
    }
  }

  static calculateTotalAmount(transactions: Transaction[]): number {
    return transactions.reduce((sum, transaction) => sum + transaction.Amount, 0);
  }

  static aggregateByCategory(transactions: Transaction[]): Array<{ category: string; amount: number }> {
    return transactions
      .reduce((acc, transaction) => {
        const existingCategory = acc.find(
          (item) => item.category === transaction.Category
        );
        if (existingCategory) {
          existingCategory.amount += transaction.Amount;
        } else {
          acc.push({
            category: transaction.Category,
            amount: transaction.Amount,
          });
        }
        return acc;
      }, [] as { category: string; amount: number }[])
      .sort((a, b) => b.amount - a.amount);
  }
}