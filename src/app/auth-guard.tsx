'use client';

import { useUser, useFirestore, useMemoFirebase, useDoc } from '@/firebase';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { doc } from 'firebase/firestore';
import { FullScreenLoader } from '@/components/ui/full-screen-loader';
import { Dashboard } from './dashboard';
import { type User as UserData } from '@/shared/types';

export function AuthGuard() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const router = useRouter();
  const [hasRedirected, setHasRedirected] = useState(false);

  // Get user data to check onboarding status
  const userDocRef = useMemoFirebase(
    () => (firestore && user ? doc(firestore, 'users', user.uid) : null),
    [firestore, user]
  );
  const { data: userData, isLoading: isUserDataLoading } = useDoc<UserData>(userDocRef);

  useEffect(() => {
    // Prevent multiple redirects during the same session
    if (hasRedirected) return;

    // Wait for auth to be fully resolved before making any decisions
    if (isUserLoading) return;

    // If no user after auth is resolved, redirect to login
    if (!user) {
      console.log('AuthGuard: Redirecting to login - no user');
      setHasRedirected(true);
      router.replace('/login');
      return;
    }

    // If we have a user but user data is still loading, wait
    if (isUserDataLoading) return;

    // Now we have a user and user data loading is complete
    // Check both onboardingCompleted (new field) and isInitialized (legacy field)
    const hasCompletedOnboarding = userData?.onboardingCompleted || userData?.isInitialized;
    
    if (!userData || !hasCompletedOnboarding) {
      console.log('AuthGuard: Redirecting to onboarding', {
        hasUserData: !!userData,
        onboardingCompleted: userData?.onboardingCompleted,
        isInitialized: userData?.isInitialized,
        hasCompletedOnboarding
      });
      setHasRedirected(true);
      router.replace('/onboarding');
      return;
    } else {
      console.log('AuthGuard: User has completed onboarding, showing dashboard');
    }
  }, [isUserLoading, user, userData, isUserDataLoading, router, hasRedirected]);

  // Show loading while checking auth state or user data, or during redirect
  if (isUserLoading || (user && isUserDataLoading) || hasRedirected) {
    return <FullScreenLoader text="Loading dashboard..." />;
  }

  // If user is authenticated and has completed onboarding, render the dashboard
  if (user && userData && (userData.onboardingCompleted || userData.isInitialized)) {
    return <Dashboard />;
  }

  // Fallback loader for any edge cases
  return <FullScreenLoader text="Initializing..." />;
}
