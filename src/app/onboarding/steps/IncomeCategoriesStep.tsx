'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Briefcase, ArrowRight, AlertTriangle, Info, Plus, Trash2 } from 'lucide-react';
import { useOnboarding } from '../OnboardingContext';

export function IncomeCategoriesStep() {
  const { 
    data, 
    updateData, 
    nextStep, 
    canProceedToNext,
    addCustomIncomeCategory,
    removeIncomeCategory
  } = useOnboarding();
  
  const [localCategories, setLocalCategories] = useState(data.incomeCategories);
  const [newCategoryName, setNewCategoryName] = useState('');

  const totalIncome = parseFloat(data.monthlyIncome) || 0;
  const allocatedIncome = parseFloat(localCategories['Salary'] || '0') + parseFloat(localCategories['Transfer'] || '0');
  const remainingIncome = totalIncome - allocatedIncome;

  const handleCategoryChange = (category: string, value: string) => {
    const newCategories = { ...localCategories, [category]: value };
    setLocalCategories(newCategories);
    updateData({ incomeCategories: newCategories });
  };

  const handleAddCategory = () => {
    if (!newCategoryName.trim()) return;
    
    const success = addCustomIncomeCategory(newCategoryName);
    if (success) {
      setNewCategoryName('');
    }
  };

  const handleRemoveCategory = (category: string) => {
    removeIncomeCategory(category);
    // Also remove from local state immediately for instant visual feedback
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

  const isOverAllocated = allocatedIncome > totalIncome;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <Briefcase className="w-8 h-8 text-primary" />
        </div>
        <h2 className="text-2xl font-bold">Income Sources</h2>
        <p className="text-muted-foreground">
          Allocate your ${totalIncome.toLocaleString()} monthly income across sources
        </p>
      </div>

      {/* Income Overview */}
      <Card className="bg-muted/50">
        <CardContent className="pt-6">
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total Monthly Income</span>
              <span className="font-semibold">${totalIncome.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Allocated</span>
              <span className={`font-semibold ${isOverAllocated ? 'text-destructive' : 'text-primary'}`}>
                ${allocatedIncome.toLocaleString()}
              </span>
            </div>
            <hr className="my-2" />
            <div className="flex justify-between">
              <span className="font-medium">Remaining</span>
              <span className={`font-bold ${remainingIncome >= 0 ? 'text-green-600' : 'text-destructive'}`}>
                ${remainingIncome.toLocaleString()}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Income Categories */}
      <div className="space-y-4">
        {/* Default Categories - Only show if they exist in data */}
        {Object.keys(data.incomeCategories).includes('Salary') && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <div>
                <CardTitle className="text-lg">Salary</CardTitle>
                <CardDescription>
                  Regular employment income, wages, or salary
                </CardDescription>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleRemoveCategory('Salary')}
                className="text-destructive hover:text-destructive"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="salary">Monthly Amount</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground text-lg">
                    $
                  </span>
                  <Input
                      id="salary"
                      type="number"
                      inputMode="decimal"
                      placeholder="4000"
                      value={localCategories['Salary'] || ''}
                      onChange={(e) => handleCategoryChange('Salary', e.target.value)}
                      className="h-12 text-lg pl-8"
                      min="0"
                      step="0.01"
                    />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Transfer Category - Only show if it exists in data */}
        {Object.keys(data.incomeCategories).includes('Transfer') && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <div>
                <CardTitle className="text-lg">Transfer</CardTitle>
                <CardDescription>
                  Money transfers, family support, or other income sources
                </CardDescription>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleRemoveCategory('Transfer')}
                className="text-destructive hover:text-destructive"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="transfer">Monthly Amount</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground text-lg">
                    $
                  </span>
                  <Input
                      id="transfer"
                      type="number"
                      inputMode="decimal"
                      placeholder="1000"
                      value={localCategories['Transfer'] || ''}
                      onChange={(e) => handleCategoryChange('Transfer', e.target.value)}
                      className="h-12 text-lg pl-8"
                      min="0"
                      step="0.01"
                    />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Custom Categories */}
        {data.customIncomeCategories.map((category) => (
          <Card key={category}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-lg">{category}</CardTitle>
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
                <Label htmlFor={category}>Monthly Amount</Label>
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
            <Label htmlFor="newCategory">Add New Income Category</Label>
            <div className="flex gap-2">
              <Input
                id="newCategory"
                placeholder="e.g., Freelance, Investments"
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
      {isOverAllocated && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            You&apos;ve allocated ${(allocatedIncome - totalIncome).toLocaleString()} more than your total income. 
            Please adjust the amounts.
          </AlertDescription>
        </Alert>
      )}

      {allocatedIncome > 0 && !isOverAllocated && remainingIncome > 0 && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            You have ${remainingIncome.toLocaleString()} unallocated. 
            You can leave this for flexibility or add it to one of the categories.
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
          You can adjust these amounts anytime in the app
        </p>
      </div>
    </div>
  );
}