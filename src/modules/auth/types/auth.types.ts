/**
 * Authentication Types
 * 
 * Type definitions for authentication module.
 */

export interface AuthUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  emailVerified: boolean;
}

export interface UserProfile {
  id: string;
  name: string;
  email?: string;
  categories?: string[];
  incomeCategories?: string[];
  income?: number;
  savings?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuthState {
  user: AuthUser | null;
  userProfile: UserProfile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData extends LoginCredentials {
  name: string;
}

export interface UserSetupData {
  name: string;
  income: number;
  savings: number;
  categories?: string[];
  incomeCategories?: string[];
}

export interface AuthContextValue extends AuthState {
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  setupUser: (data: UserSetupData) => Promise<boolean>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
  refreshProfile: () => Promise<void>;
}

export type AuthAction = 
  | { type: 'AUTH_START' }
  | { type: 'AUTH_SUCCESS'; payload: { user: AuthUser; userProfile?: UserProfile } }
  | { type: 'AUTH_ERROR'; payload: string }
  | { type: 'PROFILE_UPDATE'; payload: UserProfile }
  | { type: 'LOGOUT' }
  | { type: 'CLEAR_ERROR' };