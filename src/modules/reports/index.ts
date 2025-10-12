/**
 * Reports Module
 * 
 * Centralized reporting and analytics functionality.
 * Handles financial reports, data visualization, and export capabilities.
 */

// Module interface
export const ReportsModule = {
  name: 'Reports',
  version: '1.0.0',
  dependencies: ['Transactions', 'Budgets', 'Utils'],
  
  // Module capabilities
  capabilities: {
    financialReports: true,
    dataVisualization: true,
    exportReports: true,
    scheduledReports: false, // Future feature
    customReports: false, // Future feature
  },
  
  // Module configuration
  config: {
    defaultDateRange: 'thisMonth',
    chartColors: [
      '#3B82F6', '#EF4444', '#10B981', '#F59E0B',
      '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16'
    ],
    exportFormats: ['pdf', 'csv', 'xlsx'],
  },
} as const;