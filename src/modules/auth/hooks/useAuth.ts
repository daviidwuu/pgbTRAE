/**
 * useAuth Hook
 * 
 * Custom hook for authentication state management.
 * Provides clean interface for authentication operations.
 */

import { useState, useEffect, useCallback } from 'react';
import { AuthService } from '../services/AuthService';
import { UserProfileService } from '../services/UserProfileService';
import { AuthState, LoginCredentials, RegisterData, UserSetupData, AuthUser, UserProfile } from '../types/auth.types';
import { AUTH_SUCCESS_MESSAGES } from '../constants/auth.constants';
import { useToast } from '../../../shared/hooks';

interface UseAuthOptions {
  authService: AuthService;
  userProfileService: UserProfileService;
  onAuthStateChange?: (user: AuthUser | null) => void;
}

export function useAuth(options: UseAuthOptions) {
  const { authService, userProfileService, onAuthStateChange } = options;
  const { toast } = useToast();

  const [state, setState] = useState<AuthState>({
    user: null,
    userProfile: null,
    isLoading: true,
    isAuthenticated: false,
    error: null,
  });

  // Initialize auth state
  useEffect(() => {
    const unsubscribe = authService.onAuthStateChanged(async (user) => {
      setState(prev => ({ ...prev, isLoading: true }));

      try {
        if (user) {
          // Load user profile
          const userProfile = await userProfileService.getProfile(user.uid);
          
          setState({
            user,
            userProfile,
            isLoading: false,
            isAuthenticated: true,
            error: null,
          });
        } else {
          setState({
            user: null,
            userProfile: null,
            isLoading: false,
            isAuthenticated: false,
            error: null,
          });
        }

        onAuthStateChange?.(user);
      } catch (error) {
        setState(prev => ({
          ...prev,
          isLoading: false,
          error: error instanceof Error ? error.message : 'Failed to load user profile',
        }));
      }
    });

    return unsubscribe;
  }, [authService, userProfileService, onAuthStateChange]);

  // Login function
  const login = useCallback(async (credentials: LoginCredentials) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      await authService.login(credentials);
      toast({
        title: "Success",
        description: AUTH_SUCCESS_MESSAGES.LOGIN_SUCCESS,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Login failed';
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }));
      
      toast({
        title: "Login Failed",
        description: errorMessage,
        variant: "destructive",
      });
      
      throw error;
    }
  }, [authService, toast]);

  // Register function
  const register = useCallback(async (data: RegisterData) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      await authService.register(data);
      toast({
        title: "Success",
        description: AUTH_SUCCESS_MESSAGES.REGISTER_SUCCESS,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Registration failed';
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }));
      
      toast({
        title: "Registration Failed",
        description: errorMessage,
        variant: "destructive",
      });
      
      throw error;
    }
  }, [authService, toast]);

  // Logout function
  const logout = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      await authService.logout();
      toast({
        title: "Success",
        description: AUTH_SUCCESS_MESSAGES.LOGOUT_SUCCESS,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Logout failed';
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }));
      
      toast({
        title: "Logout Failed",
        description: errorMessage,
        variant: "destructive",
      });
      
      throw error;
    }
  }, [authService, toast]);

  // Setup user function
  const setupUser = useCallback(async (setupData: UserSetupData): Promise<boolean> => {
    if (!state.user) {
      throw new Error('No authenticated user');
    }

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const userProfile = await userProfileService.setupUser(state.user.uid, setupData);
      
      setState(prev => ({
        ...prev,
        userProfile,
        isLoading: false,
      }));

      toast({
        title: "Success",
        description: "Profile setup completed successfully",
      });

      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Profile setup failed';
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }));
      
      toast({
        title: "Setup Failed",
        description: errorMessage,
        variant: "destructive",
      });
      
      return false;
    }
  }, [state.user, userProfileService, toast]);

  // Update profile function
  const updateProfile = useCallback(async (updates: Partial<UserProfile>) => {
    if (!state.user) {
      throw new Error('No authenticated user');
    }

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      // Exclude id from updates to match UpdateUserProfileDto
      const { id, ...updateData } = updates;
      await userProfileService.updateProfile(state.user.uid, updateData);
      
      // Refresh profile data
      const updatedProfile = await userProfileService.getProfile(state.user.uid);
      
      setState(prev => ({
        ...prev,
        userProfile: updatedProfile,
        isLoading: false,
      }));

      toast({
        title: "Success",
        description: AUTH_SUCCESS_MESSAGES.PROFILE_UPDATED,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Profile update failed';
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }));
      
      toast({
        title: "Update Failed",
        description: errorMessage,
        variant: "destructive",
      });
      
      throw error;
    }
  }, [state.user, userProfileService, toast]);

  // Refresh profile function
  const refreshProfile = useCallback(async () => {
    if (!state.user) return;

    setState(prev => ({ ...prev, isLoading: true }));

    try {
      const userProfile = await userProfileService.getProfile(state.user.uid);
      setState(prev => ({
        ...prev,
        userProfile,
        isLoading: false,
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to refresh profile',
      }));
    }
  }, [state.user, userProfileService]);

  // Clear error function
  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  return {
    // State
    ...state,
    
    // Actions
    login,
    register,
    logout,
    setupUser,
    updateProfile,
    refreshProfile,
    clearError,
  };
}