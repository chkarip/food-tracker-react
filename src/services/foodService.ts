/**
 * Firebase Firestore Service
 * Handles all database operations for food management
 */

import { 
  collection, 
  doc, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  orderBy,
  where,
  onSnapshot,
  Timestamp
} from 'firebase/firestore';
import { db } from '../config/firebase';

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

export interface DatabaseFood extends FirebaseFoodItem {
  firestoreId: string; // The actual Firestore document ID
}

/**
 * Get all foods from Firestore database
 */
export const getAllFoods = async (): Promise<DatabaseFood[]> => {
  try {
    const foodsRef = collection(db, 'foods');
    const q = query(foodsRef, orderBy('name'));
    const querySnapshot = await getDocs(q);
    
    const foods: DatabaseFood[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data() as FirebaseFoodItem;
      foods.push({
        ...data,
        firestoreId: doc.id,
        // Convert Firestore Timestamps to Dates if needed
        metadata: {
          ...data.metadata,
          addedAt: data.metadata.addedAt instanceof Timestamp 
            ? data.metadata.addedAt.toDate() 
            : data.metadata.addedAt,
          lastUpdated: data.metadata.lastUpdated instanceof Timestamp 
            ? data.metadata.lastUpdated.toDate() 
            : data.metadata.lastUpdated,
        }
      });
    });
    
    return foods;
  } catch (error) {
    console.error('Error fetching foods:', error);
    throw error;
  }
};

/**
 * Add a new food to the database
 */
export const addFood = async (foodData: FoodFormData): Promise<string> => {
  try {
    const timestamp = new Date();
    
    // Calculate cost efficiency
    const costEfficiency = foodData.nutrition.protein > 0 
      ? (foodData.cost.unit === 'unit' 
          ? foodData.cost.costPerKg 
          : (foodData.cost.costPerKg / 1000) * 100) / foodData.nutrition.protein
      : null;
    
    // Calculate protein efficiency
    const proteinEfficiency = foodData.nutrition.calories > 0 
      ? foodData.nutrition.protein / foodData.nutrition.calories 
      : 0;

    const firebaseFood: FirebaseFoodItem = {
      id: foodData.name.toLowerCase().replace(/[^a-z0-9]/g, '-'),
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

    const foodsRef = collection(db, 'foods');
    const docRef = await addDoc(foodsRef, firebaseFood);
    
    console.log('✅ Food added successfully:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('❌ Error adding food:', error);
    throw error;
  }
};

/**
 * Update an existing food in the database
 */
export const updateFood = async (firestoreId: string, foodData: FoodFormData): Promise<void> => {
  try {
    const timestamp = new Date();
    
    // Calculate cost efficiency
    const costEfficiency = foodData.nutrition.protein > 0 
      ? (foodData.cost.unit === 'unit' 
          ? foodData.cost.costPerKg 
          : (foodData.cost.costPerKg / 1000) * 100) / foodData.nutrition.protein
      : null;
    
    // Calculate protein efficiency
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
  } catch (error) {
    console.error('❌ Error updating food:', error);
    throw error;
  }
};

/**
 * Delete a food from the database
 */
export const deleteFood = async (firestoreId: string): Promise<void> => {
  try {
    const foodRef = doc(db, 'foods', firestoreId);
    await deleteDoc(foodRef);
    
    console.log('✅ Food deleted successfully:', firestoreId);
  } catch (error) {
    console.error('❌ Error deleting food:', error);
    throw error;
  }
};

/**
 * Get foods by category
 */
export const getFoodsByCategory = async (category: string): Promise<DatabaseFood[]> => {
  try {
    const foodsRef = collection(db, 'foods');
    const q = query(
      foodsRef, 
      where('metadata.category', '==', category),
      orderBy('name')
    );
    const querySnapshot = await getDocs(q);
    
    const foods: DatabaseFood[] = [];
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
        }
      });
    });
    
    return foods;
  } catch (error) {
    console.error('Error fetching foods by category:', error);
    throw error;
  }
};

/**
 * Get all food categories
 */
export const getFoodCategories = async (): Promise<string[]> => {
  try {
    const categoriesRef = collection(db, 'categories');
    const querySnapshot = await getDocs(categoriesRef);
    
    const categories: string[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      categories.push(data.name);
    });
    
    return categories.sort();
  } catch (error) {
    console.error('Error fetching categories:', error);
    throw error;
  }
};

/**
 * Real-time listener for foods collection
 */
export const subscribeToFoods = (callback: (foods: DatabaseFood[]) => void) => {
  const foodsRef = collection(db, 'foods');
  const q = query(foodsRef, orderBy('name'));
  
  return onSnapshot(q, (querySnapshot) => {
    const foods: DatabaseFood[] = [];
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
        }
      });
    });
    callback(foods);
  }, (error) => {
    console.error('Error in foods subscription:', error);
  });
};

/**
 * Convert DatabaseFood to the format expected by the existing FoodSelector component
 */
export const convertToLegacyFoodFormat = (foods: DatabaseFood[]) => {
  const legacyFormat: Record<string, {
    name: string;
    nutrition: { protein: number; fats: number; carbs: number; calories: number };
    isUnitFood: boolean;
    useFixedAmount: boolean;
    fixedAmount: number;
  }> = {};

  foods.forEach(food => {
    legacyFormat[food.name] = {
      name: food.name,
      nutrition: food.nutrition,
      isUnitFood: food.metadata.isUnitFood,
      useFixedAmount: food.metadata.useFixedAmount,
      fixedAmount: food.metadata.fixedAmount,
    };
  });

  return legacyFormat;
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
};

export default foodService;
