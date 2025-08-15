/**
 * foodConsumptionService.ts
 * ------------------------------------------------------------
 * Records food-consumption documents in Firestore and provides
 * analytics (period stats, monthly summaries, realtime feed).
 * No dependency on the old FOOD_DATABASE constant.
 */

import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  onSnapshot,
  Timestamp,
  Query,
  DocumentData
} from 'firebase/firestore';
import { db } from '../../../config/firebase';

/* ------------------------------------------------------------------ */
/*  SHARED TYPES                                                       */
/* ------------------------------------------------------------------ */

export interface FoodConsumption {
  id: string;                                 // Firestore document ID
  foodName: string;
  quantity: number;
  unit: 'g' | 'kg' | 'unit' | 'units';
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

export type NewFoodConsumption = Omit<FoodConsumption, 'id'>;

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
  month: string; // YYYY-MM
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
 * Single food item inside a daily-meal program.
 * The caller (FoodContext) supplies `isUnitFood`.
 */
export interface MealProgramFood {
  name: string;
  quantity: number;
  protein: number;
  fats: number;
  carbs: number;
  calories: number;
  isUnitFood: boolean;
}

/* ------------------------------------------------------------------ */
/*  COLLECTION REF                                                     */
/* ------------------------------------------------------------------ */

const collectionRef = collection(db, 'foodConsumptions');

/* ------------------------------------------------------------------ */
/*  INSERT                                                             */
/* ------------------------------------------------------------------ */

export const recordFoodConsumption = async (
  consumption: NewFoodConsumption
): Promise<string> => {
  try {
    const docRef = await addDoc(collectionRef, {
      ...consumption,
      consumedAt: Timestamp.fromDate(consumption.consumedAt)
    });
    return docRef.id;
  } catch (err) {
    console.error('❌ recordFoodConsumption:', err);
    throw err;
  }
};

/* ------------------------------------------------------------------ */
/*  HISTORY FETCH                                                      */
/* ------------------------------------------------------------------ */

export const getFoodConsumptionHistory = async (
  start: Date,
  end: Date,
  userId?: string
): Promise<FoodConsumption[]> => {
  try {
    const q: Query<DocumentData> = userId
      ? query(collectionRef, where('userId', '==', userId))
      : query(collectionRef);

    const snap = await getDocs(q);
    const out: FoodConsumption[] = [];

    snap.forEach(doc => {
      const d = doc.data();
      const consumedAt =
        d.consumedAt instanceof Timestamp
          ? d.consumedAt.toDate()
          : new Date(d.consumedAt);

      if (consumedAt >= start && consumedAt <= end) {
        out.push({
          id: doc.id,
          foodName: d.foodName,
          quantity: d.quantity,
          unit: d.unit,
          nutrition: d.nutrition,
          consumedAt,
          mealType: d.mealType,
          userId: d.userId
        });
      }
    });

    return out.sort((a, b) => b.consumedAt.getTime() - a.consumedAt.getTime());
  } catch (err) {
    console.error('❌ getFoodConsumptionHistory:', err);
    throw err;
  }
};

/* ------------------------------------------------------------------ */
/*  STATISTICS                                                         */
/* ------------------------------------------------------------------ */

export const getFoodStatsForPeriod = async (
  start: Date,
  end: Date,
  userId?: string
): Promise<FoodHistoryStats[]> => {
  try {
    const consumptions = await getFoodConsumptionHistory(start, end, userId);

    /* group by foodName */
    const groups: Record<string, FoodConsumption[]> = {};
    consumptions.forEach(c => {
      (groups[c.foodName] ||= []).push(c);
    });

    /* fallback weights for unit foods */
    const UNIT_WEIGHTS: Record<string, number> = {
      Eggs: 0.05,
      'Tortilla wrap': 0.064,
      'Canned tuna': 0.16
    };

    const stats: FoodHistoryStats[] = Object.entries(groups).map(
      ([foodName, list]) => {
        const lastEaten = list.reduce(
          (latest, c) => (c.consumedAt > latest ? c.consumedAt : latest),
          new Date(0)
        );

        /* total kg */
        const totalKilos = list.reduce((sum, c) => {
          if (c.unit === 'g') return sum + c.quantity / 1000;
          if (c.unit === 'kg') return sum + c.quantity;
          if (c.unit === 'unit' || c.unit === 'units') {
            const w = UNIT_WEIGHTS[c.foodName] ?? 0.1;
            return sum + w * c.quantity;
          }
          return sum;
        }, 0);

        /* nutrition totals */
        const nutritionTotals = list.reduce(
          (tot, c) => ({
            protein: tot.protein + c.nutrition.protein,
            fats: tot.fats + c.nutrition.fats,
            carbs: tot.carbs + c.nutrition.carbs,
            calories: tot.calories + c.nutrition.calories
          }),
          { protein: 0, fats: 0, carbs: 0, calories: 0 }
        );

        const avgQty =
          list.reduce((s, c) => s + c.quantity, 0) / list.length;

        return {
          foodName,
          lastEaten,
          timesEatenThisMonth: list.length,
          totalKilosThisMonth: totalKilos,
          totalConsumptions: list.length,
          averageQuantityPerMeal: avgQty,
          nutritionTotals
        };
      }
    );

    return stats.sort((a, b) => b.lastEaten.getTime() - a.lastEaten.getTime());
  } catch (err) {
    console.error('❌ getFoodStatsForPeriod:', err);
    throw err;
  }
};

export const getCurrentMonthFoodStats = async (
  userId?: string
): Promise<FoodHistoryStats[]> => {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
  return getFoodStatsForPeriod(start, end, userId);
};

/* ------------------------------------------------------------------ */
/*  MONTHLY SUMMARY                                                    */
/* ------------------------------------------------------------------ */

export const getMonthlyFoodSummary = async (
  year: number,
  month: number,
  userId?: string
): Promise<MonthlyFoodSummary> => {
  try {
    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 0, 23, 59, 59);

    const foods = await getFoodStatsForPeriod(start, end, userId);

    const totalNutrition = foods.reduce(
      (tot, f) => ({
        protein: tot.protein + f.nutritionTotals.protein,
        fats: tot.fats + f.nutritionTotals.fats,
        carbs: tot.carbs + f.nutritionTotals.carbs,
        calories: tot.calories + f.nutritionTotals.calories
      }),
      { protein: 0, fats: 0, carbs: 0, calories: 0 }
    );

    const all = await getFoodConsumptionHistory(start, end, userId);
    const uniqueDays = new Set(
      all.map(c => c.consumedAt.toDateString())
    ).size;

    return {
      month: `${year}-${month.toString().padStart(2, '0')}`,
      year,
      foods,
      totalDays: uniqueDays,
      uniqueFoods: foods.length,
      totalNutrition
    };
  } catch (err) {
    console.error('❌ getMonthlyFoodSummary:', err);
    throw err;
  }
};

