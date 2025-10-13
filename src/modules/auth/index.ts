/**
 * Authentication Module
 * 
 * Centralized authentication functionality with single responsibility.
 * Handles user authentication, profile management, and session state.
 */

// Core exports
export * from './services/AuthService';
export * from './services/UserProfileService';
export * from './hooks/useAuth';
export * from './hooks/useUserProfile';
export * from './types/auth.types';
export * from './constants/auth.constants';

// Module interface
export const AuthModule = {
  name: 'Auth',
  version: '1.0.0',
  dependencies: ['Firebase', 'Services'],
  
  // Module capabilities
  capabilities: {
    authentication: true,
    userProfile: true,
    sessionManagement: true,
    roleBasedAccess: false, // Future feature
  },
  
  // Module configuration
  config: {
    sessionTimeout: 30 * 60 * 1000, // 30 minutes
    refreshInterval: 5 * 60 * 1000, // 5 minutes
    autoLogout: true,
  },
} as const;