import { useState, useEffect, useMemo } from "react";
import { type RecurringTransaction } from "@/shared/types";
import { useUser, useFirestore, useMemoFirebase, useCollection } from "@/firebase";
import { doc, collection, query, orderBy, addDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { addDocumentNonBlocking, updateDocumentNonBlocking, deleteDocumentNonBlocking } from "@/firebase/non-blocking-updates";
import { useToast } from "@/shared/hooks";

export function useRecurringTransactions() {
  const [isProcessing, setIsProcessing] = useState(false);
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();

  // Query for recurring transactions
  const recurringQuery = useMemoFirebase(
    () => (firestore && user ? query(collection(firestore, `users/${user.uid}/recurringTransactions`), orderBy('createdAt', 'desc')) : null),
    [firestore, user]
  );
  
  const { data: recurringTransactions, isLoading: isRecurringLoading } = useCollection<RecurringTransaction>(recurringQuery);

  // Helper function to calculate next due date based on frequency
  const calculateNextDueDate = (currentDate: Date, frequency: 'weekly' | 'monthly' | 'yearly'): Date => {
    const nextDate = new Date(currentDate);
    
    switch (frequency) {
      case 'weekly':
        nextDate.setDate(nextDate.getDate() + 7);
        break;
      case 'monthly':
        nextDate.setMonth(nextDate.getMonth() + 1);
        break;
      case 'yearly':
        nextDate.setFullYear(nextDate.getFullYear() + 1);
        break;
    }
    
    return nextDate;
  };

  // Check for due recurring transactions and create them
  const processRecurringTransactions = async () => {
    if (!user || !firestore || !recurringTransactions || isProcessing) return;
    
    setIsProcessing(true);
    const now = new Date();
    let processedCount = 0;

    try {
      for (const recurring of recurringTransactions) {
        if (!recurring.isActive) continue;
        
        const dueDate = new Date(recurring.nextDueDate);
        
        // If the transaction is due (due date has passed)
        if (dueDate <= now) {
          // Create the actual transaction
          const transactionData = {
            Amount: recurring.Amount,
            Type: recurring.Type,
            Category: recurring.Category,
            Notes: recurring.Notes,
            Date: now,
            userId: user.uid,
          };

          // Add the transaction
          const transactionsCollection = collection(firestore, `users/${user.uid}/transactions`);
          await addDocumentNonBlocking(transactionsCollection, transactionData);

          // Update the recurring transaction's next due date
          const nextDueDate = calculateNextDueDate(dueDate, recurring.frequency);
          const recurringRef = doc(firestore, `users/${user.uid}/recurringTransactions`, recurring.id);
          
          await updateDocumentNonBlocking(recurringRef, {
            nextDueDate,
            lastProcessed: now,
          });

          processedCount++;
        }
      }

      if (processedCount > 0) {
        toast({
          title: "Recurring Transactions Processed",
          description: `${processedCount} recurring transaction(s) have been created.`,
        });
      }
    } catch (error) {
      console.error('Error processing recurring transactions:', error);
      toast({
        variant: "destructive",
        title: "Error Processing Recurring Transactions",
        description: "There was an error processing your recurring transactions.",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Auto-process recurring transactions on app load and periodically
  useEffect(() => {
    if (recurringTransactions && !isRecurringLoading) {
      processRecurringTransactions();
    }
  }, [recurringTransactions, isRecurringLoading]);

  // CRUD operations for recurring transactions
  const createRecurringTransaction = async (data: Omit<RecurringTransaction, 'id' | 'createdAt' | 'userId'>) => {
    if (!user || !firestore) {
      throw new Error('User not authenticated');
    }

    const recurringData = {
      ...data,
      userId: user.uid,
      createdAt: new Date(),
    };

    const recurringCollection = collection(firestore, `users/${user.uid}/recurringTransactions`);
    await addDocumentNonBlocking(recurringCollection, recurringData);
  };

  const updateRecurringTransaction = async (id: string, updates: Partial<RecurringTransaction>) => {
    if (!user || !firestore) {
      throw new Error('User not authenticated');
    }

    const recurringRef = doc(firestore, `users/${user.uid}/recurringTransactions`, id);
    await updateDocumentNonBlocking(recurringRef, updates);
  };

  const deleteRecurringTransaction = async (id: string) => {
    if (!user || !firestore) {
      throw new Error('User not authenticated');
    }

    const recurringRef = doc(firestore, `users/${user.uid}/recurringTransactions`, id);
    await deleteDocumentNonBlocking(recurringRef);
  };

  const toggleRecurringTransaction = async (id: string, isActive: boolean) => {
    await updateRecurringTransaction(id, { isActive });
  };

  // Get active recurring transactions
  const activeRecurringTransactions = useMemo(() => {
    return recurringTransactions?.filter(rt => rt.isActive) || [];
  }, [recurringTransactions]);

  // Get upcoming due transactions (next 7 days)
  const upcomingTransactions = useMemo(() => {
    if (!recurringTransactions) return [];
    
    const now = new Date();
    const nextWeek = new Date();
    nextWeek.setDate(now.getDate() + 7);
    
    return recurringTransactions
      .filter(rt => rt.isActive)
      .filter(rt => {
        const dueDate = new Date(rt.nextDueDate);
        return dueDate >= now && dueDate <= nextWeek;
      })
      .sort((a, b) => new Date(a.nextDueDate).getTime() - new Date(b.nextDueDate).getTime());
  }, [recurringTransactions]);

  return {
    // Data
    recurringTransactions: recurringTransactions || [],
    activeRecurringTransactions,
    upcomingTransactions,
    isRecurringLoading,
    isProcessing,
    
    // Actions
    createRecurringTransaction,
    updateRecurringTransaction,
    deleteRecurringTransaction,
    toggleRecurringTransaction,
    processRecurringTransactions,
  };
}