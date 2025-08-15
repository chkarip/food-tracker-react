/**
 * Firebase Firestore Service  
 * ------------------------------------------------------------------
 * Handles all database operations for food management with real-time 
 * subscriptions, cost data, and legacy format conversion.
 */

import {
  collection,
  doc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  where,
  onSnapshot,
  Timestamp
} from 'firebase/firestore';
import { db } from '../../../config/firebase';

export interface FirebaseFoodItem {
  id: string;
  name: string;
  nutrition: {
    protein: number;
    fats: number;
    carbs: number;
    calories: number;
  };
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
  };
}

export interface FoodFormData {
  name: string;
  nutrition: {
    protein: number;
    fats: number;
    carbs: number;
    calories: number;
  };
  cost: {
    costPerKg: number;
    unit: 'kg' | 'unit';
  };
  category: string;
  isUnitFood: boolean;
  useFixedAmount: boolean;
  fixedAmount: number;
}

// FirestoreFood = FirebaseFoodItem + document ID
export type FirestoreFood = FirebaseFoodItem & { firestoreId: string };

/**
 * Get all foods from Firestore database
 */
export const getAllFoods = async (): Promise<FirestoreFood[]> => {
  const foodsRef = collection(db, 'foods');
  const q = query(foodsRef, orderBy('name'));
  const querySnapshot = await getDocs(q);

  const foods: FirestoreFood[] = [];
  querySnapshot.forEach((doc) => {
    const data = doc.data() as FirebaseFoodItem;
    foods.push({
      ...data,
      firestoreId: doc.id,
      metadata: {
        ...data.metadata,
        addedAt: data.metadata.addedAt instanceof Timestamp
          ? data.metadata.addedAt.toDate()
          : data.metadata.addedAt,
        lastUpdated: data.metadata.lastUpdated instanceof Timestamp
          ? data.metadata.lastUpdated.toDate()
          : data.metadata.lastUpdated,
      },
    });
  });

  return foods;
};

/**
 * Add a new food to the database
 */
export const addFood = async (foodData: FoodFormData): Promise<string> => {
  const timestamp = new Date();
  const documentId = foodData.name.toLowerCase().replace(/[^a-z0-9]/g, '-');

  const costEfficiency = foodData.nutrition.protein > 0
    ? (foodData.cost.unit === 'unit'
        ? foodData.cost.costPerKg
        : (foodData.cost.costPerKg / 1000) * 100) / foodData.nutrition.protein
    : null;

  const proteinEfficiency = foodData.nutrition.calories > 0
    ? foodData.nutrition.protein / foodData.nutrition.calories
    : 0;

  const firebaseFood: FirebaseFoodItem = {
    id: documentId,
    name: foodData.name,
    nutrition: foodData.nutrition,
    cost: {
      costPerKg: foodData.cost.costPerKg,
      unit: foodData.cost.unit,
      costEfficiency: costEfficiency,
    },
    metadata: {
      isUnitFood: foodData.isUnitFood,
      category: foodData.category,
      proteinEfficiency: proteinEfficiency,
      addedAt: timestamp,
      lastUpdated: timestamp,
      useFixedAmount: foodData.useFixedAmount,
      fixedAmount: foodData.fixedAmount,
    },
  };

  const foodRef = doc(db, 'foods', documentId);
  await setDoc(foodRef, firebaseFood);
  console.log('✅ Food added successfully:', documentId);
  return documentId;
};

/**
 * Update an existing food in the database
 */
export const updateFood = async (firestoreId: string, foodData: FoodFormData): Promise<void> => {
  const timestamp = new Date();
  const costEfficiency = foodData.nutrition.protein > 0
    ? (foodData.cost.unit === 'unit'
        ? foodData.cost.costPerKg
        : (foodData.cost.costPerKg / 1000) * 100) / foodData.nutrition.protein
    : null;

  const proteinEfficiency = foodData.nutrition.calories > 0
    ? foodData.nutrition.protein / foodData.nutrition.calories
    : 0;

  const updateData = {
    name: foodData.name,
    nutrition: foodData.nutrition,
    cost: {
      costPerKg: foodData.cost.costPerKg,
      unit: foodData.cost.unit,
      costEfficiency: costEfficiency,
    },
    'metadata.category': foodData.category,
    'metadata.isUnitFood': foodData.isUnitFood,
    'metadata.proteinEfficiency': proteinEfficiency,
    'metadata.lastUpdated': timestamp,
    'metadata.useFixedAmount': foodData.useFixedAmount ?? false,
    'metadata.fixedAmount': foodData.fixedAmount ?? 0,
  };

  const foodRef = doc(db, 'foods', firestoreId);
  await updateDoc(foodRef, updateData);
  console.log('✅ Food updated successfully:', firestoreId);
};

