import { FoodItem, MacroTargets } from '../types/nutrition';

// Daily macro targets
export const MACRO_TARGETS: MacroTargets = {
  protein: 125,    // grams
  fats: 61,        // grams
  carbs: 287,      // grams
  caloriesMin: 2100, // kcal
  caloriesMax: 2200  // kcal
};

// Unit foods (measured per individual item, not per 100g)
export const UNIT_FOODS = ['Eggs', 'Tortilla wrap', 'Canned tuna'];

// Comprehensive nutrition database
export const FOOD_DATABASE: Record<string, FoodItem> = {
  'Greek yogurt': {
    name: 'Greek yogurt',
    nutrition: { protein: 10, fats: 0, carbs: 4, calories: 57 },
    isUnitFood: false
  },
  'Peanut-butter': {
    name: 'Peanut-butter',
    nutrition: { protein: 33, fats: 50, carbs: 17, calories: 588 },
    isUnitFood: false
  },
  'Dry rice': {
    name: 'Dry rice',
    nutrition: { protein: 7, fats: 0.6, carbs: 78, calories: 360 },
    isUnitFood: false
  },
  'Dry lentils': {
    name: 'Dry lentils',
    nutrition: { protein: 25.4, fats: 1.1, carbs: 60, calories: 350 },
    isUnitFood: false
  },
  'Bulk oats': {
    name: 'Bulk oats',
    nutrition: { protein: 14.2, fats: 7, carbs: 67, calories: 383 },
    isUnitFood: false
  },
  'Chicken-breast': {
    name: 'Chicken-breast',
    nutrition: { protein: 31, fats: 3.6, carbs: 0, calories: 165 },
    isUnitFood: false
  },
  'Edamame': {
    name: 'Edamame',
    nutrition: { protein: 11, fats: 5, carbs: 8, calories: 121 },
    isUnitFood: false
  },
  'Canned tuna': {
    name: 'Canned tuna',
    nutrition: { protein: 30, fats: 1, carbs: 0, calories: 132 },
    isUnitFood: true // measured per can
  },
  'Whey isolate': {
    name: 'Whey isolate',
    nutrition: { protein: 80, fats: 3, carbs: 8, calories: 365 },
    isUnitFood: false
  },
  'Eggs': {
    name: 'Eggs',
    nutrition: { protein: 7.5, fats: 6.2, carbs: 0.7, calories: 90 },
    isUnitFood: true // measured per egg
  },
  'Tortilla wrap': {
    name: 'Tortilla wrap',
    nutrition: { protein: 6, fats: 8, carbs: 52, calories: 320 },
    isUnitFood: true // measured per wrap
  },
  'Almonds/Walnuts': {
    name: 'Almonds/Walnuts',
    nutrition: { protein: 20, fats: 50, carbs: 22, calories: 575 },
    isUnitFood: false
  },
  'Dark-chocolate 74%': {
    name: 'Dark-chocolate 74%',
    nutrition: { protein: 9.6, fats: 42, carbs: 46, calories: 580 },
    isUnitFood: false
  },
  'Oatmeal': {
    name: 'Oatmeal',
    nutrition: { protein: 7, fats: 3, carbs: 19.7, calories: 130.7 },
    isUnitFood: false
  }
};
