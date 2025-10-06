"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Share, PlusSquare, X } from "lucide-react";

export function AddToHomeScreenPrompt() {
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    const isIos = () => {
      const userAgent = window.navigator.userAgent.toLowerCase();
      return /iphone|ipad|ipod/.test(userAgent);
    };
    
    // This is for Safari on iOS, not a standard property.
    // @ts-ignore
    const isInStandaloneMode = () => ('standalone' in window.navigator) && (window.navigator.standalone);

    if (typeof window !== "undefined" && localStorage) {
      const hasDismissed = localStorage.getItem('pwa-install-prompt-dismissed') === 'true';
      if (isIos() && !isInStandaloneMode() && !hasDismissed) {
        setShowPrompt(true);
      }
    }

  }, []);

  const handleDismiss = () => {
    localStorage.setItem('pwa-install-prompt-dismissed', 'true');
    setShowPrompt(false);
  };

  if (!showPrompt) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 sm:left-auto sm:max-w-sm animate-in slide-in-from-bottom-10 duration-500">
      <Card className="bg-card/95 backdrop-blur-sm shadow-2xl">
        <CardHeader className="flex-row items-start justify-between pb-2">
          <CardTitle className="text-base font-semibold">Add to Home Screen</CardTitle>
          <Button variant="ghost" size="icon" className="-mt-2 -mr-2 h-8 w-8 rounded-full" onClick={handleDismiss}>
            <X className="h-4 w-4" />
            <span className="sr-only">Dismiss</span>
          </Button>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground leading-relaxed">
            To install this app on your device, tap the
            <Share className="mx-1 inline-block h-4 w-4 align-text-bottom" aria-hidden="true" />
            icon and then select 'Add to Home Screen'.
            <PlusSquare className="ml-1 inline-block h-4 w-4 align-text-bottom" aria-hidden="true" />
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
