
"use client";

import { useEffect, useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ArrowLeft } from "lucide-react";
import { addDocumentNonBlocking, useFirestore, updateDocumentNonBlocking } from "@/firebase";
import { collection, doc } from "firebase/firestore";
import { type Transaction } from "@/lib/data";
import { DrawerHeader, DrawerTitle } from "../ui/drawer";

const formSchema = z.object({
  Amount: z.coerce.number().positive({ message: "Amount must be positive" }),
  Category: z.string().min(1, { message: "Category is required" }),
  Notes: z.string().min(1, { message: "Notes are required" }),
});

type FormValues = z.infer<typeof formSchema>;

export interface AddTransactionFormProps {
  setOpen: (open: boolean) => void;
  userId?: string;
  transactionToEdit?: Transaction | null;
  categories: string[];
}

export function AddTransactionForm({ setOpen, userId, transactionToEdit, categories }: AddTransactionFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState(0);
  const { toast } = useToast();
  const firestore = useFirestore();
  const amountInputRef = useRef<HTMLInputElement | null>(null);
  const notesInputRef = useRef<HTMLInputElement | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      Amount: '' as unknown as FormValues['Amount'],
      Category: "",
      Notes: "",
    },
    mode: "onChange",
  });

  useEffect(() => {
    if (transactionToEdit) {
      form.reset({
        ...transactionToEdit,
        Amount: transactionToEdit.Amount,
      });
    } else {
      form.reset({
        Amount: '' as unknown as FormValues['Amount'],
        Category: "",
        Notes: "",
      });
    }
    setStep(0);
    setTimeout(() => {
      amountInputRef.current?.focus();
    }, 100);
  }, [transactionToEdit, form]);

  const nextStep = async (field?: keyof FormValues) => {
    if (field) {
        const isValid = await form.trigger(field);
        if (!isValid) return;
    }
    setStep((s) => s + 1);

    if (field === 'Category') {
      setTimeout(() => {
        notesInputRef.current?.focus();
      }, 100);
    }
  };

  const prevStep = () => {
    setStep((s) => s - 1);
  };

  async function onSubmit(values: FormValues) {
    if (!userId || !firestore) {
        toast({
            variant: "destructive",
            title: "Error",
            description: "User not authenticated.",
        });
        return;
    }
    setIsLoading(true);

    const transactionData = {
        ...values,
        Date: new Date(),
        Type: 'Expense',
        userId,
    };
    
    try {
        if (transactionToEdit) {
            const transactionRef = doc(firestore, `users/${userId}/transactions`, transactionToEdit.id);
            updateDocumentNonBlocking(transactionRef, transactionData);
        } else {
            const transactionsCollection = collection(firestore, `users/${userId}/transactions`);
            await addDocumentNonBlocking(transactionsCollection, transactionData);
        }
    } catch (error) {
        console.error('Failed to save transaction', error);
        toast({
            variant: "destructive",
            title: "Error adding transaction",
            description: "There was an error adding the transaction.",
        });
    } finally {
        setIsLoading(false);
        setOpen(false);
    }
  }

  const handleCategorySelect = (category: string) => {
    form.setValue("Category", category, { shouldValidate: true });
    nextStep('Category');
  };

  return (
    <>
      <DrawerHeader className="text-left relative">
        {step > 0 && (
          <Button variant="ghost" onClick={prevStep} className="absolute left-4 top-1/2 -translate-y-1/2 px-2 h-auto focus-visible:outline-none">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        )}
        <DrawerTitle className="text-center">{transactionToEdit ? 'Edit Transaction' : 'Add New Transaction'}</DrawerTitle>
      </DrawerHeader>
      <div className="p-4 h-[35vh]">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="h-full flex flex-col">
              <div className={`flex-grow transition-transform duration-300 ${step === 0 ? 'flex flex-col' : 'hidden'}`}>
                <FormField
                    control={form.control}
                    name="Amount"
                    render={({ field }) => {
                      const { ref, ...fieldProps } = field;
                      return (
                        <FormItem className="flex-grow flex flex-col justify-center">
                            <FormControl>
                              <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-4xl text-muted-foreground">$</span>
                                <Input
                                  {...fieldProps}
                                  type="number"
                                  step="0.01"
                                  placeholder="0.00"
                                  inputMode="decimal"
                                  className="h-auto w-full border-none bg-transparent text-center text-6xl font-bold focus-visible:outline-none"
                                  ref={(element) => {
                                    ref(element);
                                    amountInputRef.current = element;
                                  }}
                                />
                              </div>
                            </FormControl>
                            <FormMessage className="text-center pt-2" />
                        </FormItem>
                      );
                    }}
                />
                 <Button 
                    type="button"
                    onClick={() => nextStep('Amount')} 
                    className="w-full"
                    disabled={!form.watch('Amount')}
                >
                    Next
                </Button>
              </div>

              <div className={`transition-transform duration-300 ${step === 1 ? '' : 'hidden'}`}>
                  <fieldset className="space-y-4">
                      <legend className="text-sm font-medium text-center mb-4">Category</legend>
                      <div className="flex flex-wrap gap-2 justify-center">
                          {categories.map((cat) => (
                              <Button
                                  type="button"
                                  key={cat}
                                  variant={form.watch("Category") === cat ? "default" : "outline"}
                                  onClick={() => handleCategorySelect(cat)}
                                  className="h-auto py-3 px-4"
                              >
                                  {cat}
                              </Button>
                          ))}
                      </div>
                      <FormMessage className="text-center">{form.formState.errors.Category?.message}</FormMessage>
                  </fieldset>
              </div>

              <div className={`h-full flex flex-col transition-transform duration-300 ${step === 2 ? 'flex flex-col' : 'hidden'}`}>
                <FormField
                    control={form.control}
                    name="Notes"
                    render={({ field }) => {
                      const { ref, ...fieldProps } = field;
                      return (
                        <FormItem className="flex-grow flex flex-col justify-center">
                            <FormControl>
                                <Input
                                    {...fieldProps}
                                    placeholder="e.g., Coffee"
                                    className="h-auto w-full border-none bg-transparent text-center text-4xl font-bold focus-visible:outline-none"
                                    ref={(element) => {
                                      ref(element);
                                      notesInputRef.current = element;
                                    }}
                                />
                            </FormControl>
                            <FormMessage className="text-center pt-2" />
                        </FormItem>
                      );
                    }}
                />
                 <Button 
                    type="submit" 
                    className="w-full mt-auto" 
                    disabled={isLoading || !form.formState.isValid}
                >
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {transactionToEdit ? 'Update Transaction' : 'Add Transaction'}
                </Button>
              </div>
          </form>
        </Form>
      </div>
    </>
  );
}