/* ------------------------------------------------------------------ */
/*  REAL-TIME LISTENER                                                 */
/* ------------------------------------------------------------------ */

export const subscribeToFoodConsumptions = (
  cb: (c: FoodConsumption[]) => void,
  userId?: string
) => {
  const q: Query<DocumentData> = userId
    ? query(collectionRef, where('userId', '==', userId))
    : query(collectionRef);

  return onSnapshot(
    q,
    snap => {
      const list: FoodConsumption[] = [];
      snap.forEach(doc => {
        const d = doc.data();
        list.push({
          id: doc.id,
          foodName: d.foodName,
          quantity: d.quantity,
          unit: d.unit,
          nutrition: d.nutrition,
          consumedAt:
            d.consumedAt instanceof Timestamp
              ? d.consumedAt.toDate()
              : new Date(d.consumedAt),
          mealType: d.mealType,
          userId: d.userId
        });
      });
      list.sort((a, b) => b.consumedAt.getTime() - a.consumedAt.getTime());
      cb(list);
    },
    err => console.error('🔥 subscribeToFoodConsumptions:', err)
  );
};

/* ------------------------------------------------------------------ */
/*  DAILY-MEAL IMPORTER                                                */
/* ------------------------------------------------------------------ */

export const isDailyMealProgramImported = async (
  date: string,
  userId?: string
): Promise<boolean> => {
  try {
    const target = new Date(date);
    const start = new Date(target);
    start.setHours(0, 0, 0, 0);
    const end = new Date(target);
    end.setHours(23, 59, 59, 999);

    const q: Query<DocumentData> = userId
      ? query(collectionRef, where('userId', '==', userId))
      : query(collectionRef);

    const snap = await getDocs(q);
    let exists = false;

    snap.forEach(doc => {
      const ts =
        doc.data().consumedAt instanceof Timestamp
          ? doc.data().consumedAt.toDate()
          : new Date(doc.data().consumedAt);

      if (ts >= start && ts <= end) exists = true;
    });

    return exists;
  } catch (err) {
    console.error('❌ isDailyMealProgramImported:', err);
    return false;
  }
};

export const importDailyMealProgram = async (
  mealProgram: { date: string; foods: MealProgramFood[] },
  userId?: string
): Promise<void> => {
  try {
    if (await isDailyMealProgramImported(mealProgram.date, userId)) {
      console.log(`⚠️ Meal program ${mealProgram.date} already imported.`);
      return;
    }

    const date = new Date(mealProgram.date);

    await Promise.all(
      mealProgram.foods.map(f => {
        const unit: 'units' | 'g' = f.isUnitFood ? 'units' : 'g';

        const consumption: NewFoodConsumption = {
          foodName: f.name,
          quantity: f.quantity,
          unit,
          nutrition: {
            protein: f.protein,
            fats: f.fats,
            carbs: f.carbs,
            calories: f.calories
          },
          consumedAt: date,
          mealType: 'lunch',
          userId
        };

        return recordFoodConsumption(consumption);
      })
    );

    console.log('✅ Daily meal program imported.');
  } catch (err) {
    console.error('❌ importDailyMealProgram:', err);
    throw err;
  }
};

/* ------------------------------------------------------------------ */
/*  AGGREGATE EXPORT                                                   */
/* ------------------------------------------------------------------ */

const foodHistoryService = {
  recordFoodConsumption,
  getFoodConsumptionHistory,
  getFoodStatsForPeriod,
  getCurrentMonthFoodStats,
  getMonthlyFoodSummary,
  subscribeToFoodConsumptions,
  isDailyMealProgramImported,
  importDailyMealProgram
};

export default foodHistoryService;
