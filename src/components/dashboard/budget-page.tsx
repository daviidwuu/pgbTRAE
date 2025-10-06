
"use client";

import { useState, useMemo } from "react";
import { type Budget, type User } from "@/lib/data";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
  DrawerDescription,
  DrawerClose,
} from "@/components/ui/drawer";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Pencil, Trash2, Plus } from "lucide-react";

export interface BudgetPageProps {
  user: User;
  budgets: Budget[];
  onUpdateIncome: (newIncome: number) => void;
  onUpdateSavings: (newSavings: number) => void;
  onUpdateBudget: (category: string, newBudget: number) => void;
  onAddCategory: (category: string) => void;
  onDeleteCategory: (category: string) => void;
}

interface BudgetEditDrawerProps {
  category: string;
  currentBudget: number;
  onUpdateBudget: (category: string, newBudget: number) => void;
}

function BudgetEditDrawer({ category, currentBudget, onUpdateBudget }: BudgetEditDrawerProps) {
    const [budgetValue, setBudgetValue] = useState(String(currentBudget));

    const handleUpdate = () => {
        const newValue = parseFloat(budgetValue);
        if (!isNaN(newValue)) {
            onUpdateBudget(category, newValue);
        }
    };

    return (
        <DrawerContent>
            <DrawerHeader>
                <DrawerTitle>Edit Budget: {category}</DrawerTitle>
            </DrawerHeader>
            <div className="p-4 h-[35vh] flex flex-col justify-center">
                <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-5xl text-muted-foreground">$</span>
                    <Input
                        type="number"
                        step="0.01"
                        inputMode="decimal"
                        value={budgetValue}
                        onChange={(e) => setBudgetValue(e.target.value)}
                        onBlur={handleUpdate}
                        placeholder="0.00"
                        className="h-auto w-full border-none bg-transparent text-center text-5xl font-bold"
                    />
                </div>
            </div>
             <DrawerClose asChild>
                <Button className="w-full" onClick={handleUpdate}>Done</Button>
            </DrawerClose>
        </DrawerContent>
    );
}

