"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useUser, useFirestore } from "@/firebase";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { useToast } from "@/shared/hooks";
import { OnboardingProvider, useOnboarding } from "./OnboardingContext";
import { WelcomeStep } from "./steps/WelcomeStep";
import { UsernameStep } from "./steps/UsernameStep";
import { IncomeStep } from "./steps/IncomeStep";
import { IncomeCategoriesStep } from "./steps/IncomeCategoriesStep";
import { ExpenseCategoriesStep } from "./steps/ExpenseCategoriesStep";
import { BudgetSummaryStep } from "./steps/BudgetSummaryStep";
import { CompleteWizardStep } from "./steps/CompleteWizardStep";
import { AddToHomeScreenStep } from "./steps/AddToHomeScreenStep";
import { ShortcutSetupStep } from "./steps/ShortcutSetupStep";
import { NotificationStep } from "./steps/NotificationStep";
import { FinishSetupStep } from "./steps/FinishSetupStep";

function OnboardingContent() {
  const router = useRouter();
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const { data, previousStep, canProceedToNext, resetData, totalSteps } = useOnboarding();

  const [isLoading, setIsLoading] = useState(false);

  // Redirect if user is not authenticated
  useEffect(() => {
    if (!user) {
      router.push('/login');
    }
  }, [user, router]);

  const progressPercentage = ((data.currentStep + 1) / (totalSteps + 1)) * 100;

  const handlePrevious = useCallback(() => {
    previousStep();
  }, [previousStep]);

  const handleFinish = useCallback(async () => {
    if (!user || !firestore) return;

    setIsLoading(true);
    try {
      const userDocRef = doc(firestore, "users", user.uid);
      
      // Save user profile data
      await setDoc(userDocRef, {
        name: data.userName,
        income: parseFloat(data.monthlyIncome),
        savings: parseFloat(data.savingsGoal),
        categories: Object.keys(data.expenseCategories),
        incomeCategories: Object.keys(data.incomeCategories),
        onboardingCompleted: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }, { merge: true });

      // Create budget documents for expense categories
      const expenseBudgetPromises = Object.entries(data.expenseCategories).map(([category, amount]) => {
        const budgetRef = doc(firestore, `users/${user.uid}/budgets`, category);
        return setDoc(budgetRef, {
          Category: category,
          MonthlyBudget: parseFloat(amount || '0'),
          type: 'expense',
          isActive: true,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      });

      // Create budget documents for income categories
      const incomeBudgetPromises = Object.entries(data.incomeCategories).map(([category, amount]) => {
        const budgetRef = doc(firestore, `users/${user.uid}/budgets`, `income_${category}`);
        return setDoc(budgetRef, {
          Category: category,
          MonthlyBudget: parseFloat(amount || '0'),
          type: 'income',
          isActive: true,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      });

      // Execute all Firestore operations in parallel
      await Promise.all([...expenseBudgetPromises, ...incomeBudgetPromises]);

      // Clear the onboarding data from localStorage
      resetData();

      toast({
        title: "Welcome to PiggyBank!",
        description: "Your account has been set up successfully.",
      });

      router.push("/");
    } catch (error) {
      console.error("Error saving onboarding data:", error);
      toast({
        title: "Error",
        description: "Failed to save your setup. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [user, firestore, data, router, toast, resetData]);

  const renderCurrentStep = () => {
    switch (data.currentStep) {
      case 0:
        return <WelcomeStep />;
      case 1:
        return <UsernameStep />;
      case 2:
        return <IncomeStep />;
      case 3:
        return <IncomeCategoriesStep />;
      case 4:
        return <ExpenseCategoriesStep />;
      case 5:
        return <BudgetSummaryStep />;
      case 6:
        return <CompleteWizardStep />;
      case 7:
        return <AddToHomeScreenStep />;
      case 8:
        return <ShortcutSetupStep />;
      case 9:
        return <NotificationStep />;
      case 10:
        return <FinishSetupStep />;
      default:
        return <WelcomeStep />;
    }
  };

  // Show loading while checking user
  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="container max-w-md mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {data.currentStep > 0 && (
                <Button variant="ghost" size="icon" onClick={handlePrevious}>
                  <ArrowLeft className="w-4 h-4" />
                </Button>
              )}
              <div>
                <h1 className="text-lg font-semibold">Setup</h1>
                <p className="text-sm text-muted-foreground">
                  Step {data.currentStep + 1} of {totalSteps + 1}
                </p>
              </div>
            </div>
          </div>
          <div className="mt-4">
            <Progress value={progressPercentage} className="h-2" />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 container max-w-md mx-auto px-4 py-6">
        {renderCurrentStep()}
      </div>
    </div>
  );
}

export default function OnboardingPage() {
  return (
    <OnboardingProvider>
      <OnboardingContent />
    </OnboardingProvider>
  );
}