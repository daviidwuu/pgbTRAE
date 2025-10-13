/**
 * UI Module
 * 
 * Centralized UI components and design system.
 * Provides consistent UI components across all modules.
 */

// Re-export existing UI components for backward compatibility
export * from '../../components/ui/button';
export * from '../../components/ui/input';
export * from '../../components/ui/card';
export * from '../../components/ui/dialog';
export * from '../../components/ui/drawer';
export * from '../../components/ui/toast';
export * from '../../components/ui/badge';
export * from '../../components/ui/skeleton';
export * from '../../components/ui/table';
export * from '../../components/ui/select';
export * from '../../components/ui/progress';

// Dashboard-specific components
export * from '../../components/dashboard/balance';
export * from '../../components/dashboard/transactions-table';
export * from '../../components/dashboard/add-transaction-form';
export * from '../../components/dashboard/budget-page';
export * from '../../components/dashboard/reports-page';
export * from '../../components/dashboard/recurring-transactions-page';

// Module interface
export const UIModule = {
  name: 'UI',
  version: '1.0.0',
  dependencies: ['React', 'Tailwind', 'RadixUI'],
  
  // Module capabilities
  capabilities: {
    designSystem: true,
    responsiveComponents: true,
    accessibleComponents: true,
    theming: true,
    animations: true,
  },
  
  // Module configuration
  config: {
    theme: 'default',
    animations: true,
    accessibility: true,
  },
} as const;

// Component categories for better organization
export const ComponentCategories = {
  FORMS: ['Button', 'Input', 'Select', 'Textarea'],
  LAYOUT: ['Card', 'Container', 'Grid', 'Stack'],
  FEEDBACK: ['Toast', 'Alert', 'Badge', 'Progress'],
  OVERLAY: ['Dialog', 'Drawer', 'Popover', 'Tooltip'],
  DATA_DISPLAY: ['Table', 'List', 'Avatar', 'Skeleton'],
  NAVIGATION: ['Tabs', 'Breadcrumb', 'Pagination'],
} as const;