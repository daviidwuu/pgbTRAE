"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Copy, Bell, Key, Loader2 } from "lucide-react";
import { useUser } from "@/firebase";
import { useToast } from "@/shared/hooks";
import { type WizardData } from "./setup-wizard";

interface FinalSetupStepProps {
  data: WizardData;
  updateData: (updates: Partial<WizardData>) => void;
  onNext: () => void;
  onComplete?: () => void;
  isLoading?: boolean;
}

export function FinalSetupStep({ onComplete, isLoading }: FinalSetupStepProps) {
  const [enableNotifications, setEnableNotifications] = useState(false);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default');
  
  const { user } = useUser();
  const { toast } = useToast();

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setNotificationPermission(Notification.permission);
    }
  }, []);

  const handleCopyUserId = async () => {
    if (!user) return;
    
    try {
      await navigator.clipboard.writeText(user.uid);
      toast({
        title: "User ID Copied!",
        description: "You can now paste this into your Apple Shortcut.",
      });
    } catch (error) {
      console.error("Failed to copy user ID:", error);
      toast({
        title: "Copy Failed",
        description: "Please manually select and copy your User ID.",
        variant: "destructive",
      });
    }
  };

  const handleNotificationToggle = async (checked: boolean) => {
    setEnableNotifications(checked);
    
    if (checked && notificationPermission === 'default') {
      try {
        const permission = await Notification.requestPermission();
        setNotificationPermission(permission);
        
        if (permission === 'granted') {
          toast({
            title: "Notifications Enabled",
            description: "You'll receive updates about your spending and budgets.",
          });
        } else {
          toast({
            title: "Notifications Disabled",
            description: "You can enable them later in your browser settings.",
            variant: "destructive",
          });
          setEnableNotifications(false);
        }
      } catch (error) {
        console.error("Failed to request notification permission:", error);
        setEnableNotifications(false);
      }
    }
  };

  const handleFinish = () => {
    if (onComplete) {
      onComplete();
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <div className="flex justify-center mb-4">
          <div className="p-3 bg-primary/10 rounded-full">
            <Key className="h-8 w-8 text-primary" />
          </div>
        </div>
        <h2 className="text-2xl font-bold">Final Setup</h2>
        <p className="text-muted-foreground">
          Get your User ID and configure notifications to complete your setup.
        </p>
      </div>

      <div className="space-y-4">
        {/* User ID */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Key className="h-5 w-5" />
              Your Unique User ID
            </CardTitle>
            <CardDescription>
              Copy this ID to use with the Apple Shortcut for logging transactions.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2">
              <Input 
                readOnly 
                value={user?.uid || "Loading..."} 
                className="text-xs font-mono"
              />
              <Button 
                variant="outline" 
                size="icon" 
                onClick={handleCopyUserId}
                disabled={!user}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Keep this ID safe - you&apos;ll need it to set up the Apple Shortcut.
            </p>
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Bell className="h-5 w-5" />
              Notifications
            </CardTitle>
            <CardDescription>
              Get notified about budget alerts and spending insights.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="notifications">Enable Notifications</Label>
                <p className="text-xs text-muted-foreground">
                  Receive alerts when you&apos;re close to budget limits
                </p>
              </div>
              <Switch
                id="notifications"
                checked={enableNotifications}
                onCheckedChange={handleNotificationToggle}
                disabled={notificationPermission === 'denied'}
              />
            </div>
            
            {notificationPermission === 'denied' && (
              <p className="text-xs text-yellow-600">
                Notifications are blocked. You can enable them in your browser settings.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        <Button 
          onClick={handleFinish} 
          className="w-full" 
          size="lg"
          disabled={isLoading}
        >
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Complete Setup & Go to Dashboard
        </Button>
        
        <p className="text-xs text-center text-muted-foreground">
          You&apos;re all set! You can always modify these settings later in your dashboard.
        </p>
      </div>
    </div>
  );
}