/**
 * Delete a food from the database
 */
export const deleteFood = async (firestoreId: string): Promise<void> => {
  const foodRef = doc(db, 'foods', firestoreId);
  await deleteDoc(foodRef);
  console.log('✅ Food deleted successfully:', firestoreId);
};

/**
 * Get foods by category
 */
export const getFoodsByCategory = async (category: string): Promise<FirestoreFood[]> => {
  const foodsRef = collection(db, 'foods');
  const q = query(
    foodsRef,
    where('metadata.category', '==', category),
    orderBy('name')
  );
  const querySnapshot = await getDocs(q);
  const foods: FirestoreFood[] = [];

  querySnapshot.forEach((doc) => {
    const data = doc.data() as FirebaseFoodItem;
    foods.push({
      ...data,
      firestoreId: doc.id,
      metadata: {
        ...data.metadata,
        addedAt: data.metadata.addedAt instanceof Timestamp
          ? data.metadata.addedAt.toDate()
          : data.metadata.addedAt,
        lastUpdated: data.metadata.lastUpdated instanceof Timestamp
          ? data.metadata.lastUpdated.toDate()
          : data.metadata.lastUpdated,
      },
    });
  });

  return foods;
};

/**
 * Get all food categories
 */
export const getFoodCategories = async (): Promise<string[]> => {
  const categoriesRef = collection(db, 'categories');
  const querySnapshot = await getDocs(categoriesRef);
  const categories: string[] = [];

  querySnapshot.forEach((doc) => {
    const data = doc.data();
    categories.push(data.name);
  });

  return categories.sort();
};

/**
 * Real-time listener for foods collection
 * ✅ NOW ACCEPTS OPTIONAL ERROR HANDLER
 */
export const subscribeToFoods = (
  onNext: (foods: FirestoreFood[]) => void,
  onError?: (err: Error) => void
): (() => void) => {
  const foodsRef = collection(db, 'foods');
  const q = query(foodsRef, orderBy('name'));

  return onSnapshot(
    q,
    (querySnapshot) => {
      const foods: FirestoreFood[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data() as FirebaseFoodItem;
        foods.push({
          ...data,
          firestoreId: doc.id,
          metadata: {
            ...data.metadata,
            addedAt: data.metadata.addedAt instanceof Timestamp
              ? data.metadata.addedAt.toDate()
              : data.metadata.addedAt,
            lastUpdated: data.metadata.lastUpdated instanceof Timestamp
              ? data.metadata.lastUpdated.toDate()
              : data.metadata.lastUpdated,
          },
        });
      });
      onNext(foods);
    },
    (error) => {
      console.error('Error in foods subscription:', error);
      if (onError) onError(error as Error);
    }
  );
};

/**
 * Convert FirestoreFood to legacy format + INCLUDE COST DATA
 */
export const convertToLegacyFoodFormat = (foods: FirestoreFood[]): Record<string, any> => {
  const legacyFormat: Record<string, any> = {};
  foods.forEach(food => {
    legacyFormat[food.name] = {
      name: food.name,
      nutrition: food.nutrition,
      isUnitFood: food.metadata.isUnitFood,
      useFixedAmount: food.metadata.useFixedAmount,
      fixedAmount: food.metadata.fixedAmount,
      cost: food.cost  // ✅ THIS IS THE KEY - includes costPerKg + unit
    };
  });
  return legacyFormat;
};

/**
 * Calculate the cost of a specific portion of food
 */
export const calculatePortionCost = (
  foodName: string,
  amount: number,
  foodDB: Record<string, any>
): number | null => {
  const food = foodDB[foodName];
  if (!food || !food.cost || food.cost.costPerKg == null) return null;

  const { costPerKg, unit } = food.cost;
  if ((unit ?? (food.isUnitFood ? 'unit' : 'kg')) === 'unit') {
    return costPerKg * amount; // unit-based (eggs, tuna cans…)
  }
  return (costPerKg / 1_000) * amount; // €/kg → €/g
};

/**
 * Calculate total cost of selected foods
 */
export const calculateTotalMealCost = (
  selectedFoods: { name: string; amount: number }[],
  foodDB: Record<string, any>
) => {
  const individualCosts: Record<string, number> = {};
  let totalCost = 0;

  selectedFoods.forEach(food => {
    const portionCost = calculatePortionCost(food.name, food.amount, foodDB);
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
 */
export const formatCost = (cost: number, decimals: number = 2): string => {
  return `€${cost.toFixed(decimals)}`;
};

const foodService = {
  getAllFoods,
  addFood,
  updateFood,
  deleteFood,
  getFoodsByCategory,
  getFoodCategories,
  subscribeToFoods,
  convertToLegacyFoodFormat,
  calculatePortionCost,
  calculateTotalMealCost,
  formatCost,
};

export default foodService;
