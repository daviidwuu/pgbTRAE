import { useState, useEffect, useMemo } from "react";
import { type DateRange } from "@/components/dashboard/date-filter";
import { format, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear } from 'date-fns';

export function useDashboardState() {
  const [dateRange, setDateRange] = useState<DateRange>('month');
  const [displayDate, setDisplayDate] = useState('');
  const [isClient, setIsClient] = useState(false);
  
  // Modal states
  const [isAddTransactionOpen, setAddTransactionOpen] = useState(false);
  const [isBudgetOpen, setBudgetOpen] = useState(false);
  const [isReportsOpen, setReportsOpen] = useState(false);
  const [isSettingsOpen, setSettingsOpen] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const dateFilterRange = useMemo(() => {
    const now = new Date();
    switch (dateRange) {
      case 'daily':
        return { start: startOfDay(now), end: endOfDay(now) };
      case 'week':
        return { start: startOfWeek(now), end: endOfWeek(now) };
      case 'month':
        return { start: startOfMonth(now), end: endOfMonth(now) };
      case 'yearly':
        return { start: startOfYear(now), end: endOfYear(now) };
      case 'all':
        return { start: new Date(0), end: new Date() };
      default:
        return { start: startOfMonth(now), end: endOfMonth(now) };
    }
  }, [dateRange]);

  useEffect(() => {
    const { start, end } = dateFilterRange;
    let displayText = '';
    
    switch (dateRange) {
      case 'daily':
        displayText = format(start, 'MMM d, yyyy');
        break;
      case 'week':
        displayText = `${format(start, 'MMM d')} - ${format(end, 'MMM d, yyyy')}`;
        break;
      case 'month':
        displayText = format(start, 'MMMM yyyy');
        break;
      case 'yearly':
        displayText = format(start, 'yyyy');
        break;
      case 'all':
        displayText = 'All time';
        break;
      default:
        displayText = format(start, 'MMMM yyyy');
    }
    
    setDisplayDate(displayText);
  }, [dateRange, dateFilterRange]);

  return {
    // Date state
    dateRange,
    setDateRange,
    displayDate,
    dateFilterRange,
    
    // Client state
    isClient,
    
    // Modal states
    isAddTransactionOpen,
    setAddTransactionOpen,
    isBudgetOpen,
    setBudgetOpen,
    isReportsOpen,
    setReportsOpen,
    isSettingsOpen,
    setSettingsOpen,
  };
}