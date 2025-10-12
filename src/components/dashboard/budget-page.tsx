
"use client";

import { useState, useMemo } from "react";
import { type Budget, type User, type CategoryType } from "@/shared/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { 
  Wallet, 
  TrendingUp, 
  TrendingDown, 
  Plus, 
  Trash2, 
  Pencil,
  Target,
  DollarSign
} from "lucide-react";
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

  return (
    <div className="space-y-6 p-4">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <DollarSign className="w-8 h-8 text-primary" />
        </div>
        <h3 className="text-xl font-bold">Edit {category}</h3>
        <p className="text-muted-foreground">
          Set your monthly budget for this category
        </p>
      </div>

      {/* Budget Input Card */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <Label htmlFor="budget">Monthly Budget</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground text-lg">
                $
              </span>
              <Input
                id="budget"
                type="number"
                step="0.01"
                inputMode="decimal"
                value={budgetValue}
                onChange={(e) => setBudgetValue(e.target.value)}
                placeholder="0.00"
                className="h-12 text-lg pl-8"
                min="0"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Category Type Selection */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <Label>Category Type</Label>
            <Select value={categoryType} onValueChange={(value: CategoryType) => setCategoryType(value)}>
              <SelectTrigger className="h-12">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="income">Income</SelectItem>
                <SelectItem value="expense">Expense</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Update Button */}
      <DrawerClose asChild>
        <Button 
          onClick={handleUpdate}
          className="w-full h-12 text-lg font-semibold"
          size="lg"
        >
          Update Budget
        </Button>
      </DrawerClose>
    </div>
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
  
  // Get all categories (user categories + default income categories)
  const userCategories = user?.categories || [];
  const userIncomeCategories = user?.incomeCategories || DEFAULT_INCOME_CATEGORIES;
  const allCategories = [...userCategories, ...userIncomeCategories];

  // Calculate totals using BudgetService
  const totalIncomeBudget = useMemo(() => 
    BudgetService.getTotalIncomeBudget(budgets), [budgets]
  );
  
  const totalExpenseBudget = useMemo(() => 
    BudgetService.getTotalExpenseBudget(budgets), [budgets]
  );

  const plannedSavings = totalIncomeBudget - totalExpenseBudget;
  const budgetStatus = getBudgetStatus(plannedSavings, totalIncomeBudget);

  // Separate budgets by type
  const incomeBudgets = budgets.filter(b => b.type === 'income');
  const expenseBudgets = budgets.filter(b => b.type === 'expense');

  // Get default income categories that don't have budgets yet
  const defaultIncomeCategoriesToShow = DEFAULT_INCOME_CATEGORIES.filter(
    category => !incomeBudgets.some(b => b.Category === category)
  );

  const getBudgetForCategory = (category: string) => {
    return budgets.find(b => b.Category === category)?.MonthlyBudget ?? 0;
  };

  const getCategoryType = (category: string): CategoryType => {
    const budget = budgets.find(b => b.Category === category);
    if (budget) return budget.type || 'expense';
    return (DEFAULT_INCOME_CATEGORIES as readonly string[]).includes(category) ? 'income' : 'expense';
  };

  const handleUpdateAndCloseDrawer = (category: string, newBudget: number, type: CategoryType) => {
    onUpdateBudget(category, newBudget, type);
    setEditingCategory(null);
  };

  const handleAddCategory = () => {
    const trimmedCategory = newCategory.trim();
    const validation = validateCategoryName(trimmedCategory, allCategories);
    
    if (!validation.isValid) {
      setValidationError(validation.error || "Invalid category name");
      return;
    }

    onAddCategory(trimmedCategory, newCategoryType);
    setNewCategory("");
    setValidationError("");
  };

  const handleDeleteCategory = (category: string) => {
    onDeleteCategory(category);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <Wallet className="w-8 h-8 text-primary" />
        </div>
        <h2 className="text-2xl font-bold">Budget Management</h2>
        <p className="text-muted-foreground">
          Manage your income and expense categories
        </p>
      </div>

      {/* Budget Overview Cards */}
      <div className="space-y-4">
        {/* Total Income */}
        <Card>
          <CardContent className="flex items-center justify-between pt-6">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <CardTitle className="text-lg">Total Income Budget</CardTitle>
                <CardDescription>Monthly income allocation</CardDescription>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-green-600">
                {formatBudgetAmount(totalIncomeBudget)}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Total Expenses */}
        <Card>
          <CardContent className="flex items-center justify-between pt-6">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <TrendingDown className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <CardTitle className="text-lg">Total Expense Budget</CardTitle>
                <CardDescription>Monthly spending allocation</CardDescription>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-red-600">
                {formatBudgetAmount(totalExpenseBudget)}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Planned Savings */}
        <Card>
          <CardContent className="flex items-center justify-between pt-6">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                <Target className="w-6 h-6 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg">Planned Savings</CardTitle>
                <CardDescription>Monthly savings target</CardDescription>
              </div>
            </div>
            <div className="text-right">
              <div className={`text-2xl font-bold ${budgetStatus.color}`}>
                {formatBudgetAmount(plannedSavings, true)}
              </div>
              <Badge variant="outline" className={`${budgetStatus.bgColor} ${budgetStatus.color} mt-1`}>
                {budgetStatus.label}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Income Categories */}
      {(incomeBudgets.length > 0 || defaultIncomeCategoriesToShow.length > 0) && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Income Categories</h3>
          
          {/* Income budgets with amounts */}
          {incomeBudgets.map((budget) => (
            <Card key={budget.Category}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                <div>
                  <CardTitle className="text-base">{budget.Category}</CardTitle>
                  <CardDescription>
                    Monthly: {formatBudgetAmount(budget.MonthlyBudget)}
                  </CardDescription>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setEditingCategory(budget.Category)}
                  className="text-primary hover:text-primary"
                >
                  <Pencil className="w-4 h-4" />
                </Button>
              </CardHeader>
            </Card>
          ))}

          {/* Default income categories without budgets */}
          {defaultIncomeCategoriesToShow.map((category) => (
            <Card key={category} className="border-dashed">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                <div>
                  <CardTitle className="text-base text-muted-foreground">{category}</CardTitle>
                  <CardDescription>
                    No budget set
                  </CardDescription>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setEditingCategory(category)}
                  className="text-primary hover:text-primary"
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </CardHeader>
            </Card>
          ))}
        </div>
      )}

      {/* Expense Categories */}
      {expenseBudgets.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Expense Categories</h3>
          
          {expenseBudgets.map((budget) => (
            <Card key={budget.Category}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                <div>
                  <CardTitle className="text-base">{budget.Category}</CardTitle>
                  <CardDescription>
                    Monthly: {formatBudgetAmount(budget.MonthlyBudget)}
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setEditingCategory(budget.Category)}
                    className="text-primary hover:text-primary"
                  >
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDeleteCategory(budget.Category)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      )}

      {/* Add New Category */}
      <Card className="border-dashed">
        <CardContent className="pt-6">
          <div className="space-y-4">
            <Label htmlFor="newCategory">Add New Category</Label>
            <div className="flex gap-2">
              <Input
                id="newCategory"
                placeholder="e.g., Healthcare, Travel"
                value={newCategory}
                onChange={(e) => {
                  setNewCategory(e.target.value);
                  setValidationError("");
                }}
                onKeyPress={(e) => e.key === 'Enter' && handleAddCategory()}
                className="flex-1"
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
              <Button onClick={handleAddCategory} disabled={!newCategory.trim()}>
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            {validationError && (
              <p className="text-sm text-destructive">{validationError}</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Empty State */}
      {allCategories.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <Wallet className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium mb-2">No categories yet</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Add your first category to start budgeting
            </p>
            <Button onClick={() => setCategoryManagerOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Category
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Edit Budget Drawer */}
      <Drawer open={!!editingCategory} onOpenChange={(open) => !open && setEditingCategory(null)}>
        <DrawerContent>
          {editingCategory && (
            <BudgetEditDrawer
              category={editingCategory}
              currentBudget={getBudgetForCategory(editingCategory)}
              currentType={getCategoryType(editingCategory)}
              onUpdateBudget={handleUpdateAndCloseDrawer}
            />
          )}
        </DrawerContent>
      </Drawer>
    </div>
  );
}

    