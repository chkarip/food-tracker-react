/**
 * Central food type definitions - Single source of truth
 */

// ✅ Open Food Facts API Types
export interface OpenFoodFactsProduct {
  code: string;
  product_name: string;
  brands?: string;
  categories?: string;
  nutriments?: {
    proteins_100g?: number;
    fat_100g?: number;
    carbohydrates_100g?: number;
    energy_kcal_100g?: number;
    sugars_100g?: number;
    fiber_100g?: number;
    sodium_100g?: number;
  };
  serving_size?: string;
  quantity?: string;
  image_url?: string;
  ingredients_text?: string;
  nutriscore_grade?: string;
  ecoscore_grade?: string;
}

export interface OpenFoodFactsSearchResult {
  products: OpenFoodFactsProduct[];
  count: number;
  page: number;
  page_size: number;
}

// ✅ Food Search State for Open Food Facts API Integration
export interface FoodSearchState {
  isSearching: boolean;
  searchResults: OpenFoodFactsProduct[];
  selectedApiFood: OpenFoodFactsProduct | null;
  error: string | null;
}

// ✅ Consolidated GoalType with all options
export type GoalType =
  // Range-based goals (new format)
  | 'lose_2_3'
  | 'lose_3_5'
  | 'lose_5_10'
  | 'lose_10_15'
  | 'lose_15_20'
  | 'lose_20_25'
  | 'maintain'
  | 'gain_2_3'
  | 'gain_3_5'
  | 'gain_5_10'
  | 'gain_10_15'
  | 'gain_15_20'
  | 'gain_20_25'
  // Legacy values (for backward compatibility)
  | 'lose_weight'
  | 'gain_muscle'
  | 'lose_aggressive'
  | 'lose_moderate'
  | 'lose_gradual'
  | 'lose_conservative'
  | 'lose_mild'
  | 'gain_mild'
  | 'gain_conservative'
  | 'gain_gradual'
  | 'gain_moderate'
  | 'gain_aggressive';

// ✅ User Profile interfaces
export interface UserProfile {
  userId: string;
  gender: 'male' | 'female';
  age: number;
  height: number; // cm
  weight: number; // kg
  activityLevel: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
  goal: GoalType;
  bodyFatPercentage?: number;
  waterIntakeGoal?: number; // ml per day
  createdAt: Date;
  updatedAt: Date;
}

export interface UserProfileFormData {
  gender: 'male' | 'female';
  age: number;
  height: number;
  weight: number;
  activityLevel: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
  goal: GoalType;
  bodyFatPercentage?: number;
  waterIntakeGoal?: number; // ml per day
}

export interface UserProfileFormData {
  gender: 'male' | 'female';
  age: number;
  height: number;
  weight: number;
  activityLevel: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
  goal: GoalType;
}

export interface CalculatedMacros {
  bmr: number;
  tdee: number;
  adjustedCalories: number;
  protein: number;
  carbs: number;
  fats: number;
  calories: number;
}
export interface NutritionGoal {
  protein: number;
  fats: number;
  carbs: number;
  calories: number;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface NutritionGoalFormData {
  protein: number;
  fats: number;
  carbs: number;
  calories: number;
}
export interface FirebaseFoodItem {
  id: string;
  name: string;
  nutrition: FoodNutrition;
  cost: {
    costPerKg: number;
    unit: 'kg' | 'unit';
    costEfficiency: number | null;
  };
  metadata: {
    isUnitFood: boolean;
    category: string;
    proteinEfficiency: number;
    addedAt: Date;
    lastUpdated: Date;
    useFixedAmount: boolean;
    fixedAmount: number; // Deprecated - kept for backward compatibility
    fixedAmounts?: number[]; // New: Array of up to 3 portion sizes
    hidden: boolean;
    favorite: boolean;
  };
}
/**
 * Central food type definitions - Single source of truth
 */

export interface FoodNutrition {
  protein: number;
  fats: number;
  carbs: number;
  calories: number;
}

export interface FoodCost {
  costPerKg: number;
  unit: 'kg' | 'unit';
}

export interface FoodMetadata {
  category: string;
  isUnitFood: boolean;
  useFixedAmount: boolean;
  fixedAmount: number; // Deprecated - kept for backward compatibility
  fixedAmounts?: number[]; // New: Array of up to 3 portion sizes
  hidden: boolean;
  favorite: boolean;
  addedAt?: Date;
  lastUpdated?: Date;
}

// Base food interface - the single source of truth
export interface BaseFoodData {
  name: string;
  nutrition: FoodNutrition;
  cost: FoodCost;
  metadata: FoodMetadata;
}

// Form data for creating/editing foods
export interface FoodFormData {
  name: string;
  nutrition: FoodNutrition;
  cost?: {
    costPerKg: number;
    unit: 'kg' | 'unit';
  };
  category: string;
  isUnitFood: boolean;
  useFixedAmount: boolean;
  fixedAmount: number; // Deprecated - kept for backward compatibility
  fixedAmounts?: number[]; // New: Array of up to 3 portion sizes
  hidden: boolean;
  favorite: boolean;
}

// Firestore food item
export interface FirestoreFood {
  name: string;
  nutrition: FoodNutrition;
  cost: FoodCost;
  metadata?: Partial<FoodMetadata>;
  firestoreId: string;
}

// Legacy format for existing components
export interface LegacyFoodItem {
  name: string;
  nutrition: FoodNutrition;
  isUnitFood: boolean;
  useFixedAmount: boolean;
  fixedAmount: number; // Deprecated - kept for backward compatibility
  fixedAmounts?: number[]; // New: Array of up to 3 portion sizes
  cost: FoodCost;
  metadata: Partial<FoodMetadata>;
}
