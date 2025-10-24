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
  const [isInitializing, setIsInitializing] = useState(true);

  // Get user data to check onboarding status
  const userDocRef = useMemoFirebase(
    () => (firestore && user ? doc(firestore, 'users', user.uid) : null),
    [firestore, user]
  );
  const { data: userData, isLoading: isUserDataLoading } = useDoc<UserData>(userDocRef);

  // Smart initialization that completes when we have the data we need
  useEffect(() => {
    // If we have user data and it's loaded, we can finish initializing early
    if (!isUserLoading && user && !isUserDataLoading && userData !== undefined) {
      console.log('AuthGuard: Data loaded, finishing initialization early');
      setIsInitializing(false);
      return;
    }

    // Fallback timer for cases where data doesn't load properly
    const timer = setTimeout(() => {
      console.log('AuthGuard: Initialization timeout reached, proceeding');
      setIsInitializing(false);
    }, 3000); // Reduced to 3 seconds as fallback

    return () => clearTimeout(timer);
  }, [isUserLoading, user, isUserDataLoading, userData]);

  useEffect(() => {
    // Add debug logging to understand what's happening
    console.log('AuthGuard State Debug:', {
      isInitializing,
      isUserLoading,
      hasUser: !!user,
      userId: user?.uid,
      userData,
      isUserDataLoading,
      hasRedirected,
      hasUserData: !!userData
    });

    // Prevent multiple redirects during the same session
    if (hasRedirected) {
      console.log('AuthGuard: Already redirected, skipping');
      return;
    }

    // Wait for initialization period to complete (especially important for iOS PWA)
    if (isInitializing) {
      console.log('AuthGuard: Still initializing, waiting...');
      return;
    }

    // Wait for auth to be fully resolved before making any decisions
    if (isUserLoading) {
      console.log('AuthGuard: User loading, waiting...');
      return;
    }

    // If no user after auth is resolved, redirect to login
    if (!user) {
      console.log('AuthGuard: No user found, redirecting to login');
      setHasRedirected(true);
      router.replace('/login');
      return;
    }

    // If we have a user but user data is still loading, wait
    if (isUserDataLoading) {
      console.log('AuthGuard: User data loading, waiting...');
      return;
    }

    // Simplified logic: If user exists but no user document, redirect to onboarding
    // This only happens for brand new users who just signed up
    if (!userData) {
      console.log('AuthGuard: New user detected (no user document), redirecting to onboarding');
      setHasRedirected(true);
      router.replace('/onboarding');
      return;
    }

    // If we have both user and userData, show dashboard
    console.log('AuthGuard: Existing user with data, showing dashboard');
  }, [isInitializing, isUserLoading, user, userData, isUserDataLoading, router, hasRedirected]);

  // Show loading while initializing, checking auth state, user data, or during redirect
  if (isInitializing || isUserLoading || (user && isUserDataLoading) || hasRedirected) {
    const loadingText = isInitializing 
      ? "Initializing app..." 
      : isUserLoading 
        ? "Checking authentication..." 
        : "Loading dashboard...";
    
    return <FullScreenLoader text={loadingText} />;
  }

  // If user is authenticated and has user data, render the dashboard
  if (user && userData) {
    return <Dashboard />;
  }

  // Fallback loader for any edge cases
  return <FullScreenLoader text="Preparing dashboard..." />;
}
