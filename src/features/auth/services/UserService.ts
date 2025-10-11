import { doc, setDoc, type Firestore } from 'firebase/firestore';
import { type User as UserData } from "@/shared/types";
import { updateDocumentNonBlocking } from "@/firebase/non-blocking-updates";
import { DEFAULT_CATEGORIES, DEFAULT_INCOME_CATEGORIES } from "@/shared/constants";

export interface CreateUserDto {
  name: string;
  categories?: string[];
  incomeCategories?: string[];
  income?: number;
  savings?: number;
}

export interface UpdateUserDto extends Partial<CreateUserDto> {
  id?: never; // Prevent id from being updated
}

export class UserService {
  static async create(
    userId: string,
    firestore: Firestore,
    userData: CreateUserDto
  ): Promise<void> {
    if (!userId || !firestore) {
      throw new Error('User ID and Firestore instance are required');
    }

    const userRef = doc(firestore, 'users', userId);
    
    const userWithDefaults = {
      userId,
      name: userData.name,
      categories: userData.categories || DEFAULT_CATEGORIES,
      incomeCategories: userData.incomeCategories || DEFAULT_INCOME_CATEGORIES,
      income: userData.income || 0,
      savings: userData.savings || 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await setDoc(userRef, userWithDefaults, { merge: true });
  }

  static async update(
    userId: string,
    firestore: Firestore,
    updates: UpdateUserDto
  ): Promise<void> {
    if (!userId || !firestore) {
      throw new Error('User ID and Firestore instance are required');
    }

    const userRef = doc(firestore, 'users', userId);
    
    const updatesWithMeta = {
      ...updates,
      updatedAt: new Date(),
    };

    await updateDocumentNonBlocking(userRef, updatesWithMeta);
  }

  static async updateIncome(
    userId: string,
    firestore: Firestore,
    newIncome: number
  ): Promise<void> {
    await this.update(userId, firestore, { income: newIncome });
  }

  static async updateSavings(
    userId: string,
    firestore: Firestore,
    newSavings: number
  ): Promise<void> {
    await this.update(userId, firestore, { savings: newSavings });
  }

  static async addCategory(
    userId: string,
    firestore: Firestore,
    userData: UserData,
    newCategory: string
  ): Promise<void> {
    if (!userData.categories) {
      throw new Error('User categories not found');
    }

    const updatedCategories = [...userData.categories, newCategory];
    await this.update(userId, firestore, { categories: updatedCategories });
  }

  static async removeCategory(
    userId: string,
    firestore: Firestore,
    userData: UserData,
    categoryToRemove: string
  ): Promise<void> {
    if (!userData.categories) {
      throw new Error('User categories not found');
    }

    const updatedCategories = userData.categories.filter(c => c !== categoryToRemove);
    await this.update(userId, firestore, { categories: updatedCategories });
  }

  static createUserDocRef(userId: string, firestore: Firestore) {
    if (!userId || !firestore) {
      return null;
    }

    return doc(firestore, 'users', userId);
  }

  static calculateAvailableBalance(userData: UserData, totalSpent: number = 0): number {
    const income = userData.income || 0;
    const savings = userData.savings || 0;
    return income - savings - totalSpent;
  }

  static calculateSavingsRate(userData: UserData): number {
    const income = userData.income || 0;
    const savings = userData.savings || 0;
    
    if (income === 0) return 0;
    return (savings / income) * 100;
  }

  static validateUserData(userData: Partial<UserData>): string[] {
    const errors: string[] = [];

    if (!userData.name || userData.name.trim().length === 0) {
      errors.push('Name is required');
    }

    if (userData.income !== undefined && userData.income < 0) {
      errors.push('Income cannot be negative');
    }

    if (userData.savings !== undefined && userData.savings < 0) {
      errors.push('Savings cannot be negative');
    }

    if (userData.income !== undefined && userData.savings !== undefined && userData.savings > userData.income) {
      errors.push('Savings cannot exceed income');
    }

    return errors;
  }
}