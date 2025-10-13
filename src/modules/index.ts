/**
 * Central Module Registry
 * 
 * This file serves as the main entry point for all application modules.
 * It provides a centralized way to access all module functionality with
 * clean separation of concerns and consistent interfaces.
 */

// Core Modules - Only export what exists
export * as Auth from './auth';
export * as Transactions from './transactions';
export * as Budgets from './budgets';
export * as Dashboard from './dashboard';
export * as Reports from './reports';
export * as Wallet from './wallet';
export * as Savings from './savings';

// Shared Modules
export * as UI from './ui';
export * as Services from './services';
export * as Utils from './utils';
export * as Constants from './constants';
export * as Types from './types';
export * as Hooks from './hooks';

// Module Registry for dynamic access
export const ModuleRegistry = {
  Auth: () => import('./auth'),
  Transactions: () => import('./transactions'),
  Budgets: () => import('./budgets'),
  Dashboard: () => import('./dashboard'),
  Reports: () => import('./reports'),
  Wallet: () => import('./wallet'),
  Savings: () => import('./savings'),
  UI: () => import('./ui'),
  Services: () => import('./services'),
  Utils: () => import('./utils'),
  Constants: () => import('./constants'),
  Types: () => import('./types'),
  Hooks: () => import('./hooks'),
} as const;

export type ModuleName = keyof typeof ModuleRegistry;

// Module metadata
export const ModuleMetadata = {
  totalModules: Object.keys(ModuleRegistry).length,
  coreModules: ['Auth', 'Transactions', 'Budgets', 'Dashboard'],
  sharedModules: ['UI', 'Services', 'Utils', 'Constants', 'Types', 'Hooks'],
  version: '1.0.0',
} as const;