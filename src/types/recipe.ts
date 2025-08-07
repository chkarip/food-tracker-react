/**
 * Recipe Types and Interfaces
 */

export interface RecipeIngredient {
  id: string;
  foodName: string;
  amount: number;
  unit: string;
  nutrition: {
    protein: number;
    fats: number;
    carbs: number;
    calories: number;
  };
  cost: number;
}

export interface Recipe {
  id: string;
  name: string;
  description?: string;
  instructions: string[];
  ingredients: RecipeIngredient[];
  servings: number;
  isFixedServing: boolean;
  totalNutrition: {
    protein: number;
    fats: number;
    carbs: number;
    calories: number;
  };
  totalCost: number;
  nutritionPerServing: {
    protein: number;
    fats: number;
    carbs: number;
    calories: number;
  };
  costPerServing: number;
  category?: string;
  cookingTime?: number; // in minutes
  difficulty?: 'Easy' | 'Medium' | 'Hard';
  tags?: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface RecipeFormData {
  name: string;
  description: string;
  instructions: string[];
  ingredients: RecipeIngredient[];
  servings: number;
  isFixedServing: boolean;
  category: string;
  cookingTime: number;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  tags: string[];
}
