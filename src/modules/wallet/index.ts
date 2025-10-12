/**
 * Wallet Module
 * 
 * Centralized wallet and account management functionality.
 * Handles account balances, financial summaries, and wallet operations.
 */

// Module interface
export const WalletModule = {
  name: 'Wallet',
  version: '1.0.0',
  dependencies: ['Auth', 'Transactions', 'Budgets'],
  
  // Module capabilities
  capabilities: {
    balanceTracking: true,
    multipleAccounts: false, // Future feature
    accountSync: false, // Future feature
    investmentTracking: false, // Future feature
  },
  
  // Module configuration
  config: {
    defaultCurrency: 'USD',
    refreshInterval: 30 * 1000, // 30 seconds
    enableNotifications: true,
  },
} as const;