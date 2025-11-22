/**
 * useRecipeCalculations.ts - Nutrition and cost calculation logic for recipes
 * 
 * Handles all recipe-related calculations:
 * - Ingredient nutrition calculations
 * - Ingredient cost calculations
 * - Total recipe nutrition and cost
 * - Per-serving calculations
 */

import { useMemo, useCallback } from 'react';
import { useFoodDatabase } from '../../../../contexts/FoodContext';
import { RecipeIngredient } from '../../../../types/recipe';

const ensureNutritionComplete = (nutrition: any) => ({
  protein: nutrition?.protein || 0,
  fats: nutrition?.fats || 0,
  carbs: nutrition?.carbs || 0,
  calories: nutrition?.calories || 0
});

export const useRecipeCalculations = () => {
  const { foodDatabase: cachedFoodDatabase } = useFoodDatabase();
  
  // Convert foods to legacy format for compatibility
  const foodDatabase = useMemo(() => cachedFoodDatabase, [cachedFoodDatabase]);
  const availableFoods = useMemo(() => Object.keys(foodDatabase), [foodDatabase]);

  // Calculate nutrition for a single ingredient
  const calculateIngredientNutrition = useCallback((foodName: string, amount: number) => {
    const foodItem = foodDatabase[foodName];
    if (!foodItem) return { protein: 0, fats: 0, carbs: 0, calories: 0 };

    const multiplier = foodItem.isUnitFood ? amount : amount / 100;

    return ensureNutritionComplete({
      protein: (foodItem.nutrition?.protein || 0) * multiplier,
      fats: (foodItem.nutrition?.fats || 0) * multiplier,
      carbs: (foodItem.nutrition?.carbs || 0) * multiplier,
      calories: (foodItem.nutrition?.calories || 0) * multiplier
    });
  }, [foodDatabase]);

  // Calculate cost for a single ingredient
  const calculateIngredientCost = useCallback((foodName: string, amount: number) => {
    const foodItem = foodDatabase[foodName];
    if (!foodItem || !foodItem.cost) return 0;

    const multiplier = foodItem.isUnitFood ? amount : amount / 1000; // Convert g to kg
    return Math.max(0, (foodItem.cost.costPerKg || 0) * multiplier);
  }, [foodDatabase]);

  // Get unit for a food item
  const getFoodUnit = useCallback((foodName: string): string => {
    const foodItem = foodDatabase[foodName];
    return foodItem?.isUnitFood ? 'units' : 'g';
  }, [foodDatabase]);

  // Calculate total nutrition from all ingredients
  const calculateTotalNutrition = useCallback((ingredients: RecipeIngredient[]) => {
    return ingredients.reduce((total, ingredient) => {
      const nutrition = ingredient.nutrition || calculateIngredientNutrition(ingredient.foodName, ingredient.amount);
      return {
        protein: total.protein + nutrition.protein,
        fats: total.fats + nutrition.fats,
        carbs: total.carbs + nutrition.carbs,
        calories: total.calories + nutrition.calories
      };
    }, { protein: 0, fats: 0, carbs: 0, calories: 0 });
  }, [calculateIngredientNutrition]);

  // Calculate total cost from all ingredients
  const calculateTotalCost = useCallback((ingredients: RecipeIngredient[]) => {
    return ingredients.reduce((total, ingredient) => {
      return total + (ingredient.cost || calculateIngredientCost(ingredient.foodName, ingredient.amount));
    }, 0);
  }, [calculateIngredientCost]);

  // Calculate nutrition per serving
  const calculateNutritionPerServing = useCallback((totalNutrition: any, servings: number) => {
    if (servings <= 0) return ensureNutritionComplete({});
    
    return {
      protein: (totalNutrition.protein || 0) / servings,
      fats: (totalNutrition.fats || 0) / servings,
      carbs: (totalNutrition.carbs || 0) / servings,
      calories: (totalNutrition.calories || 0) / servings
    };
  }, []);

  // Calculate cost per serving
  const calculateCostPerServing = useCallback((totalCost: number, servings: number) => {
    if (servings <= 0) return 0;
    return totalCost / servings;
  }, []);

  // Get default amount for a food
  const getDefaultAmount = useCallback((foodName: string): number => {
    const foodItem = foodDatabase[foodName];
    return foodItem?.isUnitFood ? 1 : 100;
  }, [foodDatabase]);

  // Create a new ingredient with calculated values
  const createIngredient = useCallback((foodName: string): RecipeIngredient => {
    const defaultAmount = getDefaultAmount(foodName);
    
    return {
      id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      foodName,
      amount: defaultAmount,
      unit: getFoodUnit(foodName),
      nutrition: calculateIngredientNutrition(foodName, defaultAmount),
      cost: calculateIngredientCost(foodName, defaultAmount)
    };
  }, [getDefaultAmount, getFoodUnit, calculateIngredientNutrition, calculateIngredientCost]);

  // Update ingredient with recalculated values
  const updateIngredientCalculations = useCallback((ingredient: RecipeIngredient, field: 'foodName' | 'amount', value: any): RecipeIngredient => {
    const updated = { ...ingredient };

    if (field === 'foodName') {
      updated.foodName = value;
      updated.unit = getFoodUnit(value);
      updated.nutrition = calculateIngredientNutrition(value, updated.amount);
      updated.cost = calculateIngredientCost(value, updated.amount);
    } else if (field === 'amount') {
      updated.amount = Math.max(0, value);
      updated.nutrition = calculateIngredientNutrition(updated.foodName, updated.amount);
      updated.cost = calculateIngredientCost(updated.foodName, updated.amount);
    }

    return updated;
  }, [getFoodUnit, calculateIngredientNutrition, calculateIngredientCost]);

  return {
    foodDatabase,
    availableFoods,
    calculateIngredientNutrition,
    calculateIngredientCost,
    getFoodUnit,
    calculateTotalNutrition,
    calculateTotalCost,
    calculateNutritionPerServing,
    calculateCostPerServing,
    getDefaultAmount,
    createIngredient,
    updateIngredientCalculations
  };
};
