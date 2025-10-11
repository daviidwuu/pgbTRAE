
"use client";

import { useState, useMemo } from "react";
import { type Transaction } from "@/shared/types";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { subDays, startOfDay, endOfDay, format, toDate } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { DateRange as ReactDateRange } from "react-day-picker";
import { DrawerHeader, DrawerTitle } from "../ui/drawer";

type ReportPeriod = "last7" | "last30" | "custom";

export interface ReportsPageProps {
  allTransactions: Transaction[];
  categories: string[];
}

interface ReportData {
  category: string;
  amount: number;
  count: number;
}

export function ReportsPage({ allTransactions, categories }: ReportsPageProps) {
  const [period, setPeriod] = useState<ReportPeriod>("last7");
  const [customDateRange, setCustomDateRange] = useState<ReactDateRange | undefined>({
    from: subDays(new Date(), 6),
    to: new Date(),
  });
  const [generatedReport, setGeneratedReport] = useState<ReportData[] | null>(null);

  const dateRange = useMemo(() => {
    const now = new Date();
    switch (period) {
      case "last7":
        return { start: startOfDay(subDays(now, 6)), end: endOfDay(now) };
      case "last30":
        return { start: startOfDay(subDays(now, 29)), end: endOfDay(now) };
      case "custom":
        return {
          start: customDateRange?.from ? startOfDay(customDateRange.from) : null,
          end: customDateRange?.to ? endOfDay(customDateRange.to) : null,
        };
    }
  }, [period, customDateRange]);

  const handleGenerateReport = () => {
    if (!dateRange.start || !dateRange.end) return;

    const filtered = allTransactions.filter(t => {
      if (!t.Date) return false;
      
      let transactionDate: Date;
      if (typeof t.Date === 'string') {
        transactionDate = new Date(t.Date);
      } else if (t.Date && typeof t.Date === 'object' && 'seconds' in t.Date) {
        transactionDate = toDate(t.Date.seconds * 1000);
      } else {
        return false;
      }
      
      return transactionDate >= dateRange.start! && transactionDate <= dateRange.end!;
    });

    const report = categories.map(category => {
      const categoryTransactions = filtered.filter(t => t.Category === category && t.Type === 'expense');
      return {
        category,
        amount: categoryTransactions.reduce((sum, t) => sum + t.Amount, 0),
        count: categoryTransactions.length,
      };
    }).filter(r => r.count > 0)
      .sort((a, b) => b.amount - a.amount);

    setGeneratedReport(report);
  };
  
  const totalSpent = useMemo(() => {
    return generatedReport?.reduce((sum, item) => sum + item.amount, 0) ?? 0;
  }, [generatedReport]);

  return (
    <>
      <DrawerHeader>
        <DrawerTitle>Generate Report</DrawerTitle>
      </DrawerHeader>
      <div className="h-[65vh] overflow-hidden">
        <ScrollArea className="h-full px-4 scrollbar-hide">
            <div className="space-y-6 pb-4">
                <div className="grid grid-cols-2 gap-4">
                <Select value={period} onValueChange={(value) => setPeriod(value as ReportPeriod)}>
                    <SelectTrigger>
                    <SelectValue placeholder="Select period" />
                    </SelectTrigger>
                    <SelectContent>
                    <SelectItem value="last7">Last 7 Days</SelectItem>
                    <SelectItem value="last30">Last 30 Days</SelectItem>
                    <SelectItem value="custom">Custom Range</SelectItem>
                    </SelectContent>
                </Select>

                {period === "custom" && (
                    <Popover>
                    <PopoverTrigger asChild>
                        <Button
                        variant={"outline"}
                        className="justify-start text-left font-normal"
                        >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {customDateRange?.from ? (
                            customDateRange.to ? (
                            <>
                                {format(customDateRange.from, "LLL dd, y")} -{" "}
                                {format(customDateRange.to, "LLL dd, y")}
                            </>
                            ) : (
                            format(customDateRange.from, "LLL dd, y")
                            )
                        ) : (
                            <span>Pick a date</span>
                        )}
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                        initialFocus
                        mode="range"
                        defaultMonth={customDateRange?.from}
                        selected={customDateRange}
                        onSelect={setCustomDateRange}
                        numberOfMonths={1}
                        />
                    </PopoverContent>
                    </Popover>
                )}
                </div>

                <Button onClick={handleGenerateReport} className="w-full">
                Generate Report
                </Button>

                {generatedReport && (
                <Card>
                    <CardHeader>
                    <CardTitle>Spending Report</CardTitle>
                    <CardDescription>
                        {dateRange.start && dateRange.end ? `${format(dateRange.start, "d MMM yyyy")} - ${format(dateRange.end, "d MMM yyyy")}` : ''}
                    </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="flex justify-between font-bold text-lg border-b pb-2 mb-2">
                                <span>Total Spent:</span>
                                <span>${totalSpent.toFixed(2)}</span>
                            </div>
                            {generatedReport.length > 0 ? (
                                generatedReport.map((item) => (
                                <div key={item.category} className="flex justify-between items-center">
                                    <div>
                                    <p className="font-medium">{item.category}</p>
                                    <p className="text-sm text-muted-foreground">{item.count} transaction{item.count > 1 ? 's' : ''}</p>
                                    </div>
                                    <p className="font-semibold">${item.amount.toFixed(2)}</p>
                                </div>
                                ))
                            ) : (
                                <p className="text-center text-muted-foreground py-8">No spending in this period.</p>
                            )}
                        </div>
                    </CardContent>
                </Card>
                )}
            </div>
        </ScrollArea>
      </div>
    </>
  );
}
