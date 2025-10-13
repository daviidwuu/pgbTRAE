'use client';

import { useUser, useFirestore, useMemoFirebase, useDoc } from '@/firebase';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { doc } from 'firebase/firestore';
import { SkeletonLoader } from '@/components/dashboard/skeleton-loader';
import { Dashboard } from './dashboard';
import { type User as UserData } from '@/shared/types';

export function AuthGuard() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const router = useRouter();

  // Get user data to check onboarding status
  const userDocRef = useMemoFirebase(
    () => (firestore && user ? doc(firestore, 'users', user.uid) : null),
    [firestore, user]
  );
  const { data: userData, isLoading: isUserDataLoading } = useDoc<UserData>(userDocRef);

  useEffect(() => {
    // If the initial auth check is done and there's no user, redirect to login.
    if (!isUserLoading && !user) {
      router.replace('/login');
      return;
    }

    // If user is authenticated, check their onboarding status
    if (user && userData !== undefined && !isUserDataLoading) {
      // For new users (no user document exists) or users who haven't completed onboarding
      if (!userData || !userData.onboardingCompleted) {
        router.replace('/onboarding');
        return;
      }
    }
  }, [isUserLoading, user, userData, isUserDataLoading, router]);

  // While checking for the user or user data, show a loader.
  if (isUserLoading || (user && isUserDataLoading)) {
    return <SkeletonLoader />;
  }

  // If user is authenticated and has completed onboarding, render the dashboard
  if (user && userData && userData.onboardingCompleted) {
    return <Dashboard />;
  }

  // If no user and not loading, it will be redirected soon. Render a loader in the meantime.
  return <SkeletonLoader />;
}
