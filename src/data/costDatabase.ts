// Cost database based on nutrition_data.py from Python backend
// Prices in EUR

export interface CostInfo {
  costPerKg: number;
  unit: 'kg' | 'unit'; // 'kg' for weight-based, 'unit' for individual items
}

// Cost database (€/kg or €/unit)
export const COST_DATABASE: Record<string, CostInfo> = {
  'Dry lentils': { costPerKg: 1.88, unit: 'kg' },
  'Dry rice': { costPerKg: 1.00, unit: 'kg' },
  'Bulk oats': { costPerKg: 1.90, unit: 'kg' },
  'Greek yogurt': { costPerKg: 2.29, unit: 'kg' },
  'Eggs': { costPerKg: 0.20, unit: 'unit' }, // Cost per egg
  'Tortilla wrap': { costPerKg: 4.46, unit: 'kg' },
  'Edamame': { costPerKg: 5.18, unit: 'kg' },
  'Peanut-butter': { costPerKg: 6.38, unit: 'kg' },
  'Chicken-breast': { costPerKg: 8.50, unit: 'kg' },
  'Canned tuna': { costPerKg: 2.50, unit: 'unit' }, // Cost per can
  'Dark-chocolate 74%': { costPerKg: 15.00, unit: 'kg' },
  'Almonds/Walnuts': { costPerKg: 19.21, unit: 'kg' }, // Average of almonds and walnuts
  'Whey isolate': { costPerKg: 28.09, unit: 'kg' },
  'Oatmeal': { costPerKg: 0.53, unit: 'kg' }
};

/**
 * Calculate the cost of a specific portion of food
 * @param foodName Name of the food item
 * @param amount Amount in grams for weight foods, or number of units for unit foods
 * @returns Cost in euros for the specified portion, or null if food not found
 */
export const calculatePortionCost = (foodName: string, amount: number): number | null => {
  const costInfo = COST_DATABASE[foodName];
  if (!costInfo) return null;
  
  if (costInfo.unit === 'unit') {
    // Unit-based pricing (e.g., eggs, canned tuna)
    return costInfo.costPerKg * amount;
  } else {
    // Weight-based pricing (per kg)
    const costPerGram = costInfo.costPerKg / 1000; // Convert €/kg to €/g
    return costPerGram * amount;
  }
};

/**
 * Calculate cost per gram for display in food selector
 * @param foodName Name of the food item  
 * @param isUnitFood Whether this is a unit-based food
 * @returns Cost per gram in euros, or null if not available
 */
export const getCostPerGram = (foodName: string, isUnitFood: boolean): number | null => {
  const costInfo = COST_DATABASE[foodName];
  if (!costInfo) return null;
  
  if (costInfo.unit === 'unit') {
    // For unit foods, we can't give a per-gram price as it varies by food
    // We'll return the cost per unit instead
    return costInfo.costPerKg;
  } else {
    // Weight-based pricing
    return costInfo.costPerKg / 1000; // Convert €/kg to €/g
  }
};

/**
 * Calculate total cost of all selected foods
 * @param selectedFoods Array of selected foods with amounts
 * @returns Object with individual costs and total cost
 */
export const calculateTotalMealCost = (selectedFoods: Array<{name: string, amount: number}>): {
  individualCosts: Record<string, number>;
  totalCost: number;
} => {
  const individualCosts: Record<string, number> = {};
  let totalCost = 0;
  
  selectedFoods.forEach(food => {
    const portionCost = calculatePortionCost(food.name, food.amount);
    if (portionCost !== null) {
      individualCosts[food.name] = portionCost;
      totalCost += portionCost;
    } else {
      individualCosts[food.name] = 0;
    }
  });
  
  return { individualCosts, totalCost };
};

/**
 * Format cost for display
 * @param cost Cost in euros
 * @param decimals Number of decimal places
 * @returns Formatted cost string
 */
export const formatCost = (cost: number, decimals: number = 2): string => {
  return `€${cost.toFixed(decimals)}`;
};

/**
 * Get cost efficiency (cost per gram of protein)
 * @param foodName Name of the food item
 * @param proteinPer100g Protein content per 100g
 * @returns Cost per gram of protein in euros, or null if not available
 */
export const getCostPerProteinGram = (foodName: string, proteinPer100g: number): number | null => {
  const costInfo = COST_DATABASE[foodName];
  if (!costInfo || proteinPer100g <= 0) return null;
  
  if (costInfo.unit === 'unit') {
    // Can't calculate protein efficiency for unit foods without knowing unit weight
    return null;
  }
  
  // Cost per 100g of food
  const costPer100g = (costInfo.costPerKg / 1000) * 100;
  // Cost per gram of protein
  return costPer100g / proteinPer100g;
};
