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
    fixedAmount: number;
    hidden: boolean;
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
  fixedAmount: number;
  hidden: boolean;
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
  cost: {
    costPerKg: number;
    unit: 'kg' | 'unit';
  };
  category: string;
  isUnitFood: boolean;
  useFixedAmount: boolean;
  fixedAmount: number;
  hidden: boolean;
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
  fixedAmount: number;
  cost: FoodCost;
  metadata: Partial<FoodMetadata>;
}
