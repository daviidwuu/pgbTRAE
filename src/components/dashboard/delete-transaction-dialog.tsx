
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
import { type Transaction } from "@/shared/types";
import { format, toDate } from "date-fns";

export interface DeleteTransactionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  transaction: Transaction | null;
}

export function DeleteTransactionDialog({ open, onOpenChange, onConfirm, transaction }: DeleteTransactionDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="rounded-[var(--radius)]">
        <AlertDialogHeader>
          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete the transaction:
            <br />
            <span className="font-semibold">{transaction?.Notes}</span> for <span className="font-semibold">${transaction?.Amount.toFixed(2)}</span> on <span className="font-semibold">{transaction?.Date ? (() => {
              if (typeof transaction.Date === 'string') {
                return format(new Date(transaction.Date), 'MMM d, yyyy');
              } else if (transaction.Date && typeof transaction.Date === 'object' && 'seconds' in transaction.Date) {
                return format(toDate(transaction.Date.seconds * 1000), 'MMM d, yyyy');
              }
              return 'N/A';
            })() : 'N/A'}</span>.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

    