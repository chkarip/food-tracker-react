/**
 * Firebase Database Initialization Script
 * Populates Firestore with comprehensive food inventory, nutrition data, and costs
 */

import { collection, doc, writeBatch, getDocs } from 'firebase/firestore';
import { db } from '../config/firebase';
import { FOOD_DATABASE, MACRO_TARGETS } from '../data/foodDatabase';

// Enhanced food data with costs (based on Python nutrition_data.py)
const COST_DATABASE: Record<string, { costPerKg: number; unit: string }> = {
  "Greek yogurt": { costPerKg: 2.29, unit: "kg" },
  "Peanut-butter": { costPerKg: 6.38, unit: "kg" },
  "Dry rice": { costPerKg: 1.00, unit: "kg" },
  "Dry lentils": { costPerKg: 1.88, unit: "kg" },
  "Bulk oats": { costPerKg: 1.90, unit: "kg" },
  "Chicken-breast": { costPerKg: 8.50, unit: "kg" },
  "Edamame": { costPerKg: 5.18, unit: "kg" },
  "Canned tuna": { costPerKg: 2.50, unit: "unit" }, // per can
  "Whey isolate": { costPerKg: 28.09, unit: "kg" },
  "Eggs": { costPerKg: 0.20, unit: "unit" }, // per egg
  "Tortilla wrap": { costPerKg: 4.46, unit: "kg" },
  "Almonds/Walnuts": { costPerKg: 19.21, unit: "kg" },
  "Dark-chocolate 74%": { costPerKg: 15.00, unit: "kg" },
  "Oatmeal": { costPerKg: 0.53, unit: "kg" }
};

// Food categories for better organization
const FOOD_CATEGORIES: Record<string, string> = {
  "Greek yogurt": "Dairy",
  "Peanut-butter": "Nuts & Seeds",
  "Dry rice": "Grains",
  "Dry lentils": "Legumes",
  "Bulk oats": "Grains",
  "Chicken-breast": "Protein",
  "Edamame": "Legumes",
  "Canned tuna": "Protein",
  "Whey isolate": "Supplements",
  "Eggs": "Protein",
  "Tortilla wrap": "Grains",
  "Almonds/Walnuts": "Nuts & Seeds",
  "Dark-chocolate 74%": "Treats",
  "Oatmeal": "Grains"
};

// Calculate cost efficiency (cost per gram of protein)
const calculateCostEfficiency = (foodName: string) => {
  const nutrition = FOOD_DATABASE[foodName]?.nutrition;
  const cost = COST_DATABASE[foodName];
  
  if (!nutrition || !cost || nutrition.protein <= 0) return null;
  
  const costPer100g = cost.unit === 'unit' ? cost.costPerKg : (cost.costPerKg / 1000) * 100;
  return costPer100g / nutrition.protein; // euros per gram of protein
};

// Calculate protein efficiency (protein per calorie)
const calculateProteinEfficiency = (foodName: string) => {
  const nutrition = FOOD_DATABASE[foodName]?.nutrition;
  if (!nutrition || nutrition.calories <= 0) return 0;
  return nutrition.protein / nutrition.calories;
};

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
    unit: string;
    costEfficiency: number | null; // euros per gram of protein
  };
  metadata: {
    isUnitFood: boolean;
    category: string;
    proteinEfficiency: number; // protein per calorie
    addedAt: Date;
    lastUpdated: Date;
  };
}

export interface FirebaseConfig {
  macroTargets: {
    protein: number;
    fats: number;
    carbs: number;
    caloriesMin: number;
    caloriesMax: number;
  };
  version: string;
  lastUpdated: Date;
}

/**
 * Initialize Firestore database with food inventory data
 */
