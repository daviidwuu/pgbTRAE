/**
 * Dashboard Module
 * 
 * Centralized dashboard functionality.
 * Handles dashboard state management, data aggregation, and UI coordination.
 */

// Core exports
export * from './services/DashboardService';
export * from './hooks/useDashboard';
export * from './hooks/useDashboardState';
export * from './types/dashboard.types';
export * from './constants/dashboard.constants';

// Module interface
export const DashboardModule = {
  name: 'Dashboard',
  version: '1.0.0',
  dependencies: ['Auth', 'Transactions', 'Budgets', 'UI'],
  
  // Module capabilities
  capabilities: {
    dataAggregation: true,
    realTimeUpdates: true,
    customizableLayout: true,
    exportData: true,
    notifications: true,
  },
  
  // Module configuration
  config: {
    refreshInterval: 60 * 1000, // 1 minute
    autoRefresh: true,
    defaultDateRange: 'thisMonth',
    maxWidgets: 12,
  },
} as const;