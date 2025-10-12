
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { type Transaction, type Budget, type User as UserData, type CategoryType } from "@/shared/types";
import { type DateRange } from "@/components/dashboard/date-filter";
import { Balance } from "@/components/dashboard/balance";
import { TransactionsTable } from "@/components/dashboard/transactions-table";
import { TodaysTransactionsCard } from "@/components/dashboard/todays-transactions-card";
import { SavingsCard } from "@/components/dashboard/savings-card";
import type { AddTransactionFormProps } from "@/components/dashboard/add-transaction-form";
import type { BudgetPageProps } from "@/components/dashboard/budget-page";
import type { ReportsPageProps } from "@/components/dashboard/reports-page";
import type { RecurringTransactionsPageProps } from "@/components/dashboard/recurring-transactions-page";
import type { SetupSheetProps } from "@/components/dashboard/setup-sheet";
import type { NotificationPermissionDialogProps } from "@/components/dashboard/notification-permission-dialog";
import type { DeleteTransactionDialogProps } from "@/components/dashboard/delete-transaction-dialog";
import type { UserSettingsDialogProps } from "@/components/dashboard/user-settings-dialog";
import { type ChartConfig } from "@/components/ui/chart";
import {
  Drawer,
  DrawerContent,
  DrawerTrigger,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription
} from "@/components/ui/drawer";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Plus, Settings, Wallet, User as UserIcon, LogOut, FileText, Bell, Smartphone, Repeat } from "lucide-react";
import { SkeletonLoader } from "@/components/dashboard/skeleton-loader";
import { useToast } from "@/shared/hooks";
import { useAuth, useUser, useFirestore, useMemoFirebase, useCollection, useDoc } from "@/firebase";
import { doc, collection, setDoc, query, orderBy, limit, getDocs, type QueryDocumentSnapshot, type DocumentData } from 'firebase/firestore';
import { signOut } from "firebase/auth";
import { addDocumentNonBlocking, deleteDocumentNonBlocking, updateDocumentNonBlocking } from "@/firebase/non-blocking-updates";
import {
  requestNotificationPermission,
  unsubscribeFromNotifications,
  getSubscription,
  syncSubscriptionWithFirestore,
} from "@/firebase/messaging";
import { toDate, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear, format, getDaysInMonth, differenceInMonths } from "date-fns";
import { useRouter } from "next/navigation";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";

// Import from new feature-based structure
import { useTransactions } from "@/features/transactions/hooks";
import { useBudgets } from "@/features/budgets/hooks";
import { useUserProfile } from "@/features/auth/hooks";
import { useNotifications, useDashboardState } from "@/features/dashboard/hooks";
import { useSavings } from "@/features/savings/hooks/useSavings";

// Constants
import { CHART_COLORS, DEFAULT_INCOME_CATEGORIES } from "@/shared/constants";

export type SortOption = 'latest' | 'highest' | 'category';

const chartColors = [
  "#2563eb", "#f97316", "#6366f1", "#ef4444", "#8b5cf6",
  "#78350f", "#ec4899", "#64748b", "#f59e0b"
];

const defaultCategories = [
  "F&B", "Shopping", "Transport", "Bills", "Others",
];

function DrawerContentFallback() {
  return (
    <div className="p-4 text-center text-sm text-muted-foreground">
      Loading...
    </div>
  );
}

function SetupSheetFallback() {
  return (
    <div className="flex flex-col items-center justify-center p-6 text-sm text-muted-foreground">
      Preparing your dashboard...
    </div>
  );
}

const AddTransactionForm = dynamic<AddTransactionFormProps>(
  () =>
    import("@/components/dashboard/add-transaction-form").then(
      (mod) => mod.AddTransactionForm
    ),
  { loading: DrawerContentFallback, ssr: false }
);

const BudgetPage = dynamic<BudgetPageProps>(
  () =>
    import("@/components/dashboard/budget-page").then(
      (mod) => mod.BudgetPage
    ),
  { loading: DrawerContentFallback, ssr: false }
);

const ReportsPage = dynamic<ReportsPageProps>(
  () =>
    import("@/components/dashboard/reports-page").then(
      (mod) => mod.ReportsPage
    ),
  { loading: DrawerContentFallback, ssr: false }
);

const RecurringTransactionsPage = dynamic<RecurringTransactionsPageProps>(
  () =>
    import("@/components/dashboard/recurring-transactions-page").then(
      (mod) => mod.RecurringTransactionsPage
    ),
  { loading: DrawerContentFallback, ssr: false }
);

const SetupSheet = dynamic<SetupSheetProps>(
  () =>
    import("@/components/dashboard/setup-sheet").then(
      (mod) => mod.SetupSheet
    ),
  { loading: SetupSheetFallback, ssr: false }
);

