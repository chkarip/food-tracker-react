/**
 * Open Food Facts API Service
 * Provides food search and nutrition data retrieval
 * No API key required, no rate limits, 4M+ products worldwide
 */

import { FoodFormData } from '../../types/food';
import { useQuery } from '@tanstack/react-query';

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
    'energy-kcal_100g'?: number; // Alternative format
    energy_100g?: number; // Energy in kJ
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

const OPEN_FOOD_FACTS_BASE_URL = 'https://world.openfoodfacts.org';

/**
 * Search for products in Open Food Facts database
 */
export const searchOpenFoodFacts = async (
  query: string,
  pageSize = 25,
  page = 1
): Promise<OpenFoodFactsSearchResult> => {
  if (!query.trim()) {
    return { products: [], count: 0, page: 1, page_size: pageSize };
  }

  try {
    console.log(`🔍 SEARCHING FOOD DATABASE: "${query}" (page ${page}, limit ${pageSize})`);
    
    // Open Food Facts search API
    const response = await fetch(
      `${OPEN_FOOD_FACTS_BASE_URL}/cgi/search.pl?search_terms=${encodeURIComponent(query)}&json=1&page_size=${pageSize}&page=${page}&sort_by=popularity`
    );

    if (!response.ok) {
      throw new Error(`Open Food Facts API error: ${response.status}`);
    }

    const data = await response.json();
    console.log(`✅ FOUND FOOD PRODUCTS: ${data.count || 0} results for "${query}"`);

    return {
      products: data.products || [],
      count: data.count || 0,
      page: data.page || 1,
      page_size: data.page_size || pageSize
    };
  } catch (error) {
    console.error('❌ FOOD SEARCH FAILED:', error);
    throw new Error('Failed to search food database. Please try again.');
  }
};

/**
 * Get detailed product information by barcode
 */
export const getOpenFoodFactsProduct = async (barcode: string): Promise<OpenFoodFactsProduct> => {
  try {
    console.log(`📦 LOADING PRODUCT DETAILS: Barcode ${barcode}`);
    
    const response = await fetch(
      `${OPEN_FOOD_FACTS_BASE_URL}/api/v0/product/${barcode}.json`
    );

    if (!response.ok) {
      throw new Error(`Open Food Facts API error: ${response.status}`);
    }

    const data = await response.json();

    if (data.status === 0) {
      throw new Error('Product not found');
    }

    console.log(`✅ PRODUCT LOADED: "${data.product.product_name}" (${barcode})`);
    return data.product;
  } catch (error) {
    console.error('❌ PRODUCT LOOKUP FAILED:', error);
    throw new Error('Failed to get product details. Please try again.');
  }
};

/**
 * Map Open Food Facts product data to our FoodFormData format
 */
export const mapOpenFoodFactsToFoodFormData = (product: OpenFoodFactsProduct): Partial<FoodFormData> => {
  const nutriments = product.nutriments || {};

  // Extract macro nutrients (values are per 100g)
  const protein = nutriments.proteins_100g || 0;
  const totalFat = nutriments.fat_100g || 0;
  const carbs = nutriments.carbohydrates_100g || 0;

  // Handle calories - prefer energy-kcal_100g, fallback to energy_100g (kJ) converted to kcal
  let calories = nutriments['energy-kcal_100g'] || nutriments.energy_kcal_100g || 0;
  if (calories === 0 && nutriments.energy_100g) {
    // Convert kJ to kcal (1 kcal = 4.184 kJ)
    calories = Math.round(nutriments.energy_100g / 4.184);
  }

  return {
    // Auto-fill these fields from API
    name: product.product_name || 'Unknown Product',
    nutrition: {
      protein: Math.round(protein * 100) / 100, // Round to 2 decimal places
      fats: Math.round(totalFat * 100) / 100,
      carbs: Math.round(carbs * 100) / 100,
      calories: Math.round(calories * 100) / 100,
    },
    // Cost is optional - user can fill manually
    cost: {
      costPerKg: 0,
      unit: 'kg'
    },
    // These fields are user-set, don't auto-fill from API
    category: 'Fruits & Treats', // Default category, user can change
    isUnitFood: false, // User toggles this
    useFixedAmount: false, // User toggles this
    fixedAmount: 100, // Default amount
    hidden: false, // User toggles this
    favorite: false // User toggles this
  };
};

/**
 * Determine if a product is likely measured in units rather than weight
 */
