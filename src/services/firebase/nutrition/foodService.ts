/**
 * Firebase Firestore Service
 * ------------------------------------------------------------------
 * Handles all database operations for food management with real-time
 * subscriptions, cost data, and legacy format conversion.
 */


import {
  FoodFormData,
  FirestoreFood,
  FirebaseFoodItem
} from '../../../types/food';
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
  Timestamp,
} from 'firebase/firestore';
import { db } from '../../../config/firebase';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

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
  
  const costEfficiency = foodData.cost && foodData.nutrition.protein > 0
    ? (foodData.cost.unit === 'unit'
        ? foodData.cost.costPerKg
        : (foodData.cost.costPerKg / 1000) * 100) / foodData.nutrition.protein
    : null;

  const proteinEfficiency = foodData.nutrition.calories > 0
    ? foodData.nutrition.protein / foodData.nutrition.calories
    : 0;

  // Build metadata object, excluding undefined values (Firestore doesn't allow undefined)
  const metadata: Record<string, any> = {
    category: foodData.category,
    isUnitFood: foodData.isUnitFood,
    useFixedAmount: foodData.useFixedAmount,
    fixedAmount: foodData.fixedAmount,
    fixedAmounts: foodData.fixedAmounts || [foodData.fixedAmount], // Store array, fallback to single value
    hidden: foodData.hidden,
    favorite: foodData.favorite,
    proteinEfficiency: proteinEfficiency,
    addedAt: timestamp,
    lastUpdated: timestamp,
  };

  // Add recipe fields if they have actual values (true/false for isRecipe, string for recipeId)
  if (foodData.isRecipe !== undefined) {
    metadata.isRecipe = foodData.isRecipe;
  }
  
  if (foodData.recipeId !== undefined && foodData.recipeId !== null && foodData.recipeId !== '') {
    metadata.recipeId = foodData.recipeId;
  }

  const firebaseFood: FirebaseFoodItem = {
    id: documentId,
    name: foodData.name,
    nutrition: foodData.nutrition,
    cost: foodData.cost ? {
      costPerKg: foodData.cost.costPerKg,
      unit: foodData.cost.unit,
      costEfficiency: costEfficiency,
    } : {
      costPerKg: 0,
      unit: 'kg',
      costEfficiency: null,
    },
    metadata: metadata as any,
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
  const costEfficiency = foodData.cost && foodData.nutrition.protein > 0
    ? (foodData.cost.unit === 'unit'
        ? foodData.cost.costPerKg
        : (foodData.cost.costPerKg / 1000) * 100) / foodData.nutrition.protein
    : null;

  const proteinEfficiency = foodData.nutrition.calories > 0
    ? foodData.nutrition.protein / foodData.nutrition.calories
    : 0;

  // Build metadata updates - only include fields that should be updated
  const metadataUpdates: Record<string, any> = {
    'metadata.category': foodData.category,
    'metadata.isUnitFood': foodData.isUnitFood,
    'metadata.useFixedAmount': foodData.useFixedAmount,
    'metadata.fixedAmount': foodData.fixedAmount,
    'metadata.fixedAmounts': foodData.fixedAmounts || [foodData.fixedAmount],
    'metadata.hidden': foodData.hidden,
    'metadata.favorite': foodData.favorite,
    'metadata.proteinEfficiency': proteinEfficiency,
    'metadata.lastUpdated': timestamp,
  };

  // Update recipe fields if they are explicitly provided
  if (foodData.isRecipe !== undefined) {
    metadataUpdates['metadata.isRecipe'] = foodData.isRecipe;
  }
  
  if (foodData.recipeId !== undefined && foodData.recipeId !== null && foodData.recipeId !== '') {
    metadataUpdates['metadata.recipeId'] = foodData.recipeId;
  }

  const updateData = {
    name: foodData.name,
    nutrition: foodData.nutrition,
    cost: foodData.cost ? {
      costPerKg: foodData.cost.costPerKg,
      unit: foodData.cost.unit,
      costEfficiency: costEfficiency,
    } : {
      costPerKg: 0,
      unit: 'kg',
      costEfficiency: null,
    },
    ...metadataUpdates
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
      isUnitFood: food.metadata?.isUnitFood ?? false,
      useFixedAmount: food.metadata?.useFixedAmount ?? false,
      fixedAmount: food.metadata?.fixedAmount ?? 0,
      fixedAmounts: food.metadata?.fixedAmounts || [food.metadata?.fixedAmount ?? 0], // Include array
      cost: food.cost,
      metadata: { ...food.metadata },
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

// React Query Hooks for Food Database

/**
 * Hook to fetch all foods with React Query caching
 */
export const useFoodDatabase = () => {
  return useQuery({
    queryKey: ['foods'],
    queryFn: getAllFoods,
    staleTime: 10 * 60 * 1000, // 10 minutes - food DB rarely changes
  });
};

/**
 * Hook to fetch foods by category with React Query caching
 */
export const useFoodsByCategory = (category: string) => {
  return useQuery({
    queryKey: ['foods', 'category', category],
    queryFn: () => getFoodsByCategory(category),
    enabled: !!category,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};

/**
 * Hook to fetch food categories with React Query caching
 */
export const useFoodCategories = () => {
  return useQuery({
    queryKey: ['foodCategories'],
    queryFn: getFoodCategories,
    staleTime: 30 * 60 * 1000, // 30 minutes - categories change rarely
  });
};

/**
 * Mutation hook for adding foods
 */
export const useAddFood = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (foodData: FoodFormData) => addFood(foodData),
    onSuccess: () => {
      // Invalidate food cache to refetch
      queryClient.invalidateQueries({ queryKey: ['foods'] });
    },
  });
};

/**
 * Mutation hook for updating foods
 */
export const useUpdateFood = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ firestoreId, foodData }: { firestoreId: string; foodData: FoodFormData }) =>
      updateFood(firestoreId, foodData),
    onSuccess: () => {
      // Invalidate food cache to refetch
      queryClient.invalidateQueries({ queryKey: ['foods'] });
    },
  });
};

/**
 * Mutation hook for deleting foods
 */
export const useDeleteFood = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (firestoreId: string) => deleteFood(firestoreId),
    onSuccess: () => {
      // Invalidate food cache to refetch
      queryClient.invalidateQueries({ queryKey: ['foods'] });
    },
  });
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
  // React Query hooks
  useFoodDatabase,
  useFoodsByCategory,
  useFoodCategories,
  useAddFood,
  useUpdateFood,
  useDeleteFood,
};

export default foodService;
