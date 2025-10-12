/**
 * useUserProfile Hook
 * 
 * Custom hook for user profile management.
 * Provides clean interface for profile operations.
 */

import { useState, useCallback } from 'react';
import { UserProfileService } from '../services/UserProfileService';
import { UserProfile } from '../types/auth.types';
import { useToast } from '../../../shared/hooks';

interface UseUserProfileOptions {
  userProfileService: UserProfileService;
  userId?: string;
}

export function useUserProfile(options: UseUserProfileOptions) {
  const { userProfileService, userId } = options;
  const { toast } = useToast();

  const [isUserSettingsOpen, setUserSettingsOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Update income
  const updateIncome = useCallback(async (newIncome: number) => {
    if (!userId) {
      throw new Error('User ID is required');
    }

    setIsLoading(true);
    try {
      await userProfileService.updateIncome(userId, newIncome);
      toast({
        title: "Success",
        description: "Income updated successfully",
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update income';
      toast({
        title: "Update Failed",
        description: errorMessage,
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [userId, userProfileService, toast]);

  // Update savings
  const updateSavings = useCallback(async (newSavings: number) => {
    if (!userId) {
      throw new Error('User ID is required');
    }

    setIsLoading(true);
    try {
      await userProfileService.updateSavings(userId, newSavings);
      toast({
        title: "Success",
        description: "Savings updated successfully",
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update savings';
      toast({
        title: "Update Failed",
        description: errorMessage,
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [userId, userProfileService, toast]);

  // Add category
  const addCategory = useCallback(async (newCategory: string, type: 'expense' | 'income' = 'expense') => {
    if (!userId) {
      throw new Error('User ID is required');
    }

    setIsLoading(true);
    try {
      await userProfileService.addCategory(userId, newCategory, type);
      toast({
        title: "Success",
        description: `${type === 'income' ? 'Income' : 'Expense'} category added successfully`,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to add category';
      toast({
        title: "Add Failed",
        description: errorMessage,
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [userId, userProfileService, toast]);

  // Remove category
  const removeCategory = useCallback(async (categoryToRemove: string, type: 'expense' | 'income' = 'expense') => {
    if (!userId) {
      throw new Error('User ID is required');
    }

    setIsLoading(true);
    try {
      await userProfileService.removeCategory(userId, categoryToRemove, type);
      toast({
        title: "Success",
        description: `${type === 'income' ? 'Income' : 'Expense'} category removed successfully`,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to remove category';
      toast({
        title: "Remove Failed",
        description: errorMessage,
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [userId, userProfileService, toast]);

  // Calculate available balance
  const calculateAvailableBalance = useCallback((profile: UserProfile, totalSpent: number = 0): number => {
    return userProfileService.calculateAvailableBalance(profile, totalSpent);
  }, [userProfileService]);

  // Calculate savings rate
  const calculateSavingsRate = useCallback((profile: UserProfile): number => {
    return userProfileService.calculateSavingsRate(profile);
  }, [userProfileService]);

  // Copy user ID to clipboard
  const copyUserId = useCallback(async () => {
    if (!userId) return;

    try {
      await navigator.clipboard.writeText(userId);
      toast({
        title: "Copied",
        description: "User ID copied to clipboard",
      });
    } catch (error) {
      toast({
        title: "Copy Failed",
        description: "Failed to copy user ID",
        variant: "destructive",
      });
    }
  }, [userId, toast]);

  // UI state management
  const openUserSettings = useCallback(() => {
    setUserSettingsOpen(true);
  }, []);

  const closeUserSettings = useCallback(() => {
    setUserSettingsOpen(false);
  }, []);

  const showLogoutConfirmation = useCallback(() => {
    setShowLogoutConfirm(true);
  }, []);

  const hideLogoutConfirmation = useCallback(() => {
    setShowLogoutConfirm(false);
  }, []);

  return {
    // State
    isUserSettingsOpen,
    showLogoutConfirm,
    isLoading,

    // Profile operations
    updateIncome,
    updateSavings,
    addCategory,
    removeCategory,
    calculateAvailableBalance,
    calculateSavingsRate,
    copyUserId,

    // UI state management
    openUserSettings,
    closeUserSettings,
    showLogoutConfirmation,
    hideLogoutConfirmation,
  };
}