export function BudgetPage({ 
  user,
  budgets, 
  onUpdateIncome, 
  onUpdateSavings, 
  onUpdateBudget, 
  onAddCategory, 
  onDeleteCategory 
}: BudgetPageProps) {
  const [newCategory, setNewCategory] = useState("");
  const [isCategoryManagerOpen, setCategoryManagerOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  
  const [currentIncome, setCurrentIncome] = useState(user?.income ?? 0);
  const [currentSavings, setCurrentSavings] = useState(user?.savings ?? 0);
  
  const categories = user?.categories || [];
  const income = user?.income ?? 0;
  const savings = user?.savings ?? 0;

  const totalBudgeted = useMemo(() => budgets.reduce((sum, b) => sum + b.MonthlyBudget, 0), [budgets]);
  const leftToBudget = useMemo(() => income - savings - totalBudgeted, [income, savings, totalBudgeted]);

  const handleAddCategory = () => {
    if (newCategory.trim() !== "" && !categories.includes(newCategory.trim())) {
      onAddCategory(newCategory.trim());
      setNewCategory("");
    }
  };

  const getBudgetForCategory = (category: string) => {
    return budgets.find(b => b.Category === category)?.MonthlyBudget ?? 0;
  };
  
  const handleUpdateAndCloseDrawer = (category: string, newBudget: number) => {
    onUpdateBudget(category, newBudget);
    setEditingCategory(null);
  }

  return (
    <div className="space-y-6 px-4">
        <Card className="border-none shadow-none">
            <CardHeader>
                <CardTitle>Income & Savings</CardTitle>
                <CardDescription>Set your monthly income and savings goal.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pb-4">
                <div className="space-y-2">
                    <label className="text-sm font-medium text-center block pb-2">Monthly Income</label>
                    <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-5xl text-muted-foreground">$</span>
                        <Input
                            type="number"
                            step="0.01"
                            inputMode="decimal"
                            defaultValue={currentIncome}
                            onBlur={(e) => onUpdateIncome(parseFloat(e.target.value) || 0)}
                            onChange={(e) => setCurrentIncome(parseFloat(e.target.value) || 0)}
                            placeholder="0.00"
                            className="h-auto w-full border-none bg-transparent text-center text-5xl font-bold"
                        />
                    </div>
                </div>
                 <div className="space-y-2 pt-4">
                    <label className="text-sm font-medium text-center block pb-2">Monthly Savings Goal</label>
                    <div className="relative">
                       <span className="absolute left-3 top-1/2 -translate-y-1/2 text-5xl text-muted-foreground">$</span>
                       <Input
                            type="number"
                            step="0.01"
                            inputMode="decimal"
                            defaultValue={currentSavings}
                            onBlur={(e) => onUpdateSavings(parseFloat(e.target.value) || 0)}
                            onChange={(e) => setCurrentSavings(parseFloat(e.target.value) || 0)}
                            placeholder="0.00"
                            className="h-auto w-full border-none bg-transparent text-center text-5xl font-bold"
                        />
                    </div>
                </div>
            </CardContent>
        </Card>

        <Card className="border-none shadow-none">
             <CardHeader>
                <CardTitle>Amount Left to Budget</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="relative text-center">
                    <span className={`absolute left-3 top-1/2 -translate-y-1/2 text-3xl ${leftToBudget < 0 ? 'text-destructive' : 'text-muted-foreground'}`}>$</span>
                    <div className={`h-auto w-full text-3xl font-bold ${leftToBudget < 0 ? 'text-destructive' : ''}`}>
                        {Math.abs(leftToBudget).toFixed(2)}
                    </div>
                </div>
            </CardContent>
        </Card>

        <Card className="border-none shadow-none">
            <CardHeader className="flex-row items-center justify-between">
                <div className="space-y-1.5">
                    <CardTitle>Budget</CardTitle>
                    <CardDescription>Allocate your spending limits.</CardDescription>
                </div>
                <Drawer open={isCategoryManagerOpen} onOpenChange={setCategoryManagerOpen}>
                    <DrawerTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-primary flex-shrink-0">
                            <Pencil className="h-4 w-4" />
                        </Button>
                    </DrawerTrigger>
                    <DrawerContent>
                        <DrawerHeader>
                            <DrawerTitle>Manage Categories</DrawerTitle>
                            <DrawerDescription>Add or remove spending categories.</DrawerDescription>
                        </DrawerHeader>
                        <div className="px-4">
                            <div className="flex w-full items-center space-x-2">
                                <Input 
                                    value={newCategory}
                                    onChange={(e) => setNewCategory(e.target.value)}
                                    placeholder="New category name..."
                                    className="h-10"
                                    onKeyDown={(e) => e.key === 'Enter' && handleAddCategory()}
                                />
                                <Button size="sm" onClick={handleAddCategory} className="h-10">
                                    <Plus className="h-4 w-4 mr-1"/>
                                    Add
                                </Button>
                            </div>
                        </div>
                        <ScrollArea className="h-64 mt-4">
                            <div className="space-y-2 px-4">
                                {categories.map((category) => (
                                    <div key={category} className="flex items-center justify-between rounded-md border p-3">
                                        <span className="font-medium text-sm">{category}</span>
                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => onDeleteCategory(category)}>
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                ))}
                                {categories.length === 0 && (
                                    <div className="text-center text-muted-foreground pt-8">
                                        <p>No categories found.</p>
                                        <p className="text-xs">Add one using the form above.</p>
                                    </div>
                                )}
                            </div>
                        </ScrollArea>
                    </DrawerContent>
                </Drawer>
            </CardHeader>
            <CardContent className="space-y-4 pb-4">
                <Drawer open={!!editingCategory} onOpenChange={(isOpen) => !isOpen && setEditingCategory(null)}>
                    {editingCategory && (
                        <BudgetEditDrawer 
                            category={editingCategory}
                            currentBudget={getBudgetForCategory(editingCategory)}
                            onUpdateBudget={handleUpdateAndCloseDrawer}
                        />
                    )}
                </Drawer>
                <div className="space-y-3 pt-2">
                    {categories.map((category) => (
                        <button 
                            key={category} 
                            onClick={() => setEditingCategory(category)}
                            className="flex items-center justify-between gap-4 w-full p-2 rounded-md"
                        >
                            <span className="font-medium truncate pr-2">{category}</span>
                            <div className="flex items-center gap-2 flex-shrink-0">
                                <span className="text-muted-foreground">${getBudgetForCategory(category).toFixed(2)}</span>
                            </div>
                        </button>
                    ))}
                </div>
            </CardContent>
        </Card>
    </div>
  );
}

    