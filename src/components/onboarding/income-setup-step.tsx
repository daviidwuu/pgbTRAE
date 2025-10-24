"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { DollarSign, Target } from "lucide-react";
import { type WizardData } from "./setup-wizard";

const formSchema = z.object({
  income: z.number().min(0, { message: "Income must be a positive number." }),
  savingsGoal: z.number().min(0, { message: "Savings goal must be a positive number." }),
});

interface IncomeSetupStepProps {
  data: WizardData;
  updateData: (updates: Partial<WizardData>) => void;
  onNext: () => void;
  onComplete?: () => void;
  isLoading?: boolean;
}

export function IncomeSetupStep({ data, updateData, onNext }: IncomeSetupStepProps) {
  const [isValid, setIsValid] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      income: data.income || 0,
      savingsGoal: data.savingsGoal || 0,
    },
  });

  const watchedIncome = form.watch("income");
  const watchedSavingsGoal = form.watch("savingsGoal");

  useEffect(() => {
    setIsValid(watchedIncome > 0);
    updateData({ 
      income: watchedIncome, 
      savingsGoal: watchedSavingsGoal 
    });
  }, [watchedIncome, watchedSavingsGoal, updateData]);

  const handleNext = () => {
    if (isValid) {
      onNext();
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header - Compact */}
      <div className="text-center space-y-3 mb-6">
        <div className="flex justify-center">
          <div className="p-2 bg-primary/10 rounded-full">
            <DollarSign className="h-6 w-6 text-primary" />
          </div>
        </div>
        <div>
          <h2 className="text-xl font-bold">Set up your finances</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Monthly income and savings goals
          </p>
        </div>
      </div>

      {/* Form - Flexible content */}
      <div className="flex-1">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleNext)} className="space-y-5">
            <FormField
              control={form.control}
              name="income"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2 text-sm">
                    <DollarSign className="h-3 w-3" />
                    Monthly Income
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="0.00"
                      {...field}
                      value={field.value === 0 ? "" : field.value}
                      onChange={(e) => {
                        const value = e.target.value;
                        field.onChange(value === "" ? 0 : parseFloat(value) || 0);
                      }}
                      className="text-center font-medium placeholder:font-medium placeholder:text-muted-foreground h-12 text-lg"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="savingsGoal"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2 text-sm">
                    <Target className="h-3 w-3" />
                    Monthly Savings Goal (Optional)
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="0.00"
                      {...field}
                      value={field.value === 0 ? "" : field.value}
                      onChange={(e) => {
                        const value = e.target.value;
                        field.onChange(value === "" ? 0 : parseFloat(value) || 0);
                      }}
                      className="text-center font-medium placeholder:font-medium placeholder:text-muted-foreground h-12 text-lg"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button 
              type="submit" 
              className="w-full h-12 mt-6" 
              disabled={!isValid}
            >
              Continue
            </Button>
          </form>
        </Form>
      </div>
    </div>
  );
}