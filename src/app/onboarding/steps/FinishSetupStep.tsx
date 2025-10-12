'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, Sparkles, TrendingUp, Target, Zap } from 'lucide-react';
import { useOnboarding } from '../OnboardingContext';

export function FinishSetupStep() {
  const { data } = useOnboarding();

  const monthlyIncome = parseFloat(data.monthlyIncome) || 0;
  const savingsGoal = parseFloat(data.savingsGoal) || 0;
  const annualSavings = savingsGoal * 12;

  // This will trigger the final save and redirect to dashboard
  const handleFinish = () => {
    // The parent component will handle the actual finish logic
    // This is just to trigger the completion
  };

  return (
    <div className="space-y-6">
      {/* Celebration Header */}
      <div className="text-center space-y-4">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Sparkles className="w-10 h-10 text-green-600" />
        </div>
        <h1 className="text-3xl font-bold text-green-800">
          🎉 Congratulations, {data.userName}!
        </h1>
        <p className="text-lg text-muted-foreground">
          Your PiggyBank account is ready to help you achieve your financial goals
        </p>
      </div>

      {/* Achievement Cards */}
      <div className="space-y-4">
        <Card className="border-green-200">
          <CardContent className="flex items-center space-x-4 pt-6">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <Target className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <CardTitle className="text-lg">Savings Goal Set</CardTitle>
              <CardDescription>
                You&apos;re planning to save ${annualSavings.toLocaleString()} this year!
              </CardDescription>
            </div>
          </CardContent>
        </Card>

        <Card className="border-green-200">
          <CardContent className="flex items-center space-x-4 pt-6">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <CardTitle className="text-lg">Budget Organized</CardTitle>
              <CardDescription>
                Your ${monthlyIncome.toLocaleString()} monthly income is perfectly allocated
              </CardDescription>
            </div>
          </CardContent>
        </Card>

        <Card className="border-green-200">
          <CardContent className="flex items-center space-x-4 pt-6">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <Zap className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <CardTitle className="text-lg">iOS Shortcuts Ready</CardTitle>
              <CardDescription>
                Track expenses instantly with &quot;Hey Siri, add expense&quot;
              </CardDescription>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* What's Next */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            What&apos;s Next?
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-3 text-sm">
            <li className="flex items-start gap-3">
              <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
              <div>
                <strong>Start tracking expenses:</strong> Add your first transaction to see your budget in action
              </div>
            </li>
            <li className="flex items-start gap-3">
              <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
              <div>
                <strong>Try the iOS Shortcut:</strong> Say &quot;Hey Siri, add expense&quot; to log purchases hands-free
              </div>
            </li>
            <li className="flex items-start gap-3">
              <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
              <div>
                <strong>Check your reports:</strong> View spending insights and track your progress toward goals
              </div>
            </li>
            <li className="flex items-start gap-3">
              <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
              <div>
                <strong>Adjust as needed:</strong> Fine-tune your budget categories and amounts anytime
              </div>
            </li>
          </ul>
        </CardContent>
      </Card>

      {/* Success Message */}
      <Card className="border-green-200">
        <CardContent className="pt-6 text-center">
          <h3 className="text-xl font-bold mb-2">
            You&apos;re All Set! 🚀
          </h3>
          <p className="text-muted-foreground mb-4">
            Welcome to your journey toward better financial health. 
            PiggyBank is here to support you every step of the way.
          </p>
          <div className="text-sm text-muted-foreground">
            Remember: Small, consistent steps lead to big financial wins! 💪
          </div>
        </CardContent>
      </Card>

      {/* Final Encouragement */}
      <div className="text-center">
        <p className="text-sm text-muted-foreground">
          Your future self will thank you for taking this step today! 🌟
        </p>
      </div>

      {/* Continue to PiggyBank Button */}
      <Button 
        onClick={() => {
          // Navigate to dashboard - this will be handled by the parent component
          window.location.href = '/';
        }}
        className="w-full h-14 text-xl font-bold bg-green-600 hover:bg-green-700 text-white"
        size="lg"
      >
        <Sparkles className="w-6 h-6 mr-2" />
        Continue to PiggyBank
      </Button>
    </div>
  );
}