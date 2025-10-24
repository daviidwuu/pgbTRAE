"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, X, TrendingUp } from "lucide-react";
import { type WizardData } from "./setup-wizard";

interface IncomeCategoriesStepProps {
  data: WizardData;
  updateData: (updates: Partial<WizardData>) => void;
  onNext: () => void;
  onComplete?: () => void;
  isLoading?: boolean;
}

export function IncomeCategoriesStep({ data, updateData, onNext }: IncomeCategoriesStepProps) {
  const [newCategory, setNewCategory] = useState("");

  const addCategory = () => {
    if (newCategory.trim() && !data.incomeCategories.includes(newCategory.trim())) {
      updateData({
        incomeCategories: [...data.incomeCategories, newCategory.trim()]
      });
      setNewCategory("");
    }
  };

  const removeCategory = (category: string) => {
    updateData({
      incomeCategories: data.incomeCategories.filter((c: string) => c !== category)
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
            <TrendingUp className="h-8 w-8 text-primary" />
          </div>
        </div>
        <h2 className="text-2xl font-bold">Income Categories</h2>
        <p className="text-muted-foreground">
          Customize your income sources. We&apos;ve added some common ones to get you started.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Your Income Sources</CardTitle>
          <CardDescription>
            Add or remove categories to match your income sources.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Current Categories */}
          <div className="flex flex-wrap gap-2">
            {data.incomeCategories.map((category: string) => (
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
              placeholder="Freelance, Bonus, etc."
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
        disabled={data.incomeCategories.length === 0}
      >
        Continue
      </Button>
    </div>
  );
}