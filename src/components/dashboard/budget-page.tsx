
"use client";

import { useState, useMemo } from "react";
import { type Budget, type User, type CategoryType } from "@/shared/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { Pencil, Trash2, Plus, TrendingUp, TrendingDown } from "lucide-react";
import { BudgetService } from "@/features/budgets/services/BudgetService";
import { getBudgetStatus, formatBudgetAmount, validateCategoryName, getCategoryTypeInfo } from "@/shared/utils/budget";
import { DEFAULT_EXPENSE_CATEGORIES, DEFAULT_INCOME_CATEGORIES } from "@/shared/constants/budget";

export interface BudgetPageProps {
  user: User;
  budgets: Budget[];
  onUpdateIncome: (newIncome: number) => void; // Kept for compatibility but unused
  onUpdateSavings: (newSavings: number) => void; // Kept for compatibility but unused
  onUpdateBudget: (category: string, newBudget: number, type?: CategoryType) => void;
  onAddCategory: (category: string, type?: CategoryType) => void;
  onDeleteCategory: (category: string) => void;
}

interface BudgetEditDrawerProps {
  category: string;
  currentBudget: number;
  currentType: CategoryType;
  onUpdateBudget: (category: string, newBudget: number, type: CategoryType) => void;
}

function BudgetEditDrawer({ category, currentBudget, currentType, onUpdateBudget }: BudgetEditDrawerProps) {
  const [budgetValue, setBudgetValue] = useState(String(currentBudget));
  const [categoryType, setCategoryType] = useState<CategoryType>(currentType);

  const handleUpdate = () => {
    const newValue = parseFloat(budgetValue);
    if (!isNaN(newValue)) {
      onUpdateBudget(category, newValue, categoryType);
    }
  };

  const typeInfo = getCategoryTypeInfo(categoryType);

  return (
    <DrawerContent>
      <DrawerHeader>
        <DrawerTitle>Edit Budget: {category}</DrawerTitle>
        <DrawerDescription>
          Adjust the monthly budget and category type
        </DrawerDescription>
      </DrawerHeader>
      <div className="p-4 space-y-6">
        {/* Category Type Selector */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Category Type</label>
          <Select value={categoryType} onValueChange={(value: CategoryType) => setCategoryType(value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="income">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-green-500" />
                  Income
                </div>
              </SelectItem>
              <SelectItem value="expense">
                <div className="flex items-center gap-2">
                  <TrendingDown className="h-4 w-4 text-red-500" />
                  Expense
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Budget Amount */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Monthly Budget</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-3xl text-muted-foreground">$</span>
            <Input
              type="number"
              step="0.01"
              inputMode="decimal"
              value={budgetValue}
              onChange={(e) => setBudgetValue(e.target.value)}
              onBlur={handleUpdate}
              placeholder="0.00"
              className="h-auto w-full border-none bg-transparent text-center text-3xl font-bold pl-8"
            />
          </div>
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
  onUpdateBudget, 
  onAddCategory, 
  onDeleteCategory 
}: BudgetPageProps) {
  const [newCategory, setNewCategory] = useState("");
  const [newCategoryType, setNewCategoryType] = useState<CategoryType>("expense");
  const [isCategoryManagerOpen, setCategoryManagerOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string>("");
  
  const categories = user?.categories || [];

  // Calculate totals using BudgetService
  const totalIncomeBudget = useMemo(() => 
    BudgetService.getTotalIncomeBudget(budgets), [budgets]
  );
  
  const totalExpenseBudget = useMemo(() => 
    BudgetService.getTotalExpenseBudget(budgets), [budgets]
  );
  
  const plannedSavings = useMemo(() => 
    BudgetService.getPlannedSavings(budgets), [budgets]
  );

  const budgetStatus = getBudgetStatus(totalIncomeBudget, totalExpenseBudget);

  const handleAddCategory = () => {
    const validation = validateCategoryName(newCategory, categories);
    
    if (!validation.isValid) {
      setValidationError(validation.error || "Invalid category name");
      return;
    }

    onAddCategory(newCategory.trim(), newCategoryType);
    setNewCategory("");
    setValidationError("");
  };

  const getBudgetForCategory = (category: string) => {
    return budgets.find(b => b.Category === category)?.MonthlyBudget ?? 0;
  };

  const getCategoryType = (category: string): CategoryType => {
    return budgets.find(b => b.Category === category)?.type ?? 'expense';
  };
  
  const handleUpdateAndCloseDrawer = (category: string, newBudget: number, type: CategoryType) => {
    onUpdateBudget(category, newBudget, type);
    setEditingCategory(null);
  };

  // Group categories by type for display
  const incomeBudgets = budgets.filter(b => b.type === 'income');
  const expenseBudgets = budgets.filter(b => (b.type || 'expense') === 'expense');

  return (
    <div className="space-y-6 px-4">
      {/* Budget Summary Header */}
      <Card className="border-none shadow-none">
        <CardHeader>
          <CardTitle>Budget Overview</CardTitle>
          <CardDescription>Manage your income and expense categories</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <div className="text-sm text-muted-foreground">Total Income Budget</div>
              <div className="text-2xl font-bold text-green-600">
                {formatBudgetAmount(totalIncomeBudget)}
              </div>
            </div>
            <div className="space-y-1">
              <div className="text-sm text-muted-foreground">Total Expense Budget</div>
              <div className="text-2xl font-bold text-red-600">
                {formatBudgetAmount(totalExpenseBudget)}
              </div>
            </div>
          </div>
          
          <div className="pt-2 border-t">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <div className="text-sm text-muted-foreground">Planned Savings</div>
                <div className={`text-xl font-bold ${budgetStatus.color}`}>
                  {formatBudgetAmount(plannedSavings, true)}
                </div>
              </div>
              <Badge variant="outline" className={`${budgetStatus.bgColor} ${budgetStatus.color}`}>
                {budgetStatus.label}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {budgetStatus.message}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Category Management */}
      <Card className="border-none shadow-none">
        <CardHeader className="flex-row items-center justify-between">
          <div className="space-y-1.5">
            <CardTitle>Categories</CardTitle>
            <CardDescription>Manage your budget categories and amounts</CardDescription>
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
                <DrawerDescription>Add or remove budget categories</DrawerDescription>
              </DrawerHeader>
              <div className="px-4 space-y-4">
                {/* Add Category Form */}
                <div className="space-y-3">
                  <div className="flex w-full items-center space-x-2">
                    <Input 
                      value={newCategory}
                      onChange={(e) => {
                        setNewCategory(e.target.value);
                        setValidationError("");
                      }}
                      placeholder="New category name..."
                      className="h-10"
                      onKeyDown={(e) => e.key === 'Enter' && handleAddCategory()}
                    />
                    <Select value={newCategoryType} onValueChange={(value: CategoryType) => setNewCategoryType(value)}>
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="income">Income</SelectItem>
                        <SelectItem value="expense">Expense</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button size="sm" onClick={handleAddCategory} className="h-10">
                      <Plus className="h-4 w-4 mr-1"/>
                      Add
                    </Button>
                  </div>
                  {validationError && (
                    <p className="text-sm text-red-600">{validationError}</p>
                  )}
                </div>
              </div>
              
              {/* Categories List */}
              <ScrollArea className="h-64 mt-4 scrollbar-hide">
                <div className="space-y-2 px-4">
                  {categories.map((category: string) => {
                    const categoryType = getCategoryType(category);
                    const typeInfo = getCategoryTypeInfo(categoryType);
                    
                    return (
                      <div key={category} className="flex items-center justify-between rounded-md border p-3">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">{category}</span>
                          <Badge variant="outline" className="text-xs">
                            <span className="mr-1">{typeInfo.icon}</span>
                            {typeInfo.label}
                          </Badge>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-destructive" 
                          onClick={() => onDeleteCategory(category)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    );
                  })}
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

        <CardContent className="space-y-6 pb-4">
          {/* Budget Edit Drawer */}
          <Drawer open={!!editingCategory} onOpenChange={(isOpen) => !isOpen && setEditingCategory(null)}>
            {editingCategory && (
              <BudgetEditDrawer 
                category={editingCategory}
                currentBudget={getBudgetForCategory(editingCategory)}
                currentType={getCategoryType(editingCategory)}
                onUpdateBudget={handleUpdateAndCloseDrawer}
              />
            )}
          </Drawer>

          {/* Income Categories */}
          {incomeBudgets.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-green-500" />
                <h3 className="font-medium text-green-700">Income Categories</h3>
              </div>
              <div className="space-y-2">
                {incomeBudgets.map((budget) => (
                  <button 
                    key={budget.Category} 
                    onClick={() => setEditingCategory(budget.Category)}
                    className="flex items-center justify-between gap-4 w-full p-3 rounded-md border border-green-100 bg-green-50/50 hover:bg-green-50"
                  >
                    <span className="font-medium truncate pr-2">{budget.Category}</span>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-green-700 font-medium">
                        {formatBudgetAmount(budget.MonthlyBudget)}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Expense Categories */}
          {expenseBudgets.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <TrendingDown className="h-4 w-4 text-red-500" />
                <h3 className="font-medium text-red-700">Expense Categories</h3>
              </div>
              <div className="space-y-2">
                {expenseBudgets.map((budget) => (
                  <button 
                    key={budget.Category} 
                    onClick={() => setEditingCategory(budget.Category)}
                    className="flex items-center justify-between gap-4 w-full p-3 rounded-md border border-red-100 bg-red-50/50 hover:bg-red-50"
                  >
                    <span className="font-medium truncate pr-2">{budget.Category}</span>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-red-700 font-medium">
                        {formatBudgetAmount(budget.MonthlyBudget)}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Empty State */}
          {categories.length === 0 && (
            <div className="text-center text-muted-foreground py-8">
              <p className="text-lg font-medium">No categories yet</p>
              <p className="text-sm">Add your first category to start budgeting</p>
              <Button 
                variant="outline" 
                className="mt-4"
                onClick={() => setCategoryManagerOpen(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Category
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

    