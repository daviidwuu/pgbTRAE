'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Smartphone, Share, Plus, ArrowRight, Info } from 'lucide-react';
import { useOnboarding } from '../OnboardingContext';

export function AddToHomeScreenStep() {
  const { nextStep } = useOnboarding();

  const handleNext = () => {
    nextStep();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <Smartphone className="w-8 h-8 text-primary" />
        </div>
        <h2 className="text-2xl font-bold">Add to Home Screen</h2>
        <p className="text-muted-foreground">
          Get quick access to PiggyBank like a native app
        </p>
      </div>

      {/* Benefits Card */}
      <Card className="bg-primary/5 border-primary/20">
        <CardContent className="pt-6">
          <h3 className="font-semibold mb-3">Why add to Home Screen?</h3>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
              Launch instantly like a native app
            </li>
            <li className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
              Works offline for viewing your budget
            </li>
            <li className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
              No browser bars for a cleaner experience
            </li>
            <li className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
              Perfect for iOS Shortcuts integration
            </li>
          </ul>
        </CardContent>
      </Card>

      {/* Step-by-Step Instructions */}
      <div className="space-y-4">
        <h3 className="font-semibold text-lg">Follow these steps:</h3>
        
        {/* Step 1 */}
        <Card>
          <CardContent className="flex items-start space-x-4 pt-6">
            <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-sm font-bold text-primary">1</span>
            </div>
            <div className="flex-1">
              <h4 className="font-semibold mb-2 flex items-center gap-2">
                <Share className="w-4 h-4" />
                Tap the Share Button
              </h4>
              <p className="text-sm text-muted-foreground">
                Look for the share icon at the bottom of your Safari browser. 
                It looks like a square with an arrow pointing up.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Step 2 */}
        <Card>
          <CardContent className="flex items-start space-x-4 pt-6">
            <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-sm font-bold text-primary">2</span>
            </div>
            <div className="flex-1">
              <h4 className="font-semibold mb-2 flex items-center gap-2">
                <Plus className="w-4 h-4" />
                Select &quot;Add to Home Screen&quot;
              </h4>
              <p className="text-sm text-muted-foreground">
                Scroll down in the share menu and tap &quot;Add to Home Screen&quot;. 
                You&apos;ll see the PiggyBank icon and name.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Step 3 */}
        <Card>
          <CardContent className="flex items-start space-x-4 pt-6">
            <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-sm font-bold text-primary">3</span>
            </div>
            <div className="flex-1">
              <h4 className="font-semibold mb-2">Tap &quot;Add&quot;</h4>
              <p className="text-sm text-muted-foreground">
                Confirm by tapping &quot;Add&quot; in the top-right corner. 
                PiggyBank will now appear on your home screen!
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Troubleshooting */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          <strong>Don&apos;t see the share button?</strong>
          <br />
          Make sure you&apos;re using Safari browser on iOS. The &quot;Add to Home Screen&quot; 
          feature works best in Safari and may not be available in other browsers.
        </AlertDescription>
      </Alert>

      {/* Continue Button */}
      <Button 
        onClick={handleNext}
        className="w-full h-12 text-lg font-semibold"
        size="lg"
      >
        I&apos;ve Added It
        <ArrowRight className="w-5 h-5 ml-2" />
      </Button>

      {/* Skip Option */}
      <div className="text-center">
        <Button 
          variant="ghost" 
          onClick={handleNext}
          className="text-muted-foreground"
        >
          Skip for now
        </Button>
      </div>
    </div>
  );
}