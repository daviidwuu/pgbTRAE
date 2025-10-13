/**
 * Custom hook for cache-first data loading
 * 
 * Provides instant data display from cache while fetching fresh data in background
 */

import { useState, useEffect, useCallback } from 'react';
import { cacheManager } from '@/lib/cache-manager';

interface UseCachedDataOptions<T> {
  cacheKey: string;
  fetchData: () => Promise<T | null>;
  cacheDuration?: number;
  enabled?: boolean;
}

interface UseCachedDataResult<T> {
  data: T | null;
  isLoading: boolean;
  isCached: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

export function useCachedData<T>({
  cacheKey,
  fetchData,
  cacheDuration = 5 * 60 * 1000, // 5 minutes default
  enabled = true
}: UseCachedDataOptions<T>): UseCachedDataResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isCached, setIsCached] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const loadData = useCallback(async (useCache = true) => {
    if (!enabled) return;

    try {
      setError(null);
      
      // Try to load from cache first for instant display
      if (useCache) {
        const cachedData = await cacheManager.get<T>(cacheKey, {
          ttl: cacheDuration,
          storage: 'localStorage'
        });
        
        if (cachedData) {
          setData(cachedData);
          setIsCached(true);
          // Don't set loading to false yet - we'll fetch fresh data in background
        }
      }

      // Always fetch fresh data
      setIsLoading(true);
      const freshData = await fetchData();
      
      if (freshData) {
        setData(freshData);
        setIsCached(false);
        
        // Cache the fresh data
        await cacheManager.set(cacheKey, freshData, {
          ttl: cacheDuration,
          storage: 'localStorage'
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to load data'));
      console.error(`Error loading data for ${cacheKey}:`, err);
    } finally {
      setIsLoading(false);
    }
  }, [cacheKey, fetchData, cacheDuration, enabled]);

  const refetch = useCallback(async () => {
    await loadData(false); // Skip cache on manual refetch
  }, [loadData]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return {
    data,
    isLoading,
    isCached,
    error,
    refetch
  };
}

/**
 * Hook for cached user data
 */
export function useCachedUserData(userId: string | undefined, userData: any, isLoading: boolean) {
  const [cachedData, setCachedData] = useState<any>(null);
  const [hasCachedData, setHasCachedData] = useState(false);

  useEffect(() => {
    if (!userId) return;

    // Load cached data immediately
    const loadCached = async () => {
      const cached = await cacheManager.getCachedUserData(userId);
      if (cached) {
        setCachedData(cached);
        setHasCachedData(true);
      }
    };

    loadCached();
  }, [userId]);

  useEffect(() => {
    if (!userId || !userData || isLoading) return;

    // Cache fresh data when it arrives
    cacheManager.cacheUserData(userId, userData);
    setHasCachedData(false); // Fresh data is now available
  }, [userId, userData, isLoading]);

  // Return cached data if available and fresh data is still loading
  return {
    data: (!isLoading && userData) ? userData : (hasCachedData ? cachedData : null),
    isCached: hasCachedData && isLoading
  };
}

/**
 * Hook for cached transactions
 */
export function useCachedTransactions(userId: string | undefined, transactions: any[], isLoading: boolean) {
  const [cachedData, setCachedData] = useState<any[]>([]);
  const [hasCachedData, setHasCachedData] = useState(false);

  useEffect(() => {
    if (!userId) return;

    // Load cached data immediately
    const loadCached = async () => {
      const cached = await cacheManager.getCachedTransactions(userId);
      if (cached && cached.length > 0) {
        setCachedData(cached);
        setHasCachedData(true);
      }
    };

    loadCached();
  }, [userId]);

  useEffect(() => {
    if (!userId || !transactions || isLoading) return;

    // Cache fresh data when it arrives
    if (transactions.length > 0) {
      cacheManager.cacheTransactions(userId, transactions);
      setHasCachedData(false); // Fresh data is now available
    }
  }, [userId, transactions, isLoading]);

  // Return cached data if available and fresh data is still loading
  return {
    data: (!isLoading && transactions.length > 0) ? transactions : (hasCachedData ? cachedData : []),
    isCached: hasCachedData && (isLoading || transactions.length === 0)
  };
}

/**
 * Hook for cached budgets
 */
export function useCachedBudgets(userId: string | undefined, budgets: any[], isLoading: boolean) {
  const [cachedData, setCachedData] = useState<any[]>([]);
  const [hasCachedData, setHasCachedData] = useState(false);

  useEffect(() => {
    if (!userId) return;

    // Load cached data immediately
    const loadCached = async () => {
      const cached = await cacheManager.getCachedBudgets(userId);
      if (cached && cached.length > 0) {
        setCachedData(cached);
        setHasCachedData(true);
      }
    };

    loadCached();
  }, [userId]);

  useEffect(() => {
    if (!userId || !budgets || isLoading) return;

    // Cache fresh data when it arrives
    if (budgets.length > 0) {
      cacheManager.cacheBudgets(userId, budgets);
      setHasCachedData(false); // Fresh data is now available
    }
  }, [userId, budgets, isLoading]);

  // Return cached data if available and fresh data is still loading
  return {
    data: (!isLoading && budgets.length > 0) ? budgets : (hasCachedData ? cachedData : []),
    isCached: hasCachedData && (isLoading || budgets.length === 0)
  };
}