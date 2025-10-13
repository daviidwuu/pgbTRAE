"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Smartphone, Share, Plus, Link as LinkIcon, Download } from "lucide-react";
import Link from "next/link";
import { type WizardData } from "./setup-wizard";

interface PwaShortcutsStepProps {
  data: WizardData;
  updateData: (updates: Partial<WizardData>) => void;
  onNext: () => void;
  onComplete?: () => void;
  isLoading?: boolean;
}

export function PwaShortcutsStep({ onNext }: PwaShortcutsStepProps) {
  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <div className="flex justify-center mb-4">
          <div className="p-3 bg-primary/10 rounded-full">
            <Smartphone className="h-8 w-8 text-primary" />
          </div>
        </div>
        <h2 className="text-2xl font-bold">Quick Access Setup</h2>
        <p className="text-muted-foreground">
          Set up shortcuts for the fastest way to log transactions and access your dashboard.
        </p>
      </div>

      <div className="space-y-4">
        {/* PWA Installation */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Download className="h-5 w-5" />
              Install as App
              <Badge variant="secondary">Recommended</Badge>
            </CardTitle>
            <CardDescription>
              Add piggybank to your home screen for app-like experience.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-sm space-y-2">
              <p className="font-medium">On iPhone/iPad:</p>
              <ol className="list-decimal list-inside space-y-1 text-muted-foreground ml-4">
                <li>Tap the <Share className="inline h-3 w-3" /> share button in Safari</li>
                <li>Scroll down and tap &quot;Add to Home Screen&quot;</li>
                <li>Tap &quot;Add&quot; to confirm</li>
              </ol>
            </div>
            <div className="text-sm space-y-2">
              <p className="font-medium">On Android:</p>
              <ol className="list-decimal list-inside space-y-1 text-muted-foreground ml-4">
                <li>Tap the menu (⋮) in your browser</li>
                <li>Select &quot;Add to Home screen&quot; or &quot;Install app&quot;</li>
                <li>Tap &quot;Add&quot; to confirm</li>
              </ol>
            </div>
          </CardContent>
        </Card>

        {/* Apple Shortcut */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <LinkIcon className="h-5 w-5" />
              Apple Shortcut
              <Badge variant="outline">iOS Only</Badge>
            </CardTitle>
            <CardDescription>
              Log transactions instantly with Siri or from your widgets.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              The Apple Shortcut allows you to quickly add transactions by saying 
              &quot;Hey Siri, log expense&quot; or using the widget.
            </p>
            <Button asChild className="w-full">
              <Link 
                href="https://www.icloud.com/shortcuts/74a972a014cc4469b2fe0fa5787508a3" 
                target="_blank"
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Add Apple Shortcut
              </Link>
            </Button>
            <p className="text-xs text-muted-foreground">
              You&apos;ll need your User ID for the shortcut setup (we&apos;ll show this next).
            </p>
          </CardContent>
        </Card>
      </div>

      <Button onClick={onNext} className="w-full">
        Continue to Final Setup
      </Button>
    </div>
  );
}