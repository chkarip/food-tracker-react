/**
 * Food History Service
 * Handles food consumption tracking and history analytics
 */

import { 
  collection, 
  doc, 
  getDocs, 
  addDoc, 
  updateDoc, 
  query, 
  orderBy,
  where,
  Timestamp,
  onSnapshot
} from 'firebase/firestore';
import { db } from '../../../config/firebase';
import { FOOD_DATABASE } from '../../../data/foodDatabase';

export interface FoodConsumption {
  id: string;
  foodName: string;
  quantity: number;
  unit: string;
  nutrition: {
    protein: number;
    fats: number;
    carbs: number;
    calories: number;
  };
  consumedAt: Date;
  mealType?: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  userId?: string;
}

export interface FoodHistoryStats {
  foodName: string;
  lastEaten: Date;
  timesEatenThisMonth: number;
  totalKilosThisMonth: number;
  totalConsumptions: number;
  averageQuantityPerMeal: number;
  nutritionTotals: {
    protein: number;
    fats: number;
    carbs: number;
    calories: number;
  };
}

export interface MonthlyFoodSummary {
  month: string; // YYYY-MM format
  year: number;
  foods: FoodHistoryStats[];
  totalDays: number;
  uniqueFoods: number;
  totalNutrition: {
    protein: number;
    fats: number;
    carbs: number;
    calories: number;
  };
}

/**
 * Record a food consumption entry
 */
export const recordFoodConsumption = async (consumption: Omit<FoodConsumption, 'id'>): Promise<string> => {
  try {
    const consumptionRef = collection(db, 'foodConsumptions');
    const docRef = await addDoc(consumptionRef, {
      ...consumption,
      consumedAt: Timestamp.fromDate(consumption.consumedAt),
    });
    
    console.log('✅ Food consumption recorded:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('❌ Error recording food consumption:', error);
    throw error;
  }
};

/**
 * Get food consumption history for a specific time period
 */
export const getFoodConsumptionHistory = async (
  startDate: Date, 
  endDate: Date, 
  userId?: string
): Promise<FoodConsumption[]> => {
  try {
    const consumptionRef = collection(db, 'foodConsumptions');
    
    // Use simpler query approach to avoid composite index issues
    let q;
    
    if (userId) {
      // First query by userId only
      q = query(
        consumptionRef,
        where('userId', '==', userId)
      );
    } else {
      // Query all documents if no userId (less efficient but works)
      q = query(consumptionRef);
    }

    const querySnapshot = await getDocs(q);
    
    const consumptions: FoodConsumption[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      const consumedAt = data.consumedAt instanceof Timestamp 
        ? data.consumedAt.toDate() 
        : new Date(data.consumedAt);
      
      // Filter by date range in memory (less efficient but avoids index issues)
      if (consumedAt >= startDate && consumedAt <= endDate) {
        consumptions.push({
          id: doc.id,
          foodName: data.foodName,
          quantity: data.quantity,
          unit: data.unit,
          nutrition: data.nutrition,
          consumedAt,
          mealType: data.mealType,
          userId: data.userId,
        });
      }
    });
    
    // Sort by consumedAt in memory
    consumptions.sort((a, b) => b.consumedAt.getTime() - a.consumedAt.getTime());
    
    return consumptions;
  } catch (error) {
    console.error('Error fetching food consumption history:', error);
    throw error;
  }
};

/**
 * Get current month's food history statistics
 */
export const getCurrentMonthFoodStats = async (userId?: string): Promise<FoodHistoryStats[]> => {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

  return getFoodStatsForPeriod(startOfMonth, endOfMonth, userId);
};

/**
 * Get food statistics for a specific period
 */
