"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles, Wallet, TrendingUp, Shield } from "lucide-react";
import { type WizardData } from "./setup-wizard";

interface WelcomeStepProps {
  data: WizardData;
  updateData: (updates: Partial<WizardData>) => void;
  onNext: () => void;
  onComplete?: () => void;
  isLoading?: boolean;
}

export function WelcomeStep({ onNext }: WelcomeStepProps) {
  return (
    <div className="text-center space-y-6">
      <div className="space-y-2">
        <div className="flex justify-center mb-4">
          <div className="p-3 bg-primary/10 rounded-full">
            <Sparkles className="h-8 w-8 text-primary" />
          </div>
        </div>
        <h1 className="text-3xl font-bold text-primary">Welcome to piggybank</h1>
        <p className="text-lg text-muted-foreground max-w-md mx-auto">
          Let&apos;s set up your personal finance tracker in just a few simple steps.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 my-8">
        <Card className="border-muted">
          <CardHeader className="pb-3">
            <div className="flex justify-center mb-2">
              <Wallet className="h-6 w-6 text-primary" />
            </div>
            <CardTitle className="text-sm">Track Expenses</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <CardDescription className="text-xs">
              Monitor your spending across different categories
            </CardDescription>
          </CardContent>
        </Card>

        <Card className="border-muted">
          <CardHeader className="pb-3">
            <div className="flex justify-center mb-2">
              <TrendingUp className="h-6 w-6 text-primary" />
            </div>
            <CardTitle className="text-sm">Set Budgets</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <CardDescription className="text-xs">
              Create budgets and track your financial goals
            </CardDescription>
          </CardContent>
        </Card>

        <Card className="border-muted">
          <CardHeader className="pb-3">
            <div className="flex justify-center mb-2">
              <Shield className="h-6 w-6 text-primary" />
            </div>
            <CardTitle className="text-sm">Stay Secure</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <CardDescription className="text-xs">
              Your data is encrypted and stored securely
            </CardDescription>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">
          This setup will take about 3-5 minutes to complete.
        </p>
        <Button onClick={onNext} size="lg" className="w-full md:w-auto">
          Get Started
        </Button>
      </div>
    </div>
  );
}