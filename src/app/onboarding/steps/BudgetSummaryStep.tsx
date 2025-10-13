'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Calendar, Clock, Target, ArrowRight, TrendingUp, Lightbulb } from 'lucide-react';
import { useOnboarding } from '../OnboardingContext';

export function BudgetSummaryStep() {
  const { data, nextStep, getDailyBudget, getWeeklyBudget, getMonthlyBudget } = useOnboarding();

  const monthlyIncome = parseFloat(data.monthlyIncome) || 0;
  const savingsGoal = parseFloat(data.savingsGoal) || 0;
  const dailyBudget = getDailyBudget();
  const weeklyBudget = getWeeklyBudget();
  const monthlyBudget = getMonthlyBudget();
  const savingsPercentage = monthlyIncome > 0 ? (savingsGoal / monthlyIncome) * 100 : 0;

  // Calculate days to reach savings goal (assuming they save the full amount each month)
  const daysToSaveGoal = savingsGoal > 0 ? Math.ceil((savingsGoal * 12) / (savingsGoal * 365)) : 0;

  const handleNext = () => {
    nextStep();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <TrendingUp className="w-8 h-8 text-primary" />
        </div>
        <h2 className="text-2xl font-bold">Your Budget Plan</h2>
        <p className="text-muted-foreground">
          Here&apos;s how your money will work for you
        </p>
      </div>

      {/* Budget Breakdown Cards */}
      <div className="space-y-4">
        {/* Daily Budget */}
        <Card>
          <CardContent className="flex items-center justify-between pt-6">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                <Clock className="w-6 h-6 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg">Daily Budget</CardTitle>
                <CardDescription>Available to spend each day</CardDescription>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-primary">
                ${dailyBudget.toFixed(0)}
              </div>
              <div className="text-sm text-muted-foreground">per day</div>
            </div>
          </CardContent>
        </Card>

        {/* Weekly Budget */}
        <Card>
          <CardContent className="flex items-center justify-between pt-6">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                <Calendar className="w-6 h-6 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg">Weekly Budget</CardTitle>
                <CardDescription>Available to spend each week</CardDescription>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-primary">
                ${weeklyBudget.toFixed(0)}
              </div>
              <div className="text-sm text-muted-foreground">per week</div>
            </div>
          </CardContent>
        </Card>

        {/* Monthly Budget */}
        <Card>
          <CardContent className="flex items-center justify-between pt-6">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                <Target className="w-6 h-6 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg">Monthly Budget</CardTitle>
                <CardDescription>Total monthly spending limit</CardDescription>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-primary">
                ${monthlyBudget.toFixed(0)}
              </div>
              <div className="text-sm text-muted-foreground">per month</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Savings Goal Card */}
      {savingsGoal > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Target className="w-5 h-5 text-green-600" />
              Savings Goal
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center">
              <span>Monthly Savings</span>
              <span className="font-bold text-green-600">${savingsGoal.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center">
              <span>Savings Rate</span>
              <span className="font-bold text-green-600">{savingsPercentage.toFixed(0)}%</span>
            </div>
            <div className="flex justify-between items-center">
              <span>Annual Savings</span>
              <span className="font-bold text-green-600">${(savingsGoal * 12).toLocaleString()}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tips for Achieving Savings */}
      <Alert>
        <Lightbulb className="h-4 w-4" />
        <AlertDescription>
          <strong>Tips to achieve your savings goal:</strong>
          <ul className="mt-2 space-y-1 text-sm">
            <li>• Track your daily spending to stay within ${dailyBudget.toFixed(0)}</li>
            <li>• Review your budget weekly and adjust if needed</li>
            <li>• Set up automatic transfers to your savings account</li>
            <li>• Use the 24-hour rule before making non-essential purchases</li>
            {savingsPercentage >= 20 && (
              <li>• Great job! You&apos;re saving {savingsPercentage.toFixed(0)}% - that&apos;s excellent!</li>
            )}
          </ul>
        </AlertDescription>
      </Alert>

      {/* Continue Button */}
      <Button 
        onClick={handleNext}
        className="w-full h-12 text-lg font-semibold"
        size="lg"
      >
        Continue
        <ArrowRight className="w-5 h-5 ml-2" />
      </Button>

      {/* Motivation */}
      <div className="text-center">
        <p className="text-sm text-muted-foreground">
          You&apos;re on track to save <span className="font-medium text-foreground">
            ${(savingsGoal * 12).toLocaleString()}
          </span> this year! 🎯
        </p>
      </div>
    </div>
  );
}