"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, Sparkles, TrendingUp, Target } from "lucide-react";
import { type WizardData } from "./setup-wizard";

interface CompletionStepProps {
  data: WizardData;
  updateData: (updates: Partial<WizardData>) => void;
  onNext: () => void;
  onComplete?: () => void;
  isLoading?: boolean;
}

export function CompletionStep({ data, onNext }: CompletionStepProps) {
  const totalBudget = Object.values(data.budgets).reduce((sum: number, amount: number) => sum + amount, 0);

  return (
    <div className="space-y-6">
      <div className="text-center space-y-4">
        <div className="flex justify-center mb-4">
          <div className="p-4 bg-green-100 rounded-full">
            <CheckCircle className="h-12 w-12 text-green-600" />
          </div>
        </div>
        <h2 className="text-3xl font-bold text-green-600">Congratulations!</h2>
        <p className="text-lg text-muted-foreground">
          Your financial profile is all set up. Here&apos;s what we&apos;ve configured for you:
        </p>
      </div>

      <div className="grid gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Sparkles className="h-5 w-5 text-primary" />
              Welcome, {data.name}!
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Your personalized finance tracker is ready to help you manage your money.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <TrendingUp className="h-5 w-5 text-primary" />
              Monthly Income & Savings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Income:</span>
                <span className="font-medium">${data.income.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Savings Goal:</span>
                <span className="font-medium">${data.savingsGoal.toLocaleString()}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Target className="h-5 w-5 text-primary" />
              Categories & Budgets
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Income Categories:</span>
                <span className="font-medium">{data.incomeCategories.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Expense Categories:</span>
                <span className="font-medium">{data.expenseCategories.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Total Budget:</span>
                <span className="font-medium">${totalBudget.toLocaleString()}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="text-center space-y-4">
        <p className="text-sm text-muted-foreground">
          Next, we&apos;ll show you how to add the Apple Shortcut for quick transaction logging.
        </p>
        <Button onClick={onNext} size="lg" className="w-full">
          Continue to Setup
        </Button>
      </div>
    </div>
  );
}