const isLikelyUnitFood = (product: OpenFoodFactsProduct): boolean => {
  const productName = (product.product_name || '').toLowerCase();
  const categories = (product.categories || '').toLowerCase();

  const unitFoodKeywords = [
    'yogurt', 'cheese', 'milk', 'egg', 'eggs',
    'bread', 'bun', 'roll', 'bagel', 'muffin',
    'apple', 'banana', 'orange', 'pear', 'peach', 'plum',
    'chicken breast', 'chicken thigh', 'chicken wing', 'drumstick',
    'fish fillet', 'salmon fillet', 'cod fillet', 'tuna',
    'canned tuna', 'tuna in water', 'tuna in oil',
    'protein bar', 'energy bar', 'granola bar',
    'cereal bar', 'nutrition bar', 'snack bar',
    'cookie', 'cookies', 'cracker', 'crackers',
    'chip', 'chips', 'pretzel', 'pretzels',
    'candy', 'chocolate bar', 'chocolate',
    'ice cream', 'frozen yogurt', 'sorbet'
  ];

  // Check product name and categories
  const combinedText = `${productName} ${categories}`;
  return unitFoodKeywords.some(keyword => combinedText.includes(keyword));
};

/**
 * Categorize product based on Open Food Facts data
 */
const categorizeProduct = (product: OpenFoodFactsProduct): string => {
  const productName = (product.product_name || '').toLowerCase();
  const categories = (product.categories || '').toLowerCase();
  const combinedText = `${productName} ${categories}`;

  // Protein sources
  if (combinedText.includes('chicken') || combinedText.includes('beef') ||
      combinedText.includes('pork') || combinedText.includes('fish') ||
      combinedText.includes('salmon') || combinedText.includes('tuna') ||
      combinedText.includes('protein') || combinedText.includes('whey') ||
      combinedText.includes('meat') || combinedText.includes('turkey')) {
    return 'protein';
  }

  // Carbohydrates
  if (combinedText.includes('rice') || combinedText.includes('pasta') ||
      combinedText.includes('bread') || combinedText.includes('oat') ||
      combinedText.includes('cereal') || combinedText.includes('quinoa') ||
      combinedText.includes('potato') || combinedText.includes('noodle')) {
    return 'carbs';
  }

  // Dairy
  if (combinedText.includes('yogurt') || combinedText.includes('milk') ||
      combinedText.includes('cheese') || combinedText.includes('cream') ||
      combinedText.includes('butter') || combinedText.includes('kefir')) {
    return 'dairy';
  }

  // Fruits
  if (combinedText.includes('apple') || combinedText.includes('banana') ||
      combinedText.includes('orange') || combinedText.includes('berry') ||
      combinedText.includes('grape') || combinedText.includes('fruit') ||
      combinedText.includes('juice')) {
    return 'fruits';
  }

  // Vegetables
  if (combinedText.includes('spinach') || combinedText.includes('lettuce') ||
      combinedText.includes('broccoli') || combinedText.includes('carrot') ||
      combinedText.includes('tomato') || combinedText.includes('vegetable') ||
      combinedText.includes('salad') || combinedText.includes('green')) {
    return 'vegetables';
  }

  // Nuts and seeds
  if (combinedText.includes('peanut butter') || combinedText.includes('almond') ||
      combinedText.includes('walnut') || combinedText.includes('cashew') ||
      combinedText.includes('nut') || combinedText.includes('seed')) {
    return 'nuts';
  }

  // Fats/oils
  if (combinedText.includes('oil') || combinedText.includes('olive') ||
      combinedText.includes('avocado') || combinedText.includes('coconut')) {
    return 'fats';
  }

  // Sweets and treats
  if (combinedText.includes('chocolate') || combinedText.includes('candy') ||
      combinedText.includes('cookie') || combinedText.includes('cake') ||
      combinedText.includes('ice cream') || combinedText.includes('sweet')) {
    return 'fruits & treats';
  }

  return 'other'; // Default category
};

/**
 * React Query hook for food search with caching
 */
export const useFoodSearch = (query: string, pageSize = 25, page = 1) => {
  return useQuery({
    queryKey: ['foodSearch', query.toLowerCase().trim(), pageSize, page],
    queryFn: () => searchOpenFoodFacts(query, pageSize, page),
    enabled: query.length >= 3, // Only search meaningful queries
    staleTime: 30 * 60 * 1000, // 30 minutes - search results don't change often
  });
};

/**
 * React Query hook for product details with caching
 */
export const useFoodProduct = (barcode: string) => {
  return useQuery({
    queryKey: ['foodProduct', barcode],
    queryFn: () => getOpenFoodFactsProduct(barcode),
    enabled: !!barcode,
    staleTime: 60 * 60 * 1000, // 1 hour - product details are stable
  });
};