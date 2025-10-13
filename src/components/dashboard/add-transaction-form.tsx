
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
  FormLabel,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/shared/hooks";
import { Loader2, ArrowLeft } from "lucide-react";
import { addDocumentNonBlocking, useFirestore, updateDocumentNonBlocking } from "@/firebase";
import { collection, doc } from "firebase/firestore";
import { type Transaction } from "@/shared/types";
import { DrawerHeader, DrawerTitle } from "../ui/drawer";

const formSchema = z.object({
  Amount: z.coerce.number().positive({ message: "Amount must be positive" }),
  Category: z.string().min(1, { message: "Category is required" }),
  Notes: z.string().min(1, { message: "Notes are required" }),
  isRecurring: z.boolean().default(false),
  frequency: z.enum(['weekly', 'monthly', 'yearly']).optional(),
  nextDueDate: z.date().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export interface AddTransactionFormProps {
  setOpen: (open: boolean) => void;
  userId?: string;
  transactionToEdit?: Transaction | null;
  categories: string[];
  incomeCategories: string[];
}

export function AddTransactionForm({ setOpen, userId, transactionToEdit, categories, incomeCategories }: AddTransactionFormProps) {
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
      isRecurring: false,
      frequency: 'monthly',
      nextDueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // Default to 30 days from now
    },
    mode: "onChange",
  });

  const isRecurring = form.watch('isRecurring');

  useEffect(() => {
    if (transactionToEdit) {
      form.reset({
        ...transactionToEdit,
        Amount: transactionToEdit.Amount,
        isRecurring: false, // Existing transactions are not recurring
      });
    } else {
      form.reset({
        Amount: '' as unknown as FormValues['Amount'],
        Category: "",
        Notes: "",
        isRecurring: false,
        frequency: 'monthly',
        nextDueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
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

  // Determine transaction type based on selected category
  const getTransactionType = (category: string): 'income' | 'expense' => {
    return incomeCategories.includes(category) ? 'income' : 'expense';
  };

  async function onSubmit(values: FormValues) {
    if (!userId || !firestore) {
        return;
    }
    setIsLoading(true);

    const transactionType = getTransactionType(values.Category);
    
    const transactionData = {
        ...values,
        Date: transactionToEdit ? transactionToEdit.Date : new Date(), // Preserve original date when editing
        Type: transactionType,
        userId,
    };
    
    try {
        if (transactionToEdit) {
            const transactionRef = doc(firestore, `users/${userId}/transactions`, transactionToEdit.id);
            await updateDocumentNonBlocking(transactionRef, transactionData);
            toast({
                title: "Success",
                description: "Transaction updated successfully.",
            });
        } else {
            const transactionsCollection = collection(firestore, `users/${userId}/transactions`);
            await addDocumentNonBlocking(transactionsCollection, transactionData);
        }

        // Handle recurring transaction creation (only for new transactions)
        if (!transactionToEdit && values.isRecurring && values.frequency && values.nextDueDate) {
          const recurringTransactionData = {
            Amount: values.Amount,
            Type: transactionType,
            Category: values.Category,
            Notes: values.Notes,
            frequency: values.frequency,
            nextDueDate: values.nextDueDate,
            isActive: true,
            createdAt: new Date(),
            userId,
          };

          const recurringCollection = collection(firestore, `users/${userId}/recurringTransactions`);
          await addDocumentNonBlocking(recurringCollection, recurringTransactionData);
          
          toast({
              title: "Success",
              description: "Transaction added successfully with recurring schedule.",
          });
        }
    } catch (error) {
        console.error('Failed to save transaction', error);
        toast({
            variant: "destructive",
            title: "Error",
            description: `Failed to ${transactionToEdit ? 'update' : 'add'} transaction.`,
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
      <div className="p-4 mobile-form-container drawer-form-container overflow-y-auto">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="h-full flex flex-col">
              {/* Amount Step */}
              <div className={`transition-transform duration-300 ${step === 0 ? 'flex flex-col h-full' : 'hidden'}`}>
                <div className="flex-1 flex flex-col justify-center min-h-0">
                  <FormField
                      control={form.control}
                      name="Amount"
                      render={({ field }) => {
                        const { ref, ...fieldProps } = field;
                        return (
                          <FormItem className="flex flex-col justify-center">
                              <FormControl>
                                <div className="relative">
                                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-3xl text-muted-foreground">$</span>
                                  <Input
                                    {...fieldProps}
                                    type="text"
                                    inputMode="decimal"
                                    placeholder="0.00"
                                    className="amount-input h-auto w-full border-none bg-transparent text-center !text-4xl !font-bold focus-visible:outline-none placeholder:!text-4xl placeholder:!font-bold placeholder:text-muted-foreground px-0 py-0"
                                    style={{ fontSize: '2.25rem !important', fontWeight: '700 !important' }}
                                    onInput={(e) => {
                                      // Allow only numbers and decimal point
                                      const value = e.currentTarget.value.replace(/[^0-9.]/g, '');
                                      // Prevent multiple decimal points
                                      const parts = value.split('.');
                                      if (parts.length > 2) {
                                        e.currentTarget.value = parts[0] + '.' + parts.slice(1).join('');
                                      } else {
                                        e.currentTarget.value = value;
                                      }
                                      // Update form value
                                      fieldProps.onChange(e.currentTarget.value);
                                    }}
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
                </div>

                {/* Recurring Toggle - Scrollable Section */}
                <div className="flex-shrink-0 space-y-4 mt-4 pb-4">
                  <FormField
                    control={form.control}
                    name="isRecurring"
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between">
                        <FormLabel className="text-base">Make this recurring</FormLabel>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  {/* Recurring Details - Integrated */}
                  {isRecurring && (
                    <div className="space-y-4 max-h-[200px] overflow-y-auto scrollbar-hide">
                      <FormField
                        control={form.control}
                        name="frequency"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Frequency</FormLabel>
                            <div className="flex gap-2 justify-center">
                              {['weekly', 'monthly', 'yearly'].map((freq) => (
                                <Button
                                  key={freq}
                                  type="button"
                                  variant={field.value === freq ? "default" : "outline"}
                                  onClick={() => field.onChange(freq)}
                                  className="h-8 py-1 px-3 text-sm capitalize"
                                >
                                  {freq}
                                </Button>
                              ))}
                            </div>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="nextDueDate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Next Due Date</FormLabel>
                            <FormControl>
                              <Input
                                type="date"
                                className="h-auto py-3 px-4"
                                value={field.value ? field.value.toISOString().split('T')[0] : ''}
                                onChange={(e) => field.onChange(new Date(e.target.value))}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>
                  )}
                </div>

                {/* Fixed Next Button */}
                <div className="flex-shrink-0 pt-4 border-t border-border/50 bg-background form-fixed-button">
                  <Button 
                      type="button"
                      onClick={() => nextStep('Amount')} 
                      className="w-full"
                      disabled={!form.watch('Amount')}
                  >
                      Next
                  </Button>
                </div>
              </div>

              {/* Category Step */}
              <div className={`transition-transform duration-300 ${step === 1 ? '' : 'hidden'}`}>
                  <fieldset className="space-y-6">
                      <legend className="text-sm font-medium text-center mb-4">Category</legend>
                      
                      {/* Expense Categories */}
                      <div className="space-y-3">
                        <h3 className="text-sm font-medium text-muted-foreground">Expenses</h3>
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
                      </div>

                      {/* Income Categories */}
                      <div className="space-y-3">
                        <h3 className="text-sm font-medium text-muted-foreground">Income</h3>
                        <div className="flex flex-wrap gap-2 justify-center">
                            {incomeCategories.map((cat) => (
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
                      </div>

                      <FormMessage className="text-center">{form.formState.errors.Category?.message}</FormMessage>
                  </fieldset>
                  
                  {/* Next Button for Category Step */}
                  <div className="flex-shrink-0 pt-4 border-t border-border/50 bg-background form-fixed-button">
                    <Button 
                        type="button"
                        onClick={() => nextStep('Category')} 
                        className="w-full"
                        disabled={!form.watch('Category')}
                    >
                        Next
                    </Button>
                  </div>
              </div>

              {/* Notes Step */}
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
