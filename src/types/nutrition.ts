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
  portionIndex?: number; // Index of selected portion size from fixedAmounts array (0, 1, or 2)
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

// Timeslot configuration for dynamic meal planning
export interface TimeslotConfig {
  id: string;
  time: string; // e.g., "6:00 PM"
  icon: string; // emoji or icon name, e.g., "🌅", "🌙"
  name: string; // e.g., "Afternoon", "Evening"
}

// User's macro targets (replaces nutritionGoals table, supports both old and new format)
export interface MacroTargets {
  protein: number;
  fats: number;
  carbs: number;
  calories: number;
  caloriesMin?: number; // Legacy format support
  caloriesMax?: number; // Legacy format support
}
