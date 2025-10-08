import { useMemo } from "react";
import { type Budget, type User as UserData } from "@/shared/types";
import { useUser, useFirestore, useMemoFirebase, useCollection } from "@/firebase";
import { doc, collection, setDoc } from 'firebase/firestore';
import { updateDocumentNonBlocking, deleteDocumentNonBlocking } from "@/firebase/non-blocking-updates";
import { type DateRange } from "@/components/dashboard/date-filter";
import { getDaysInMonth, differenceInMonths } from 'date-fns';

export function useBudgets(userData: UserData | null, transactions: any[] = []) {
  const { user } = useUser();
  const firestore = useFirestore();

  const budgetsQuery = useMemoFirebase(
    () => (firestore && user ? collection(firestore, `users/${user.uid}/budgets`) : null),
    [firestore, user]
  );
  
  const { data: budgets, isLoading: isBudgetsLoading } = useCollection<Budget>(budgetsQuery);

  const userDocRef = useMemoFirebase(
    () => (firestore && user ? doc(firestore, 'users', user.uid) : null),
    [firestore, user]
  );

  const getTotalBudget = (dateRange: DateRange) => {
    if (!userData) return 0;
    const monthlyBudget = (userData.income || 0) - (userData.savings || 0);
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
  };

  const handleUpdateIncome = (newIncome: number) => {
    if (!userDocRef) return;
    updateDocumentNonBlocking(userDocRef, { income: newIncome });
  };

  const handleUpdateSavings = (newSavings: number) => {
    if (!userDocRef) return;
    updateDocumentNonBlocking(userDocRef, { savings: newSavings });
  };

  const handleUpdateBudget = (category: string, newBudget: number) => {
    if (!user || !firestore) return;
    const budgetRef = doc(firestore, `users/${user.uid}/budgets`, category);
    const budgetData = { Category: category, MonthlyBudget: newBudget };
    setDoc(budgetRef, budgetData, { merge: true });
  };

  const handleAddCategory = (category: string) => {
    if (!userDocRef || !userData) return;
    const updatedCategories = [...(userData.categories || []), category];
    updateDocumentNonBlocking(userDocRef, { categories: updatedCategories });
    handleUpdateBudget(category, 0); // Initialize with 0 budget
  };

  const handleDeleteCategory = (category: string) => {
    if (!userDocRef || !user || !firestore || !userData) return;
    const updatedCategories = (userData.categories || []).filter((c: string) => c !== category);
    updateDocumentNonBlocking(userDocRef, { categories: updatedCategories });

    const budgetRef = doc(firestore, `users/${user.uid}/budgets`, category);
    deleteDocumentNonBlocking(budgetRef);
  };

  return {
    // Data
    budgets,
    isBudgetsLoading,
    
    // Computed
    getTotalBudget,
    
    // Actions
    handleUpdateIncome,
    handleUpdateSavings,
    handleUpdateBudget,
    handleAddCategory,
    handleDeleteCategory,
  };
}