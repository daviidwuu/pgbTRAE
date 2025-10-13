'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { User, ArrowRight } from 'lucide-react';
import { useOnboarding } from '../OnboardingContext';

export function UsernameStep() {
  const { data, updateData, nextStep, canProceedToNext } = useOnboarding();
  const [localName, setLocalName] = useState(data.userName);

  const handleNameChange = (value: string) => {
    setLocalName(value);
    updateData({ userName: value });
  };

  const handleNext = () => {
    if (canProceedToNext()) {
      nextStep();
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && canProceedToNext()) {
      handleNext();
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <User className="w-8 h-8 text-primary" />
        </div>
        <h2 className="text-2xl font-bold">What should we call you?</h2>
        <p className="text-muted-foreground">
          Enter your name to personalize your experience
        </p>
      </div>

      {/* Input Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Your Name</CardTitle>
          <CardDescription>
            This will be displayed throughout the app
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="username">Name</Label>
            <Input
              id="username"
              type="text"
              placeholder="Enter your name"
              value={localName}
              onChange={(e) => handleNameChange(e.target.value)}
              onKeyPress={handleKeyPress}
              className="h-12 text-lg"
              autoComplete="given-name"
              autoFocus
              maxLength={50}
            />
          </div>
          
          {localName.trim().length > 0 && (
            <div className="text-sm text-muted-foreground">
              We&apos;ll call you <span className="font-medium text-foreground">{localName.trim()}</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Continue Button */}
      <Button 
        onClick={handleNext}
        disabled={!canProceedToNext()}
        className="w-full h-12 text-lg font-semibold"
        size="lg"
      >
        Continue
        <ArrowRight className="w-5 h-5 ml-2" />
      </Button>

      {/* Tips */}
      <div className="text-center">
        <p className="text-sm text-muted-foreground">
          You can change this later in settings
        </p>
      </div>
    </div>
  );
}