const NotificationPermissionDialog = dynamic<NotificationPermissionDialogProps>(
  () =>
    import("@/components/dashboard/notification-permission-dialog").then(
      (mod) => mod.NotificationPermissionDialog
    ),
  {
    ssr: false,
    loading: (props) => {
      const { open = false, onDeny } = props as NotificationPermissionDialogProps;
      return (
        <AlertDialog open={open} onOpenChange={(isOpen) => !isOpen && onDeny?.()}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Loading...</AlertDialogTitle>
              <AlertDialogDescription>
                Preparing notification prompt.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Close</AlertDialogCancel>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      );
    },
  }
);

const DeleteTransactionDialog = dynamic<DeleteTransactionDialogProps>(
  () =>
    import("@/components/dashboard/delete-transaction-dialog").then(
      (mod) => mod.DeleteTransactionDialog
    ),
  {
    ssr: false,
    loading: (props) => {
      const { open = false, onOpenChange } = props as DeleteTransactionDialogProps;
      return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Loading...</AlertDialogTitle>
              <AlertDialogDescription>
                Fetching transaction details.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Close</AlertDialogCancel>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      );
    },
  }
);

const UserSettingsDialog = dynamic<UserSettingsDialogProps>(
  () =>
    import("@/components/dashboard/user-settings-dialog").then(
      (mod) => mod.UserSettingsDialog
    ),
  {
    ssr: false,
    loading: () => (
      <div className="py-6 text-center text-sm text-muted-foreground">
        Loading profile...
      </div>
    ),
  }
);

const USER_ID_COPIED_KEY = 'userIdCopied';
const NOTIFICATION_PROMPT_KEY = 'notificationPromptShown';

