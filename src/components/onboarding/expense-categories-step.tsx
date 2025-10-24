"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, X, ShoppingCart } from "lucide-react";
import { type WizardData } from "./setup-wizard";

interface ExpenseCategoriesStepProps {
  data: WizardData;
  updateData: (updates: Partial<WizardData>) => void;
  onNext: () => void;
  onComplete?: () => void;
  isLoading?: boolean;
}

export function ExpenseCategoriesStep({ data, updateData, onNext }: ExpenseCategoriesStepProps) {
  const [newCategory, setNewCategory] = useState("");

  const addCategory = () => {
    if (newCategory.trim() && !data.expenseCategories.includes(newCategory.trim())) {
      updateData({
        expenseCategories: [...data.expenseCategories, newCategory.trim()]
      });
      setNewCategory("");
    }
  };

  const removeCategory = (category: string) => {
    updateData({
      expenseCategories: data.expenseCategories.filter((c: string) => c !== category)
    });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addCategory();
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <div className="flex justify-center mb-4">
          <div className="p-3 bg-primary/10 rounded-full">
            <ShoppingCart className="h-8 w-8 text-primary" />
          </div>
        </div>
        <h2 className="text-2xl font-bold">Expense Categories</h2>
        <p className="text-muted-foreground">
          Organize your spending with categories. We&apos;ve included the most common ones.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Your Expense Categories</CardTitle>
          <CardDescription>
            Add or remove categories to match your spending habits.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Current Categories */}
          <div className="flex flex-wrap gap-2">
            {data.expenseCategories.map((category: string) => (
              <Badge
                key={category}
                variant="secondary"
                className="flex items-center gap-2 px-3 py-1"
              >
                {category}
                <button
                  onClick={() => removeCategory(category)}
                  className="hover:text-destructive"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>

          {/* Add New Category */}
          <div className="flex gap-2">
            <Input
              placeholder="Entertainment, Health, etc."
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              onKeyPress={handleKeyPress}
              className="text-center font-medium placeholder:font-medium placeholder:text-muted-foreground"
            />
            <Button
              onClick={addCategory}
              disabled={!newCategory.trim()}
              size="icon"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          <p className="text-xs text-muted-foreground">
            You can always modify these categories later in your settings.
          </p>
        </CardContent>
      </Card>

      <Button 
        onClick={onNext} 
        className="w-full"
        disabled={data.expenseCategories.length === 0}
      >
        Continue
      </Button>
    </div>
  );
}