
"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
  } from "@/components/ui/card";
import { Loader2, Copy, Link as LinkIcon } from "lucide-react";
import Link from "next/link";
import { useToast } from "@/shared/hooks";

const formSchema = z.object({
  name: z.string().min(1, { message: "Please enter your name." }),
});

export interface SetupSheetProps {
  onSave: (data: { name: string; }) => Promise<void>;
  onCopyUserId: () => void;
  userId?: string;
}

export function SetupSheet({ onSave, onCopyUserId, userId }: SetupSheetProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    await onSave({ name: values.name });
    // This will likely unmount the component, so loading state might not be seen if successful
    setIsLoading(false);
  }

  const handleCopy = () => {
    onCopyUserId();
    toast({
        title: "User ID Copied!",
        description: "You can now paste this into your Apple Shortcut.",
    });
  }

  return (
    <Card className="w-full max-w-md border-none shadow-none">
        <CardHeader>
            <CardTitle>Welcome to piggybank</CardTitle>
            <CardDescription>
                Set up your account with default categories for expenses (F&B, Shopping, Transport, Bills, Others) and income (Salary, Transfer). Then add the Apple Shortcut to start logging transactions quickly.
            </CardDescription>
        </CardHeader>
        <CardContent className="pb-2 space-y-4">
            <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                      <FormItem>
                      <FormLabel>Your Name</FormLabel>
                      <FormControl>
                          <Input
                          placeholder="e.g., David"
                          {...field}
                          />
                      </FormControl>
                      <FormMessage />
                      </FormItem>
                  )}
                />
                <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save and Continue
                </Button>
            </form>
            </Form>
        </CardContent>
        {userId && (
          <CardFooter className="flex-col items-start gap-4 pt-4">
              <div className="w-full space-y-2">
                <p className="text-sm text-muted-foreground">1. Copy your unique User ID:</p>
                <div className="flex items-center w-full gap-2">
                    <Input readOnly value={userId} className="text-xs" />
                    <Button variant="outline" size="icon" onClick={handleCopy}>
                        <Copy className="h-4 w-4" />
                    </Button>
                </div>
              </div>
              <div className="w-full space-y-2">
                <p className="text-sm text-muted-foreground">2. Add the Shortcut to your iPhone:</p>
                <Button asChild className="w-full">
                    <Link href="https://www.icloud.com/shortcuts/74a972a014cc4469b2fe0fa5787508a3" target="_blank">
                        <LinkIcon className="mr-2 h-4 w-4" />
                        Add Apple Shortcut
                    </Link>
                </Button>
              </div>
          </CardFooter>
        )}
    </Card>
  );
}
