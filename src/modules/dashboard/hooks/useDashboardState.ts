/**
 * useDashboardState Hook
 * 
 * Custom hook for dashboard state management.
 * Handles UI state and interactions.
 */

import { useState, useCallback } from 'react';
import { DashboardState } from '../types/dashboard.types';
import { DASHBOARD_VIEW_MODES } from '../constants/dashboard.constants';

interface UseDashboardStateOptions {
  initialState?: Partial<DashboardState>;
}

export function useDashboardState(options: UseDashboardStateOptions = {}) {
  const { initialState = {} } = options;

  const [state, setState] = useState<DashboardState>({
    selectedDateRange: {
      start: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
      end: new Date(),
    },
    activeFilters: [],
    viewMode: 'overview',
    isLoading: false,
    error: null,
    ...initialState,
  });

  // Set date range
  const setDateRange = useCallback((start: Date, end: Date) => {
    setState(prev => ({
      ...prev,
      selectedDateRange: { start, end },
    }));
  }, []);

  // Set view mode
  const setViewMode = useCallback((viewMode: 'overview' | 'detailed' | 'analytics') => {
    setState(prev => ({
      ...prev,
      viewMode,
    }));
  }, []);

  // Add filter
  const addFilter = useCallback((filter: string) => {
    setState(prev => ({
      ...prev,
      activeFilters: [...prev.activeFilters.filter(f => f !== filter), filter],
    }));
  }, []);

  // Remove filter
  const removeFilter = useCallback((filter: string) => {
    setState(prev => ({
      ...prev,
      activeFilters: prev.activeFilters.filter(f => f !== filter),
    }));
  }, []);

  // Clear all filters
  const clearFilters = useCallback(() => {
    setState(prev => ({
      ...prev,
      activeFilters: [],
    }));
  }, []);

  // Set loading state
  const setLoading = useCallback((isLoading: boolean) => {
    setState(prev => ({
      ...prev,
      isLoading,
    }));
  }, []);

  // Set error state
  const setError = useCallback((error: string | null) => {
    setState(prev => ({
      ...prev,
      error,
    }));
  }, []);

  // Clear error
  const clearError = useCallback(() => {
    setState(prev => ({
      ...prev,
      error: null,
    }));
  }, []);

  // Reset state
  const resetState = useCallback(() => {
    setState({
      selectedDateRange: {
        start: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
        end: new Date(),
      },
      activeFilters: [],
      viewMode: 'overview',
      isLoading: false,
      error: null,
    });
  }, []);

  // Get predefined date ranges
  const getDateRangePresets = useCallback(() => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
    const startOfYear = new Date(now.getFullYear(), 0, 1);

    return {
      thisMonth: { start: startOfMonth, end: now },
      lastMonth: { start: startOfLastMonth, end: endOfLastMonth },
      thisYear: { start: startOfYear, end: now },
      last30Days: { start: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000), end: now },
      last90Days: { start: new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000), end: now },
    };
  }, []);

  return {
    // State
    ...state,

    // Actions
    setDateRange,
    setViewMode,
    addFilter,
    removeFilter,
    clearFilters,
    setLoading,
    setError,
    clearError,
    resetState,

    // Utilities
    getDateRangePresets,
  };
}