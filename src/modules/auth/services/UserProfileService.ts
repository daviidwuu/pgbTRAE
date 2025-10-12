/**
 * User Profile Service
 * 
 * Handles user profile operations with Firestore.
 * Single responsibility: User profile data management.
 */

import { doc, setDoc, getDoc, updateDoc, Firestore } from 'firebase/firestore';
import { BaseService } from '../../services';
import { UserProfile, UserSetupData } from '../types/auth.types';
import { DEFAULT_CATEGORIES, DEFAULT_INCOME_CATEGORIES } from '../../../shared/constants';

export interface CreateUserProfileDto {
  name: string;
  email?: string;
  categories?: string[];
  incomeCategories?: string[];
  income?: number;
  savings?: number;
}

export interface UpdateUserProfileDto extends Partial<CreateUserProfileDto> {
  id?: never; // Prevent id from being updated
}

export class UserProfileService extends BaseService {
  private firestore: Firestore;

  constructor(firestore: Firestore) {
    super();
    this.firestore = firestore;
  }

  /**
   * Create a new user profile
   */
  async createProfile(userId: string, data: CreateUserProfileDto): Promise<UserProfile> {
    if (!userId) {
      throw new Error('User ID is required');
    }

    const userRef = doc(this.firestore, 'users', userId);
    const now = new Date();
    
    const profileData: UserProfile = {
      id: userId,
      name: data.name,
      email: data.email,
      categories: data.categories || DEFAULT_CATEGORIES,
      incomeCategories: data.incomeCategories || DEFAULT_INCOME_CATEGORIES,
      income: data.income || 0,
      savings: data.savings || 0,
      createdAt: now,
      updatedAt: now,
    };

    await setDoc(userRef, profileData, { merge: true });
    return profileData;
  }

  /**
   * Get user profile by ID
   */
  async getProfile(userId: string): Promise<UserProfile | null> {
    if (!userId) {
      throw new Error('User ID is required');
    }

    const userRef = doc(this.firestore, 'users', userId);
    const docSnap = await getDoc(userRef);
    
    if (!docSnap.exists()) {
      return null;
    }

    const data = docSnap.data();
    return {
      id: userId,
      name: data.name,
      email: data.email,
      categories: data.categories || DEFAULT_CATEGORIES,
      incomeCategories: data.incomeCategories || DEFAULT_INCOME_CATEGORIES,
      income: data.income || 0,
      savings: data.savings || 0,
      createdAt: data.createdAt?.toDate() || new Date(),
      updatedAt: data.updatedAt?.toDate() || new Date(),
    };
  }

  /**
   * Update user profile
   */
  async updateProfile(userId: string, updates: UpdateUserProfileDto): Promise<void> {
    if (!userId) {
      throw new Error('User ID is required');
    }

    const userRef = doc(this.firestore, 'users', userId);
    
    const updateData = {
      ...updates,
      updatedAt: new Date(),
    };

    await updateDoc(userRef, updateData);
  }

  /**
   * Setup user profile with initial data
   */
  async setupUser(userId: string, setupData: UserSetupData): Promise<UserProfile> {
    const profileData: CreateUserProfileDto = {
      name: setupData.name,
      income: setupData.income,
      savings: setupData.savings,
      categories: setupData.categories || DEFAULT_CATEGORIES,
      incomeCategories: setupData.incomeCategories || DEFAULT_INCOME_CATEGORIES,
    };

    return await this.createProfile(userId, profileData);
  }

  /**
   * Update user income
   */
  async updateIncome(userId: string, newIncome: number): Promise<void> {
    await this.updateProfile(userId, { income: newIncome });
  }

  /**
   * Update user savings
   */
  async updateSavings(userId: string, newSavings: number): Promise<void> {
    await this.updateProfile(userId, { savings: newSavings });
  }

  /**
   * Add category to user profile
   */
  async addCategory(userId: string, newCategory: string, type: 'expense' | 'income' = 'expense'): Promise<void> {
    const profile = await this.getProfile(userId);
    if (!profile) {
      throw new Error('User profile not found');
    }

    const categoryField = type === 'income' ? 'incomeCategories' : 'categories';
    const currentCategories = profile[categoryField] || [];
    
    if (!currentCategories.includes(newCategory)) {
      const updatedCategories = [...currentCategories, newCategory];
      await this.updateProfile(userId, { [categoryField]: updatedCategories });
    }
  }

  /**
   * Remove category from user profile
   */
  async removeCategory(userId: string, categoryToRemove: string, type: 'expense' | 'income' = 'expense'): Promise<void> {
    const profile = await this.getProfile(userId);
    if (!profile) {
      throw new Error('User profile not found');
    }

    const categoryField = type === 'income' ? 'incomeCategories' : 'categories';
    const currentCategories = profile[categoryField] || [];
    
    const updatedCategories = currentCategories.filter(cat => cat !== categoryToRemove);
    await this.updateProfile(userId, { [categoryField]: updatedCategories });
  }

  /**
   * Calculate available balance
   */
  calculateAvailableBalance(profile: UserProfile, totalSpent: number = 0): number {
    const income = profile.income || 0;
    const savings = profile.savings || 0;
    return income - savings - totalSpent;
  }

  /**
   * Calculate savings rate
   */
  calculateSavingsRate(profile: UserProfile): number {
    const income = profile.income || 0;
    const savings = profile.savings || 0;
    return income > 0 ? (savings / income) * 100 : 0;
  }

  /**
   * Validate user profile data
   */
  validateProfileData(data: Partial<UserProfile>): string[] {
    const errors: string[] = [];

    if (data.name !== undefined && (!data.name || data.name.trim().length < 2)) {
      errors.push('Name must be at least 2 characters long');
    }

    if (data.income !== undefined && (data.income < 0 || data.income > 10000000)) {
      errors.push('Income must be between 0 and 10,000,000');
    }

    if (data.savings !== undefined && (data.savings < 0 || data.savings > 10000000)) {
      errors.push('Savings must be between 0 and 10,000,000');
    }

    if (data.email !== undefined && data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      errors.push('Invalid email format');
    }

    return errors;
  }
}