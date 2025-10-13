/**
 * Authentication Constants
 * 
 * Constants specific to the authentication module.
 */

export const AUTH_CONSTANTS = {
  SESSION_TIMEOUT: 30 * 60 * 1000, // 30 minutes
  REFRESH_INTERVAL: 5 * 60 * 1000, // 5 minutes
  MAX_LOGIN_ATTEMPTS: 5,
  LOCKOUT_DURATION: 15 * 60 * 1000, // 15 minutes
} as const;

export const AUTH_STORAGE_KEYS = {
  USER_ID_COPIED: 'userIdCopied',
  REMEMBER_ME: 'rememberMe',
  LAST_LOGIN: 'lastLogin',
  LOGIN_ATTEMPTS: 'loginAttempts',
} as const;

export const AUTH_ERRORS = {
  INVALID_CREDENTIALS: 'Invalid email or password',
  USER_NOT_FOUND: 'User not found',
  EMAIL_ALREADY_IN_USE: 'Email is already in use',
  WEAK_PASSWORD: 'Password is too weak',
  NETWORK_ERROR: 'Network connection error',
  SESSION_EXPIRED: 'Your session has expired',
  UNAUTHORIZED: 'You are not authorized to perform this action',
  ACCOUNT_LOCKED: 'Account temporarily locked due to too many failed attempts',
} as const;

export const AUTH_SUCCESS_MESSAGES = {
  LOGIN_SUCCESS: 'Welcome back!',
  REGISTER_SUCCESS: 'Account created successfully',
  LOGOUT_SUCCESS: 'Logged out successfully',
  PROFILE_UPDATED: 'Profile updated successfully',
  PASSWORD_RESET_SENT: 'Password reset email sent',
} as const;

export const AUTH_VALIDATION = {
  MIN_PASSWORD_LENGTH: 6,
  MAX_PASSWORD_LENGTH: 128,
  EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  NAME_MIN_LENGTH: 2,
  NAME_MAX_LENGTH: 50,
} as const;