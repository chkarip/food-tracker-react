// TypeScript interfaces for food tracker

export interface NutritionData {
  protein: number;
  fats: number;
  carbs: number;
  calories: number;
}

export interface FoodItem {
  name: string;
  nutrition: NutritionData;
  isUnitFood: boolean; // true for items measured per unit (eggs, wraps), false for weight-based (per 100g)
}

export interface SelectedFood {
  name: string;
  amount: number; // grams for weight foods, number of units for unit foods
}

export interface MacroTargets {
  protein: number;
  fats: number;
  carbs: number;
  caloriesMin: number;
  caloriesMax: number;
}

export interface ExternalNutrition {
  protein: number;
  fats: number;
  carbs: number;
  calories: number;
}

export interface DailyPlan {
  selectedFoods: SelectedFood[];
  externalNutrition: ExternalNutrition;
  date: string;
}

export interface MealCost {
  individualCosts: Record<string, number>;
  totalCost: number;
}
