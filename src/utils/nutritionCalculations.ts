import { NutritionData, SelectedFood } from '../types/nutrition';
import { getAllFoods, convertToLegacyFoodFormat } from '../services/firebase/nutrition/foodService';

/**
 * Calculate macro nutrients for a specific food and amount
 * @param foodName Name of the food
 * @param amount Amount in grams or units
 * @param foodDatabase Food database object from Firebase
 */
export const calculateMacros = (foodName: string, amount: number, foodDatabase: any): NutritionData => {
  const foodItem = foodDatabase[foodName];
  if (!foodItem) {
    return { protein: 0, fats: 0, carbs: 0, calories: 0 };
  }

  const nutrition = foodItem.nutrition;
  const factor = foodItem.isUnitFood ? amount : amount / 100;

  return {
    protein: nutrition.protein * factor,
    fats: nutrition.fats * factor,
    carbs: nutrition.carbs * factor,
    calories: nutrition.calories * factor
  };
};

/**
 * Calculate total macros for all selected foods (requires food database)
 * @param selectedFoods Array of selected foods
 * @param foodDatabase Food database object from Firebase
 */
export const calculateTotalMacros = (selectedFoods: SelectedFood[], foodDatabase: any): NutritionData => {
  const totals = { protein: 0, fats: 0, carbs: 0, calories: 0 };

  selectedFoods.forEach(food => {
    const macros = calculateMacros(food.name, food.amount, foodDatabase);
    totals.protein += macros.protein;
    totals.fats += macros.fats;
    totals.carbs += macros.carbs;
    totals.calories += macros.calories;
  });

  return totals;
};

/**
 * Calculate total macros with automatic Firebase food database loading
 * Use this in service files where you don't have direct access to the food database
 */
export const calculateTotalMacrosWithFirebase = async (selectedFoods: SelectedFood[]): Promise<NutritionData> => {
  try {
    const firebaseFoods = await getAllFoods();
    const foodDatabase = convertToLegacyFoodFormat(firebaseFoods);
    return calculateTotalMacros(selectedFoods, foodDatabase);
  } catch (error) {
    console.error('Error loading food database for macro calculations:', error);
    return { protein: 0, fats: 0, carbs: 0, calories: 0 };
  }
};

/**
 * Get the unit text for a food item
 */
export const getFoodUnit = (foodName: string, foodDatabase: any): string => {
  const foodItem = foodDatabase[foodName];
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
