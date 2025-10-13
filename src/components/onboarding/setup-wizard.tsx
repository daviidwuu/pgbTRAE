"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth, useUser, useFirestore } from "@/firebase";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useToast } from "@/shared/hooks";
import { DatabaseService } from "./database-service";

// Import wizard steps
import { WelcomeStep } from "./welcome-step";
import { NameSetupStep } from "./name-setup-step";
import { IncomeSetupStep } from "./income-setup-step";
import { IncomeCategoriesStep } from "./income-categories-step";
import { ExpenseCategoriesStep } from "./expense-categories-step";
import { BudgetSummaryStep } from "./budget-summary-step";
import { CompletionStep } from "./completion-step";
import { PwaShortcutsStep } from "./pwa-shortcuts-step";
import { FinalSetupStep } from "./final-setup-step";

// Default categories
const DEFAULT_EXPENSE_CATEGORIES = ["F&B", "Shopping", "Transport", "Bills", "Others"];
const DEFAULT_INCOME_CATEGORIES = ["Salary", "Transfer"];

export interface WizardData {
  name: string;
  income: number;
  savingsGoal: number;
  incomeCategories: string[];
  expenseCategories: string[];
  budgets: Record<string, number>;
}

const WIZARD_STEPS = [
  { id: 0, title: "Welcome", component: WelcomeStep },
  { id: 1, title: "Name Setup", component: NameSetupStep },
  { id: 2, title: "Income & Savings", component: IncomeSetupStep },
  { id: 3, title: "Income Categories", component: IncomeCategoriesStep },
  { id: 4, title: "Expense Categories", component: ExpenseCategoriesStep },
  { id: 5, title: "Budget Summary", component: BudgetSummaryStep },
  { id: 6, title: "Completion", component: CompletionStep },
  { id: 7, title: "Shortcuts & PWA", component: PwaShortcutsStep },
  { id: 8, title: "Final Setup", component: FinalSetupStep },
];

export function SetupWizard() {
  const [currentStep, setCurrentStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [wizardData, setWizardData] = useState<WizardData>({
    name: "",
    income: 0,
    savingsGoal: 0,
    incomeCategories: [...DEFAULT_INCOME_CATEGORIES],
    expenseCategories: [...DEFAULT_EXPENSE_CATEGORIES],
    budgets: {},
  });

  const router = useRouter();
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();

  const updateWizardData = useCallback((updates: Partial<WizardData>) => {
    setWizardData(prev => ({ ...prev, ...updates }));
  }, []);

  const nextStep = useCallback(() => {
    if (currentStep < WIZARD_STEPS.length - 1) {
      setCurrentStep(prev => prev + 1);
    }
  }, [currentStep]);

  const prevStep = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  }, [currentStep]);

  const completeWizard = useCallback(async () => {
    if (!user || !firestore) {
      toast({
        title: "Error",
        description: "User authentication required",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    
    // Validate wizard data before proceeding
    if (!wizardData.name.trim()) {
      toast({
        title: "Validation Error",
        description: "Name is required to complete setup.",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    if (wizardData.income <= 0) {
      toast({
        title: "Validation Error", 
        description: "Income must be greater than 0.",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    if (wizardData.expenseCategories.length === 0) {
      toast({
        title: "Validation Error",
        description: "At least one expense category is required.",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    try {
      // Use the DatabaseService for consistent schema operations
      const dbService = new DatabaseService(firestore, user);
      const result = await dbService.initializeNewUser(wizardData);

      if (!result.success) {
        throw new Error(result.error || "Database initialization failed");
      }

      toast({
        title: "Setup Complete!",
        description: `Your account has been successfully configured. Created ${result.budgetDocumentsCreated} budget categories.`,
      });

      // Redirect to dashboard
      router.replace('/');
    } catch (error) {
      console.error("Failed to complete setup:", error);
      
      // Provide specific error messages based on error type
      let errorMessage = "There was an error setting up your account. Please try again.";
      
      if (error instanceof Error) {
        if (error.message.includes('permission-denied')) {
          errorMessage = "Permission denied. Please check your authentication and try again.";
        } else if (error.message.includes('network')) {
          errorMessage = "Network error. Please check your connection and try again.";
        } else if (error.message.includes('quota-exceeded')) {
          errorMessage = "Database quota exceeded. Please try again later.";
        }
      }
      
      toast({
        title: "Setup Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [user, firestore, wizardData, toast, router]);

  const progress = ((currentStep + 1) / WIZARD_STEPS.length) * 100;
  const CurrentStepComponent = WIZARD_STEPS[currentStep].component;

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background to-muted/20">
      <Card className="w-full max-w-2xl">
        <CardContent className="p-8">
          {/* Progress Bar */}
          <div className="mb-8">
            <div className="flex justify-between items-center mb-2">
              <h2 className="text-sm font-medium text-muted-foreground">
                Step {currentStep + 1} of {WIZARD_STEPS.length}
              </h2>
              <span className="text-sm font-medium text-muted-foreground">
                {Math.round(progress)}%
              </span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          {/* Current Step */}
          <div className="mb-8">
            <CurrentStepComponent
              data={wizardData}
              updateData={updateWizardData}
              onNext={nextStep}
              onComplete={completeWizard}
              isLoading={isLoading}
            />
          </div>

          {/* Navigation */}
          <div className="flex justify-between">
            <Button
              variant="outline"
              onClick={prevStep}
              disabled={currentStep === 0}
              className="flex items-center gap-2"
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>

            {currentStep < WIZARD_STEPS.length - 1 ? (
              <Button
                onClick={nextStep}
                className="flex items-center gap-2"
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button
                onClick={completeWizard}
                disabled={isLoading}
                className="flex items-center gap-2"
              >
                Complete Setup
                <ChevronRight className="h-4 w-4" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}