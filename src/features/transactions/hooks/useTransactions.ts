import { useState, useMemo, useEffect } from "react";
import { type Transaction } from "@/shared/types";
import { useUser, useFirestore, useMemoFirebase, useCollection } from "@/firebase";
import { doc, collection, query, orderBy, limit, where } from 'firebase/firestore';
import { deleteDocumentNonBlocking } from "@/firebase/non-blocking-updates";
import { type DateRange } from "@/components/dashboard/date-filter";
import { startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear } from 'date-fns';
import { toDate } from "date-fns";

export type SortOption = 'latest' | 'highest' | 'category';

export function useTransactions(dateRange: DateRange = 'month') {
  const [visibleTransactions, setVisibleTransactions] = useState(20);
  const [sortOption, setSortOption] = useState<SortOption>('latest');
  const [transactionToEdit, setTransactionToEdit] = useState<Transaction | null>(null);
  const [transactionToDelete, setTransactionToDelete] = useState<Transaction | null>(null);

  const { user } = useUser();
  const firestore = useFirestore();

  // Query for visible transactions (limited for display)
  const transactionsQuery = useMemoFirebase(
    () => (firestore && user ? query(collection(firestore, `users/${user.uid}/transactions`), orderBy('Date', 'desc'), limit(visibleTransactions)) : null),
    [firestore, user, visibleTransactions]
  );
  
  const { data: transactions, isLoading: isTransactionsLoading } = useCollection<Transaction>(transactionsQuery);

  // Query for ALL transactions (for accurate totals calculation)
  const allTransactionsQuery = useMemoFirebase(
    () => (firestore && user ? query(collection(firestore, `users/${user.uid}/transactions`), orderBy('Date', 'desc')) : null),
    [firestore, user]
  );
  
  const { data: allTransactions, isLoading: isAllTransactionsLoading } = useCollection<Transaction>(allTransactionsQuery);

  // Debug logging for transactions
  useEffect(() => {
    console.log('Transactions debug:', {
      user: !!user,
      userId: user?.uid,
      firestore: !!firestore,
      transactionsQuery: !!transactionsQuery,
      transactions: transactions,
      transactionsLength: transactions?.length,
      isTransactionsLoading,
    });
    
    // Log individual transaction date formats for debugging
    if (transactions && transactions.length > 0) {
      console.log('Transaction date formats:', transactions.map(t => ({
        id: t.id,
        dateType: typeof t.Date,
        dateValue: t.Date,
        category: t.Category,
        amount: t.Amount,
        type: t.Type
      })));
    }
  }, [user, firestore, transactionsQuery, transactions, isTransactionsLoading]);

  const getDateFilterRange = (dateRange: DateRange) => {
    const now = new Date();
    switch (dateRange) {
      case 'daily':
        return { start: startOfDay(now), end: endOfDay(now) };
      case 'week':
        return { start: startOfWeek(now), end: endOfWeek(now) };
      case 'month':
        return { start: startOfMonth(now), end: endOfMonth(now) };
      case 'yearly':
        return { start: startOfYear(now), end: endOfYear(now) };
      case 'all':
        return { start: new Date(0), end: new Date() };
      default:
        return { start: startOfMonth(now), end: endOfMonth(now) };
    }
  };

  const getFilteredTransactions = (dateRange: DateRange, useAllTransactions: boolean = false) => {
    const transactionsToFilter = useAllTransactions ? allTransactions : transactions;
    if (!transactionsToFilter) return [];
    
    const { start, end } = getDateFilterRange(dateRange);
    
    return transactionsToFilter.filter(t => {
      let transactionDate: Date;
      
      if (typeof t.Date === 'string') {
        transactionDate = new Date(t.Date);
      } else if (t.Date && typeof t.Date === 'object' && 'seconds' in t.Date) {
        transactionDate = toDate(t.Date.seconds * 1000);
      } else {
        return false;
      }
      
      if (isNaN(transactionDate.getTime())) return false;
      
      const isAfterStart = transactionDate >= start;
      const isBeforeEnd = transactionDate <= end;
      
      return isAfterStart && isBeforeEnd;
    });
  };

  const getSortedTransactions = (filteredTransactions: Transaction[]) => {
    if (!filteredTransactions) return [];
    const sorted = [...filteredTransactions];
    switch (sortOption) {
      case 'highest':
        return sorted.sort((a, b) => b.Amount - a.Amount);
      case 'category':
        return sorted.sort((a, b) => a.Category.localeCompare(b.Category));
      case 'latest':
      default:
        // Data is already sorted by date descending from Firestore
        return sorted;
    }
  };

  const getExpenseTransactions = (filteredTransactions: Transaction[]) => {
    return filteredTransactions.filter(t => t.Type === 'expense' || t.Type === 'Expense');
  };

  const getTotalSpent = (expenseTransactions: Transaction[]) => {
    return expenseTransactions.reduce((sum, t) => sum + t.Amount, 0);
  };

  const getAggregatedData = (expenseTransactions: Transaction[]) => {
    return expenseTransactions
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
  };

  const handleEditClick = (transaction: Transaction) => {
    setTransactionToEdit(transaction);
  };
  
  const handleDeleteClick = (transaction: Transaction) => {
    setTransactionToDelete(transaction);
  };

  const handleConfirmDelete = () => {
    if (!transactionToDelete || !user || !firestore) return;
    const docRef = doc(firestore, `users/${user.uid}/transactions`, transactionToDelete.id);
    deleteDocumentNonBlocking(docRef);
    setTransactionToDelete(null);
  };

  const loadMoreTransactions = () => {
    setVisibleTransactions(prev => prev + 20);
  };

  return {
    // Data
    transactions,
    allTransactions,
    isTransactionsLoading,
    isAllTransactionsLoading,
    
    // State
    visibleTransactions,
    sortOption,
    transactionToEdit,
    transactionToDelete,
    
    // Actions
    setVisibleTransactions,
    setSortOption,
    setTransactionToEdit,
    setTransactionToDelete,
    handleEditClick,
    handleDeleteClick,
    handleConfirmDelete,
    loadMoreTransactions,
    
    // Computed data helpers
    getFilteredTransactions,
    getSortedTransactions,
    getExpenseTransactions,
    getTotalSpent,
    getAggregatedData,
  };
}