export const getFoodStatsForPeriod = async (
  startDate: Date, 
  endDate: Date, 
  userId?: string
): Promise<FoodHistoryStats[]> => {
  try {
    const consumptions = await getFoodConsumptionHistory(startDate, endDate, userId);
    
    // Group consumptions by food name
    const foodGroups: Record<string, FoodConsumption[]> = {};
    consumptions.forEach(consumption => {
      if (!foodGroups[consumption.foodName]) {
        foodGroups[consumption.foodName] = [];
      }
      foodGroups[consumption.foodName].push(consumption);
    });

    // Calculate statistics for each food
    const stats: FoodHistoryStats[] = Object.entries(foodGroups).map(([foodName, consumptions]) => {
      const sortedConsumptions = consumptions.sort((a, b) => b.consumedAt.getTime() - a.consumedAt.getTime());
      const lastEaten = sortedConsumptions[0].consumedAt;
      
      // Unit weight mapping for accurate weight calculations
      const UNIT_WEIGHTS: Record<string, number> = {
        'Eggs': 0.050,           // 50g per egg
        'Tortilla wrap': 0.064,  // 64g per wrap (8-inch tortilla)
        'Canned tuna': 0.160,    // 160g per can (typical size)
      };

      // Calculate total kilos consumed (convert all to kg)
      const totalKilos = consumptions.reduce((sum, consumption) => {
        if (consumption.unit === 'g') {
          return sum + (consumption.quantity / 1000);
        } else if (consumption.unit === 'kg') {
          return sum + consumption.quantity;
        } else if (consumption.unit === 'unit' || consumption.unit === 'units') {
          // For unit foods, use proper weight mapping
          const unitWeight = UNIT_WEIGHTS[consumption.foodName] || 0.1;
          return sum + (consumption.quantity * unitWeight);
        } else {
          // Default fallback - treat as grams if unknown unit
          return sum + (consumption.quantity / 1000);
        }
      }, 0);

      // Calculate nutrition totals
      const nutritionTotals = consumptions.reduce((totals, consumption) => ({
        protein: totals.protein + consumption.nutrition.protein,
        fats: totals.fats + consumption.nutrition.fats,
        carbs: totals.carbs + consumption.nutrition.carbs,
        calories: totals.calories + consumption.nutrition.calories,
      }), { protein: 0, fats: 0, carbs: 0, calories: 0 });

      // Calculate average quantity per meal
      const averageQuantityPerMeal = consumptions.reduce((sum, c) => sum + c.quantity, 0) / consumptions.length;

      return {
        foodName,
        lastEaten,
        timesEatenThisMonth: consumptions.length,
        totalKilosThisMonth: totalKilos,
        totalConsumptions: consumptions.length,
        averageQuantityPerMeal,
        nutritionTotals,
      };
    });

    // Sort by last eaten date (most recent first)
    return stats.sort((a, b) => b.lastEaten.getTime() - a.lastEaten.getTime());
  } catch (error) {
    console.error('Error calculating food stats:', error);
    throw error;
  }
};

/**
 * Get monthly food summary
 */
export const getMonthlyFoodSummary = async (
  year: number, 
  month: number, 
  userId?: string
): Promise<MonthlyFoodSummary> => {
  try {
    const startOfMonth = new Date(year, month - 1, 1);
    const endOfMonth = new Date(year, month, 0, 23, 59, 59);
    
    const foods = await getFoodStatsForPeriod(startOfMonth, endOfMonth, userId);
    
    // Calculate total nutrition for the month
    const totalNutrition = foods.reduce((totals, food) => ({
      protein: totals.protein + food.nutritionTotals.protein,
      fats: totals.fats + food.nutritionTotals.fats,
      carbs: totals.carbs + food.nutritionTotals.carbs,
      calories: totals.calories + food.nutritionTotals.calories,
    }), { protein: 0, fats: 0, carbs: 0, calories: 0 });

    // Calculate unique days with food consumption
    const consumptions = await getFoodConsumptionHistory(startOfMonth, endOfMonth, userId);
    const uniqueDays = new Set(
      consumptions.map(c => c.consumedAt.toDateString())
    ).size;

    return {
      month: `${year}-${month.toString().padStart(2, '0')}`,
      year,
      foods,
      totalDays: uniqueDays,
      uniqueFoods: foods.length,
      totalNutrition,
    };
  } catch (error) {
    console.error('Error getting monthly food summary:', error);
    throw error;
  }
};

/**
 * Real-time listener for food consumption changes
 */
