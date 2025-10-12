'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Wallet, TrendingUp, Target, Smartphone } from 'lucide-react';
import { useOnboarding } from '../OnboardingContext';

export function WelcomeStep() {
  const { nextStep } = useOnboarding();

  return (
    <div className="space-y-6">
      {/* App Icon and Title */}
      <div className="text-center space-y-4">
        <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
          <Wallet className="w-10 h-10 text-primary" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-primary mb-2">PiggyBank</h1>
          <p className="text-lg text-muted-foreground">
            Your smart budget companion that helps you save money effortlessly.
          </p>
        </div>
      </div>

      {/* Feature Cards */}
      <div className="space-y-4">
        <Card className="border-primary/20">
          <CardContent className="flex items-center space-x-4 pt-6">
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-primary" />
            </div>
            <div>
              <CardTitle className="text-base">Smart Budgeting</CardTitle>
              <CardDescription>
                Track expenses and manage your money with intelligent insights
              </CardDescription>
            </div>
          </CardContent>
        </Card>

        <Card className="border-primary/20">
          <CardContent className="flex items-center space-x-4 pt-6">
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
              <Target className="w-6 h-6 text-primary" />
            </div>
            <div>
              <CardTitle className="text-base">Savings Goals</CardTitle>
              <CardDescription>
                Set and achieve your financial goals with personalized plans
              </CardDescription>
            </div>
          </CardContent>
        </Card>

        <Card className="border-primary/20">
          <CardContent className="flex items-center space-x-4 pt-6">
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
              <Smartphone className="w-6 h-6 text-primary" />
            </div>
            <div>
              <CardTitle className="text-base">iOS Shortcuts</CardTitle>
              <CardDescription>
                Quick expense tracking with Siri and iOS Shortcuts integration
              </CardDescription>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Get Started Button */}
      <div className="pt-4">
        <Button 
          onClick={nextStep}
          className="w-full h-12 text-lg font-semibold"
          size="lg"
        >
          Get Started
        </Button>
      </div>

      {/* Setup Time Indicator */}
      <div className="text-center">
        <p className="text-sm text-muted-foreground">
          Setup takes less than 2 minutes
        </p>
      </div>
    </div>
  );
}