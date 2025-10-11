"use client";

import { useState } from "react";
import { type RecurringTransaction } from "@/shared/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { DrawerHeader, DrawerTitle, DrawerDescription } from "@/components/ui/drawer";
import { Plus, Edit, Trash2, Calendar, TrendingUp, TrendingDown, Pause, Play } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { useRecurringTransactions } from "@/features/transactions/hooks/useRecurringTransactions";
import { useToast } from "@/shared/hooks";
import { DEFAULT_INCOME_CATEGORIES } from "@/shared/constants";

const recurringFormSchema = z.object({
  Amount: z.coerce.number().positive({ message: "Amount must be positive" }),
  Type: z.enum(['income', 'expense']),
  Category: z.string().min(1, { message: "Category is required" }),
  Notes: z.string().min(1, { message: "Notes are required" }),
  frequency: z.enum(['weekly', 'monthly', 'yearly']),
  nextDueDate: z.date(),
  isActive: z.boolean().default(true),
});

type RecurringFormValues = z.infer<typeof recurringFormSchema>;

export interface RecurringTransactionsPageProps {
  categories: string[];
  incomeCategories: string[];
}

export function RecurringTransactionsPage({ categories, incomeCategories }: RecurringTransactionsPageProps) {
  const [isCreateDialogOpen, setCreateDialogOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<RecurringTransaction | null>(null);
  const { toast } = useToast();

  const {
    recurringTransactions,
    activeRecurringTransactions,
    upcomingTransactions,
    isRecurringLoading,
    createRecurringTransaction,
    updateRecurringTransaction,
    deleteRecurringTransaction,
    toggleRecurringTransaction,
  } = useRecurringTransactions();

  const form = useForm<RecurringFormValues>({
    resolver: zodResolver(recurringFormSchema),
    defaultValues: {
      Amount: 0,
      Type: 'expense',
      Category: "",
      Notes: "",
      frequency: 'monthly',
      nextDueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      isActive: true,
    },
  });

  const selectedType = form.watch('Type');
  const availableCategories = selectedType === 'income' ? incomeCategories : categories;

  const handleCreateSubmit = async (values: RecurringFormValues) => {
    try {
      await createRecurringTransaction(values);
      toast({
        title: "Recurring Transaction Created",
        description: "Your recurring transaction has been set up successfully.",
      });
      setCreateDialogOpen(false);
      form.reset();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to create recurring transaction.",
      });
    }
  };

  const handleEditSubmit = async (values: RecurringFormValues) => {
    if (!editingTransaction) return;
    
    try {
      await updateRecurringTransaction(editingTransaction.id, values);
      toast({
        title: "Recurring Transaction Updated",
        description: "Your recurring transaction has been updated successfully.",
      });
      setEditingTransaction(null);
      form.reset();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update recurring transaction.",
      });
    }
  };

  const handleEdit = (transaction: RecurringTransaction) => {
    setEditingTransaction(transaction);
    form.reset({
      Amount: transaction.Amount,
      Type: transaction.Type,
      Category: transaction.Category,
      Notes: transaction.Notes,
      frequency: transaction.frequency,
      nextDueDate: new Date(transaction.nextDueDate),
      isActive: transaction.isActive,
    });
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteRecurringTransaction(id);
      toast({
        title: "Recurring Transaction Deleted",
        description: "The recurring transaction has been removed.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete recurring transaction.",
      });
    }
  };

  const handleToggleActive = async (id: string, isActive: boolean) => {
    try {
      await toggleRecurringTransaction(id, !isActive);
      toast({
        title: isActive ? "Recurring Transaction Paused" : "Recurring Transaction Resumed",
        description: `The recurring transaction has been ${isActive ? 'paused' : 'resumed'}.`,
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update recurring transaction status.",
      });
    }
  };

  const getTransactionIcon = (type: 'income' | 'expense') => {
    return type === 'income' ? TrendingUp : TrendingDown;
  };

  const getTransactionColor = (type: 'income' | 'expense') => {
    return type === 'income' ? 'text-green-600' : 'text-red-600';
  };

  const formatFrequency = (frequency: 'weekly' | 'monthly' | 'yearly') => {
    return frequency.charAt(0).toUpperCase() + frequency.slice(1);
  };

  return (
    <>
      <DrawerHeader>
        <DrawerTitle>Recurring Transactions</DrawerTitle>
        <DrawerDescription>Manage your automatic recurring transactions.</DrawerDescription>
      </DrawerHeader>
      
      <div className="h-[65vh] overflow-hidden">
        <ScrollArea className="h-full px-4 scrollbar-hide">
          <div className="space-y-6">
            
            {/* Upcoming Transactions */}
            {upcomingTransactions.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Upcoming (Next 7 Days)
                  </CardTitle>
                  <CardDescription>Transactions due soon</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {upcomingTransactions.map((transaction) => {
                    const Icon = getTransactionIcon(transaction.Type);
                    return (
                      <div key={transaction.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <Icon className={`h-4 w-4 ${getTransactionColor(transaction.Type)}`} />
                          <div>
                            <p className="font-medium">{transaction.Notes}</p>
                            <p className="text-sm text-muted-foreground">
                              Due: {format(new Date(transaction.nextDueDate), 'MMM d, yyyy')}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={`font-bold ${getTransactionColor(transaction.Type)}`}>
                            {transaction.Type === 'income' ? '+' : '-'}${transaction.Amount.toFixed(2)}
                          </p>
                          <Badge variant="outline" className="text-xs">
                            {transaction.Category}
                          </Badge>
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            )}

            {/* All Recurring Transactions */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>All Recurring Transactions</CardTitle>
                    <CardDescription>
                      {activeRecurringTransactions.length} active, {recurringTransactions.length - activeRecurringTransactions.length} paused
                    </CardDescription>
                  </div>
                  <Dialog open={isCreateDialogOpen} onOpenChange={setCreateDialogOpen}>
                    <DialogTrigger asChild>
                      <Button>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Recurring
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Create Recurring Transaction</DialogTitle>
                        <DialogDescription>
                          Set up a transaction that repeats automatically.
                        </DialogDescription>
                      </DialogHeader>
                      <Form {...form}>
                        <form onSubmit={form.handleSubmit(handleCreateSubmit)} className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <FormField
                              control={form.control}
                              name="Amount"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Amount</FormLabel>
                                  <FormControl>
                                    <Input type="number" step="0.01" placeholder="0.00" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name="Type"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Type</FormLabel>
                                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                      <SelectTrigger>
                                        <SelectValue placeholder="Select type" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      <SelectItem value="expense">Expense</SelectItem>
                                      <SelectItem value="income">Income</SelectItem>
                                    </SelectContent>
                                  </Select>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                          
                          <FormField
                            control={form.control}
                            name="Category"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Category</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value}>
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select category" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    {availableCategories.map((category) => (
                                      <SelectItem key={category} value={category}>
                                        {category}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={form.control}
                            name="Notes"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Description</FormLabel>
                                <FormControl>
                                  <Input placeholder="e.g., Monthly salary" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <div className="space-y-4">
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
                                        className="h-auto py-3 px-4 capitalize"
                                      >
                                        {freq}
                                      </Button>
                                    ))}
                                  </div>
                                  <FormMessage />
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
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                          
                          <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setCreateDialogOpen(false)}>
                              Cancel
                            </Button>
                            <Button type="submit">Create Recurring Transaction</Button>
                          </DialogFooter>
                        </form>
                      </Form>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                {isRecurringLoading ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Loading recurring transactions...
                  </div>
                ) : recurringTransactions.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No recurring transactions set up yet.</p>
                    <p className="text-sm">Create one to automate your regular transactions.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {recurringTransactions.map((transaction) => {
                      const Icon = getTransactionIcon(transaction.Type);
                      return (
                        <div key={transaction.id} className={`flex items-center justify-between p-4 border rounded-lg ${!transaction.isActive ? 'opacity-60' : ''}`}>
                          <div className="flex items-center gap-3">
                            <Icon className={`h-4 w-4 ${getTransactionColor(transaction.Type)}`} />
                            <div>
                              <div className="flex items-center gap-2">
                                <p className="font-medium">{transaction.Notes}</p>
                                {!transaction.isActive && (
                                  <Badge variant="secondary" className="text-xs">Paused</Badge>
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground">
                                {formatFrequency(transaction.frequency)} • Next: {format(new Date(transaction.nextDueDate), 'MMM d, yyyy')}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="text-right">
                              <p className={`font-bold ${getTransactionColor(transaction.Type)}`}>
                                {transaction.Type === 'income' ? '+' : '-'}${transaction.Amount.toFixed(2)}
                              </p>
                              <Badge variant="outline" className="text-xs">
                                {transaction.Category}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => handleToggleActive(transaction.id, transaction.isActive)}
                              >
                                {transaction.isActive ? (
                                  <Pause className="h-4 w-4" />
                                ) : (
                                  <Play className="h-4 w-4" />
                                )}
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => handleEdit(transaction)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-destructive"
                                onClick={() => handleDelete(transaction.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </ScrollArea>
      </div>

      {/* Edit Dialog */}
      <Dialog open={!!editingTransaction} onOpenChange={(open) => !open && setEditingTransaction(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Recurring Transaction</DialogTitle>
            <DialogDescription>
              Update your recurring transaction details.
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleEditSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="Amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Amount</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" placeholder="0.00" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="Type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Type</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="expense">Expense</SelectItem>
                          <SelectItem value="income">Income</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={form.control}
                name="Category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {availableCategories.map((category) => (
                          <SelectItem key={category} value={category}>
                            {category}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="Notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Monthly salary" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="space-y-4">
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
                            className="h-auto py-3 px-4 capitalize"
                          >
                            {freq}
                          </Button>
                        ))}
                      </div>
                      <FormMessage />
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
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between">
                    <FormLabel>Active</FormLabel>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setEditingTransaction(null)}>
                  Cancel
                </Button>
                <Button type="submit">Update Recurring Transaction</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </>
  );
}