export const subscribeToFoodConsumptions = (
  callback: (consumptions: FoodConsumption[]) => void,
  userId?: string
) => {
  const consumptionRef = collection(db, 'foodConsumptions');
  
  // Use simpler query approach to avoid composite index issues
  let q;
  
  if (userId) {
    // Query by userId only to avoid composite index requirement
    q = query(
      consumptionRef,
      where('userId', '==', userId)
    );
  } else {
    // Query all documents if no userId
    q = query(consumptionRef);
  }

  return onSnapshot(q, (querySnapshot) => {
    const consumptions: FoodConsumption[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      consumptions.push({
        id: doc.id,
        foodName: data.foodName,
        quantity: data.quantity,
        unit: data.unit,
        nutrition: data.nutrition,
        consumedAt: data.consumedAt instanceof Timestamp 
          ? data.consumedAt.toDate() 
          : data.consumedAt,
        mealType: data.mealType,
        userId: data.userId,
      });
    });
    
    // Sort by consumedAt in memory (most recent first)
    consumptions.sort((a, b) => b.consumedAt.getTime() - a.consumedAt.getTime());
    
    callback(consumptions);
  }, (error) => {
    console.error('Error in food consumption subscription:', error);
  });
};

/**
 * Check if a daily meal program has already been imported
 */
export const isDailyMealProgramImported = async (
  date: string,
  userId?: string
): Promise<boolean> => {
  try {
    const consumptionRef = collection(db, 'foodConsumptions');
    const targetDate = new Date(date);
    
    // Set time to start and end of day for comparison
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);
    
    let q;
    if (userId) {
      q = query(
        consumptionRef,
        where('userId', '==', userId)
      );
    } else {
      q = query(consumptionRef);
    }

    const querySnapshot = await getDocs(q);
    
    // Check if any consumption records exist for this date
    let hasRecords = false;
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      const consumedAt = data.consumedAt instanceof Timestamp 
        ? data.consumedAt.toDate() 
        : new Date(data.consumedAt);
      
      if (consumedAt >= startOfDay && consumedAt <= endOfDay) {
        hasRecords = true;
      }
    });
    
    return hasRecords;
  } catch (error) {
    console.error('Error checking if daily meal program is imported:', error);
    return false; // Default to not imported if error
  }
};

/**
 * Import daily meal program to consumption history
 */
export const importDailyMealProgram = async (
  mealProgram: {
    date: string;
    foods: Array<{
      name: string;
      quantity: number;
      protein: number;
      fats: number;
      carbs: number;
      calories: number;
    }>;
  },
  userId?: string
): Promise<void> => {
  try {
    // Check if this date has already been imported
    const alreadyImported = await isDailyMealProgramImported(mealProgram.date, userId);
    if (alreadyImported) {
      console.log(`⚠️ Daily meal program for ${mealProgram.date} already imported, skipping`);
      return;
    }
    
    const consumptionDate = new Date(mealProgram.date);
    
    // Create consumption records for each food
    const promises = mealProgram.foods.map(food => {
      // Determine correct unit based on food database
      const foodInfo = FOOD_DATABASE[food.name];
      const unit = foodInfo?.isUnitFood ? 'units' : 'g';
      
      const consumption: Omit<FoodConsumption, 'id'> = {
        foodName: food.name,
        quantity: food.quantity,
        unit: unit,
        nutrition: {
          protein: food.protein,
          fats: food.fats,
          carbs: food.carbs,
          calories: food.calories,
        },
        consumedAt: consumptionDate,
        mealType: 'lunch', // Default meal type
        userId,
      };
      
      return recordFoodConsumption(consumption);
    });

    await Promise.all(promises);
    console.log('✅ Daily meal program imported to consumption history');
  } catch (error) {
    console.error('❌ Error importing daily meal program:', error);
    throw error;
  }
};

const foodHistoryService = {
  recordFoodConsumption,
  getFoodConsumptionHistory,
  getCurrentMonthFoodStats,
  getFoodStatsForPeriod,
  getMonthlyFoodSummary,
  subscribeToFoodConsumptions,
  importDailyMealProgram,
  isDailyMealProgramImported,
};

export default foodHistoryService;
