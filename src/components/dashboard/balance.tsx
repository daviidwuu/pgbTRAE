
"use client";

import { useState } from "react";
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
import { ChevronDown } from "lucide-react";
import { type ChartConfig } from "../ui/chart";
import { DateFilter, type DateRange } from "./date-filter";

interface BalanceProps {
  totalSpending: number;
  budget: number;
  aggregatedData: { category: string; amount: number }[];
  chartConfig: ChartConfig;
  dateRange: DateRange;
  onDateRangeChange: (value: DateRange) => void;
  displayDate: string;
}

export function Balance({
  totalSpending,
  budget,
  aggregatedData,
  chartConfig,
  dateRange,
  onDateRangeChange,
  displayDate
}: BalanceProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const spendingPercentage = budget > 0 ? (totalSpending / budget) * 100 : 0;
  const isOverBudget = spendingPercentage >= 100;

  return (
    <Card className="rounded-[var(--radius)]">
      <CardHeader>
        <div className="flex justify-between items-start">
            <div>
                <CardTitle>Balance</CardTitle>
                <CardDescription>Spending vs. budget.</CardDescription>
            </div>
            <div className="flex flex-col items-end gap-1">
                <DateFilter value={dateRange} onValueChange={onDateRangeChange} />
                <span className="text-xs text-muted-foreground min-w-max">
                    {displayDate}
                </span>
            </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-2 pt-0">
        <div className="flex justify-between items-baseline">
          <div className="text-2xl font-bold text-foreground">
            ${totalSpending.toFixed(2)}
          </div>
          <div className="text-base text-muted-foreground">
            of ${budget.toFixed(2)}
          </div>
        </div>
        <Progress
          value={isOverBudget ? 100 : spendingPercentage}
          className={cn("h-10", isOverBudget && "[&>div]:bg-destructive")}
        />
        {isExpanded && (
          <div className="pt-2 space-y-2 animate-in fade-in-0">
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
