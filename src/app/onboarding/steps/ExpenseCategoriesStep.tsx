'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ShoppingCart, ArrowRight, AlertTriangle, Info, RotateCcw, Plus, Trash2 } from 'lucide-react';
import { useOnboarding } from '../OnboardingContext';

const DEFAULT_EXPENSE_CATEGORIES = [
  { key: 'F&B', label: 'F&B', description: 'Food, dining, groceries' },
  { key: 'Shopping', label: 'Shopping', description: 'Clothing, electronics, retail' },
  { key: 'Transport', label: 'Transport', description: 'Gas, public transit, ride-sharing' },
  { key: 'Bills', label: 'Bills', description: 'Utilities, phone, subscriptions' },
  { key: 'Others', label: 'Others', description: 'Miscellaneous expenses and other purchases' },
];

export function ExpenseCategoriesStep() {
  const { 
    data, 
    updateData, 
    nextStep, 
    canProceedToNext, 
    getAvailableExpenseBudget,
    addCustomExpenseCategory,
    removeExpenseCategory
  } = useOnboarding();
  
  const [localCategories, setLocalCategories] = useState(data.expenseCategories);
  const [newCategoryName, setNewCategoryName] = useState('');

  const availableBudget = getAvailableExpenseBudget();
  const allocatedExpenses = Object.values(localCategories).reduce((sum, amount) => sum + parseFloat(amount || '0'), 0);
  const remainingBudget = availableBudget - allocatedExpenses;

  const handleCategoryChange = (category: string, value: string) => {
    const newCategories = { ...localCategories, [category]: value };
    setLocalCategories(newCategories);
    updateData({ expenseCategories: newCategories });
  };

  const handleAddCategory = () => {
    if (!newCategoryName.trim()) return;
    
    const success = addCustomExpenseCategory(newCategoryName);
    if (success) {
      setNewCategoryName('');
    }
  };

  const handleRemoveCategory = (category: string) => {
    removeExpenseCategory(category);
    // Also remove from local state if it exists
    if (category in localCategories) {
      const newCategories = { ...localCategories };
      delete newCategories[category];
      setLocalCategories(newCategories);
    }
  };

  const handleNext = () => {
    if (canProceedToNext()) {
      nextStep();
    }
  };

  const autoDistribute = () => {
    const activeCategories = [
      ...Object.keys(data.expenseCategories),
      ...data.customExpenseCategories
    ];
    const amountPerCategory = Math.floor(availableBudget / activeCategories.length);
    const newCategories: { [key: string]: string } = {};
    
    activeCategories.forEach(category => {
      newCategories[category] = amountPerCategory.toString();
    });
    
    setLocalCategories(newCategories);
    updateData({ expenseCategories: newCategories });
  };

  const isOverBudget = allocatedExpenses > availableBudget;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <ShoppingCart className="w-8 h-8 text-primary" />
        </div>
        <h2 className="text-2xl font-bold">Expense Categories</h2>
        <p className="text-muted-foreground">
          Allocate your ${availableBudget.toLocaleString()} expense budget
        </p>
      </div>

      {/* Budget Overview */}
      <Card className="bg-muted/50">
        <CardContent className="pt-6">
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Available Budget</span>
              <span className="font-semibold">${availableBudget.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Allocated</span>
              <span className={`font-semibold ${isOverBudget ? 'text-destructive' : 'text-primary'}`}>
                ${allocatedExpenses.toLocaleString()}
              </span>
            </div>
            <hr className="my-2" />
            <div className="flex justify-between">
              <span className="font-medium">Remaining</span>
              <span className={`font-bold ${remainingBudget >= 0 ? 'text-green-600' : 'text-destructive'}`}>
                ${remainingBudget.toLocaleString()}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Expense Categories */}
      <div className="space-y-4">
        {/* Default Categories - Only show if they exist in data */}
        {DEFAULT_EXPENSE_CATEGORIES.filter(category => 
          Object.keys(data.expenseCategories).includes(category.key)
        ).map((category) => (
          <Card key={category.key}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <div>
                <CardTitle className="text-base">{category.label}</CardTitle>
                <CardDescription className="text-sm">
                  {category.description}
                </CardDescription>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleRemoveCategory(category.key)}
                className="text-destructive hover:text-destructive"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor={category.key}>Monthly Budget</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground text-lg">
                    $
                  </span>
                  <Input
                    id={category.key}
                    type="number"
                    inputMode="decimal"
                    placeholder="0"
                    value={localCategories[category.key] || ''}
                    onChange={(e) => handleCategoryChange(category.key, e.target.value)}
                    className="h-12 text-lg pl-8"
                    min="0"
                    step="0.01"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {/* Custom Categories */}
        {data.customExpenseCategories.map((category) => (
          <Card key={category}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-base">{category}</CardTitle>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleRemoveCategory(category)}
                className="text-destructive hover:text-destructive"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor={category}>Monthly Budget</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground text-lg">
                    $
                  </span>
                  <Input
                    id={category}
                    type="number"
                    inputMode="decimal"
                    placeholder="0"
                    value={localCategories[category] || ''}
                    onChange={(e) => handleCategoryChange(category, e.target.value)}
                    className="h-12 text-lg pl-8"
                    min="0"
                    step="0.01"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Add New Category */}
      <Card className="border-dashed">
        <CardContent className="pt-6">
          <div className="space-y-4">
            <Label htmlFor="newExpenseCategory">Add New Expense Category</Label>
            <div className="flex gap-2">
              <Input
                id="newExpenseCategory"
                placeholder="e.g., Healthcare, Travel, Pets"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAddCategory()}
                className="flex-1"
              />
              <Button onClick={handleAddCategory} disabled={!newCategoryName.trim()}>
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Warnings */}
      {isOverBudget && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            You&apos;ve allocated ${(allocatedExpenses - availableBudget).toLocaleString()} more than your available budget. 
            Please adjust the amounts.
          </AlertDescription>
        </Alert>
      )}

      {allocatedExpenses > 0 && !isOverBudget && remainingBudget > 0 && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            You have ${remainingBudget.toLocaleString()} unallocated. 
            Consider adding it to categories or keeping it as a buffer.
          </AlertDescription>
        </Alert>
      )}

      {/* Continue Button */}
      <Button 
        onClick={handleNext}
        disabled={!canProceedToNext()}
        className="w-full h-12 text-lg font-semibold"
        size="lg"
      >
        Continue
        <ArrowRight className="w-5 h-5 ml-2" />
      </Button>

      {/* Tips */}
      <div className="text-center">
        <p className="text-sm text-muted-foreground">
          You can leave categories at $0 if you don&apos;t plan to use them
        </p>
      </div>
    </div>
  );
}