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
export const UNCATEGORISED = 'Uncategorised';

/* ---------- helper ---------- */
export default function groupFoodsByCategory(
  foods: SelectedFood[],
  foodDb: ReturnType<typeof useFoodDatabase>['foodDatabase']
): Record<string, SelectedFood[]> {
  // DEBUG: log what the helper receives
  console.log('🟢 groupFoodsByCategory received:', {
    foods: foods.slice(0, 5),
    foodDbKeys: Object.keys(foodDb).slice(0, 5)
  });
  return foods.reduce<Record<string, SelectedFood[]>>((acc, food) => {
    const cat =
      foodDb[food.name]?.metadata?.category ?? UNCATEGORISED;
    (acc[cat] ||= []).push(food);
    return acc;
  }, {});
}
