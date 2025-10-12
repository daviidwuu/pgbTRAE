'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface OnboardingData {
  currentStep: number;
  userName: string;
  monthlyIncome: string;
  savingsGoal: string;
  incomeCategories: {
    [key: string]: string; // Changed to allow dynamic keys
  };
  customIncomeCategories: string[];
  expenseCategories: {
    [key: string]: string;
  };
  customExpenseCategories: string[];
  isCompleted: boolean;
}

interface OnboardingContextType {
  data: OnboardingData;
  updateData: (updates: Partial<OnboardingData>) => void;
  nextStep: () => void;
  previousStep: () => void;
  resetData: () => void;
  canProceedToNext: () => boolean;
  totalSteps: number;
  getAvailableExpenseBudget: () => number;
  getDailyBudget: () => number;
  getWeeklyBudget: () => number;
  getMonthlyBudget: () => number;
  addCustomIncomeCategory: (category: string) => boolean;
  removeIncomeCategory: (category: string) => void;
  addCustomExpenseCategory: (category: string) => boolean;
  removeExpenseCategory: (category: string) => void;
}

const defaultData: OnboardingData = {
  currentStep: 0,
  userName: '',
  monthlyIncome: '',
  savingsGoal: '',
  incomeCategories: {
    'Salary': '',
    'Transfer': '',
  },
  customIncomeCategories: [],
  expenseCategories: {
    'F&B': '',
    'Shopping': '',
    'Transport': '',
    'Bills': '',
    'Others': '',
  },
  customExpenseCategories: [],
  isCompleted: false,
};

const OnboardingContext = createContext<OnboardingContextType | null>(null);

const STORAGE_KEY = 'onboardingData';
const TOTAL_STEPS = 10; // Steps 0-10

export function OnboardingProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<OnboardingData>(defaultData);

  // Load data from localStorage on mount
  useEffect(() => {
    const savedData = localStorage.getItem(STORAGE_KEY);
    if (savedData) {
      try {
        const parsedData = JSON.parse(savedData);
        setData({ ...defaultData, ...parsedData });
      } catch (error) {
        console.error('Failed to parse saved onboarding data:', error);
      }
    }
  }, []);

  // Save data to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }, [data]);

  const updateData = (updates: Partial<OnboardingData>) => {
    setData(prev => ({ ...prev, ...updates }));
  };

  const nextStep = () => {
    if (data.currentStep < TOTAL_STEPS && canProceedToNext()) {
      updateData({ currentStep: data.currentStep + 1 });
    }
  };

  const previousStep = () => {
    if (data.currentStep > 0) {
      updateData({ currentStep: data.currentStep - 1 });
    }
  };

  const resetData = () => {
    setData(defaultData);
    localStorage.removeItem(STORAGE_KEY);
  };

  const canProceedToNext = (): boolean => {
    switch (data.currentStep) {
      case 0: // Welcome
        return true;
      case 1: // Username
        return data.userName.trim().length > 0;
      case 2: // Income & Savings
        const income = parseFloat(data.monthlyIncome);
        const savings = parseFloat(data.savingsGoal);
        return income > 0 && savings >= 0 && savings <= income;
      case 3:
        // Step 3: Income categories validation
        const totalIncomeCategories = Object.keys(data.incomeCategories).length + data.customIncomeCategories.length;
        return totalIncomeCategories > 0;
      
      case 4:
        // Step 4: Expense categories validation
        const totalExpenseCategories = Object.keys(data.expenseCategories).length + data.customExpenseCategories.length;
        return totalExpenseCategories > 0;
      case 5: // Budget Summary
      case 6: // Complete Wizard
      case 7: // Add to Home Screen
      case 8: // Shortcut Link
      case 9: // Notification Prompt
      case 10: // Finish Setup
        return true;
      default:
        return false;
    }
  };

  const getAvailableExpenseBudget = (): number => {
    const income = parseFloat(data.monthlyIncome) || 0;
    const savings = parseFloat(data.savingsGoal) || 0;
    return income - savings;
  };

  const getDailyBudget = (): number => {
    return getAvailableExpenseBudget() / 30;
  };

  const getWeeklyBudget = (): number => {
    return getAvailableExpenseBudget() / 4;
  };

  const getMonthlyBudget = (): number => {
    return getAvailableExpenseBudget();
  };

  const addCustomIncomeCategory = (category: string): boolean => {
    const trimmedCategory = category.trim();
    if (!trimmedCategory) return false;
    
    // Check for duplicates in both default and custom categories
    const allIncomeCategories = [
      ...Object.keys(data.incomeCategories),
      ...data.customIncomeCategories
    ];
    
    if (allIncomeCategories.includes(trimmedCategory)) {
      return false; // Duplicate found
    }
    
    updateData({
      customIncomeCategories: [...data.customIncomeCategories, trimmedCategory],
      incomeCategories: {
        ...data.incomeCategories,
        [trimmedCategory]: ''
      }
    });
    return true;
  };

  const removeIncomeCategory = (category: string) => {
    // Remove from custom categories
    if (data.customIncomeCategories.includes(category)) {
      updateData({
        customIncomeCategories: data.customIncomeCategories.filter(c => c !== category),
        incomeCategories: Object.fromEntries(
          Object.entries(data.incomeCategories).filter(([key]) => key !== category)
        )
      });
    }
    // Remove from default categories (by setting amount to empty but keeping the key)
    else if (category in data.incomeCategories) {
      updateData({
        incomeCategories: {
          ...data.incomeCategories,
          [category]: ''
        }
      });
    }
  };

  const addCustomExpenseCategory = (category: string): boolean => {
    const trimmedCategory = category.trim();
    if (!trimmedCategory) return false;
    
    // Check for duplicates in both default and custom categories
    const allExpenseCategories = [
      ...Object.keys(data.expenseCategories),
      ...data.customExpenseCategories
    ];
    
    if (allExpenseCategories.includes(trimmedCategory)) {
      return false; // Duplicate found
    }
    
    updateData({
      customExpenseCategories: [...data.customExpenseCategories, trimmedCategory]
    });
    return true;
  };

  const removeExpenseCategory = (category: string) => {
    // Remove from custom categories
    if (data.customExpenseCategories.includes(category)) {
      updateData({
        customExpenseCategories: data.customExpenseCategories.filter(c => c !== category)
      });
    }
    // Remove from default categories (by removing the key)
    if (category in data.expenseCategories) {
      const newExpenseCategories = { ...data.expenseCategories };
      delete newExpenseCategories[category];
      updateData({
        expenseCategories: newExpenseCategories
      });
    }
  };

  const contextValue: OnboardingContextType = {
    data,
    updateData,
    nextStep,
    previousStep,
    resetData,
    canProceedToNext,
    totalSteps: TOTAL_STEPS,
    getAvailableExpenseBudget,
    getDailyBudget,
    getWeeklyBudget,
    getMonthlyBudget,
    addCustomIncomeCategory,
    removeIncomeCategory,
    addCustomExpenseCategory,
    removeExpenseCategory,
  };

  return (
    <OnboardingContext.Provider value={contextValue}>
      {children}
    </OnboardingContext.Provider>
  );
}

export function useOnboarding() {
  const context = useContext(OnboardingContext);
  if (!context) {
    throw new Error('useOnboarding must be used within an OnboardingProvider');
  }
  return context;
}