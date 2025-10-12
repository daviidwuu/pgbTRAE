'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser, useFirestore } from '@/firebase';
import { doc, updateDoc, setDoc } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft, ArrowRight, CheckCircle } from 'lucide-react';
import { useToast } from '@/shared/hooks';
import { DEFAULT_EXPENSE_CATEGORIES, DEFAULT_INCOME_CATEGORIES } from '@/shared/constants/budget';

interface OnboardingStep {
  title: string;
  description: string;
  component: React.ReactNode;
}

export default function OnboardingPage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const router = useRouter();
  const { toast } = useToast();
  
  const [currentStep, setCurrentStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  
  // Form data
  const [estimatedIncome, setEstimatedIncome] = useState('');
  const [estimatedExpenses, setEstimatedExpenses] = useState('');
  const [desiredSavings, setDesiredSavings] = useState('');
  const [selectedIncomeCategories, setSelectedIncomeCategories] = useState<string[]>([...DEFAULT_INCOME_CATEGORIES]);
  const [selectedExpenseCategories, setSelectedExpenseCategories] = useState<string[]>([...DEFAULT_EXPENSE_CATEGORIES]);

  // Redirect if user is not authenticated
  useEffect(() => {
    if (!user) {
      router.push('/login');
    }
  }, [user, router]);

  const steps: OnboardingStep[] = [
    {
      title: "Welcome to PiggyBank PWA!",
      description: "Let's set up your financial profile to help you track your savings effectively.",
      component: (
        <div className="space-y-6 text-center">
          <div className="mx-auto w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
            <span className="text-3xl">🐷</span>
          </div>
          <div className="space-y-2">
            <p className="text-muted-foreground">
              We&apos;ll guide you through setting up your income, expenses, and savings goals.
            </p>
            <p className="text-sm text-muted-foreground">
              This will help us calculate how much you&apos;re saving with PiggyBank PWA!
            </p>
          </div>
        </div>
      )
    },
    {
      title: "Estimated Monthly Income",
      description: "How much do you expect to earn each month?",
      component: (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="income">Monthly Income ($)</Label>
            <Input
              id="income"
              type="number"
              placeholder="e.g., 5000"
              value={estimatedIncome}
              onChange={(e) => setEstimatedIncome(e.target.value)}
              className="text-lg"
            />
          </div>
          <p className="text-sm text-muted-foreground">
            Include your salary, freelance income, and any other regular income sources.
          </p>
        </div>
      )
    },
    {
      title: "Estimated Monthly Expenses",
      description: "How much do you typically spend each month?",
      component: (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="expenses">Monthly Expenses ($)</Label>
            <Input
              id="expenses"
              type="number"
              placeholder="e.g., 3500"
              value={estimatedExpenses}
              onChange={(e) => setEstimatedExpenses(e.target.value)}
              className="text-lg"
            />
          </div>
          <p className="text-sm text-muted-foreground">
            Include rent, food, transport, bills, and other regular expenses.
          </p>
        </div>
      )
    },
    {
      title: "Desired Monthly Savings",
      description: "How much would you like to save each month?",
      component: (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="savings">Monthly Savings Goal ($)</Label>
            <Input
              id="savings"
              type="number"
              placeholder="e.g., 1000"
              value={desiredSavings}
              onChange={(e) => setDesiredSavings(e.target.value)}
              className="text-lg"
            />
          </div>
          {estimatedIncome && estimatedExpenses && (
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm font-medium">Recommended Daily Budget:</p>
              <p className="text-2xl font-bold text-primary">
                ${((parseFloat(estimatedIncome) - parseFloat(estimatedExpenses || '0')) / 30).toFixed(2)}
              </p>
              <p className="text-xs text-muted-foreground">
                Based on your income minus expenses, divided by 30 days
              </p>
            </div>
          )}
        </div>
      )
    },
    {
      title: "Income Categories",
      description: "Select or customize your income categories:",
      component: (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-2">
            {DEFAULT_INCOME_CATEGORIES.map((category) => (
              <Button
                key={category}
                variant={selectedIncomeCategories.includes(category) ? "default" : "outline"}
                onClick={() => {
                  setSelectedIncomeCategories(prev => 
                    prev.includes(category) 
                      ? prev.filter(c => c !== category)
                      : [...prev, category]
                  );
                }}
                className="justify-start"
              >
                {selectedIncomeCategories.includes(category) && <CheckCircle className="w-4 h-4 mr-2" />}
                {category}
              </Button>
            ))}
          </div>
          <p className="text-sm text-muted-foreground">
            You can always add or modify categories later in the app.
          </p>
        </div>
      )
    },
    {
      title: "Expense Categories",
      description: "Select or customize your expense categories:",
      component: (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-2">
            {DEFAULT_EXPENSE_CATEGORIES.map((category) => (
              <Button
                key={category}
                variant={selectedExpenseCategories.includes(category) ? "default" : "outline"}
                onClick={() => {
                  setSelectedExpenseCategories(prev => 
                    prev.includes(category) 
                      ? prev.filter(c => c !== category)
                      : [...prev, category]
                  );
                }}
                className="justify-start"
              >
                {selectedExpenseCategories.includes(category) && <CheckCircle className="w-4 h-4 mr-2" />}
                {category}
              </Button>
            ))}
          </div>
          <p className="text-sm text-muted-foreground">
            You can always add or modify categories later in the app.
          </p>
        </div>
      )
    }
  ];

  const canProceed = () => {
    switch (currentStep) {
      case 0: return true;
      case 1: return estimatedIncome && parseFloat(estimatedIncome) > 0;
      case 2: return estimatedExpenses && parseFloat(estimatedExpenses) > 0;
      case 3: return desiredSavings && parseFloat(desiredSavings) >= 0;
      case 4: return selectedIncomeCategories.length > 0;
      case 5: return selectedExpenseCategories.length > 0;
      default: return false;
    }
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = async () => {
    if (!user || !firestore) return;
    
    setIsLoading(true);
    
    try {
      // Update user profile with onboarding data
      const userRef = doc(firestore, 'users', user.uid);
      await updateDoc(userRef, {
        onboardingCompleted: true,
        estimatedMonthlyIncome: parseFloat(estimatedIncome),
        estimatedMonthlyExpenses: parseFloat(estimatedExpenses),
        desiredMonthlySavings: parseFloat(desiredSavings),
        categories: selectedExpenseCategories,
        incomeCategories: selectedIncomeCategories,
        updatedAt: new Date()
      });

      // Create budget documents for each category
      const budgetPromises = [
        ...selectedIncomeCategories.map(category => 
          setDoc(doc(firestore, `users/${user.uid}/budgets`, category), {
            Category: category,
            MonthlyBudget: 0, // User can set these later
            type: 'income'
          }, { merge: true })
        ),
        ...selectedExpenseCategories.map(category => 
          setDoc(doc(firestore, `users/${user.uid}/budgets`, category), {
            Category: category,
            MonthlyBudget: 0, // User can set these later
            type: 'expense'
          }, { merge: true })
        )
      ];

      await Promise.all(budgetPromises);

      toast({
        title: 'Success',
        description: 'Onboarding completed successfully!'
      });
      router.push('/');
    } catch (error) {
      console.error('Error completing onboarding:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to complete onboarding. Please try again.'
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) {
    return null; // Will redirect to login
  }

  const progress = ((currentStep + 1) / steps.length) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-4">
      <div className="max-w-2xl mx-auto pt-8">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium">Step {currentStep + 1} of {steps.length}</span>
            <span className="text-sm text-muted-foreground">{Math.round(progress)}% complete</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Main Card */}
        <Card className="shadow-lg">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">{steps[currentStep].title}</CardTitle>
            <CardDescription className="text-lg">
              {steps[currentStep].description}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {steps[currentStep].component}
            
            {/* Navigation Buttons */}
            <div className="flex justify-between pt-6">
              <Button
                variant="outline"
                onClick={handlePrevious}
                disabled={currentStep === 0}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Previous
              </Button>
              
              <Button
                onClick={handleNext}
                disabled={!canProceed() || isLoading}
                className="flex items-center gap-2"
              >
                {currentStep === steps.length - 1 ? (
                  isLoading ? 'Completing...' : 'Complete Setup'
                ) : (
                  <>
                    Next
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}