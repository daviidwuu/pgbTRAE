
"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { BellRing } from "lucide-react";

export interface NotificationPermissionDialogProps {
  open: boolean;
  onAllow: () => void;
  onDeny: () => void;
}

export function NotificationPermissionDialog({
  open,
  onAllow,
  onDeny,
}: NotificationPermissionDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={(isOpen) => !isOpen && onDeny()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="flex justify-center">
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <BellRing className="h-8 w-8 text-primary" />
            </div>
          </div>
          <AlertDialogTitle className="text-center">Enable Web App Notifications</AlertDialogTitle>
          <AlertDialogDescription className="text-center">
            Allow this web app to send you push notifications. On iOS devices, you must first add the app to your Home Screen to enable this feature.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="sm:justify-center">
          <AlertDialogCancel onClick={onDeny}>Maybe Later</AlertDialogCancel>
          <AlertDialogAction onClick={onAllow}>Allow Notifications</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
