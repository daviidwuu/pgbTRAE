
"use client";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { CalendarIcon } from "lucide-react";

export type DateRange = 'daily' | 'week' | 'month' | 'yearly' | 'all';

interface DateFilterProps {
  value: DateRange;
  onValueChange: (value: DateRange) => void;
}

const options: { label: string; value: DateRange }[] = [
  { label: "Daily", value: "daily" },
  { label: "Weekly", value: "week" },
  { label: "Monthly", value: "month" },
  { label: "Yearly", value: "yearly" },
  { label: 'All Time', value: 'all'},
];

export function DateFilter({ value, onValueChange }: DateFilterProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8 focus-visible:outline-none rounded-full bg-primary/10" aria-label="Filter by date">
          <CalendarIcon className="h-4 w-4 text-primary" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="rounded-lg">
        <DropdownMenuRadioGroup value={value} onValueChange={(value) => onValueChange(value as DateRange)}>
          {options.map((option) => (
            <DropdownMenuRadioItem
              key={option.value}
              value={option.value}
            >
              {option.label}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
