'use client';

import { useUser } from '@/firebase';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { SkeletonLoader } from '@/components/dashboard/skeleton-loader';
import { Dashboard } from './dashboard';

export function AuthGuard() {
  const { user, isUserLoading } = useUser();
  const router = useRouter();

  useEffect(() => {
    // If the initial auth check is done and there's no user, redirect to login.
    if (!isUserLoading && !user) {
      router.replace('/login');
    }
  }, [isUserLoading, user, router]);

  // While checking for the user, show a loader.
  if (isUserLoading) {
    return <SkeletonLoader />;
  }

  // If a user is logged in, render the main dashboard which will handle its own data loading.
  if (user) {
    return <Dashboard />;
  }

  // If no user and not loading, it will be redirected soon. Render a loader in the meantime.
  return <SkeletonLoader />;
}
