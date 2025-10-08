import { useState, useEffect } from "react";
import { type User as UserData } from "@/shared/types";
import { useAuth, useUser, useFirestore, useMemoFirebase, useDoc } from "@/firebase";
import { doc, collection, setDoc } from 'firebase/firestore';
import { signOut } from "firebase/auth";
import { updateDocumentNonBlocking } from "@/firebase/non-blocking-updates";
import { useRouter } from "next/navigation";
import { useToast } from "@/shared/hooks";

const defaultCategories = [
  "F&B", "Shopping", "Transport", "Bills",
];

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

  const handleSetupSave = async (data: { name: string }) => {
    console.log('handleSetupSave called with:', data);
    console.log('Current state:', { userDocRef: !!userDocRef, firestore: !!firestore, user: !!user });
    
    if (!userDocRef || !firestore || !user) {
      console.log('Missing dependencies, returning early');
      return;
    }
    
    try {
      console.log('Creating user data...');
      const newUserData = {
        userId: user.uid, // Required by Firestore rules
        name: data.name,
        categories: defaultCategories,
        income: 0,
        savings: 0,
        createdAt: new Date(), // Required by Firestore rules
        updatedAt: new Date()
      };
      
      console.log('Saving user document:', newUserData);
      await setDoc(userDocRef, newUserData, { merge: true });
      console.log('User document saved successfully');

      const budgetsCollection = collection(firestore, `users/${user.uid}/budgets`);
      const budgetPromises = defaultCategories.map(category =>
        setDoc(doc(budgetsCollection, category), { 
          category: category, 
          amount: 0, 
          period: 'monthly',
          userId: user.uid,
          createdAt: new Date(),
          updatedAt: new Date()
        }, { merge: true })
      );
      
      console.log('Saving budget documents...');
      await Promise.all(budgetPromises);
      console.log('Budget documents saved successfully');
      
      toast({
        title: "Setup Complete!",
        description: "Your profile has been created successfully.",
      });
      
      console.log('Setup completed');
      return true;
    } catch (error) {
      console.error('Setup save error:', error);
      toast({
        title: "Setup Error",
        description: "Failed to save your profile. Please try again.",
        variant: "destructive",
      });
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
    toast({
        title: "User ID Copied!",
        description: "You can now paste this into your Apple Shortcut.",
    });
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
    handleSetupSave,
    handleCopyUserId,
    handleCopyUserIdToast,
    handleUpdateUser,
    handleLogout,
  };
}