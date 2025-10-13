"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Calculator, AlertCircle } from "lucide-react";
import { type WizardData } from "./setup-wizard";

interface BudgetSummaryStepProps {
  data: WizardData;
  updateData: (updates: Partial<WizardData>) => void;
  onNext: () => void;
  onComplete?: () => void;
  isLoading?: boolean;
}

export function BudgetSummaryStep({ data, updateData, onNext }: BudgetSummaryStepProps) {
  const [budgets, setBudgets] = useState<Record<string, number>>(data.budgets || {});

  const updateBudget = (category: string, amount: number) => {
    const newBudgets = { ...budgets, [category]: amount };
    setBudgets(newBudgets);
    updateData({ budgets: newBudgets });
  };

  const totalBudget = Object.values(budgets).reduce((sum, amount) => sum + amount, 0);
  const availableAfterSavings = data.income - data.savingsGoal;
  const remainingBudget = availableAfterSavings - totalBudget;

  const isOverBudget = totalBudget > availableAfterSavings;

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <div className="flex justify-center mb-4">
          <div className="p-3 bg-primary/10 rounded-full">
            <Calculator className="h-8 w-8 text-primary" />
          </div>
        </div>
        <h2 className="text-2xl font-bold">Set Your Budgets</h2>
        <p className="text-muted-foreground">
          Allocate your monthly spending across categories. You can skip this and set budgets later.
        </p>
      </div>

      {/* Budget Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Budget Overview</CardTitle>
          <CardDescription>
            Monthly income: ${data.income.toLocaleString()} | 
            Savings goal: ${data.savingsGoal.toLocaleString()} | 
            Available for expenses: ${availableAfterSavings.toLocaleString()}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {data.expenseCategories.map((category) => (
              <div key={category} className="flex items-center justify-between">
                <Label htmlFor={category} className="flex-1">
                  {category}
                </Label>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">$</span>
                  <Input
                    id={category}
                    type="number"
                    placeholder="0"
                    value={budgets[category] || ""}
                    onChange={(e) => updateBudget(category, parseFloat(e.target.value) || 0)}
                    className="w-24 text-right"
                  />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Budget Status */}
      <Card className={isOverBudget ? "border-destructive" : remainingBudget < 0 ? "border-yellow-500" : ""}>
        <CardContent className="pt-6">
          <div className="flex items-center gap-2 mb-2">
            {isOverBudget && <AlertCircle className="h-4 w-4 text-destructive" />}
            <span className="font-medium">
              Total Budget: ${totalBudget.toLocaleString()}
            </span>
          </div>
          <div className={`text-sm ${
            isOverBudget 
              ? "text-destructive" 
              : remainingBudget > 0 
                ? "text-green-600" 
                : "text-muted-foreground"
          }`}>
            {isOverBudget 
              ? `Over budget by $${Math.abs(remainingBudget).toLocaleString()}`
              : remainingBudget > 0 
                ? `$${remainingBudget.toLocaleString()} remaining`
                : "Budget fully allocated"
            }
          </div>
        </CardContent>
      </Card>

      <div className="space-y-2">
        <Button onClick={onNext} className="w-full">
          Continue
        </Button>
        <p className="text-xs text-center text-muted-foreground">
            Don&apos;t worry, you can adjust these budgets anytime in your dashboard.
          </p>
      </div>
    </div>
  );
}