export function Dashboard() {
  const [dateRange, setDateRange] = useState<DateRange>('month');
  
  const [isAddTransactionOpen, setAddTransactionOpen] = useState(false);
  const [isBudgetOpen, setBudgetOpen] = useState(false);
  const [isReportsOpen, setReportsOpen] = useState(false);
  const [isRecurringOpen, setRecurringOpen] = useState(false);
  const [isSettingsOpen, setSettingsOpen] = useState(false);
  
  const [showIosPwaInstructions, setShowIosPwaInstructions] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [isUserSettingsOpen, setUserSettingsOpen] = useState(false);
  const [isPushSubscribed, setIsPushSubscribed] = useState(false);
  const [showNotificationPrompt, setShowNotificationPrompt] = useState(false);
  const [displayDate, setDisplayDate] = useState('');
  const [isClient, setIsClient] = useState(false);
  
  const { toast } = useToast();
  const auth = useAuth();
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const router = useRouter();

  const userDocRef = useMemoFirebase(
    () => (firestore && user ? doc(firestore, 'users', user.uid) : null),
    [firestore, user]
  );
  const { data: userData, isLoading: isUserDataLoading } = useDoc<UserData>(userDocRef);

  // Use the transactions hook with dateRange
  const {
    transactions,
    allTransactions,
    isTransactionsLoading,
    isAllTransactionsLoading,
    visibleTransactions,
    sortOption,
    transactionToEdit,
    transactionToDelete,
    setVisibleTransactions,
    setSortOption,
    setTransactionToEdit,
    setTransactionToDelete,
    handleEditClick,
    handleDeleteClick,
    handleConfirmDelete,
    loadMoreTransactions,
    getFilteredTransactions,
    getSortedTransactions,
    getExpenseTransactions,
    getIncomeTransactions,
    getTotalSpent,
    getTotalIncome,
    getNetIncome,
    getAggregatedData,
  } = useTransactions(dateRange);

  const budgetsQuery = useMemoFirebase(
    () => (firestore && user ? collection(firestore, `users/${user.uid}/budgets`) : null),
    [firestore, user]
  );
  const { data: budgets, isLoading: isBudgetsLoading } = useCollection<Budget>(budgetsQuery);

  // Calculate savings using the new hook
  const savingsData = useSavings(
    allTransactions || undefined, 
    budgets || undefined, 
    isAllTransactionsLoading, 
    isBudgetsLoading
  );

  const finalUserData = userData;

  // Category backfill logic for existing users
  useEffect(() => {
    if (!finalUserData || !userDocRef || !user) return;
    
    const needsBackfill = 
      !finalUserData.categories || 
      !finalUserData.incomeCategories || 
      finalUserData.categories.length === 0 || 
      finalUserData.incomeCategories.length === 0 ||
      !finalUserData.isInitialized;

    if (needsBackfill) {
      const updates: Partial<UserData> = {};
      
      // Backfill expense categories
      if (!finalUserData.categories || finalUserData.categories.length === 0) {
        updates.categories = defaultCategories;
      } else {
        // Add missing default categories
        const missingCategories = defaultCategories.filter(cat => !finalUserData.categories?.includes(cat));
        if (missingCategories.length > 0) {
          updates.categories = [...(finalUserData.categories || []), ...missingCategories];
        }
      }
      
      // Backfill income categories
      if (!finalUserData.incomeCategories || finalUserData.incomeCategories.length === 0) {
        updates.incomeCategories = DEFAULT_INCOME_CATEGORIES;
      } else {
        // Add missing default income categories
        const missingIncomeCategories = DEFAULT_INCOME_CATEGORIES.filter(cat => !finalUserData.incomeCategories?.includes(cat));
        if (missingIncomeCategories.length > 0) {
          updates.incomeCategories = [...(finalUserData.incomeCategories || []), ...missingIncomeCategories];
        }
      }
      
      // Mark as initialized
      updates.isInitialized = true;
      updates.updatedAt = new Date();
      
      if (Object.keys(updates).length > 0) {
        console.log('Backfilling categories for existing user:', updates);
        updateDocumentNonBlocking(userDocRef, updates);
      }
    }
  }, [finalUserData, userDocRef, user]);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    const checkSubscription = async () => {
      if (typeof window === 'undefined' || !('serviceWorker' in navigator) || !('PushManager' in window)) {
        console.log('[Push Debug] Service worker or PushManager not supported');
        return;
      }

      console.log('[Push Debug] Checking notification permission:', Notification.permission);
      console.log('[Push Debug] Checking existing subscription...');
      
      const sub = await getSubscription();
      console.log('[Push Debug] Current subscription:', sub ? 'Found' : 'None');
      
      setIsPushSubscribed(!!sub);
      const promptShown = localStorage.getItem(NOTIFICATION_PROMPT_KEY);
      console.log('[Push Debug] Prompt previously shown:', promptShown);
      
      if (!promptShown && !sub) {
        console.log('[Push Debug] Showing notification prompt');
        setShowNotificationPrompt(true);
      }
    };

    void checkSubscription();
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined' || !user || !firestore) return;

    // @ts-ignore - Firebase Firestore type compatibility
    void syncSubscriptionWithFirestore(user.uid, firestore);
  }, [user, firestore]);
  
  const handleSetupSave = async (userData: { name: string }) => {
    try {
      if (!user || !firestore) return;
      
      const userRef = doc(firestore, 'users', user.uid);
      await setDoc(userRef, {
        ...userData,
        categories: defaultCategories,
        incomeCategories: DEFAULT_INCOME_CATEGORIES,
        income: 0,
        savings: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      
      console.log('Setup completed, opening budget dialog');
      setBudgetOpen(true);
    } catch (error) {
      console.error('Setup save error:', error);
    }
  };
  
  const handleCopyUserId = () => {
    if (!user) return;
    navigator.clipboard.writeText(user.uid);
  };

  const handleUpdateIncome = (newIncome: number) => {
    if (!userDocRef) return;
    updateDocumentNonBlocking(userDocRef, { income: newIncome });
  };

  const handleUpdateSavings = (newSavings: number) => {
    if (!userDocRef) return;
    updateDocumentNonBlocking(userDocRef, { savings: newSavings });
  };

  const handleUpdateBudget = (category: string, newBudget: number, type?: CategoryType) => {
    if (!user || !firestore) return;
    const budgetRef = doc(firestore, `users/${user.uid}/budgets`, category);
    const budgetData = { 
      Category: category, 
      MonthlyBudget: newBudget,
      type: type || 'expense' // Default to expense if no type provided
    };
    setDoc(budgetRef, budgetData, { merge: true });
  };

  const handleAddCategory = (category: string, type?: CategoryType) => {
    if (!userDocRef || !finalUserData) return;
    if (type === 'income') {
      const updatedIncomeCategories = [
        ...((finalUserData.incomeCategories || DEFAULT_INCOME_CATEGORIES) as string[]),
        category,
      ];
      updateDocumentNonBlocking(userDocRef, { incomeCategories: updatedIncomeCategories });
    } else {
      const updatedCategories = [...(finalUserData.categories || []), category];
      updateDocumentNonBlocking(userDocRef, { categories: updatedCategories });
    }
    handleUpdateBudget(category, 0, type); // Initialize with 0 budget and specified type
  };

  const handleDeleteCategory = async (category: string) => {
    if (!userDocRef || !user || !firestore || !finalUserData) return;
    
    // Protect 'Others' category from deletion
    if (category === 'Others') {
      toast({
        variant: "destructive",
        title: "Cannot Delete Category",
        description: "'Others' is a protected category and cannot be deleted.",
      });
      return;
    }
    
    // Determine category type and target reassignment category
    const isIncomeCategory = (finalUserData.incomeCategories || []).includes(category);
    const targetCategory = isIncomeCategory ? 'Transfer' : 'Others';
    
    // Ensure target category exists in the appropriate list
    if (isIncomeCategory && !(finalUserData.incomeCategories || []).includes(targetCategory)) {
      toast({
        variant: "destructive",
        title: "Cannot Delete Category",
        description: "Target reassignment category 'Transfer' not found in income categories.",
      });
      return;
    }
    
    if (!isIncomeCategory && !(finalUserData.categories || []).includes(targetCategory)) {
      toast({
        variant: "destructive",
        title: "Cannot Delete Category",
        description: "Target reassignment category 'Others' not found in expense categories.",
      });
      return;
    }

    try {
      // Count transactions that will be reassigned
      const transactionsQuery = query(
        collection(firestore, `users/${user.uid}/transactions`),
        orderBy('Date', 'desc')
      );
      const transactionsSnapshot = await getDocs(transactionsQuery);
      const transactionsToReassign = transactionsSnapshot.docs.filter((doc: QueryDocumentSnapshot<DocumentData>) => 
        doc.data().Category === category
      );
      
      // Count recurring transactions that will be reassigned
      const recurringQuery = query(
        collection(firestore, `users/${user.uid}/recurringTransactions`)
      );
      const recurringSnapshot = await getDocs(recurringQuery);
      const recurringToReassign = recurringSnapshot.docs.filter((doc: QueryDocumentSnapshot<DocumentData>) => 
        doc.data().Category === category
      );
      
      const totalItems = transactionsToReassign.length + recurringToReassign.length;
      
      if (totalItems > 0) {
        // Show confirmation dialog
        const confirmed = window.confirm(
          `This will delete the "${category}" category and reassign ${totalItems} item(s) to "${targetCategory}". Continue?`
        );
        
        if (!confirmed) return;
      }

      // Batch reassign transactions (process in chunks of 400 to avoid Firestore limits)
      const batchSize = 400;
      for (let i = 0; i < transactionsToReassign.length; i += batchSize) {
        const batch = transactionsToReassign.slice(i, i + batchSize);
        const batchPromises = batch.map((doc: QueryDocumentSnapshot<DocumentData>) => {
          const transactionRef = doc.ref;
          return updateDocumentNonBlocking(transactionRef, { 
            Category: targetCategory,
            updatedAt: new Date()
          });
        });
        await Promise.all(batchPromises);
      }
      
      // Batch reassign recurring transactions
      for (let i = 0; i < recurringToReassign.length; i += batchSize) {
        const batch = recurringToReassign.slice(i, i + batchSize);
        const batchPromises = batch.map((doc: QueryDocumentSnapshot<DocumentData>) => {
          const recurringRef = doc.ref;
          return updateDocumentNonBlocking(recurringRef, { 
            Category: targetCategory,
            updatedAt: new Date()
          });
        });
        await Promise.all(batchPromises);
      }

      // Remove category from the appropriate list
      if (isIncomeCategory) {
        const updatedIncomeCategories = (finalUserData.incomeCategories || []).filter((c: string) => c !== category);
        updateDocumentNonBlocking(userDocRef, { incomeCategories: updatedIncomeCategories });
      } else {
        const updatedCategories = (finalUserData.categories || []).filter((c: string) => c !== category);
        updateDocumentNonBlocking(userDocRef, { categories: updatedCategories });
      }

      // Delete the budget document
      const budgetRef = doc(firestore, `users/${user.uid}/budgets`, category);
      deleteDocumentNonBlocking(budgetRef);
      
      // Show success message
      toast({
        title: "Category Deleted",
        description: totalItems > 0 
          ? `"${category}" deleted and ${totalItems} item(s) reassigned to "${targetCategory}".`
          : `"${category}" category deleted successfully.`,
      });
      
    } catch (error) {
      console.error('Error deleting category:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete category. Please try again.",
      });
    }
  };


  const handleUpdateUser = (name: string) => {
    if (userDocRef) {
      updateDocumentNonBlocking(userDocRef, { name });
      setUserSettingsOpen(false);
    }
  };

  const handleLogout = async () => {
    setShowLogoutConfirm(false);
    try {
      await signOut(auth);
      router.push('/login');
    } catch (error) {
      console.error("Logout Error: ", error);
      toast({
        variant: "destructive",
        title: "Logout Failed",
        description: "Could not log you out. Please try again.",
      });
    }
  };

  const handleCopyUserIdToast = () => {
    if (!user) return;
    navigator.clipboard.writeText(user.uid);
    localStorage.setItem(USER_ID_COPIED_KEY, 'true');
  };

  const handleNotificationToggle = async (checked: boolean) => {
    console.log('[Push Debug] Toggle clicked:', checked);
    console.log('[Push Debug] Current permission:', Notification.permission);
    
    if (checked) {
        await handleAllowNotifications();
    } else {
        await handleDenyNotifications(true); // true to indicate it's from the toggle
    }
  };

  const handleAllowNotifications = async () => {
    console.log('[Push Debug] handleAllowNotifications called');
    
    if (!user || !firestore || typeof window === 'undefined') {
      console.log('[Push Debug] Missing requirements:', { user: !!user, firestore: !!firestore, window: typeof window !== 'undefined' });
      return;
    }

    localStorage.setItem(NOTIFICATION_PROMPT_KEY, 'true');
    setShowNotificationPrompt(false);

    const isIos = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isStandalone = (navigator as any).standalone === true || 
      window.matchMedia('(display-mode: standalone)').matches;
    
    console.log('[Push Debug] Device info:', { 
      isIos, 
      isStandalone, 
      userAgent: navigator.userAgent.substring(0, 100),
      notificationPermission: Notification.permission
    });

    if (isIos && !isStandalone) {
        console.log('[Push Debug] iOS device not in standalone mode, showing PWA instructions');
        setShowIosPwaInstructions(true);
        return;
    }

    console.log('[Push Debug] Attempting to request notification permission...');
    setIsPushSubscribed(true);
    try {
        // @ts-ignore - Firebase Firestore type compatibility
        const subscription = await requestNotificationPermission(user.uid, firestore);
        
        if (subscription) {
          console.log('[Push Debug] Subscription successful:', {
            endpoint: subscription.endpoint.substring(0, 50) + '...',
            hasKeys: !!(subscription.toJSON().keys?.auth && subscription.toJSON().keys?.p256dh)
          });
          setIsPushSubscribed(true);
          
          // Test notification after successful subscription
          if (isIos) {
            console.log('[Push Debug] Testing notification on iOS...');
            try {
              // Use Firebase Functions endpoint instead of API route
              const testResponse = await fetch('https://us-central1-piggybankpwa.cloudfunctions.net/transactions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  UserID: user.uid,
                  Data: {
                    Amount: 0.01,
                    Category: 'Test',
                    Notes: 'iOS notification test',
                    Type: 'expense'
                  }
                })
              });
              const testResult = await testResponse.json();
              console.log('[Push Debug] Test notification result:', testResult);
            } catch (testError) {
              console.error('[Push Debug] Test notification failed:', testError);
            }
          }
        }
        
        console.log('[Push Debug] Notification permission request successful');
    } catch (error) {
        console.error("[Push Debug] Failed to subscribe:", error);
        setIsPushSubscribed(false);
        
        // Show more helpful error message for iOS
        if (isIos) {
          alert(`iOS Notification Setup Failed: ${error instanceof Error ? error.message : 'Unknown error'}\n\nTips:\n1. Make sure this PWA is added to your home screen\n2. Check Safari Settings > Notifications\n3. Try refreshing and enabling again`);
        }
    }
  };

  const handleDenyNotifications = async (fromToggle = false) => {
    console.log('[Push Debug] handleDenyNotifications called, fromToggle:', fromToggle);
    
    localStorage.setItem(NOTIFICATION_PROMPT_KEY, 'true');
    setShowNotificationPrompt(false);
    if (fromToggle && user && firestore) {
        console.log('[Push Debug] Unsubscribing from notifications...');
        setIsPushSubscribed(false);
        try {
            // @ts-ignore - Firebase Firestore type compatibility
            await unsubscribeFromNotifications(user.uid, firestore);
            console.log('[Push Debug] Successfully unsubscribed');
        } catch (error) {
            console.error("[Push Debug] Failed to unsubscribe:", error);
            setIsPushSubscribed(true);
        }
    }
  };


  const dateFilterRange = useMemo(() => {
    const today = new Date();
    switch (dateRange) {
      case 'daily':
        return { start: startOfDay(today), end: endOfDay(today) };
      case 'week':
        return { start: startOfWeek(today, { weekStartsOn: 1 }), end: endOfWeek(today, { weekStartsOn: 1 }) };
      case 'month':
        return { start: startOfMonth(today), end: endOfMonth(today) };
      case 'yearly':
        return { start: startOfYear(today), end: endOfYear(today) };
      case 'all':
      default:
        return { start: null, end: null };
    }
  }, [dateRange]);

  const getDisplayDate = useCallback((range: DateRange): string => {
    if (!transactions?.length && range !== 'all') return "No data for this period";

    const { start, end } = dateFilterRange;

    switch (range) {
      case 'daily':
        return start ? format(start, 'd MMM yyyy') : "Today";
      case 'week':
        return (start && end) ? `${format(start, 'd MMM')} - ${format(end, 'd MMM yyyy')}` : "This Week";
      case 'month':
        return start ? format(start, 'MMMM yyyy') : "This Month";
      case 'yearly':
        return start ? format(start, 'yyyy') : "This Year";
      case 'all':
      default:
        if (!transactions?.length) return "All Time";
        const oldestLoaded = transactions[transactions.length - 1]?.Date;
        const mostRecentLoaded = transactions[0]?.Date;

        if (!oldestLoaded || !mostRecentLoaded) return "All Time";
        
        // Handle both date formats
        let oldestDate: Date, mostRecentDate: Date;
        
        if (typeof oldestLoaded === 'string') {
          oldestDate = new Date(oldestLoaded);
        } else if (oldestLoaded && typeof oldestLoaded === 'object' && 'seconds' in oldestLoaded) {
          oldestDate = toDate(oldestLoaded.seconds * 1000);
        } else {
          return "All Time";
        }
        
        if (typeof mostRecentLoaded === 'string') {
          mostRecentDate = new Date(mostRecentLoaded);
        } else if (mostRecentLoaded && typeof mostRecentLoaded === 'object' && 'seconds' in mostRecentLoaded) {
          mostRecentDate = toDate(mostRecentLoaded.seconds * 1000);
        } else {
          return "All Time";
        }

        if (isNaN(oldestDate.getTime()) || isNaN(mostRecentDate.getTime())) return "All Time";
        
        return `${format(oldestDate, 'd MMM yyyy')} - ${format(mostRecentDate, 'd MMM yyyy')}`;
    }
  }, [dateFilterRange, transactions]);

  useEffect(() => {
    if (!isClient) return;
    setDisplayDate(getDisplayDate(dateRange));
  }, [dateRange, getDisplayDate, isClient]);

  // Calculate filtered transactions using ALL transactions for accurate totals
  const filteredTransactions = useMemo(() => 
    getFilteredTransactions(dateRange, true), // Use all transactions for accurate filtering
    [getFilteredTransactions, dateRange]
  );
  
  const totalBudget = useMemo(() => {
    if (!finalUserData) return 0;
    const monthlyBudget = (finalUserData.income || 0) - (finalUserData.savings || 0);
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
          oldestDate = toDate(oldestLoaded.seconds * 1000);
        } else {
          return monthlyBudget;
        }
        
        const monthSpan = differenceInMonths(now, oldestDate) + 1;
        return monthlyBudget * Math.max(1, monthSpan);
      default:
        return monthlyBudget;
    }
  }, [finalUserData, dateRange, transactions]);

  const expenseTransactions = useMemo(() => 
    getExpenseTransactions(filteredTransactions),
    [getExpenseTransactions, filteredTransactions]
  );

  const incomeTransactions = useMemo(() => 
    getIncomeTransactions(filteredTransactions),
    [getIncomeTransactions, filteredTransactions]
  );

  const totalSpent = useMemo(() => 
    getTotalSpent(expenseTransactions),
    [getTotalSpent, expenseTransactions]
  );

  const totalIncome = useMemo(() => 
    getTotalIncome(incomeTransactions),
    [getTotalIncome, incomeTransactions]
  );

  const netIncome = useMemo(() => 
    getNetIncome(filteredTransactions),
    [getNetIncome, filteredTransactions]
  );

  const categories = finalUserData?.categories || [];
  const incomeCategories = finalUserData?.incomeCategories || DEFAULT_INCOME_CATEGORIES;
  const categoryColors = useMemo(() => {
    return categories.reduce((acc: Record<string, string>, category: string, index: number) => {
      acc[category] = chartColors[index % chartColors.length];
      return acc;
    }, {} as Record<string, string>);
  }, [categories]);

  const aggregatedData = useMemo(() => 
    getAggregatedData(expenseTransactions),
    [getAggregatedData, expenseTransactions]
  );

  const chartConfig = useMemo(() => {
    return Object.keys(categoryColors).reduce((acc, category) => {
      acc[category] = {
        label: category,
        color: categoryColors[category],
      };
      return acc;
    }, {} as ChartConfig);
  }, [categoryColors]);

  const sortedTransactions = useMemo(() => {
    // Use limited transactions for display, but filtered by date range
    const displayTransactions = getFilteredTransactions(dateRange, false); // Use limited transactions for display
    return getSortedTransactions(displayTransactions);
  }, [getFilteredTransactions, getSortedTransactions, dateRange]);

  useEffect(() => {
    // When the dialog closes, reset the transaction to edit
    if (!isAddTransactionOpen) {
      setTransactionToEdit(null);
    }
  }, [isAddTransactionOpen]);

  const isLoading = isUserLoading || isUserDataLoading || (user && finalUserData !== null && (isTransactionsLoading || isAllTransactionsLoading || isBudgetsLoading));

  // Debug logging
  useEffect(() => {
    console.log('Dashboard state:', {
      user: !!user,
      userId: user?.uid,
      finalUserData,
      isUserDataLoading,
      isUserLoading,
      isLoading,
      hasFirestore: !!firestore,
      userDocRef: !!userDocRef
    });
  }, [user, finalUserData, isUserDataLoading, isUserLoading, isLoading, firestore, userDocRef]);

  // If we're in static export mode and no Firebase services are available, show a message
  if (typeof window !== 'undefined' && !firestore) {
    return (
      <div className="flex flex-col min-h-screen bg-background items-center justify-center p-6">
        <div className="w-full max-w-[428px] text-center space-y-4">
          <h1 className="text-2xl font-bold">Firebase Setup Required</h1>
          <p className="text-muted-foreground">
            To use this app, you need to:
          </p>
          <div className="text-left space-y-2 bg-muted p-4 rounded-lg">
            <p>1. Enable <strong>Authentication</strong> in Firebase Console</p>
            <p>2. Create <strong>Firestore Database</strong> in Firebase Console</p>
            <p>3. Enable <strong>Email/Password</strong> sign-in method</p>
          </div>
          <p className="text-sm text-muted-foreground">
            Visit: <a href="https://console.firebase.google.com/project/piggybankpwa" className="text-blue-500 underline" target="_blank" rel="noopener noreferrer">Firebase Console</a>
          </p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return <SkeletonLoader />;
  }

  // If user is authenticated but has no profile data (it's null after loading), show setup sheet
  // Also check that we're not still loading user data
  if (user && finalUserData === null && !isUserDataLoading) {
    return (
      <div className="flex flex-col min-h-screen bg-background items-center justify-center">
          <div className="w-full max-w-[428px] p-6">
              <SetupSheet 
                onSave={handleSetupSave} 
                onCopyUserId={handleCopyUserId}
                userId={user.uid}
              />
          </div>
      </div>
    );
  }

  if (!user || !finalUserData || transactions === undefined || budgets === undefined || allTransactions === undefined) {
    return <SkeletonLoader />;
  }

  return (
    <div className="flex flex-col min-h-screen bg-background items-center scrollbar-hide">
      <div className="w-full max-w-[428px] pt-[env(safe-area-inset-top)] scrollbar-hide">
        <main className="flex-1 p-4 space-y-4 pb-[calc(env(safe-area-inset-bottom)+4rem)]">
          <NotificationPermissionDialog
              open={showNotificationPrompt}
              onAllow={handleAllowNotifications}
              onDeny={() => handleDenyNotifications(false)}
           />
           <Dialog open={showIosPwaInstructions} onOpenChange={setShowIosPwaInstructions}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle className="flex flex-col items-center gap-4">
                  <Smartphone className="h-12 w-12" />
                  Add to Home Screen
                </DialogTitle>
                <DialogDescription className="text-center pt-2">
                  To enable push notifications on iOS, you must first add this app to your Home Screen.
                  <br /><br />
                  Tap the <span className="font-bold">Share</span> icon in Safari, then scroll down and select <span className="font-bold">&quot;Add to Home Screen&quot;</span>.
                </DialogDescription>
              </DialogHeader>
            </DialogContent>
           </Dialog>
           <DeleteTransactionDialog
              open={!!transactionToDelete}
              onOpenChange={() => setTransactionToDelete(null)}
              onConfirm={handleConfirmDelete}
              transaction={transactionToDelete}
           />
          <Dialog open={isUserSettingsOpen} onOpenChange={setUserSettingsOpen}>
            <DialogContent className="max-w-[400px]" onOpenAutoFocus={(e) => e.preventDefault()}>
                <DialogHeader>
                  <DialogTitle>User Settings</DialogTitle>
                </DialogHeader>
                <UserSettingsDialog
                  user={finalUserData}
                  userId={user?.uid}
                  onSave={handleUpdateUser}
                  onCopyUserId={handleCopyUserIdToast}
                />
            </DialogContent>
          </Dialog>
            <AlertDialog open={showLogoutConfirm} onOpenChange={setShowLogoutConfirm}>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you sure you want to log out?</AlertDialogTitle>
                  <AlertDialogDescription>
                    You will be signed out of your account. You can sign back in at any time.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleLogout} className="bg-destructive text-destructive-foreground">
                    Log Out
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          <div className="flex justify-between items-start mb-4">
            <div>
              <h1 className="text-2xl font-bold">Welcome,</h1>
              <h1 className="text-primary text-3xl font-bold">{finalUserData.name}</h1>
            </div>
            <div className="flex flex-col items-end">
                <div className="flex items-center gap-2">
                  <Drawer open={isBudgetOpen} onOpenChange={setBudgetOpen}>
                    <DrawerContent>
                       <DrawerHeader>
                        <DrawerTitle>Wallet</DrawerTitle>
                      </DrawerHeader>
                      <ScrollArea className="h-[70vh] scrollbar-hide">
                        <BudgetPage 
                          user={finalUserData}
                          budgets={budgets || []} 
                          onUpdateIncome={handleUpdateIncome}
                          onUpdateSavings={handleUpdateSavings}
                          onUpdateBudget={handleUpdateBudget} 
                          onAddCategory={handleAddCategory}
                          onDeleteCategory={handleDeleteCategory}
                        />
                      </ScrollArea>
                    </DrawerContent>
                  </Drawer>
                  
                  <Drawer open={isSettingsOpen} onOpenChange={setSettingsOpen}>
                      <DrawerTrigger asChild>
                           <Button variant="ghost" size="icon" className="h-8 w-8">
                              <Settings className="h-4 w-4 text-primary" />
                           </Button>
                      </DrawerTrigger>
                      <DrawerContent>
                          <DrawerHeader>
                              <DrawerTitle>Settings</DrawerTitle>
                              <DrawerDescription>Manage your account and app preferences.</DrawerDescription>
                          </DrawerHeader>
                          <div className="p-4 pb-0">
                            <div className="flex flex-col space-y-2">
                                <Button
                                  variant="ghost"
                                  className="justify-start p-4 h-auto"
                                  onClick={() => { setSettingsOpen(false); setUserSettingsOpen(true); }}
                                >
                                  <UserIcon className="mr-4 h-5 w-5" />
                                  <div className="text-left">
                                      <p className="font-semibold">User Profile</p>
                                      <p className="text-xs text-muted-foreground">Update your name and user ID.</p>
                                  </div>
                                </Button>
                                <Button
                                  variant="ghost"
                                  className="justify-start p-4 h-auto"
                                  onClick={() => { setSettingsOpen(false); setBudgetOpen(true); }}
                                >
                                  <Wallet className="mr-4 h-5 w-5" />
                                  <div className="text-left">
                                      <p className="font-semibold">Wallet</p>
                                      <p className="text-xs text-muted-foreground">Manage income, savings, and budgets.</p>
                                  </div>
                                </Button>
                                <Button
                                  variant="ghost"
                                  className="justify-start p-4 h-auto"
                                  onClick={() => { setSettingsOpen(false); setReportsOpen(true); }}
                                >
                                  <FileText className="mr-4 h-5 w-5" />
                                  <div className="text-left">
                                      <p className="font-semibold">Reports</p>
                                      <p className="text-xs text-muted-foreground">Generate spending reports.</p>
                                  </div>
                                </Button>
                                <Button
                                  variant="ghost"
                                  className="justify-start p-4 h-auto"
                                  onClick={() => { setSettingsOpen(false); setRecurringOpen(true); }}
                                >
                                  <Repeat className="mr-4 h-5 w-5" />
                                  <div className="text-left">
                                      <p className="font-semibold">Recurring Transactions</p>
                                      <p className="text-xs text-muted-foreground">Manage automatic recurring payments.</p>
                                  </div>
                                </Button>
                                <div className="flex items-center justify-between p-4 h-auto">
                                    <div className="flex items-center space-x-4">
                                      <Bell className="h-5 w-5" />
                                      <div className="text-left">
                                        <p className="font-semibold">Push Notifications</p>
                                        <p className="text-xs text-muted-foreground">Enable or disable transaction alerts.</p>
                                      </div>
                                    </div>
                                    <Switch
                                        checked={isPushSubscribed}
                                        onCheckedChange={handleNotificationToggle}
                                        aria-label="Toggle push notifications"
                                    />
                                </div>
                                <Button
                                    variant="ghost"
                                    className="justify-start p-4 h-auto text-destructive mt-4"
                                    onClick={() => { setSettingsOpen(false); setShowLogoutConfirm(true); }}
                                >
                                    <LogOut className="mr-4 h-5 w-5" />
                                    <p className="font-semibold">Log Out</p>
                                </Button>
                            </div>
                          </div>
                      </DrawerContent>
                  </Drawer>

                </div>
              </div>
          </div>
          
          <Balance
            totalSpending={totalSpent}
            totalIncome={totalIncome}
            netIncome={netIncome}
            budget={totalBudget}
            savingsGoal={finalUserData?.savings || 0}
            aggregatedData={aggregatedData}
            chartConfig={chartConfig}
            dateRange={dateRange}
            onDateRangeChange={setDateRange}
            displayDate={displayDate}
          />
          
          <SavingsCard savingsData={savingsData} />
          
          <TodaysTransactionsCard
            transactions={allTransactions || []}
            onAddTransaction={() => setAddTransactionOpen(true)}
            onEditTransaction={handleEditClick}
            onDeleteTransaction={handleDeleteClick}
            isLoading={isAllTransactionsLoading}
          />
          
          <TransactionsTable 
            data={sortedTransactions} 
            chartConfig={chartConfig}
            hasMore={transactions ? transactions.length === visibleTransactions : false}
            onLoadMore={() => setVisibleTransactions(v => v + 20)}
            sortOption={sortOption}
            onSortChange={setSortOption}
            onEdit={handleEditClick}
            onDelete={handleDeleteClick}
          />
        </main>

        <Drawer open={isAddTransactionOpen} onOpenChange={setAddTransactionOpen}>
            <DrawerTrigger asChild>
                <Button 
                    variant="default"
                    className="fixed bottom-[calc(env(safe-area-inset-bottom)+1rem)] right-6 h-16 w-16 rounded-full shadow-lg z-50"
                    style={{ backgroundColor: 'hsl(var(--primary))' }}
                >
                    <Plus className="h-8 w-8" />
                </Button>
            </DrawerTrigger>
            <DrawerContent>
                <AddTransactionForm 
                  userId={user?.uid}
                  setOpen={setAddTransactionOpen}
                  transactionToEdit={transactionToEdit}
                  categories={categories}
                  incomeCategories={incomeCategories}
                />
            </DrawerContent>
        </Drawer>
        
        <Drawer open={isReportsOpen} onOpenChange={setReportsOpen}>
          <DrawerContent>
            <ReportsPage allTransactions={transactions || []} categories={categories} />
          </DrawerContent>
        </Drawer>

        <Drawer open={isRecurringOpen} onOpenChange={setRecurringOpen}>
          <DrawerContent>
            <RecurringTransactionsPage categories={categories} incomeCategories={incomeCategories} />
          </DrawerContent>
        </Drawer>

      </div>
    </div>
  );
}


    