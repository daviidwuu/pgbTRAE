
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { type Transaction, type Budget, type User as UserData, type CategoryType } from "@/shared/types";
import { type DateRange } from "@/components/dashboard/date-filter";
import { Balance } from "@/components/dashboard/balance";
import { TransactionsTable } from "@/components/dashboard/transactions-table";
import type { AddTransactionFormProps } from "@/components/dashboard/add-transaction-form";
import type { BudgetPageProps } from "@/components/dashboard/budget-page";
import type { ReportsPageProps } from "@/components/dashboard/reports-page";
import type { RecurringTransactionsPageProps } from "@/components/dashboard/recurring-transactions-page";
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
import { EmptyTransactions } from "@/components/dashboard/empty-states";
import { FullScreenLoader } from "@/components/ui/full-screen-loader";
import { useAuth, useUser, useFirestore, useMemoFirebase, useCollection, useDoc } from "@/firebase";
import { doc, collection, setDoc } from 'firebase/firestore';
import { signOut } from "firebase/auth";
import { deleteDocumentNonBlocking, updateDocumentNonBlocking } from "@/firebase/non-blocking-updates";
import {
  requestNotificationPermission,
  unsubscribeFromNotifications,
  getSubscription,
  syncSubscriptionWithFirestore,
} from "@/firebase/messaging";
import { startOfWeek, endOfWeek, format } from "date-fns";
import { useRouter } from "next/navigation";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";

// Import from new feature-based structure
import { useTransactions } from "@/features/transactions/hooks";
import { DEFAULT_INCOME_CATEGORIES } from "@/shared/constants";

export type SortOption = 'latest' | 'highest' | 'category';

const chartColors = [
  "#2563eb", "#f97316", "#6366f1", "#ef4444", "#8b5cf6",
  "#78350f", "#ec4899", "#64748b", "#f59e0b"
];

function DrawerContentFallback() {
  return <FullScreenLoader text="Loading..." />;
}

const NOTIFICATION_PROMPT_KEY = 'notificationPromptShown';

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

const NotificationPermissionDialog = dynamic<NotificationPermissionDialogProps>(
  () =>
    import("@/components/dashboard/notification-permission-dialog").then(
      (mod) => mod.NotificationPermissionDialog
    ),
  {
    ssr: false,
    loading: () => <FullScreenLoader text="Loading notification settings..." />,
  }
);

const DeleteTransactionDialog = dynamic<DeleteTransactionDialogProps>(
  () =>
    import("@/components/dashboard/delete-transaction-dialog").then(
      (mod) => mod.DeleteTransactionDialog
    ),
  {
    ssr: false,
    loading: () => <FullScreenLoader text="Loading..." />,
  }
);

