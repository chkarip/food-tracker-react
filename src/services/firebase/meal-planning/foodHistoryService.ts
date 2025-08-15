import { 
  collection, 
  doc, 
  setDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  limit, 
  Timestamp 
} from 'firebase/firestore';
import { db } from '../../../config/firebase';
import { FoodHistory } from '../../../types/firebase';
import { formatDate, COLLECTIONS, createTimestamp } from '../shared/utils';

// Extended food history document for detailed meal tracking
interface MealHistoryDocument {
  id?: string;
  userId: string;
  date: string; // YYYY-MM-DD format
  foods: Array<{ name: string; amount: number; cost: number }>;
  macros: {
    protein: number;
    fats: number;
    carbs: number;
    calories: number;
    cost: number;
  };
  externalNutrition: {
    protein: number;
    fats: number; 
    carbs: number;
    calories: number;
  };
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// Save food history entry
export const saveFoodHistory = async (
  userId: string,
  foods: Array<{ name: string; amount: number; cost: number }>,
  macros: {
    protein: number;
    fats: number;
    carbs: number;
    calories: number;
    cost: number;
  },
  externalNutrition: {
    protein: number;
    fats: number; 
    carbs: number;
    calories: number;
  },
  date?: string // Optional date parameter, defaults to today
): Promise<string> => {
  try {
    const entryDate = date || formatDate(new Date());
    const historyId = `${userId}_${entryDate}_${Date.now()}`;
    const historyRef = doc(db, COLLECTIONS.FOOD_HISTORY, historyId);
    
    console.log('🍽️ Firestore DEBUG - saveFoodHistory:');
    console.log('  👤 UserId:', userId);
    console.log('  📅 Date:', entryDate);
    console.log('  🥘 Foods count:', foods.length);
    console.log('  🧮 Macros:', macros);
    console.log('  🌍 External nutrition:', externalNutrition);
    
    const historyDoc: Omit<MealHistoryDocument, 'id'> = {
      userId,
      date: entryDate,
      foods,
      macros,
      externalNutrition,
      createdAt: createTimestamp(),
      updatedAt: createTimestamp()
    };
    
    await setDoc(historyRef, historyDoc);
    
    console.log('  ✅ Successfully saved food history');
    return historyId;
  } catch (error: any) {
    console.error('  ❌ Save food history error:', error);
    throw new Error(`Failed to save food history: ${error.message}`);
  }
};

// Get food history for a specific date
export const getFoodHistoryForDate = async (
  userId: string,
  date: string // YYYY-MM-DD format
): Promise<MealHistoryDocument[]> => {
  try {
    console.log('🍽️ Firestore DEBUG - getFoodHistoryForDate:');
    console.log('  👤 UserId:', userId);
    console.log('  📅 Date:', date);
    
    const q = query(
      collection(db, COLLECTIONS.FOOD_HISTORY),
      where('userId', '==', userId),
      where('date', '==', date),
      orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    console.log('  🍽️ Food history records found:', querySnapshot.docs.length);
    
    const results = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as MealHistoryDocument[];
    
    console.log('  ✅ Successfully loaded food history for date');
    return results;
  } catch (error: any) {
    console.error('  ❌ Get food history error:', error);
    throw new Error(`Failed to get food history: ${error.message}`);
  }
};

// Get recent food history entries (last N days)
export const getRecentFoodHistory = async (
  userId: string,
  daysBack: number = 7
): Promise<MealHistoryDocument[]> => {
  try {
    console.log('🍽️ Firestore DEBUG - getRecentFoodHistory:');
    console.log('  👤 UserId:', userId);
    console.log('  📅 Days back:', daysBack);
    
    // Calculate start date
    const today = new Date();
    const startDate = new Date(today);
    startDate.setDate(today.getDate() - daysBack + 1); // Include today
    
    const startDateString = formatDate(startDate);
    const endDateString = formatDate(today);
    
    console.log('  📅 Date range:', { startDateString, endDateString });
    
    const q = query(
      collection(db, COLLECTIONS.FOOD_HISTORY),
      where('userId', '==', userId),
      where('date', '>=', startDateString),
      where('date', '<=', endDateString),
      orderBy('date', 'desc'),
      orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    console.log('  🍽️ Recent food history records found:', querySnapshot.docs.length);
    
    const results = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as MealHistoryDocument[];
    
    console.log('  ✅ Successfully loaded recent food history');
    return results;
  } catch (error: any) {
    console.error('  ❌ Get recent food history error:', error);
    throw new Error(`Failed to get recent food history: ${error.message}`);
  }
};

// Get food history for a specific month
export const getFoodHistoryForMonth = async (
  userId: string,
  year: number,
  month: number // 1-based month (1-12)
): Promise<MealHistoryDocument[]> => {
  try {
    console.log('🍽️ Firestore DEBUG - getFoodHistoryForMonth:');
    console.log('  👤 UserId:', userId);
    console.log('  📅 Year/Month:', year, month);
    
    // Calculate start and end dates for the month
    const startDate = `${year}-${month.toString().padStart(2, '0')}-01`;
    const lastDay = new Date(year, month, 0).getDate(); // Get last day of month
    const endDate = `${year}-${month.toString().padStart(2, '0')}-${lastDay.toString().padStart(2, '0')}`;
    
    console.log('  📅 Date range:', { startDate, endDate });
    
    const q = query(
      collection(db, COLLECTIONS.FOOD_HISTORY),
      where('userId', '==', userId),
      where('date', '>=', startDate),
      where('date', '<=', endDate),
      orderBy('date', 'desc'),
      orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    console.log('  🍽️ Monthly food history records found:', querySnapshot.docs.length);
    
    const results = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as MealHistoryDocument[];
    
    console.log('  ✅ Successfully loaded monthly food history');
    return results;
  } catch (error: any) {
    console.error('  ❌ Get monthly food history error:', error);
    throw new Error(`Failed to get monthly food history: ${error.message}`);
  }
};

// Get food history analytics for trend analysis
export const getFoodHistoryAnalytics = async (
  userId: string,
  daysBack: number = 30
): Promise<{
  dailyAverages: {
    protein: number;
    fats: number;
    carbs: number;
    calories: number;
    cost: number;
  };
  totalDays: number;
  totalEntries: number;
  mostCommonFoods: Array<{ name: string; frequency: number }>;
}> => {
  try {
    console.log('📊 Firestore DEBUG - getFoodHistoryAnalytics:');
    console.log('  👤 UserId:', userId);
    console.log('  📅 Days back:', daysBack);
    
    const foodHistory = await getRecentFoodHistory(userId, daysBack);
    console.log('  📊 Total entries for analysis:', foodHistory.length);
    
    if (foodHistory.length === 0) {
      return {
        dailyAverages: { protein: 0, fats: 0, carbs: 0, calories: 0, cost: 0 },
        totalDays: 0,
        totalEntries: 0,
        mostCommonFoods: []
      };
    }
    
    // Group by date to calculate daily totals
    const dailyTotals = new Map<string, {
      protein: number;
      fats: number;
      carbs: number;
      calories: number;
      cost: number;
    }>();
    
    const foodFrequency = new Map<string, number>();
    
    foodHistory.forEach(entry => {
      const date = entry.date;
      const current = dailyTotals.get(date) || { protein: 0, fats: 0, carbs: 0, calories: 0, cost: 0 };
      
      // Add macros from foods + external nutrition
      current.protein += entry.macros.protein + entry.externalNutrition.protein;
      current.fats += entry.macros.fats + entry.externalNutrition.fats;
      current.carbs += entry.macros.carbs + entry.externalNutrition.carbs;
      current.calories += entry.macros.calories + entry.externalNutrition.calories;
      current.cost += entry.macros.cost;
      
      dailyTotals.set(date, current);
      
      // Count food frequency
      entry.foods.forEach((food: { name: string; amount: number; cost: number }) => {
        foodFrequency.set(food.name, (foodFrequency.get(food.name) || 0) + 1);
      });
    });
    
    // Calculate averages
    const totalDays = dailyTotals.size;
    const totalMacros = Array.from(dailyTotals.values()).reduce(
      (sum, day) => ({
        protein: sum.protein + day.protein,
        fats: sum.fats + day.fats,
        carbs: sum.carbs + day.carbs,
        calories: sum.calories + day.calories,
        cost: sum.cost + day.cost
      }),
      { protein: 0, fats: 0, carbs: 0, calories: 0, cost: 0 }
    );
    
    const dailyAverages = {
      protein: Math.round((totalMacros.protein / totalDays) * 10) / 10,
      fats: Math.round((totalMacros.fats / totalDays) * 10) / 10,
      carbs: Math.round((totalMacros.carbs / totalDays) * 10) / 10,
      calories: Math.round((totalMacros.calories / totalDays) * 10) / 10,
      cost: Math.round((totalMacros.cost / totalDays) * 100) / 100
    };
    
    // Get most common foods (top 10)
    const mostCommonFoods = Array.from(foodFrequency.entries())
      .map(([name, frequency]) => ({ name, frequency }))
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, 10);
    
    console.log('  📊 Analytics calculated:', {
      dailyAverages,
      totalDays,
      totalEntries: foodHistory.length,
      topFoodsCount: mostCommonFoods.length
    });
    
    return {
      dailyAverages,
      totalDays,
      totalEntries: foodHistory.length,
      mostCommonFoods
    };
  } catch (error: any) {
    console.error('  ❌ Get food history analytics error:', error);
    throw new Error(`Failed to get food history analytics: ${error.message}`);
  }
};
