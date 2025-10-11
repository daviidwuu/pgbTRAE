import { useMemo } from "react";
import { type Budget, type User as UserData, type CategoryType } from "@/shared/types";
import { useUser, useFirestore, useMemoFirebase, useCollection } from "@/firebase";
import { doc, collection, setDoc } from 'firebase/firestore';
import { updateDocumentNonBlocking, deleteDocumentNonBlocking } from "@/firebase/non-blocking-updates";
import { type DateRange } from "@/components/dashboard/date-filter";
import { BudgetService } from "../services/BudgetService";

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

  // Computed values using the new BudgetService methods
  const totalIncomeBudget = useMemo(() => 
    budgets ? BudgetService.getTotalIncomeBudget(budgets) : 0,
    [budgets]
  );

  const totalExpenseBudget = useMemo(() => 
    budgets ? BudgetService.getTotalExpenseBudget(budgets) : 0,
    [budgets]
  );

  const plannedSavings = useMemo(() => 
    budgets ? BudgetService.getPlannedSavings(budgets) : 0,
    [budgets]
  );

  const incomeBudgets = useMemo(() => 
    budgets ? BudgetService.getBudgetsByType(budgets, 'income') : [],
    [budgets]
  );

  const expenseBudgets = useMemo(() => 
    budgets ? BudgetService.getBudgetsByType(budgets, 'expense') : [],
    [budgets]
  );

  /**
   * Get total expense budget for a specific date range
   */
  const getTotalExpenseBudgetForDateRange = (dateRange: DateRange) => {
    if (!budgets) return 0;
    return BudgetService.getTotalExpenseBudgetForDateRange(budgets, dateRange, transactions);
  };

  /**
   * @deprecated Use getTotalExpenseBudgetForDateRange instead
   */
  const getTotalBudget = (dateRange: DateRange) => {
    if (!userData) return 0;
    return BudgetService.calculateTotalBudget(
      userData.income || 0,
      userData.savings || 0,
      dateRange,
      transactions
    );
  };

  /**
   * @deprecated Will be removed when income/savings are fully migrated to budget-based system
   */
  const handleUpdateIncome = (newIncome: number) => {
    if (!userDocRef) return;
    updateDocumentNonBlocking(userDocRef, { income: newIncome });
  };

  /**
   * @deprecated Will be removed when income/savings are fully migrated to budget-based system
   */
  const handleUpdateSavings = (newSavings: number) => {
    if (!userDocRef) return;
    updateDocumentNonBlocking(userDocRef, { savings: newSavings });
  };

  /**
   * Update or create a budget for a category
   */
  const handleUpdateBudget = (category: string, newBudget: number, type: CategoryType = 'expense') => {
    if (!user || !firestore) return;
    const budgetRef = doc(firestore, `users/${user.uid}/budgets`, category);
    const budgetData = { 
      Category: category, 
      MonthlyBudget: newBudget,
      type: type
    };
    setDoc(budgetRef, budgetData, { merge: true });
  };

  /**
   * Add a new category and initialize its budget
   */
  const handleAddCategory = (category: string, type: CategoryType = 'expense') => {
    if (!userDocRef || !userData) return;
    const updatedCategories = [...(userData.categories || []), category];
    updateDocumentNonBlocking(userDocRef, { categories: updatedCategories });
    handleUpdateBudget(category, 0, type); // Initialize with 0 budget
  };

  /**
   * Delete a category and its associated budget
   */
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
    
    // Computed values
    totalIncomeBudget,
    totalExpenseBudget,
    plannedSavings,
    incomeBudgets,
    expenseBudgets,
    
    // Functions
    getTotalExpenseBudgetForDateRange,
    getTotalBudget, // @deprecated
    
    // Actions
    handleUpdateIncome, // @deprecated
    handleUpdateSavings, // @deprecated
    handleUpdateBudget,
    handleAddCategory,
    handleDeleteCategory,
  };
}