"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Plus, Trash2, ArrowLeft, ArrowRight, DollarSign, Target, Wallet } from "lucide-react";
import { useToast } from "@/shared/hooks";
import { DEFAULT_EXPENSE_CATEGORIES, DEFAULT_INCOME_CATEGORIES } from "@/shared/constants/budget";
import { type CategoryType } from "@/shared/types";

interface BudgetWizardProps {
  onComplete: (budgetData: BudgetSetupData) => void;
  onBack?: () => void;
}

export interface BudgetSetupData {
  monthlyIncome: number;
  savingGoals: number;
  expenseBudget: number;
  incomeCategories: { name: string; amount: number }[];
  expenseCategories: { name: string; amount: number }[];
}

export function BudgetWizard({ onComplete, onBack }: BudgetWizardProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [budgetData, setBudgetData] = useState<BudgetSetupData>({
    monthlyIncome: 0,
    savingGoals: 0,
    expenseBudget: 0,
    incomeCategories: DEFAULT_INCOME_CATEGORIES.map(cat => ({ name: cat, amount: 0 })),
    expenseCategories: DEFAULT_EXPENSE_CATEGORIES.map(cat => ({ name: cat, amount: 0 })),
  });
  const { toast } = useToast();

  const totalSteps = 3;
  const progress = (currentStep / totalSteps) * 100;

  // Calculate expense budget when income or savings change
  useEffect(() => {
    const expenseBudget = Math.max(0, budgetData.monthlyIncome - budgetData.savingGoals);
    setBudgetData(prev => ({ ...prev, expenseBudget }));
  }, [budgetData.monthlyIncome, budgetData.savingGoals]);

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(prev => prev + 1);
    } else {
      // Validate and complete
      if (validateFinalData()) {
        onComplete(budgetData);
      }
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    } else if (onBack) {
      onBack();
    }
  };

  const validateFinalData = () => {
    if (budgetData.monthlyIncome <= 0) {
      toast({
        variant: "destructive",
        title: "Invalid Income",
        description: "Please enter a valid monthly income amount.",
      });
      setCurrentStep(1);
      return false;
    }
    return true;
  };

  const updateIncomeCategory = (index: number, field: 'name' | 'amount', value: string | number) => {
    setBudgetData(prev => ({
      ...prev,
      incomeCategories: prev.incomeCategories.map((cat, i) => 
        i === index ? { ...cat, [field]: value } : cat
      )
    }));
  };

  const updateExpenseCategory = (index: number, field: 'name' | 'amount', value: string | number) => {
    setBudgetData(prev => ({
      ...prev,
      expenseCategories: prev.expenseCategories.map((cat, i) => 
        i === index ? { ...cat, [field]: value } : cat
      )
    }));
  };

  const addIncomeCategory = () => {
    setBudgetData(prev => ({
      ...prev,
      incomeCategories: [...prev.incomeCategories, { name: '', amount: 0 }]
    }));
  };

  const addExpenseCategory = () => {
    setBudgetData(prev => ({
      ...prev,
      expenseCategories: [...prev.expenseCategories, { name: '', amount: 0 }]
    }));
  };

  const removeIncomeCategory = (index: number) => {
    setBudgetData(prev => ({
      ...prev,
      incomeCategories: prev.incomeCategories.filter((_, i) => i !== index)
    }));
  };

  const removeExpenseCategory = (index: number) => {
    setBudgetData(prev => ({
      ...prev,
      expenseCategories: prev.expenseCategories.filter((_, i) => i !== index)
    }));
  };

  const getTotalIncomeAllocated = () => {
    return budgetData.incomeCategories.reduce((sum, cat) => sum + cat.amount, 0);
  };

  const getTotalExpenseAllocated = () => {
    return budgetData.expenseCategories.reduce((sum, cat) => sum + cat.amount, 0);
  };

  const renderStep1 = () => (
    <div className="space-y-8">
      <div className="text-center space-y-4">
        <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
          <DollarSign className="h-8 w-8 text-primary" />
        </div>
        <div>
          <h1 className="text-3xl font-bold">Let&apos;s set up your budget</h1>
          <p className="text-muted-foreground mt-2">
            First, tell us about your monthly income and saving goals
          </p>
        </div>
      </div>

      <div className="space-y-6 max-w-md mx-auto">
        <div className="space-y-2">
          <label className="text-sm font-medium">Monthly Income</label>
          <div className="relative">
            <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="number"
              inputMode="decimal"
              placeholder="5000"
              className="pl-10 text-lg h-12"
              value={budgetData.monthlyIncome || ''}
              onChange={(e) => setBudgetData(prev => ({ 
                ...prev, 
                monthlyIncome: parseFloat(e.target.value) || 0 
              }))}
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Monthly Saving Goals</label>
          <div className="relative">
            <Target className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="number"
              inputMode="decimal"
              placeholder="1000"
              className="pl-10 text-lg h-12"
              value={budgetData.savingGoals || ''}
              onChange={(e) => setBudgetData(prev => ({ 
                ...prev, 
                savingGoals: parseFloat(e.target.value) || 0 
              }))}
            />
          </div>
        </div>

        {budgetData.monthlyIncome > 0 && (
          <Card className="bg-muted/50">
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Available for Expenses</p>
                <p className="text-2xl font-bold text-primary">
                  ${budgetData.expenseBudget.toLocaleString()}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  ${budgetData.monthlyIncome.toLocaleString()} income - ${budgetData.savingGoals.toLocaleString()} savings
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-8">
      <div className="text-center space-y-4">
        <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
          <Wallet className="h-8 w-8 text-green-600" />
        </div>
        <div>
          <h1 className="text-3xl font-bold">Income Categories</h1>
          <p className="text-muted-foreground mt-2">
            Break down your ${budgetData.monthlyIncome.toLocaleString()} monthly income by source
          </p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto space-y-6">
        <div className="grid gap-4">
          {budgetData.incomeCategories.map((category, index) => (
            <div key={index} className="flex items-center gap-3 p-4 border rounded-lg">
              <Input
                placeholder="Category name"
                value={category.name}
                onChange={(e) => updateIncomeCategory(index, 'name', e.target.value)}
                className="flex-1"
              />
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="number"
                  inputMode="decimal"
                  placeholder="0"
                  className="pl-10 w-32"
                  value={category.amount || ''}
                  onChange={(e) => updateIncomeCategory(index, 'amount', parseFloat(e.target.value) || 0)}
                />
              </div>
              {budgetData.incomeCategories.length > 1 && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeIncomeCategory(index)}
                  className="text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}
        </div>

        <Button
          variant="outline"
          onClick={addIncomeCategory}
          className="w-full"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Income Category
        </Button>

        <Card className="bg-muted/50">
          <CardContent className="pt-6">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Total Allocated:</span>
              <span className="font-semibold">
                ${getTotalIncomeAllocated().toLocaleString()} / ${budgetData.monthlyIncome.toLocaleString()}
              </span>
            </div>
            {getTotalIncomeAllocated() !== budgetData.monthlyIncome && (
              <p className="text-xs text-muted-foreground mt-2">
                {getTotalIncomeAllocated() > budgetData.monthlyIncome 
                  ? "⚠️ Total exceeds monthly income" 
                  : "💡 You can adjust amounts to match your income"}
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-8">
      <div className="text-center space-y-4">
        <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
          <Wallet className="h-8 w-8 text-red-600" />
        </div>
        <div>
          <h1 className="text-3xl font-bold">Expense Categories</h1>
          <p className="text-muted-foreground mt-2">
            Allocate your ${budgetData.expenseBudget.toLocaleString()} expense budget across categories
          </p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto space-y-6">
        <div className="grid gap-4">
          {budgetData.expenseCategories.map((category, index) => (
            <div key={index} className="flex items-center gap-3 p-4 border rounded-lg">
              <Input
                placeholder="Category name"
                value={category.name}
                onChange={(e) => updateExpenseCategory(index, 'name', e.target.value)}
                className="flex-1"
              />
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="number"
                  inputMode="decimal"
                  placeholder="0"
                  className="pl-10 w-32"
                  value={category.amount || ''}
                  onChange={(e) => updateExpenseCategory(index, 'amount', parseFloat(e.target.value) || 0)}
                />
              </div>
              {budgetData.expenseCategories.length > 1 && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeExpenseCategory(index)}
                  className="text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}
        </div>

        <Button
          variant="outline"
          onClick={addExpenseCategory}
          className="w-full"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Expense Category
        </Button>

        <Card className="bg-muted/50">
          <CardContent className="pt-6">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Total Allocated:</span>
              <span className="font-semibold">
                ${getTotalExpenseAllocated().toLocaleString()} / ${budgetData.expenseBudget.toLocaleString()}
              </span>
            </div>
            {getTotalExpenseAllocated() !== budgetData.expenseBudget && (
              <p className="text-xs text-muted-foreground mt-2">
                {getTotalExpenseAllocated() > budgetData.expenseBudget 
                  ? "⚠️ Total exceeds available budget. Your saving goal will be adjusted." 
                  : "💡 You can adjust amounts to use your full budget"}
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Progress Header */}
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <Button variant="ghost" onClick={handlePrevious}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              {currentStep === 1 ? 'Back' : 'Previous'}
            </Button>
            <Badge variant="secondary">
              Step {currentStep} of {totalSteps}
            </Badge>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 container mx-auto px-4 py-8">
        {currentStep === 1 && renderStep1()}
        {currentStep === 2 && renderStep2()}
        {currentStep === 3 && renderStep3()}
      </div>

      {/* Footer Navigation */}
      <div className="border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-end">
            <Button 
              onClick={handleNext}
              disabled={currentStep === 1 && budgetData.monthlyIncome <= 0}
              className="min-w-32"
            >
              {currentStep === totalSteps ? 'Complete Setup' : 'Next'}
              {currentStep < totalSteps && <ArrowRight className="h-4 w-4 ml-2" />}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}