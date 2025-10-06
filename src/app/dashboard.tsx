
"use client";

import { useCallback, useEffect, useState, useMemo } from "react";
import dynamic from "next/dynamic";
import { type Transaction, type Budget, type User as UserData } from "@/lib/data";
import { Balance } from "@/components/dashboard/balance";
import { TransactionsTable } from "@/components/dashboard/transactions-table";
import { type DateRange } from "@/components/dashboard/date-filter";
import type { AddTransactionFormProps } from "@/components/dashboard/add-transaction-form";
import type { BudgetPageProps } from "@/components/dashboard/budget-page";
import type { ReportsPageProps } from "@/components/dashboard/reports-page";
import type { SetupSheetProps } from "@/components/dashboard/setup-sheet";
import type { NotificationPermissionDialogProps } from "@/components/dashboard/notification-permission-dialog";
import type { DeleteTransactionDialogProps } from "@/components/dashboard/delete-transaction-dialog";
import type { UserSettingsDialogProps } from "@/components/dashboard/user-settings-dialog";
import { type ChartConfig } from "@/components/ui/chart";
import { startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear, format, getDaysInMonth, differenceInMonths } from 'date-fns';
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
import { Plus, Settings, Wallet, User as UserIcon, LogOut, FileText, Bell, Smartphone } from "lucide-react";
import { SkeletonLoader } from "@/components/dashboard/skeleton-loader";
import { useToast } from "@/hooks/use-toast";
import { useAuth, useUser, useFirestore, useMemoFirebase, useCollection, useDoc } from "@/firebase";
import { doc, collection, setDoc, query, orderBy, limit } from 'firebase/firestore';
import { signOut, type User } from "firebase/auth";
import { addDocumentNonBlocking, deleteDocumentNonBlocking, updateDocumentNonBlocking } from "@/firebase/non-blocking-updates";
import {
  requestNotificationPermission,
  unsubscribeFromNotifications,
  getSubscription,
  syncSubscriptionWithFirestore,
} from "@/firebase/messaging";
import { toDate } from "date-fns";
import { useRouter } from "next/navigation";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";


export type SortOption = 'latest' | 'highest' | 'category';

const chartColors = [
  "#2563eb", "#f97316", "#22c55e", "#ef4444", "#8b5cf6",
  "#78350f", "#ec4899", "#64748b", "#f59e0b"
];

