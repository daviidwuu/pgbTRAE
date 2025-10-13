"use client";

import { doc, writeBatch, Firestore } from "firebase/firestore";
import { type User as FirebaseUser } from "firebase/auth";
import { type WizardData } from "./setup-wizard";

// Database schema constants to ensure consistency
export const DATABASE_SCHEMA = {
  USER_FIELDS: {
    id: 'string',
    name: 'string', 
    income: 'number',
    savings: 'number',
    categories: 'array',
    incomeCategories: 'array',
    onboardingCompleted: 'boolean',
    createdAt: 'timestamp',
    updatedAt: 'timestamp',
  },
  BUDGET_FIELDS: {
    id: 'string',
    Category: 'string',
    MonthlyBudget: 'number',
    type: 'string', // 'income' | 'expense'
    createdAt: 'timestamp',
    updatedAt: 'timestamp',
  }
} as const;

export interface DatabaseInitializationResult {
  success: boolean;
  error?: string;
  userDocumentCreated: boolean;
  budgetDocumentsCreated: number;
}

/**
 * Service for handling database operations with schema consistency
 */
export class DatabaseService {
  private firestore: Firestore;
  private user: FirebaseUser;

  constructor(firestore: Firestore, user: FirebaseUser) {
    this.firestore = firestore;
    this.user = user;
  }

  /**
   * Initialize a new user's database with atomic operations
   */
  async initializeNewUser(wizardData: WizardData): Promise<DatabaseInitializationResult> {
    const batch = writeBatch(this.firestore);
    let budgetDocumentsCreated = 0;

    try {
      // Validate wizard data
      this.validateWizardData(wizardData);

      // Create user document with consistent schema
      const userRef = doc(this.firestore, 'users', this.user.uid);
      const userData = {
        id: this.user.uid,
        name: wizardData.name.trim(),
        income: wizardData.income,
        savings: wizardData.savingsGoal,
        categories: wizardData.expenseCategories,
        incomeCategories: wizardData.incomeCategories,
        onboardingCompleted: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      batch.set(userRef, userData);

      // Create budget documents for expense categories
      wizardData.expenseCategories.forEach(category => {
        const budgetRef = doc(this.firestore, `users/${this.user.uid}/budgets`, category);
        const budgetData = {
          id: `${this.user.uid}_${category}`,
          Category: category,
          MonthlyBudget: wizardData.budgets[category] || 0,
          type: 'expense' as const,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        
        batch.set(budgetRef, budgetData);
        budgetDocumentsCreated++;
      });

      // Create budget documents for income categories (if budgets are set)
      wizardData.incomeCategories.forEach(category => {
        const budgetAmount = wizardData.budgets[category];
        if (budgetAmount && budgetAmount > 0) {
          const budgetRef = doc(this.firestore, `users/${this.user.uid}/budgets`, category);
          const budgetData = {
            id: `${this.user.uid}_${category}`,
            Category: category,
            MonthlyBudget: budgetAmount,
            type: 'income' as const,
            createdAt: new Date(),
            updatedAt: new Date(),
          };
          
          batch.set(budgetRef, budgetData);
          budgetDocumentsCreated++;
        }
      });

      // Commit all operations atomically
      await batch.commit();

      return {
        success: true,
        userDocumentCreated: true,
        budgetDocumentsCreated,
      };

    } catch (error) {
      console.error("Database initialization failed:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        userDocumentCreated: false,
        budgetDocumentsCreated: 0,
      };
    }
  }

  /**
   * Validate wizard data against schema requirements
   */
  private validateWizardData(wizardData: WizardData): void {
    if (!wizardData.name || wizardData.name.trim().length === 0) {
      throw new Error("Name is required and cannot be empty");
    }

    if (typeof wizardData.income !== 'number' || wizardData.income <= 0) {
      throw new Error("Income must be a positive number");
    }

    if (typeof wizardData.savingsGoal !== 'number' || wizardData.savingsGoal < 0) {
      throw new Error("Savings goal must be a non-negative number");
    }

    if (!Array.isArray(wizardData.expenseCategories) || wizardData.expenseCategories.length === 0) {
      throw new Error("At least one expense category is required");
    }

    if (!Array.isArray(wizardData.incomeCategories)) {
      throw new Error("Income categories must be an array");
    }

    // Validate category names
    const allCategories = [...wizardData.expenseCategories, ...wizardData.incomeCategories];
    const invalidCategories = allCategories.filter(cat => 
      typeof cat !== 'string' || cat.trim().length === 0
    );
    
    if (invalidCategories.length > 0) {
      throw new Error("All categories must be non-empty strings");
    }

    // Check for duplicate categories
    const uniqueCategories = new Set(allCategories);
    if (uniqueCategories.size !== allCategories.length) {
      throw new Error("Duplicate categories are not allowed");
    }

    // Validate budgets object
    if (wizardData.budgets && typeof wizardData.budgets === 'object') {
      Object.entries(wizardData.budgets).forEach(([category, amount]) => {
        if (typeof amount !== 'number' || amount < 0) {
          throw new Error(`Budget for category "${category}" must be a non-negative number`);
        }
      });
    }
  }

  /**
   * Check if user data is consistent with current schema
   */
  static isUserDataConsistent(userData: any): boolean {
    if (!userData || typeof userData !== 'object') return false;

    // Check required fields
    const requiredFields = ['id', 'name', 'onboardingCompleted'];
    for (const field of requiredFields) {
      if (!(field in userData)) return false;
    }

    // Check field types
    if (typeof userData.name !== 'string') return false;
    if (typeof userData.onboardingCompleted !== 'boolean') return false;
    
    // Check optional fields if they exist
    if (userData.income !== undefined && typeof userData.income !== 'number') return false;
    if (userData.savings !== undefined && typeof userData.savings !== 'number') return false;
    if (userData.categories !== undefined && !Array.isArray(userData.categories)) return false;
    if (userData.incomeCategories !== undefined && !Array.isArray(userData.incomeCategories)) return false;

    return true;
  }

  /**
   * Get database schema version for migration purposes
   */
  static getDatabaseSchemaVersion(): string {
    return "1.0.0";
  }
}