export const initializeFirebaseDatabase = async (): Promise<void> => {
  try {
    console.log('🚀 Starting Firebase database initialization...');

    // Use batch for atomic operations
    const batch = writeBatch(db);
    const timestamp = new Date();

    // 1. Create foods collection
    console.log('📦 Adding food items...');
    const foodsData: FirebaseFoodItem[] = [];

    Object.entries(FOOD_DATABASE).forEach(([foodName, foodItem]) => {
      const costInfo = COST_DATABASE[foodName];
      const costEfficiency = calculateCostEfficiency(foodName);
      const proteinEfficiency = calculateProteinEfficiency(foodName);

      const firebaseFood: FirebaseFoodItem = {
        id: foodName.toLowerCase().replace(/[^a-z0-9]/g, '-'),
        name: foodName,
        nutrition: {
          protein: foodItem.nutrition.protein,
          fats: foodItem.nutrition.fats,
          carbs: foodItem.nutrition.carbs,
          calories: foodItem.nutrition.calories,
        },
        cost: {
          costPerKg: costInfo?.costPerKg || 0,
          unit: costInfo?.unit || 'kg',
          costEfficiency: costEfficiency,
        },
        metadata: {
          isUnitFood: foodItem.isUnitFood,
          category: FOOD_CATEGORIES[foodName] || 'Other',
          proteinEfficiency: proteinEfficiency,
          addedAt: timestamp,
          lastUpdated: timestamp,
        },
      };

      foodsData.push(firebaseFood);
      
      // Add food document to batch
      const foodRef = doc(collection(db, 'foods'), firebaseFood.id);
      batch.set(foodRef, firebaseFood);
    });

    // 2. Create configuration document
    console.log('⚙️ Adding app configuration...');
    const configData: FirebaseConfig = {
      macroTargets: MACRO_TARGETS,
      version: '1.0.0',
      lastUpdated: timestamp,
    };

    const configRef = doc(collection(db, 'config'), 'app-settings');
    batch.set(configRef, configData);

    // 3. Create food categories collection for filtering
    console.log('🏷️ Adding food categories...');
    const categories = Array.from(new Set(Object.values(FOOD_CATEGORIES)));
    categories.forEach(category => {
      const categoryRef = doc(collection(db, 'categories'), category.toLowerCase());
      batch.set(categoryRef, {
        name: category,
        foods: foodsData.filter(food => food.metadata.category === category).map(food => food.id),
        createdAt: timestamp,
      });
    });

    // 4. Commit all operations
    console.log('💾 Committing data to Firestore...');
    await batch.commit();

    // 5. Create summary statistics
    const totalFoods = foodsData.length;
    const avgProtein = foodsData.reduce((sum, food) => sum + food.nutrition.protein, 0) / totalFoods;
    const avgCostEfficiency = foodsData
      .filter(food => food.cost.costEfficiency !== null)
      .reduce((sum, food) => sum + (food.cost.costEfficiency || 0), 0) / 
      foodsData.filter(food => food.cost.costEfficiency !== null).length;

    console.log('✅ Firebase database initialization completed successfully!');
    console.log(`📊 Summary:
    - Total Foods: ${totalFoods}
    - Categories: ${categories.length}
    - Average Protein: ${avgProtein.toFixed(1)}g per 100g
    - Average Cost Efficiency: €${avgCostEfficiency.toFixed(3)} per gram of protein
    - Unit Foods: ${foodsData.filter(food => food.metadata.isUnitFood).length}
    - Weight Foods: ${foodsData.filter(food => !food.metadata.isUnitFood).length}`);

    return;

  } catch (error) {
    console.error('❌ Error initializing Firebase database:', error);
    throw error;
  }
};

/**
 * Check if database is already initialized
 */
export const isDatabaseInitialized = async (): Promise<boolean> => {
  try {
    const foodsSnapshot = await getDocs(collection(db, 'foods'));
    return !foodsSnapshot.empty;
  } catch (error) {
    console.error('Error checking database status:', error);
    return false;
  }
};

/**
 * Get database statistics
 */
export const getDatabaseStats = async () => {
  try {
    const [foodsSnapshot, categoriesSnapshot, configSnapshot] = await Promise.all([
      getDocs(collection(db, 'foods')),
      getDocs(collection(db, 'categories')),
      getDocs(collection(db, 'config'))
    ]);

    return {
      totalFoods: foodsSnapshot.size,
      totalCategories: categoriesSnapshot.size,
      hasConfig: !configSnapshot.empty,
      isInitialized: !foodsSnapshot.empty,
    };
  } catch (error) {
    console.error('Error getting database stats:', error);
    return null;
  }
};

// Helper functions for development
export const clearDatabase = async (): Promise<void> => {
  console.log('⚠️ Clearing Firebase database...');
  
  const collections = ['foods', 'categories', 'config'];
  const batch = writeBatch(db);
  
  for (const collectionName of collections) {
    const snapshot = await getDocs(collection(db, collectionName));
    snapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });
  }
  
  await batch.commit();
  console.log('🗑️ Database cleared successfully');
};

const databaseManager = {
  initializeFirebaseDatabase,
  isDatabaseInitialized,
  getDatabaseStats,
  clearDatabase,
};

export default databaseManager;
