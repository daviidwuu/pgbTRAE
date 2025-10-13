/**
 * useDashboard Hook
 * 
 * Custom hook for dashboard data management.
 * Provides clean interface for dashboard operations.
 */

import { useState, useEffect, useCallback } from 'react';
import { DashboardService } from '../services/DashboardService';
import { DashboardData, DashboardFilters, DashboardLayout } from '../types/dashboard.types';
import { useToast } from '../../../shared/hooks';

interface UseDashboardOptions {
  dashboardService: DashboardService;
  userId?: string;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

export function useDashboard(options: UseDashboardOptions) {
  const { dashboardService, userId, autoRefresh = true, refreshInterval = 60000 } = options;
  const { toast } = useToast();

  const [data, setData] = useState<DashboardData | null>(null);
  const [layout, setLayout] = useState<DashboardLayout | null>(null);
  const [filters, setFilters] = useState<DashboardFilters | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load dashboard data
  const loadData = useCallback(async () => {
    if (!userId) return;

    setIsLoading(true);
    setError(null);

    try {
      const dashboardData = await dashboardService.getDashboardData(userId, filters || undefined);
      setData(dashboardData);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load dashboard data';
      setError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [userId, filters, dashboardService, toast]);

  // Load dashboard layout
  const loadLayout = useCallback(async () => {
    if (!userId) return;

    try {
      const savedLayout = await dashboardService.loadDashboardLayout(userId);
      setLayout(savedLayout);
    } catch (error) {
      console.error('Failed to load dashboard layout:', error);
    }
  }, [userId, dashboardService]);

  // Save dashboard layout
  const saveLayout = useCallback(async (newLayout: DashboardLayout) => {
    if (!userId) return;

    try {
      await dashboardService.saveDashboardLayout(userId, newLayout);
      setLayout(newLayout);
      toast({
        title: "Success",
        description: "Dashboard layout saved successfully",
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to save layout';
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    }
  }, [userId, dashboardService, toast]);

  // Apply filters
  const applyFilters = useCallback((newFilters: DashboardFilters) => {
    setFilters(newFilters);
  }, []);

  // Clear filters
  const clearFilters = useCallback(() => {
    setFilters(null);
  }, []);

  // Refresh data
  const refresh = useCallback(() => {
    loadData();
  }, [loadData]);

  // Initial load
  useEffect(() => {
    loadData();
    loadLayout();
  }, [loadData, loadLayout]);

  // Auto refresh
  useEffect(() => {
    if (!autoRefresh || !userId) return;

    const interval = setInterval(() => {
      loadData();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, loadData, userId]);

  return {
    // Data
    data,
    layout,
    filters,
    isLoading,
    error,

    // Actions
    loadData,
    saveLayout,
    applyFilters,
    clearFilters,
    refresh,
  };
}