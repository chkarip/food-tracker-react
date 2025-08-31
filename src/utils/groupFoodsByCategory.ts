/**
 * UTILITY: groupFoodsByCategory
 * ------------------------------------------------------------------
 * • Converts an array of SelectedFood into an object keyed by the
 *   food’s category name (e.g. "Protein", "Dairy").
 * • Falls back to 'Uncategorised' if a food record is missing the
 *   metadata.category field.
 *
 * USAGE
 *   const grouped = groupFoodsByCategory(selectedFoods, foodDatabase);
 *
 * RETURNS
 *   {
 *     Protein: [ ...SelectedFood ],
 *     Dairy:   [ ...SelectedFood ],
 *     …
 *   }
 *
 * NOTE
 * • The canonical category comes from foodDatabase[food.name].metadata
 *   because SelectedFood does not carry that information itself.
 */

import { SelectedFood } from '../types/nutrition';
import { useFoodDatabase } from '../contexts/FoodContext';

/* ---------- constants ---------- */
export const UNCATEGORISED = 'Fruits & Treats';

// Map legacy / many category names into the simplified 4-category system
const CATEGORY_MAP: Record<string, string> = {
  // Protein-like groups
  protein: 'Protein',
  'protein foods': 'Protein',

  // Fats / nuts / seeds / oils
  fats: 'Fats',
  'nuts & seeds': 'Fats',
  'nuts & seeds foods': 'Fats',
  nuts: 'Fats',
  seeds: 'Fats',
  dairy: 'Fats',

  // Carbohydrate sources
  carbs: 'Carbs',
  'grains': 'Carbs',
  'grains foods': 'Carbs',
  'oats': 'Carbs',

  // Fruit / treats / other -> Fruits & Treats
  other: 'Fruits & Treats',
  fruit: 'Fruits & Treats',
  'fruit foods': 'Fruits & Treats',
  'treats': 'Fruits & Treats'
};

/* ---------- helper ---------- */
export default function groupFoodsByCategory(
  foods: SelectedFood[],
  foodDb: ReturnType<typeof useFoodDatabase>['foodDatabase']
): Record<string, SelectedFood[]> {
  // Desired display order for categories
  const ORDER = ['Protein', 'Fats', 'Carbs', 'Fruits & Treats'];

  // Initialize buckets in the desired order
  const buckets: Record<string, SelectedFood[]> = ORDER.reduce((acc, k) => {
    acc[k] = [];
    return acc;
  }, {} as Record<string, SelectedFood[]>);

  // Assign each food into the mapped simplified category
  for (const food of foods) {
    const rawCat = (foodDb[food.name]?.metadata?.category ?? UNCATEGORISED) as string;
    const key = rawCat.trim().toLowerCase();
    const mapped = CATEGORY_MAP[key] ?? rawCat ?? UNCATEGORISED;
    const cat = typeof mapped === 'string' && mapped.length > 0 ? mapped : UNCATEGORISED;

    // If mapped category is one of our ordered buckets, push there; otherwise fold into 'Fruits & Treats'
    if (buckets[cat]) {
      buckets[cat].push(food);
    } else {
      buckets['Fruits & Treats'].push(food);
    }
  }

  // Build the result object preserving the requested order and omitting empty buckets
  const result: Record<string, SelectedFood[]> = {};
  for (const k of ORDER) {
    if (buckets[k] && buckets[k].length > 0) result[k] = buckets[k];
  }

  return result;
}
