import { NutritionData, SelectedFood } from '../types/nutrition';
import { FOOD_DATABASE } from '../data/foodDatabase';

/**
 * Calculate macro nutrients for a specific food and amount
 */
export const calculateMacros = (food: string, amount: number): NutritionData => {
  const foodItem = FOOD_DATABASE[food];
  if (!foodItem) {
    return { protein: 0, fats: 0, carbs: 0, calories: 0 };
  }

  const nutrition = foodItem.nutrition;
  
  // For unit foods, multiply directly (nutrition data is per unit)
  // For weight foods, convert per 100g to per gram basis
  const factor = foodItem.isUnitFood ? amount : amount / 100;
  
  return {
    protein: nutrition.protein * factor,
    fats: nutrition.fats * factor,
    carbs: nutrition.carbs * factor,
    calories: nutrition.calories * factor
  };
};

/**
 * Calculate total macros for all selected foods
 */
export const calculateTotalMacros = (selectedFoods: SelectedFood[]): NutritionData => {
  const totals = { protein: 0, fats: 0, carbs: 0, calories: 0 };
  
  selectedFoods.forEach(food => {
    const macros = calculateMacros(food.name, food.amount);
    totals.protein += macros.protein;
    totals.fats += macros.fats;
    totals.carbs += macros.carbs;
    totals.calories += macros.calories;
  });
  
  return totals;
};

/**
 * Get the unit text for a food item
 */
export const getFoodUnit = (foodName: string): string => {
  const foodItem = FOOD_DATABASE[foodName];
  if (!foodItem) return 'g';
  
  if (foodItem.isUnitFood) {
    switch (foodName) {
      case 'Eggs': return 'eggs';
      case 'Tortilla wrap': return 'wraps';
      case 'Canned tuna': return 'cans';
      default: return 'units';
    }
  }
  
  return 'g';
};

/**
 * Format macro value for display
 */
export const formatMacroValue = (value: number, decimals: number = 1): string => {
  return value.toFixed(decimals);
};