const defaultCategories = [
  "F&B", "Shopping", "Transport", "Bills",
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
  const [visibleTransactions, setVisibleTransactions] = useState(20);
  const [sortOption, setSortOption] = useState<SortOption>('latest');
  
  const [isAddTransactionOpen, setAddTransactionOpen] = useState(false);
  const [isBudgetOpen, setBudgetOpen] = useState(false);
  const [isReportsOpen, setReportsOpen] = useState(false);
  const [isSettingsOpen, setSettingsOpen] = useState(false);

  const [transactionToEdit, setTransactionToEdit] = useState<Transaction | null>(null);
  const [transactionToDelete, setTransactionToDelete] = useState<Transaction | null>(null);
  
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

  const transactionsQuery = useMemoFirebase(
    () => (firestore && user ? query(collection(firestore, `users/${user.uid}/transactions`), orderBy('Date', 'desc'), limit(visibleTransactions)) : null),
    [firestore, user, visibleTransactions]
  );
  const { data: transactions, isLoading: isTransactionsLoading } = useCollection<Transaction>(transactionsQuery);

  const budgetsQuery = useMemoFirebase(
    () => (firestore && user ? collection(firestore, `users/${user.uid}/budgets`) : null),
    [firestore, user]
  );
  const { data: budgets, isLoading: isBudgetsLoading } = useCollection<Budget>(budgetsQuery);

  const finalUserData = userData;

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    const checkSubscription = async () => {
      if (typeof window === 'undefined' || !('serviceWorker' in navigator) || !('PushManager' in window)) {
        return;
      }

      const sub = await getSubscription();
      setIsPushSubscribed(!!sub);
      const promptShown = localStorage.getItem(NOTIFICATION_PROMPT_KEY);
      if (!promptShown && !sub) {
        setShowNotificationPrompt(true);
      }
    };

    void checkSubscription();
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined' || !user || !firestore) return;

    void syncSubscriptionWithFirestore(user.uid, firestore);
  }, [user, firestore]);
  
  const handleSetupSave = async (data: { name: string }) => {
    if (!userDocRef || !firestore || !user) return;
    const newUserData = {
      name: data.name,
      categories: defaultCategories,
      income: 0,
      savings: 0,
    };
    await setDoc(userDocRef, newUserData, { merge: true });

    const budgetsCollection = collection(firestore, `users/${user.uid}/budgets`);
    const budgetPromises = defaultCategories.map(category =>
      setDoc(doc(budgetsCollection, category), { Category: category, MonthlyBudget: 0 }, { merge: true })
    );
    await Promise.all(budgetPromises);
    setBudgetOpen(true);
  };
  
  const handleCopyUserId = () => {
    if (!user) return;
    navigator.clipboard.writeText(user.uid);
  };

  const handleEditClick = (transaction: Transaction) => {
    setTransactionToEdit(transaction);
    setAddTransactionOpen(true);
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
    if (!userDocRef || !finalUserData) return;
    const updatedCategories = [...(finalUserData.categories || []), category];
    updateDocumentNonBlocking(userDocRef, { categories: updatedCategories });
    handleUpdateBudget(category, 0); // Initialize with 0 budget
  };

  const handleDeleteCategory = (category: string) => {
    if (!userDocRef || !user || !firestore || !finalUserData) return;
    const updatedCategories = (finalUserData.categories || []).filter(c => c !== category);
    updateDocumentNonBlocking(userDocRef, { categories: updatedCategories });

    const budgetRef = doc(firestore, `users/${user.uid}/budgets`, category);
    deleteDocumentNonBlocking(budgetRef);
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
    toast({
        title: "User ID Copied!",
        description: "You can now paste this into your Apple Shortcut.",
    });
  };

  const handleNotificationToggle = async (checked: boolean) => {
    if (checked) {
        await handleAllowNotifications();
    } else {
        await handleDenyNotifications(true); // true to indicate it's from the toggle
    }
  };

  const handleAllowNotifications = async () => {
    if (!user || !firestore || typeof window === 'undefined') return;

    localStorage.setItem(NOTIFICATION_PROMPT_KEY, 'true');
    setShowNotificationPrompt(false);

    const isIos = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isStandalone = 'standalone' in window.navigator && (window.navigator as any).standalone;

    if (isIos && !isStandalone) {
        setShowIosPwaInstructions(true);
        return;
    }

    setIsPushSubscribed(true);
    try {
        await requestNotificationPermission(user.uid, firestore);
    } catch (error) {
        console.error("Failed to subscribe:", error);
        setIsPushSubscribed(false);
    }
  };

  const handleDenyNotifications = async (fromToggle = false) => {
    localStorage.setItem(NOTIFICATION_PROMPT_KEY, 'true');
    setShowNotificationPrompt(false);
    if (fromToggle && user && firestore) {
        setIsPushSubscribed(false);
        try {
            await unsubscribeFromNotifications(user.uid, firestore);
        } catch (error) {
            console.error("Failed to unsubscribe:", error);
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
        
        const oldestDate = toDate(oldestLoaded.seconds * 1000);
        const mostRecentDate = toDate(mostRecentLoaded.seconds * 1000);

        if (isNaN(oldestDate.getTime()) || isNaN(mostRecentDate.getTime())) return "All Time";
        
        return `${format(oldestDate, 'd MMM yyyy')} - ${format(mostRecentDate, 'd MMM yyyy')}`;
    }
  }, [dateFilterRange, transactions]);

  useEffect(() => {
    if (!isClient) return;
    setDisplayDate(getDisplayDate(dateRange));
  }, [dateRange, getDisplayDate, isClient]);

  const filteredTransactions = useMemo(() => {
    if (!transactions) return [];

    const { start, end } = dateFilterRange;

    if (dateRange === 'all' || !start || !end) {
      return transactions;
    }

    return transactions.filter(t => {
      if (!t.Date) return false;
      const transactionDate = toDate(t.Date.seconds * 1000);
      if (isNaN(transactionDate.getTime())) return false;
      
      const isAfterStart = transactionDate >= start;
      const isBeforeEnd = transactionDate <= end;
      
      return isAfterStart && isBeforeEnd;
    });
  }, [transactions, dateRange, dateFilterRange]);
  
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
        const oldestDate = toDate(oldestLoaded.seconds * 1000);
        const monthSpan = differenceInMonths(now, oldestDate) + 1;
        return monthlyBudget * Math.max(1, monthSpan);
      default:
        return monthlyBudget;
    }
  }, [finalUserData, dateRange, transactions]);

  const expenseTransactions = useMemo(() => 
    filteredTransactions.filter(t => t.Type === 'Expense'),
    [filteredTransactions]
  );

  const totalSpent = useMemo(() => 
    expenseTransactions.reduce((sum, t) => sum + t.Amount, 0),
    [expenseTransactions]
  );

  const categories = finalUserData?.categories || [];
  const categoryColors = useMemo(() => {
    return categories.reduce((acc, category, index) => {
      acc[category] = chartColors[index % chartColors.length];
      return acc;
    }, {} as Record<string, string>);
  }, [categories]);

  const aggregatedData = useMemo(() => expenseTransactions
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
    .sort((a, b) => b.amount - a.amount), [expenseTransactions]);

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
    if (!expenseTransactions) return [];
    const sorted = [...expenseTransactions];
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
  }, [expenseTransactions, sortOption]);

  useEffect(() => {
    // When the dialog closes, reset the transaction to edit
    if (!isAddTransactionOpen) {
      setTransactionToEdit(null);
    }
  }, [isAddTransactionOpen]);

  const isLoading = isUserLoading || isUserDataLoading || (user && finalUserData !== null && (isTransactionsLoading || isBudgetsLoading));

  if (isLoading) {
    return <SkeletonLoader />;
  }

  // If user is authenticated but has no profile data (it's null after loading), show setup sheet
  if (user && finalUserData === null) {
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

  if (!user || !finalUserData || transactions === undefined || budgets === undefined) {
    return <SkeletonLoader />;
  }

  return (
    <div className="flex flex-col min-h-screen bg-background items-center">
      <div className="w-full max-w-[428px] pt-[env(safe-area-inset-top)]">
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
                      <ScrollArea className="h-[70vh]">
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
            budget={totalBudget}
            aggregatedData={aggregatedData}
            chartConfig={chartConfig}
            dateRange={dateRange}
            onDateRangeChange={setDateRange}
            displayDate={displayDate}
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
                />
            </DrawerContent>
        </Drawer>
        
        <Drawer open={isReportsOpen} onOpenChange={setReportsOpen}>
          <DrawerContent>
            <ReportsPage allTransactions={transactions || []} categories={categories} />
          </DrawerContent>
        </Drawer>

      </div>
    </div>
  );
}


    