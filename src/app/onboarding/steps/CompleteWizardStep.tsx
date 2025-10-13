'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, User, DollarSign, Briefcase, ShoppingCart, ArrowRight } from 'lucide-react';
import { useOnboarding } from '../OnboardingContext';

export function CompleteWizardStep() {
  const { data, nextStep } = useOnboarding();

  const monthlyIncome = parseFloat(data.monthlyIncome) || 0;
  const savingsGoal = parseFloat(data.savingsGoal) || 0;
  const expenseBudget = monthlyIncome - savingsGoal;

  const totalIncomeAllocated = parseFloat(data.incomeCategories.Salary || '0') + 
                              parseFloat(data.incomeCategories.Transfer || '0');
  
  const totalExpenseAllocated = Object.values(data.expenseCategories)
    .reduce((sum, amount) => sum + parseFloat(amount || '0'), 0);

  const handleNext = () => {
    nextStep();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-8 h-8 text-green-600" />
        </div>
        <h2 className="text-2xl font-bold">Budget Setup Complete!</h2>
        <p className="text-muted-foreground">
          Review your financial plan before we continue
        </p>
      </div>

      {/* Summary Cards */}
      <div className="space-y-4">
        {/* Personal Info */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <User className="w-5 h-5" />
              Personal Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Name</span>
              <span className="font-medium">{data.userName}</span>
            </div>
          </CardContent>
        </Card>

        {/* Financial Overview */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <DollarSign className="w-5 h-5" />
              Financial Overview
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Monthly Income</span>
              <span className="font-medium">${monthlyIncome.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Savings Goal</span>
              <span className="font-medium text-green-600">${savingsGoal.toLocaleString()}</span>
            </div>
            <hr className="my-2" />
            <div className="flex justify-between items-center">
              <span className="font-medium">Available for Expenses</span>
              <span className="font-bold text-primary">${expenseBudget.toLocaleString()}</span>
            </div>
          </CardContent>
        </Card>

        {/* Income Categories */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Briefcase className="w-5 h-5" />
              Income Sources
            </CardTitle>
            <CardDescription>
              Total allocated: ${totalIncomeAllocated.toLocaleString()}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {Object.entries(data.incomeCategories).map(([category, amount]) => {
              const numAmount = parseFloat(amount || '0');
              if (numAmount > 0) {
                return (
                  <div key={category} className="flex justify-between items-center">
                    <span className="text-muted-foreground">{category}</span>
                    <span className="font-medium">${numAmount.toLocaleString()}</span>
                  </div>
                );
              }
              return null;
            })}
          </CardContent>
        </Card>

        {/* Expense Categories */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <ShoppingCart className="w-5 h-5" />
              Expense Categories
            </CardTitle>
            <CardDescription>
              Total allocated: ${totalExpenseAllocated.toLocaleString()}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {Object.entries(data.expenseCategories).map(([category, amount]) => {
              const numAmount = parseFloat(amount || '0');
              if (numAmount > 0) {
                return (
                  <div key={category} className="flex justify-between items-center">
                    <span className="text-muted-foreground">{category}</span>
                    <span className="font-medium">${numAmount.toLocaleString()}</span>
                  </div>
                );
              }
              return null;
            })}
          </CardContent>
        </Card>
      </div>

      {/* Success Message */}
      <Card className="bg-green-50 border-green-200">
        <CardContent className="pt-6 text-center">
          <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-green-800 mb-2">
            Your Budget is Ready!
          </h3>
          <p className="text-green-700 text-sm">
            You&apos;ve successfully set up your financial plan. Next, we&apos;ll show you how to 
            add PiggyBank to your home screen and set up iOS Shortcuts for quick expense tracking.
          </p>
        </CardContent>
      </Card>

      {/* Continue Button */}
      <Button 
        onClick={handleNext}
        className="w-full h-12 text-lg font-semibold"
        size="lg"
      >
        Continue to Tutorial
        <ArrowRight className="w-5 h-5 ml-2" />
      </Button>

      {/* Progress Indicator */}
      <div className="text-center">
        <p className="text-sm text-muted-foreground">
          Almost done! Just a few more steps to complete setup
        </p>
      </div>
    </div>
  );
}