import { useState, useEffect } from "react";
import { type User as UserData } from "@/shared/types";
import { useAuth, useUser, useFirestore, useMemoFirebase, useDoc } from "@/firebase";
import { doc, collection, setDoc } from 'firebase/firestore';
import { signOut } from "firebase/auth";
import { updateDocumentNonBlocking } from "@/firebase/non-blocking-updates";
import { useRouter } from "next/navigation";
import { useToast } from "@/shared/hooks";
import { DEFAULT_CATEGORIES, DEFAULT_INCOME_CATEGORIES } from "@/shared/constants";

const defaultCategories = DEFAULT_CATEGORIES;

const USER_ID_COPIED_KEY = 'userIdCopied';

export function useUserProfile() {
  const [isUserSettingsOpen, setUserSettingsOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

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

  // Debug logging
  useEffect(() => {
    console.log('Dashboard state:', {
      user: !!user,
      userId: user?.uid,
      userData,
      isUserDataLoading,
      isUserLoading,
      hasFirestore: !!firestore,
      userDocRef: !!userDocRef
    });
  }, [user, userData, isUserDataLoading, isUserLoading, firestore, userDocRef]);

  const setupUser = async (userData: { name: string; income: number; savings: number }): Promise<boolean> => {
    if (!user || !firestore) return false;
    
    try {
      const userRef = doc(firestore, 'users', user.uid);
      await setDoc(userRef, {
        ...userData,
        categories: defaultCategories,
        incomeCategories: DEFAULT_INCOME_CATEGORIES,
        isInitialized: true,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      const budgetsCollection = collection(firestore, `users/${user.uid}/budgets`);
      const budgetPromises = defaultCategories.map(category =>
        setDoc(doc(budgetsCollection, category), { 
          category: category, 
          amount: 0, 
          period: 'monthly',
          userId: user.uid,
          createdAt: new Date(),
          updatedAt: new Date()
        })
      );
      
      await Promise.all(budgetPromises);
      
      console.log('Setup completed');
      return true;
    } catch (error) {
      console.error('Setup save error:', error);
      return false;
    }
  };

  const handleCopyUserId = () => {
    if (!user) return;
    navigator.clipboard.writeText(user.uid);
  };

  const handleCopyUserIdToast = () => {
    if (!user) return;
    navigator.clipboard.writeText(user.uid);
    localStorage.setItem(USER_ID_COPIED_KEY, 'true');
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

  const isLoading = isUserLoading || isUserDataLoading || (user && userData === null);

  return {
    // Data
    user,
    userData,
    isUserLoading,
    isUserDataLoading,
    isLoading,
    
    // State
    isUserSettingsOpen,
    showLogoutConfirm,
    
    // Actions
    setUserSettingsOpen,
    setShowLogoutConfirm,
    setupUser,
    handleCopyUserId,
    handleCopyUserIdToast,
    handleUpdateUser,
    handleLogout,
  };
}