'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { DollarSign, Target, ArrowRight, AlertTriangle, TrendingUp } from 'lucide-react';
import { useOnboarding } from '../OnboardingContext';

export function IncomeStep() {
  const { data, updateData, nextStep, canProceedToNext, getAvailableExpenseBudget } = useOnboarding();
  const [localIncome, setLocalIncome] = useState(data.monthlyIncome);
  const [localSavings, setLocalSavings] = useState(data.savingsGoal);

  const income = parseFloat(localIncome) || 0;
  const savings = parseFloat(localSavings) || 0;
  const expenseBudget = income - savings;
  const savingsPercentage = income > 0 ? (savings / income) * 100 : 0;

  const handleIncomeChange = (value: string) => {
    setLocalIncome(value);
    updateData({ monthlyIncome: value });
  };

  const handleSavingsChange = (value: string) => {
    setLocalSavings(value);
    updateData({ savingsGoal: value });
  };

  const handleNext = () => {
    if (canProceedToNext()) {
      nextStep();
    }
  };

  const isOverBudget = savings > income;
  const isHighSavingsRate = savingsPercentage > 30;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <DollarSign className="w-8 h-8 text-primary" />
        </div>
        <h2 className="text-2xl font-bold">Your Monthly Budget</h2>
        <p className="text-muted-foreground">
          Let&apos;s set up your income and savings goals
        </p>
      </div>

      {/* Income Input */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <DollarSign className="w-5 h-5" />
            Monthly Income
          </CardTitle>
          <CardDescription>
            Your total monthly income from all sources
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground text-lg">
              $
            </span>
            <Input
              type="number"
              inputMode="decimal"
              placeholder="5000"
              value={localIncome}
              onChange={(e) => handleIncomeChange(e.target.value)}
              className="h-12 text-lg pl-8"
              min="0"
              step="0.01"
            />
          </div>
        </CardContent>
      </Card>

      {/* Savings Goal Input */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Target className="w-5 h-5" />
            Monthly Savings Goal
          </CardTitle>
          <CardDescription>
            How much do you want to save each month?
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground text-lg">
              $
            </span>
            <Input
              type="number"
              inputMode="decimal"
              placeholder="1000"
              value={localSavings}
              onChange={(e) => handleSavingsChange(e.target.value)}
              className="h-12 text-lg pl-8"
              min="0"
              step="0.01"
            />
          </div>
        </CardContent>
      </Card>

      {/* Budget Breakdown */}
      {income > 0 && (
        <Card className="bg-muted/50">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Budget Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Monthly Income</span>
              <span className="font-semibold">${income.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Savings Goal</span>
              <span className="font-semibold text-green-600">
                ${savings.toLocaleString()}
                {savingsPercentage > 0 && (
                  <span className="text-xs ml-1">({savingsPercentage.toFixed(0)}%)</span>
                )}
              </span>
            </div>
            <hr className="my-2" />
            <div className="flex justify-between items-center">
              <span className="font-medium">Available for Expenses</span>
              <span className={`font-bold text-lg ${expenseBudget >= 0 ? 'text-primary' : 'text-destructive'}`}>
                ${expenseBudget.toLocaleString()}
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Warnings and Tips */}
      {isOverBudget && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Your savings goal (${savings.toLocaleString()}) exceeds your income. 
            Please adjust your targets.
          </AlertDescription>
        </Alert>
      )}

      {isHighSavingsRate && !isOverBudget && (
        <Alert>
          <Target className="h-4 w-4" />
          <AlertDescription>
            Great savings goal! You&apos;re planning to save {savingsPercentage.toFixed(0)}% of your income. 
            Make sure this is sustainable for your lifestyle.
          </AlertDescription>
        </Alert>
      )}

      {/* Continue Button */}
      <Button 
        onClick={handleNext}
        disabled={!canProceedToNext()}
        className="w-full h-12 text-lg font-semibold"
        size="lg"
      >
        Continue
        <ArrowRight className="w-5 h-5 ml-2" />
      </Button>

      {/* Tips */}
      <div className="text-center">
        <p className="text-sm text-muted-foreground">
          Recommended: Save 20% of your income for financial security
        </p>
      </div>
    </div>
  );
}