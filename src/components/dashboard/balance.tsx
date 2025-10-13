
"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/shared/utils";
import { Button } from "../ui/button";
import { ChevronDown, TrendingUp, TrendingDown } from "lucide-react";
import { type ChartConfig } from "../ui/chart";
import { DateFilter, type DateRange } from "./date-filter";

interface BalanceProps {
  totalSpending: number;
  totalIncome: number;
  netIncome: number;
  budget: number;
  savingsGoal?: number;
  aggregatedData: { category: string; amount: number }[];
  chartConfig: ChartConfig;
  dateRange: DateRange;
  onDateRangeChange: (value: DateRange) => void;
  displayDate: string;
}

export function Balance({
  totalSpending,
  totalIncome,
  netIncome,
  budget,
  savingsGoal = 0,
  aggregatedData,
  chartConfig,
  dateRange,
  onDateRangeChange,
  displayDate
}: BalanceProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [viewMode, setViewMode] = useState<'spent' | 'left' | 'reality'>(() => {
    // Load from localStorage or default to 'spent'
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('walletViewMode');
      if (saved === 'left' || saved === 'reality') return saved;
    }
    return 'spent';
  });

  // Save view mode to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('walletViewMode', viewMode);
    }
  }, [viewMode]);

  const spendingPercentage = budget > 0 ? (totalSpending / budget) * 100 : 0;
  const isOverBudget = spendingPercentage >= 100;
  const amountLeft = Math.max(0, budget - totalSpending); // Ensure non-negative
  // Reality calculation: Income minus expenses minus savings goal
  const realityAmount = totalIncome - totalSpending - savingsGoal;

  const handleAmountClick = () => {
    if (viewMode === 'spent') {
      setViewMode('left');
    } else if (viewMode === 'left') {
      setViewMode('reality');
    } else {
      setViewMode('spent');
    }
  };

  const getDisplayContent = () => {
    switch (viewMode) {
      case 'left':
        return {
          main: `$${amountLeft.toFixed(2)}`,
          suffix: amountLeft > 0 ? ' left in budget' : ' over budget'
        };
      case 'reality':
        return {
          main: `$${Math.abs(realityAmount).toFixed(2)}`,
          suffix: realityAmount >= 0 ? ' available' : ' deficit'
        };
      default: // 'spent'
        return {
          main: `$${totalSpending.toFixed(2)}`,
          suffix: `/$${budget.toFixed(2)}`
        };
    }
  };

  const displayContent = getDisplayContent();

  return (
    <Card className="rounded-[var(--radius)]">
      <CardHeader>
        <div className="flex justify-between items-start">
            <div>
                <CardTitle>Wallet</CardTitle>
                <CardDescription>Your spending overview</CardDescription>
            </div>
            <div className="flex flex-col items-end gap-1">
                <DateFilter value={dateRange} onValueChange={onDateRangeChange} />
                <span className="text-xs text-muted-foreground min-w-max">
                    {displayDate}
                </span>
            </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 pt-0">
        {/* Budget Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between items-end">
            <div className="text-left">
              <button 
                onClick={handleAmountClick}
                className="focus:outline-none hover:opacity-80 transition-opacity"
              >
                <div className="text-3xl font-bold">
                  <span className="text-3xl font-bold">{displayContent.main}</span>
                  <span className={`text-lg font-normal ${
                    viewMode === 'left' && amountLeft <= 0 ? 'text-red-500' :
                    viewMode === 'reality' && realityAmount < 0 ? 'text-red-500' :
                    'text-muted-foreground'
                  }`}>{displayContent.suffix}</span>
                </div>
              </button>
            </div>
            <span className="text-sm text-muted-foreground">{spendingPercentage.toFixed(0)}%</span>
          </div>
          <Progress
            value={isOverBudget ? 100 : spendingPercentage}
            className={cn("h-10", isOverBudget && "[&>div]:bg-destructive")}
          />
        </div>

        {/* Expandable Section */}
        {isExpanded && (
          <div className="pt-2 space-y-4 animate-in fade-in-0 border-t">
            {/* Income and Expense Summary */}
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-base text-muted-foreground">
                  <TrendingUp className="h-4 w-4 text-green-500" />
                  <span>Income</span>
                </div>
                <div className="text-2xl font-bold text-green-600">
                  +${totalIncome.toFixed(2)}
                </div>
              </div>
              <div className="space-y-2 text-right">
                <div className="flex items-center justify-end gap-2 text-base text-muted-foreground">
                  <span>Expenses</span>
                  <TrendingDown className="h-4 w-4 text-red-500" />
                </div>
                <div className="text-2xl font-bold text-red-600">
                  -${totalSpending.toFixed(2)}
                </div>
              </div>
            </div>

            {/* Category Breakdown */}
            <div className="space-y-2">
              <span className="text-sm font-medium text-muted-foreground">Expense Breakdown</span>
              {aggregatedData.map((item, index) => (
                <div key={index} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span
                      className="h-2 w-2 rounded-full"
                      style={{ backgroundColor: chartConfig[item.category]?.color }}
                    />
                    <span className="text-muted-foreground">{item.category}</span>
                  </div>
                  <span className="font-medium">
                    ${item.amount.toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
        
        <div className="flex justify-center pt-1">
          <Button
            variant="ghost"
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-full h-auto p-1 focus-visible:outline-none"
          >
            <ChevronDown className={cn("h-4 w-4 transition-transform", isExpanded && "rotate-180")} />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