const UserSettingsDialog = dynamic<UserSettingsDialogProps>(
  () =>
    import("@/components/dashboard/user-settings-dialog").then(
      (mod) => mod.UserSettingsDialog
    ),
  {
    ssr: false,
    loading: () => <FullScreenLoader text="Loading profile..." />,
  }
);

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
  
  // Transaction state management
  const [transactionToEdit, setTransactionToEdit] = useState<Transaction | null>(null);
  const [transactionToDelete, setTransactionToDelete] = useState<Transaction | null>(null);
  
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
    isTransactionsLoading,
    visibleTransactions,
    sortOption,
    setVisibleTransactions,
    setSortOption,
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
  const { data: budgets } = useCollection<Budget>(budgetsQuery);

  const finalUserData = userData;

  // Move all useMemo and useCallback hooks before any early returns
  const getDisplayDate = useCallback((range: DateRange): string => {
    const now = new Date();
    switch (range) {
      case 'daily':
        return format(now, 'MMMM d, yyyy');
      case 'week':
        const weekStart = startOfWeek(now);
        const weekEnd = endOfWeek(now);
        return `${format(weekStart, 'MMM d')} - ${format(weekEnd, 'MMM d, yyyy')}`;
      case 'month':
        return format(now, 'MMMM yyyy');
      case 'yearly':
        return format(now, 'yyyy');
      default:
        return format(now, 'MMMM yyyy');
    }
  }, []);

  const filteredTransactions = useMemo(() => 
    getFilteredTransactions ? getFilteredTransactions(dateRange, true) : [], // Use all transactions for accurate filtering
    [getFilteredTransactions, dateRange]
  );

  const totalBudget = useMemo(() => {
    if (!budgets || budgets.length === 0) return 0;
    // Only sum expense budgets for spending calculations
    return budgets
      .filter(budget => (budget.type || 'expense') === 'expense')
      .reduce((total, budget) => total + (budget.MonthlyBudget || 0), 0);
  }, [budgets]);

  const totalIncomeBudget = useMemo(() => {
    if (!budgets || budgets.length === 0) return 0;
    // Sum income budgets separately
    return budgets
      .filter(budget => budget.type === 'income')
      .reduce((total, budget) => total + (budget.MonthlyBudget || 0), 0);
  }, [budgets]);

  const expenseTransactions = useMemo(() => 
    getExpenseTransactions ? getExpenseTransactions(filteredTransactions) : [],
    [getExpenseTransactions, filteredTransactions]
  );

  const incomeTransactions = useMemo(() => 
    getIncomeTransactions ? getIncomeTransactions(filteredTransactions) : [],
    [getIncomeTransactions, filteredTransactions]
  );

  const totalSpent = useMemo(() => 
    getTotalSpent ? getTotalSpent(expenseTransactions) : 0,
    [getTotalSpent, expenseTransactions]
  );

  const totalIncome = useMemo(() => 
    getTotalIncome ? getTotalIncome(incomeTransactions) : 0,
    [getTotalIncome, incomeTransactions]
  );

  const netIncome = useMemo(() => 
    getNetIncome ? getNetIncome(filteredTransactions) : 0,
    [getNetIncome, filteredTransactions]
  );

  const categories = useMemo(() => finalUserData?.categories || [], [finalUserData?.categories]);
  const incomeCategories = useMemo(() => finalUserData?.incomeCategories || DEFAULT_INCOME_CATEGORIES, [finalUserData?.incomeCategories]);
  
  const categoryColors = useMemo(() => {
    const colors: Record<string, string> = {};
    categories.forEach((category, index) => {
      colors[category] = chartColors[index % chartColors.length];
    });
    return colors;
  }, [categories]);

  const aggregatedData = useMemo(() => 
    getAggregatedData ? getAggregatedData(expenseTransactions) : [],
    [getAggregatedData, expenseTransactions]
  );

  const chartConfig = useMemo(() => {
    const config: ChartConfig = {};
    Object.entries(categoryColors).forEach(([category, color]) => {
      config[category] = { label: category, color };
    });
    return config;
  }, [categoryColors]);

  const sortedTransactions = useMemo(() => {
    if (!getFilteredTransactions || !getSortedTransactions) return [];
    const filtered = getFilteredTransactions(dateRange);
    return getSortedTransactions(filtered);
  }, [getFilteredTransactions, getSortedTransactions, dateRange]);

  // Handle transaction editing
  const handleTransactionEdit = useCallback((transaction: Transaction) => {
    setTransactionToEdit(transaction);
    setAddTransactionOpen(true);
  }, []);

  // Clear transaction to edit when drawer closes
  const handleDrawerOpenChange = useCallback((open: boolean) => {
    setAddTransactionOpen(open);
    if (!open) {
      setTransactionToEdit(null);
    }
  }, []);

  // Handle transaction deletion
  const handleTransactionDelete = useCallback((transaction: Transaction) => {
    setTransactionToDelete(transaction);
  }, []);

  // Confirm transaction deletion
  const handleConfirmTransactionDelete = useCallback(async () => {
    if (!transactionToDelete || !user || !firestore) return;
    
    try {
      const docRef = doc(firestore, `users/${user.uid}/transactions`, transactionToDelete.id);
      await deleteDocumentNonBlocking(docRef);
    } catch (error) {
      console.error("Failed to delete transaction:", error);
    } finally {
      setTransactionToDelete(null);
    }
  }, [transactionToDelete, user, firestore]);

  const handleUpdateIncome = useCallback(async (newIncome: number) => {
    if (!userDocRef) return;
    
    try {
      await updateDocumentNonBlocking(userDocRef, { income: newIncome });
    } catch (error) {
      console.error("Failed to update income:", error);
    }
  }, [userDocRef]);

  const handleUpdateSavings = useCallback(async (newSavings: number) => {
    if (!userDocRef) return;
    
    try {
      await updateDocumentNonBlocking(userDocRef, { savings: newSavings });
    } catch (error) {
      console.error("Failed to update savings:", error);
    }
  }, [userDocRef]);

  // Budget management handlers
  const handleUpdateBudget = useCallback(async (category: string, newBudget: number, type?: CategoryType) => {
    if (!user || !firestore) return;
    
    try {
      const budgetRef = doc(firestore, `users/${user.uid}/budgets`, category);
      const budgetData = { 
        Category: category, 
        MonthlyBudget: newBudget,
        type: type || 'expense', // Default to expense if no type provided
        updatedAt: new Date(),
      };
      
      await setDoc(budgetRef, budgetData, { merge: true });
    } catch (error) {
      console.error("Failed to update budget:", error);
    }
  }, [user, firestore]);

  const handleAddCategory = useCallback(async (category: string, type?: CategoryType) => {
    if (!userDocRef || !finalUserData) return;
    
    try {
      if (type === 'income') {
        const updatedIncomeCategories = [
          ...((finalUserData.incomeCategories || DEFAULT_INCOME_CATEGORIES) as string[]),
          category,
        ];
        await updateDocumentNonBlocking(userDocRef, { incomeCategories: updatedIncomeCategories });
      } else {
        const updatedCategories = [...(finalUserData.categories || []), category];
        await updateDocumentNonBlocking(userDocRef, { categories: updatedCategories });
      }
      
      // Initialize with 0 budget and specified type
      await handleUpdateBudget(category, 0, type);
    } catch (error) {
      console.error("Failed to add category:", error);
    }
  }, [userDocRef, finalUserData, handleUpdateBudget]);

  const handleDeleteCategory = useCallback(async (category: string) => {
    if (!userDocRef || !user || !firestore || !finalUserData) return;
    
    try {
      // Remove from user categories
      const updatedCategories = (finalUserData.categories || []).filter(c => c !== category);
      const updatedIncomeCategories = (finalUserData.incomeCategories || []).filter(c => c !== category);
      
      await updateDocumentNonBlocking(userDocRef, {
        categories: updatedCategories,
        incomeCategories: updatedIncomeCategories
      });

      // Remove budget if exists
      const budgetRef = doc(firestore, `users/${user.uid}/budgets`, category);
      await deleteDocumentNonBlocking(budgetRef);
    } catch (error) {
      console.error("Failed to delete category:", error);
    }
   }, [userDocRef, user, firestore, finalUserData]);

  const handleUpdateUser = useCallback(async (name: string) => {
    if (!userDocRef) return;
    
    try {
      await updateDocumentNonBlocking(userDocRef, { name });
      setUserSettingsOpen(false);
    } catch (error) {
      console.error("Failed to update profile:", error);
    }
  }, [userDocRef]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.push('/login');
    } catch (error) {
      console.error("Logout Error: ", error);
    }
  };

  const handleCopyUserIdToast = () => {
    if (!user) return;
    navigator.clipboard.writeText(user.uid);
  };

  const handleNotificationToggle = async (checked: boolean) => {
    if (checked) {
      await handleAllowNotifications();
    } else {
      await handleDenyNotifications(true);
    }
  };

  const handleAllowNotifications = async () => {
    try {
      console.log('[Push Debug] User clicked Allow');
      
      // Check if we're on iOS Safari
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
      const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
      
      if (isIOS && isSafari && !window.navigator.standalone) {
        console.log('[Push Debug] iOS Safari detected, showing PWA instructions');
        setShowNotificationPrompt(false);
        setShowIosPwaInstructions(true);
        return;
      }
      
      console.log('[Push Debug] Requesting notification permission...');
      if (!user || !firestore) {
        console.error('[Push Debug] User or firestore not available');
        return;
      }
      
      try {
        const subscription = await requestNotificationPermission(user.uid, firestore);
        console.log('[Push Debug] Subscription result:', subscription ? 'Success' : 'Failed');
        
        if (subscription) {
          setIsPushSubscribed(true);
          console.log('[Push Debug] Subscription successful');
        }
      } catch (error) {
        console.log('[Push Debug] Permission denied or error:', error);
        setIsPushSubscribed(false);
      }
      
      setShowNotificationPrompt(false);
      localStorage.setItem(NOTIFICATION_PROMPT_KEY, 'true');
    } catch (error) {
      console.error('[Push Debug] Error in handleAllowNotifications:', error);
      setIsPushSubscribed(false);
      setShowNotificationPrompt(false);
    }
  };

  const handleDenyNotifications = async (fromToggle = false) => {
    try {
      console.log('[Push Debug] User denied notifications, fromToggle:', fromToggle);
      
      if (fromToggle && isPushSubscribed) {
        console.log('[Push Debug] Unsubscribing from notifications...');
        if (!user || !firestore) {
          console.error('[Push Debug] User or firestore not available');
          return;
        }
        await unsubscribeFromNotifications(user.uid, firestore);
        
        if (user && firestore) {
          // @ts-ignore - Firebase Firestore type compatibility
          await syncSubscriptionWithFirestore(user.uid, firestore);
        }
      }
      
      setIsPushSubscribed(false);
      setShowNotificationPrompt(false);
      localStorage.setItem(NOTIFICATION_PROMPT_KEY, 'true');
    } catch (error) {
      console.error('[Push Debug] Error in handleDenyNotifications:', error);
    }
  };

  // All useEffect hooks
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
      
      if (!sub && !promptShown && Notification.permission === 'default') {
        console.log('[Push Debug] Should show notification prompt');
        setShowNotificationPrompt(true);
      }
    };

    if (isClient) {
      checkSubscription();
    }
  }, [isClient]);

  useEffect(() => {
    if (typeof window === 'undefined' || !user || !firestore) return;

    // @ts-ignore - Firebase Firestore type compatibility
    void syncSubscriptionWithFirestore(user.uid, firestore);
  }, [user, firestore]);

  useEffect(() => {
    if (isClient) {
      setDisplayDate(getDisplayDate(dateRange));
    }
  }, [dateRange, getDisplayDate, isClient]);

  // Show loading screen if any critical data is still loading
  const isLoading = isUserLoading || isUserDataLoading || isTransactionsLoading || !finalUserData || !transactions;

  if (isLoading) {
    return <FullScreenLoader text="Loading dashboard..." />;
  }

  // Early return for non-browser environments
  if (typeof window !== 'undefined' && !firestore) {
    return <FullScreenLoader text="Connecting to database..." />;
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
              onConfirm={handleConfirmTransactionDelete}
              transaction={transactionToDelete}
           />
           <Dialog open={isUserSettingsOpen} onOpenChange={setUserSettingsOpen}>
            <DialogContent>
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
              <h1 className="text-primary text-3xl font-bold">{finalUserData?.name || 'User'}</h1>
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
          
          {/* Balance Component */}
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

          {/* Transactions Table */}
          {transactions && transactions.length > 0 ? (
            <TransactionsTable 
              data={sortedTransactions} 
              chartConfig={chartConfig}
              hasMore={transactions ? transactions.length === visibleTransactions : false}
              onLoadMore={() => setVisibleTransactions(v => v + 20)}
              sortOption={sortOption}
              onSortChange={setSortOption}
              onEdit={handleTransactionEdit}
              onDelete={handleTransactionDelete}
            />
          ) : (
            <EmptyTransactions 
              onAddTransaction={() => setAddTransactionOpen(true)}
            />
          )}
        </main>

        <Drawer open={isAddTransactionOpen} onOpenChange={handleDrawerOpenChange}>
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


    