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
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <div className="flex justify-center mb-4">
          <div className="p-3 bg-primary/10 rounded-full">
            <DollarSign className="h-8 w-8 text-primary" />
          </div>
        </div>
        <h2 className="text-2xl font-bold">Set up your finances</h2>
        <p className="text-muted-foreground">
          Tell us about your monthly income and savings goals.
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleNext)} className="space-y-6">
          <FormField
            control={form.control}
            name="income"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Monthly Income
                </FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder="e.g., 5000"
                    {...field}
                    onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                    className="text-lg"
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
                <FormLabel className="flex items-center gap-2">
                  <Target className="h-4 w-4" />
                  Monthly Savings Goal (Optional)
                </FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder="e.g., 1000"
                    {...field}
                    onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                    className="text-lg"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {watchedIncome > 0 && watchedSavingsGoal > 0 && (
            <div className="p-4 bg-muted/50 rounded-lg">
              <p className="text-sm text-muted-foreground">
                You&apos;ll have <span className="font-semibold text-foreground">
                  ${(watchedIncome - watchedSavingsGoal).toLocaleString()}
                </span> available for expenses after savings.
              </p>
            </div>
          )}

          <Button 
            type="submit" 
            className="w-full" 
            disabled={!isValid}
          >
            Continue
          </Button>
        </form>
      </Form>
    </div>
  );
}