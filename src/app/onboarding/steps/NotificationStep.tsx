'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Bell, CheckCircle, X, ArrowRight, Info } from 'lucide-react';
import { useOnboarding } from '../OnboardingContext';
import { useToast } from '@/shared/hooks';

export function NotificationStep() {
  const { nextStep } = useOnboarding();
  const { toast } = useToast();
  const [permissionStatus, setPermissionStatus] = useState<'pending' | 'granted' | 'denied'>('pending');

  const handleEnableNotifications = async () => {
    try {
      if ('Notification' in window) {
        const permission = await Notification.requestPermission();
        
        if (permission === 'granted') {
          setPermissionStatus('granted');
          toast({
            title: "Notifications Enabled!",
            description: "You'll receive helpful budget reminders and updates.",
          });
        } else {
          setPermissionStatus('denied');
          toast({
            title: "Notifications Disabled",
            description: "You can enable them later in your browser settings.",
            variant: "destructive",
          });
        }
      } else {
        toast({
          title: "Not Supported",
          description: "Notifications are not supported in this browser.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Notification permission error:', error);
      setPermissionStatus('denied');
      toast({
        title: "Error",
        description: "Failed to request notification permission.",
        variant: "destructive",
      });
    }
  };

  const handleSkip = () => {
    setPermissionStatus('denied');
    nextStep();
  };

  const handleNext = () => {
    nextStep();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <Bell className="w-8 h-8 text-primary" />
        </div>
        <h2 className="text-2xl font-bold">Stay on Track</h2>
        <p className="text-muted-foreground">
          Get helpful reminders to maintain your budget goals
        </p>
      </div>

      {/* Benefits Card */}
      <Card className="bg-primary/5 border-primary/20">
        <CardContent className="pt-6">
          <h3 className="font-semibold mb-3">Notifications will help you:</h3>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
              Get reminded when you&apos;re close to your budget limits
            </li>
            <li className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
              Receive weekly budget summaries and insights
            </li>
            <li className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
              Stay motivated with savings milestone celebrations
            </li>
            <li className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
              Get tips for better financial habits
            </li>
          </ul>
        </CardContent>
      </Card>

      {/* Permission Status */}
      {permissionStatus === 'granted' && (
        <Card className="bg-green-50 border-green-200">
          <CardContent className="flex items-center space-x-4 pt-6">
            <CheckCircle className="w-8 h-8 text-green-600 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-green-800">Notifications Enabled!</h3>
              <p className="text-sm text-green-700">
                You&apos;ll receive helpful budget reminders and updates.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {permissionStatus === 'denied' && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            <strong>No worries!</strong> You can always enable notifications later in your 
            browser settings or from the app&apos;s settings page.
          </AlertDescription>
        </Alert>
      )}

      {/* Action Buttons */}
      {permissionStatus === 'pending' && (
        <div className="space-y-3">
          <Button 
            onClick={handleEnableNotifications}
            className="w-full h-12 text-lg font-semibold"
            size="lg"
          >
            <Bell className="w-5 h-5 mr-2" />
            Enable Notifications
          </Button>
          
          <Button 
            variant="outline"
            onClick={handleSkip}
            className="w-full h-12 text-lg"
            size="lg"
          >
            <X className="w-5 h-5 mr-2" />
            Skip for Now
          </Button>
        </div>
      )}

      {permissionStatus !== 'pending' && (
        <Button 
          onClick={handleNext}
          className="w-full h-12 text-lg font-semibold"
          size="lg"
        >
          Continue
          <ArrowRight className="w-5 h-5 ml-2" />
        </Button>
      )}

      {/* Privacy Note */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          <strong>Privacy:</strong> We only send helpful budget-related notifications. 
          You can customize or disable them anytime in settings.
        </AlertDescription>
      </Alert>
    </div>
  );
}