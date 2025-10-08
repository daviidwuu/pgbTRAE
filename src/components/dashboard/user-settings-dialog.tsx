
"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { type User as UserData } from "@/shared/types";
import { Loader2, Copy } from "lucide-react";

const formSchema = z.object({
  name: z.string().min(1, { message: "Please enter your name." }),
});

export interface UserSettingsDialogProps {
  user: UserData | null;
  userId?: string;
  onSave: (name: string) => void;
  onCopyUserId: () => void;
}

export function UserSettingsDialog({
  user,
  userId,
  onSave,
  onCopyUserId
}: UserSettingsDialogProps) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: user?.name || "",
    },
  });

  useEffect(() => {
    if (user) {
      form.reset({ name: user.name });
    }
  }, [user, form]);

  function onSubmit(values: z.infer<typeof formSchema>) {
    onSave(values.name);
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>User Profile</DialogTitle>
        <DialogDescription>
          Manage your account settings and personal information.
        </DialogDescription>
      </DialogHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Your Name</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., David" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
            {userId && (
            <div className="w-full space-y-2 pt-2">
              <p className="text-sm text-muted-foreground">Your unique User ID:</p>
              <div className="flex items-center w-full gap-2">
                  <Input readOnly value={userId} className="text-xs" />
                  <Button variant="outline" size="icon" type="button" onClick={onCopyUserId} className="focus-visible:outline-none">
                      <Copy className="h-4 w-4" />
                  </Button>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button type="submit" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </form>
      </Form>
    </>
  );
}
