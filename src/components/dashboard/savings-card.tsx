'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, PiggyBank, Calendar, DollarSign } from 'lucide-react';
import { format } from 'date-fns';
import { type UseSavingsResult } from '@/features/savings/hooks/useSavings';

interface SavingsCardProps {
  savingsData: UseSavingsResult;
}

export function SavingsCard({ savingsData }: SavingsCardProps) {
  const {
    totalSavings,
    averageDailySavings,
    daysTracked,
    todaysSavings,
    isLoading,
    hasData
  } = savingsData;

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PiggyBank className="w-5 h-5" />
            Savings with PiggyBank PWA
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="h-8 bg-muted rounded animate-pulse" />
            <div className="grid grid-cols-2 gap-4">
              <div className="h-16 bg-muted rounded animate-pulse" />
              <div className="h-16 bg-muted rounded animate-pulse" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!hasData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PiggyBank className="w-5 h-5" />
            Savings with PiggyBank PWA
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
              <PiggyBank className="w-8 h-8 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground mb-2">No savings data available</p>
            <p className="text-sm text-muted-foreground">
              Add transactions and set up budgets to start tracking your savings!
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const isSavingMoney = totalSavings >= 0;
  const todayIsSaving = todaysSavings ? todaysSavings.dailySavings >= 0 : true;

  return (
    <Card className="bg-gradient-to-br from-blue-50 to-purple-50 border-blue-200">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <PiggyBank className="w-5 h-5 text-blue-600" />
            <span className="text-blue-900">Savings with PiggyBank PWA</span>
          </div>
          <Badge variant={isSavingMoney ? "default" : "destructive"} className="text-xs">
            {daysTracked} days tracked
          </Badge>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Total Savings */}
        <div className="text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            {isSavingMoney ? (
              <TrendingUp className="w-5 h-5 text-green-600" />
            ) : (
              <TrendingDown className="w-5 h-5 text-red-600" />
            )}
            <span className="text-sm font-medium text-muted-foreground">
              Total Savings
            </span>
          </div>
          <div className={`text-3xl font-bold ${
            isSavingMoney ? 'text-green-600' : 'text-red-600'
          }`}>
            {isSavingMoney ? '+' : ''}${totalSavings.toFixed(2)}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Since {format(new Date(Date.now() - (daysTracked - 1) * 24 * 60 * 60 * 1000), 'MMM d, yyyy')}
          </p>
        </div>

        {/* Daily Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-3 bg-white/50 rounded-lg">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Calendar className="w-4 h-4 text-blue-600" />
              <span className="text-xs font-medium text-muted-foreground">
                Daily Average
              </span>
            </div>
            <div className={`text-lg font-semibold ${
              averageDailySavings >= 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              {averageDailySavings >= 0 ? '+' : ''}${averageDailySavings.toFixed(2)}
            </div>
          </div>
          
          <div className="text-center p-3 bg-white/50 rounded-lg">
            <div className="flex items-center justify-center gap-1 mb-1">
              <DollarSign className="w-4 h-4 text-blue-600" />
              <span className="text-xs font-medium text-muted-foreground">
                Today
              </span>
            </div>
            <div className={`text-lg font-semibold ${
              todayIsSaving ? 'text-green-600' : 'text-red-600'
            }`}>
              {todaysSavings ? (
                <>
                  {todaysSavings.dailySavings >= 0 ? '+' : ''}${todaysSavings.dailySavings.toFixed(2)}
                </>
              ) : (
                '$0.00'
              )}
            </div>
          </div>
        </div>

        {/* Today's Breakdown */}
        {todaysSavings && (
          <div className="text-center p-3 bg-white/30 rounded-lg">
            <p className="text-xs font-medium text-muted-foreground mb-2">Today&apos;s Breakdown</p>
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div>
                <p className="text-muted-foreground">Budget</p>
                <p className="font-semibold text-blue-600">
                  ${todaysSavings.budgetPerDay.toFixed(2)}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Spent</p>
                <p className="font-semibold text-red-600">
                  -${todaysSavings.actualExpenses.toFixed(2)}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Income</p>
                <p className="font-semibold text-green-600">
                  +${todaysSavings.actualIncome.toFixed(2)}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Motivational Message */}
        <div className="text-center">
          <p className="text-xs text-blue-700 font-medium">
            {isSavingMoney 
              ? "🎉 Great job! You&apos;re saving money with PiggyBank PWA!"
              : "💪 Keep tracking to improve your savings!"
            }
          </p>
        </div>
      </CardContent>
    </Card>
  );
}