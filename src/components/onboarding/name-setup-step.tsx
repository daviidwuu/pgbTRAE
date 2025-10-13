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
import { User } from "lucide-react";
import { type WizardData } from "./setup-wizard";

const formSchema = z.object({
  name: z.string().min(1, { message: "Please enter your name." }),
});

interface NameSetupStepProps {
  data: WizardData;
  updateData: (updates: Partial<WizardData>) => void;
  onNext: () => void;
  onComplete?: () => void;
  isLoading?: boolean;
}

export function NameSetupStep({ data, updateData, onNext }: NameSetupStepProps) {
  const [isValid, setIsValid] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: data.name || "",
    },
  });

  const watchedName = form.watch("name");

  useEffect(() => {
    setIsValid(watchedName.trim().length > 0);
    updateData({ name: watchedName });
  }, [watchedName, updateData]);

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
            <User className="h-8 w-8 text-primary" />
          </div>
        </div>
        <h2 className="text-2xl font-bold">What&apos;s your name?</h2>
        <p className="text-muted-foreground">
          We&apos;ll use this to personalize your experience.
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleNext)} className="space-y-6">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Your Name</FormLabel>
                <FormControl>
                  <Input
                    placeholder="e.g., David"
                    {...field}
                    className="text-center text-lg"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

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