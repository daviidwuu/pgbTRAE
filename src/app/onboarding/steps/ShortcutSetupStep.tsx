'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Zap, Copy, ExternalLink, ArrowRight, CheckCircle, Info } from 'lucide-react';
import { useOnboarding } from '../OnboardingContext';
import { useUser } from '@/firebase';
import { useToast } from '@/shared/hooks';

export function ShortcutSetupStep() {
  const { nextStep } = useOnboarding();
  const { user } = useUser();
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  const userId = user?.uid || 'user-id-not-found';
  const shortcutUrl = 'https://www.icloud.com/shortcuts/74a972a014cc4469b2fe0fa5787508a3';

  const handleCopyUserId = async () => {
    try {
      await navigator.clipboard.writeText(userId);
      setCopied(true);
      toast({
        title: "Copied!",
        description: "Your User ID has been copied to clipboard.",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast({
        title: "Copy failed",
        description: "Please manually copy your User ID.",
        variant: "destructive",
      });
    }
  };

  const handleOpenShortcut = () => {
    window.open(shortcutUrl, '_blank');
  };

  const handleNext = () => {
    nextStep();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <Zap className="w-8 h-8 text-primary" />
        </div>
        <h2 className="text-2xl font-bold">iOS Shortcuts Setup</h2>
        <p className="text-muted-foreground">
          Add expenses instantly with Siri voice commands
        </p>
      </div>

      {/* Benefits Card */}
      <Card className="bg-primary/5 border-primary/20">
        <CardContent className="pt-6">
          <h3 className="font-semibold mb-3">What you&apos;ll be able to do:</h3>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
              Say &quot;Hey Siri, add expense&quot; to log purchases instantly
            </li>
            <li className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
              Track spending without opening the app
            </li>
            <li className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
              Perfect for quick grocery or coffee purchases
            </li>
            <li className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
              Works from your lock screen or Apple Watch
            </li>
          </ul>
        </CardContent>
      </Card>

      {/* User ID Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Your Unique User ID</CardTitle>
          <CardDescription>
            Copy this ID to connect the iOS Shortcut to your account
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="userId">User ID</Label>
            <div className="flex gap-2">
              <Input
                id="userId"
                value={userId}
                readOnly
                className="font-mono text-sm"
              />
              <Button
                onClick={handleCopyUserId}
                variant="outline"
                size="icon"
                className="flex-shrink-0"
              >
                {copied ? (
                  <CheckCircle className="w-4 h-4 text-green-600" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>
          
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              Keep this ID safe! You&apos;ll need it to set up the iOS Shortcut. 
              You can always find it later in your profile settings.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Shortcut Installation */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Install iOS Shortcut</CardTitle>
          <CardDescription>
            Tap the button below to add the PiggyBank shortcut to your device
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            onClick={handleOpenShortcut}
            className="w-full h-12 text-lg font-semibold"
            size="lg"
          >
            <ExternalLink className="w-5 h-5 mr-2" />
            Get iOS Shortcut
          </Button>
          
          <Alert>
            <Zap className="h-4 w-4" />
            <AlertDescription>
              <strong>Setup Instructions:</strong>
              <ol className="mt-2 space-y-1 text-sm list-decimal list-inside">
                <li>Tap &quot;Get iOS Shortcut&quot; above</li>
                <li>In the Shortcuts app, tap &quot;Add Shortcut&quot;</li>
                <li>When prompted, paste your User ID from above</li>
                <li>Test it by saying &quot;Hey Siri, add expense&quot;</li>
              </ol>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Continue Button */}
      <Button 
        onClick={handleNext}
        className="w-full h-12 text-lg font-semibold"
        size="lg"
      >
        Continue
        <ArrowRight className="w-5 h-5 ml-2" />
      </Button>

      {/* Skip Option */}
      <div className="text-center">
        <Button 
          variant="ghost" 
          onClick={handleNext}
          className="text-muted-foreground"
        >
          Skip Shortcut Setup
        </Button>
      </div>
    </div>
  );
}