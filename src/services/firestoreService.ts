import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  limit,
  Timestamp,
  updateDoc,
  deleteDoc
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { DailyPlanDocument, UserPreferences, FoodHistory, ActivityHistoryDocument, TimeslotsDocument, ScheduledActivitiesDocument, ScheduledWorkoutDocument } from '../types/firebase';
import { SelectedFood, ExternalNutrition } from '../types/nutrition';
import { calculateTotalMacros } from '../utils/nutritionCalculations';

const MEAL_PLANS_COLLECTION = 'mealPlans';
const USER_PREFERENCES_COLLECTION = 'userPreferences';
const FOOD_HISTORY_COLLECTION = 'foodHistory';
const ACTIVITY_HISTORY_COLLECTION = 'activityHistory';
const TIMESLOTS_COLLECTION = 'timeslots';
const SCHEDULED_ACTIVITIES_COLLECTION = 'scheduledActivities';
const SCHEDULED_WORKOUTS_COLLECTION = 'scheduledWorkouts';

// Helper to format date as YYYY-MM-DD (timezone-safe)
const formatDate = (date: Date): string => {
  // Use local date components to avoid timezone issues
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Save daily plan to Firestore (with timeslots)
export const saveDailyPlan = async (
  userId: string, 
  timeslotData: { [key: string]: { selectedFoods: SelectedFood[], externalNutrition: ExternalNutrition } },
  foodDatabase: any,
  date?: Date,
  completionStatus?: {
    '6pm': boolean;
    '9:30pm': boolean;
    'gym': boolean;
  }
): Promise<void> => {
  try {
    const planDate = formatDate(date || new Date());
    console.log('💾 Firestore DEBUG - saveDailyPlan:');
    console.log('  👤 UserId:', userId);
    console.log('  📅 Date:', planDate);
    console.log('  🍽️ Timeslot data keys:', Object.keys(timeslotData));
    console.log('  🍽️ Full timeslot data:', timeslotData);
    console.log('  ✅ Completion status:', completionStatus);
    
    // Calculate combined totals from both timeslots
    let combinedMacros = { protein: 0, fats: 0, carbs: 0, calories: 0 };
    
    Object.values(timeslotData).forEach(data => {
      const foodMacros = calculateTotalMacros(data.selectedFoods, foodDatabase); // ✅ Pass foodDatabase
      combinedMacros.protein += foodMacros.protein + data.externalNutrition.protein;
      combinedMacros.fats += foodMacros.fats + data.externalNutrition.fats;
      combinedMacros.carbs += foodMacros.carbs + data.externalNutrition.carbs;
      combinedMacros.calories += foodMacros.calories + data.externalNutrition.calories;
    });

    console.log('  📊 Combined macros calculated:', combinedMacros);

    const planData: Omit<DailyPlanDocument, 'id'> = {
      userId,
      date: planDate,
      timeslots: {
        '6pm': timeslotData['6pm'] || { selectedFoods: [], externalNutrition: { protein: 0, fats: 0, carbs: 0, calories: 0 } },
        '9:30pm': timeslotData['9:30pm'] || { selectedFoods: [], externalNutrition: { protein: 0, fats: 0, carbs: 0, calories: 0 } }
      },
      totalMacros: combinedMacros,
      completionStatus: completionStatus || {
        '6pm': false,
        '9:30pm': false,
        'gym': false
      },
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    };

    console.log('  📄 Final plan data to save:', planData);
    console.log('  🔥 Saving to Firestore collection:', MEAL_PLANS_COLLECTION);

    // Use userId_date as document ID for easy retrieval
    const docId = `${userId}_${planDate}`;
    console.log('  📝 Document ID to use:', docId);
    
    await setDoc(doc(db, MEAL_PLANS_COLLECTION, docId), planData);
    console.log('  ✅ Successfully saved meal plan with docId:', docId);
  } catch (error: any) {
    console.error('  ❌ Save error:', error);
    throw new Error(`Failed to save daily plan: ${error.message}`);
  }
};

// Load daily plan from Firestore
export const loadDailyPlan = async (
  userId: string, 
  date?: Date
): Promise<DailyPlanDocument | null> => {
  try {
    const planDate = formatDate(date || new Date());
    const docId = `${userId}_${planDate}`;
    
    const docSnap = await getDoc(doc(db, MEAL_PLANS_COLLECTION, docId));
    
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as DailyPlanDocument;
    }
    
    return null;
  } catch (error: any) {
    throw new Error(`Failed to load daily plan: ${error.message}`);
  }
};

// Delete daily plan from Firestore
export const deleteDailyPlan = async (
  userId: string, 
  date?: Date
): Promise<void> => {
  try {
    const planDate = formatDate(date || new Date());
    const docId = `${userId}_${planDate}`;
    
    console.log('🗑️ Firestore DEBUG - deleteDailyPlan:');
    console.log('  👤 UserId:', userId);
    console.log('  📅 Date:', planDate);
    console.log('  📝 Document ID to delete:', docId);
    
    await deleteDoc(doc(db, MEAL_PLANS_COLLECTION, docId));
    console.log('  ✅ Successfully deleted meal plan with docId:', docId);
  } catch (error: any) {
    console.error('  ❌ Delete error:', error);
    throw new Error(`Failed to delete daily plan: ${error.message}`);
  }
};

// Update completion status for a daily plan
export const updateCompletionStatus = async (
  userId: string,
  date: Date,
  activityType: '6pm' | '9:30pm' | 'gym',
  completed: boolean
): Promise<void> => {
  try {
    const planDate = formatDate(date);
    const docId = `${userId}_${planDate}`;
    const docRef = doc(db, MEAL_PLANS_COLLECTION, docId);
    
    console.log('✅ Firestore DEBUG - updateCompletionStatus:');
    console.log('  👤 UserId:', userId);
    console.log('  📅 Date:', planDate);
    console.log('  🎯 Activity:', activityType);
    console.log('  ✅ Completed:', completed);
    
    // Check if document exists first
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      // Update existing document
      const currentData = docSnap.data();
      const currentCompletionStatus = currentData.completionStatus || {
        '6pm': false,
        '9:30pm': false,
        'gym': false
      };
      
      await updateDoc(docRef, {
        completionStatus: {
          ...currentCompletionStatus,
          [activityType]: completed
        },
        updatedAt: Timestamp.now()
      });
      
      console.log('  ✅ Successfully updated completion status');
    } else {
      // Create new document with completion status
      const newCompletionStatus = {
        '6pm': false,
        '9:30pm': false,
        'gym': false,
        [activityType]: completed
      };
      
      await setDoc(docRef, {
        userId,
        date: planDate,
        timeslots: {
          '6pm': { selectedFoods: [], externalNutrition: { protein: 0, fats: 0, carbs: 0, calories: 0 } },
          '9:30pm': { selectedFoods: [], externalNutrition: { protein: 0, fats: 0, carbs: 0, calories: 0 } }
        },
        totalMacros: { protein: 0, fats: 0, carbs: 0, calories: 0 },
        completionStatus: newCompletionStatus,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      });
      
      console.log('  ✅ Successfully created new document with completion status');
    }

    // Also save to activity history for 100-day tracking
    await saveActivityHistory(userId, planDate, activityType, completed);
    
  } catch (error: any) {
    console.error('  ❌ Update completion status error:', error);
    throw new Error(`Failed to update completion status: ${error.message}`);
  }
};

// Get user's recent daily plans
export const getRecentDailyPlans = async (
  userId: string, 
  daysCount: number = 7
): Promise<DailyPlanDocument[]> => {
  try {
    // Use the existing composite index (userId asc, date asc) and sort in JS
    const q = query(
      collection(db, MEAL_PLANS_COLLECTION),
      where('userId', '==', userId),
      orderBy('date', 'asc') // Use asc to match your existing index
    );
    
    const querySnapshot = await getDocs(q);
    const allPlans = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as DailyPlanDocument[];
    
    // Sort by date descending (newest first) and limit in JavaScript
    return allPlans
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, daysCount);
  } catch (error: any) {
    throw new Error(`Failed to get recent plans: ${error.message}`);
  }
};

// Get daily plans for a specific month
export const getDailyPlansForMonth = async (
  userId: string, 
  year: number, 
  month: number
): Promise<DailyPlanDocument[]> => {
  try {
    // Create start and end dates for the month using timezone-safe formatting
    const startOfMonth = new Date(year, month, 1);
    const endOfMonth = new Date(year, month + 1, 0);
    
    // Use local date components to avoid timezone issues
    const startDateString = formatDate(startOfMonth);
    const endDateString = formatDate(endOfMonth);
    
    console.log('🔍 Firestore DEBUG - getDailyPlansForMonth:');
    console.log('  📅 Input params:', { userId, year, month, monthName: new Date(year, month).toLocaleDateString('en-US', { month: 'long' }) });
    console.log('  📅 Date range:', { startDateString, endDateString });
    console.log('  🔥 Collection:', MEAL_PLANS_COLLECTION);
    
    const q = query(
      collection(db, MEAL_PLANS_COLLECTION),
      where('userId', '==', userId),
      where('date', '>=', startDateString),
      where('date', '<=', endDateString)
      // orderBy('date', 'asc') // Temporarily disabled until index is built
    );
    
    console.log('  📊 Firestore query constructed, executing...');
    const querySnapshot = await getDocs(q);
    console.log('  📊 Firestore query completed, docs found:', querySnapshot.docs.length);
    
    const results = querySnapshot.docs.map(doc => {
      const data = doc.data();
      console.log('  📄 Processing document:', { id: doc.id, date: data.date, hasTimeslots: !!data.timeslots });
      
      // Handle backward compatibility for old format
      if (!data.timeslots && data.selectedFoods) {
        console.log('  🔄 Converting old format plan for doc:', doc.id);
        return {
          id: doc.id,
          userId: data.userId,
          date: data.date,
          totalMacros: data.totalMacros,
          createdAt: data.createdAt,
          updatedAt: data.updatedAt,
          completionStatus: data.completionStatus || {
            '6pm': false,
            '9:30pm': false,
            'gym': false
          },
          timeslots: {
            '6pm': {
              selectedFoods: data.selectedFoods || [],
              externalNutrition: data.externalNutrition || { protein: 0, fats: 0, carbs: 0, calories: 0 }
            },
            '9:30pm': {
              selectedFoods: [],
              externalNutrition: { protein: 0, fats: 0, carbs: 0, calories: 0 }
            }
          }
        } as DailyPlanDocument;
      }
      
      // Return new format - ensure completionStatus exists
      console.log('  ✅ Using new format for doc:', doc.id);
      const docData = {
        id: doc.id,
        ...data,
        completionStatus: data.completionStatus || {
          '6pm': false,
          '9:30pm': false,
          'gym': false
        }
      } as DailyPlanDocument;
      
      return docData;
    });
    
    console.log('  🎯 Final results:', results.length, 'plans processed');
    console.log('  🎯 Results summary:', results.map(r => ({ id: r.id, date: r.date })));
    
    // Sort client-side until Firestore index is built
    const sortedResults = results.sort((a, b) => a.date.localeCompare(b.date));
    
    return sortedResults;
  } catch (error: any) {
    console.error('🚨 Firestore query error:', error);
    throw new Error(`Failed to get monthly plans: ${error.message}`);
  }
};

// Save user preferences
export const saveUserPreferences = async (preferences: Omit<UserPreferences, 'id' | 'createdAt' | 'updatedAt'>): Promise<void> => {
  try {
    const docId = preferences.userId;
    const existingDoc = await getDoc(doc(db, USER_PREFERENCES_COLLECTION, docId));
    
    if (existingDoc.exists()) {
      // Update existing preferences
      await updateDoc(doc(db, USER_PREFERENCES_COLLECTION, docId), {
        ...preferences,
        updatedAt: Timestamp.now()
      });
    } else {
      // Create new preferences
      await setDoc(doc(db, USER_PREFERENCES_COLLECTION, docId), {
        ...preferences,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      });
    }
  } catch (error: any) {
    throw new Error(`Failed to save preferences: ${error.message}`);
  }
};

// Load user preferences
export const loadUserPreferences = async (userId: string): Promise<UserPreferences | null> => {
  try {
    const docSnap = await getDoc(doc(db, USER_PREFERENCES_COLLECTION, userId));
    
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as UserPreferences;
    }
    
    return null;
  } catch (error: any) {
    throw new Error(`Failed to load preferences: ${error.message}`);
  }
};

// Update food usage history for recommendations
export const updateFoodHistory = async (userId: string, foodName: string, amount: number): Promise<void> => {
  try {
    const docId = `${userId}_${foodName}`;
    const docRef = doc(db, FOOD_HISTORY_COLLECTION, docId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      const data = docSnap.data() as FoodHistory;
      await updateDoc(docRef, {
        amount, // Update with latest amount
        frequency: data.frequency + 1,
        lastUsed: Timestamp.now()
      });
    } else {
      await setDoc(docRef, {
        userId,
        foodName,
        amount,
        frequency: 1,
        lastUsed: Timestamp.now()
      });
    }
  } catch (error: any) {
    throw new Error(`Failed to update food history: ${error.message}`);
  }
};

// Get popular foods for user (for recommendations)
export const getPopularFoods = async (userId: string, limitCount: number = 10): Promise<FoodHistory[]> => {
  try {
    const q = query(
      collection(db, FOOD_HISTORY_COLLECTION),
      where('userId', '==', userId),
      orderBy('frequency', 'desc'),
      limit(limitCount)
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as FoodHistory[];
  } catch (error: any) {
    throw new Error(`Failed to get popular foods: ${error.message}`);
  }
};

// Save activity completion to history for 100-day tracking
export const saveActivityHistory = async (
  userId: string,
  date: string, // YYYY-MM-DD format
  activityType: '6pm' | '9:30pm' | 'gym',
  completed: boolean
): Promise<void> => {
  try {
    const historyId = `${userId}_${date}_${activityType}`;
    const historyRef = doc(db, ACTIVITY_HISTORY_COLLECTION, historyId);
    
    console.log('📊 Firestore DEBUG - saveActivityHistory:');
    console.log('  👤 UserId:', userId);
    console.log('  📅 Date:', date);
    console.log('  🎯 Activity:', activityType);
    console.log('  ✅ Completed:', completed);
    
    await setDoc(historyRef, {
      userId,
      activityType,
      date,
      completed,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    }, { merge: true });
    
    console.log('  ✅ Successfully saved activity history');
  } catch (error: any) {
    console.error('  ❌ Save activity history error:', error);
    throw new Error(`Failed to save activity history: ${error.message}`);
  }
};

// Get last 100 days of activity history for a specific activity type
export const getLast100DaysHistory = async (
  userId: string,
  activityType: '6pm' | '9:30pm' | 'gym'
): Promise<ActivityHistoryDocument[]> => {
  try {
    console.log('📊 Firestore DEBUG - getLast100DaysHistory:');
    console.log('  👤 UserId:', userId);
    console.log('  🎯 Activity:', activityType);
    
    // Calculate date 100 days ago
    const today = new Date();
    const hundredDaysAgo = new Date(today);
    hundredDaysAgo.setDate(today.getDate() - 99); // 99 days ago + today = 100 days
    
    const startDate = formatDate(hundredDaysAgo);
    const endDate = formatDate(today);
    
    console.log('  📅 Date range:', { startDate, endDate });
    
    const q = query(
      collection(db, ACTIVITY_HISTORY_COLLECTION),
      where('userId', '==', userId),
      where('activityType', '==', activityType),
      where('date', '>=', startDate),
      where('date', '<=', endDate)
      // Removed orderBy to work with existing index
    );
    
    const querySnapshot = await getDocs(q);
    console.log('  📊 History records found:', querySnapshot.docs.length);
    
    const results = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as ActivityHistoryDocument[];
    
    // Sort by date in JavaScript since we removed orderBy for index compatibility
    results.sort((a, b) => b.date.localeCompare(a.date));
    
    console.log('  ✅ Successfully loaded activity history');
    return results;
  } catch (error: any) {
    console.error('  ❌ Get activity history error:', error);
    throw new Error(`Failed to get activity history: ${error.message}`);
  }
};

// Generate 100-day history array with missing days filled as incomplete
export const generate100DayHistory = async (
  userId: string,
  activityType: '6pm' | '9:30pm' | 'gym'
): Promise<{ date: string; completed: boolean; isToday: boolean }[]> => {
  try {
    const historyRecords = await getLast100DaysHistory(userId, activityType);
    const historyMap = new Map<string, boolean>();
    
    // Create lookup map from database records
    historyRecords.forEach(record => {
      historyMap.set(record.date, record.completed);
    });
    
    // Generate last 100 days
    const today = new Date();
    const result: { date: string; completed: boolean; isToday: boolean }[] = [];
    
    for (let i = 99; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      const dateString = formatDate(date);
      const isToday = i === 0;
      
      result.push({
        date: dateString,
        completed: historyMap.get(dateString) || false,
        isToday
      });
    }
    
    console.log('📊 Generated 100-day history for', activityType, ':', result.length, 'days');
    return result;
  } catch (error: any) {
    console.error('❌ Generate 100-day history error:', error);
    throw new Error(`Failed to generate 100-day history: ${error.message}`);
  }
};

// Migrate existing daily plan completion status to activity history
export const migrateCompletionStatusToHistory = async (userId: string): Promise<void> => {
  try {
    console.log('🔄 Starting migration of completion status to activity history for user:', userId);
    
    // Get all daily plans for the user
    const q = query(
      collection(db, MEAL_PLANS_COLLECTION),
      where('userId', '==', userId)
    );
    
    const querySnapshot = await getDocs(q);
    console.log('📄 Found', querySnapshot.docs.length, 'daily plans to migrate');
    
    const activityTypes: ('6pm' | '9:30pm' | 'gym')[] = ['6pm', '9:30pm', 'gym'];
    let migratedCount = 0;
    
    for (const doc of querySnapshot.docs) {
      const data = doc.data() as DailyPlanDocument;
      
      if (data.completionStatus) {
        for (const activityType of activityTypes) {
          const completed = data.completionStatus[activityType] || false;
          
          // Only migrate if this activity was completed (to avoid overwriting false values unnecessarily)
          if (completed) {
            await saveActivityHistory(userId, data.date, activityType, completed);
            migratedCount++;
          }
        }
      }
    }
    
    console.log('✅ Migration completed:', migratedCount, 'activity records migrated');
  } catch (error: any) {
    console.error('❌ Migration error:', error);
    throw new Error(`Failed to migrate completion status: ${error.message}`);
  }
};

// Get activity history for a specific month (for calendar display)
export const getActivityHistoryForMonth = async (
  userId: string,
  year: number,
  month: number // 1-based month (1-12)
): Promise<ActivityHistoryDocument[]> => {
  try {
    console.log('📊 Firestore DEBUG - getActivityHistoryForMonth:');
    console.log('  👤 UserId:', userId);
    console.log('  📅 Year/Month:', year, month);
    
    // Calculate start and end dates for the month
    const startDate = `${year}-${month.toString().padStart(2, '0')}-01`;
    const lastDay = new Date(year, month, 0).getDate(); // Get last day of month
    const endDate = `${year}-${month.toString().padStart(2, '0')}-${lastDay.toString().padStart(2, '0')}`;
    
    console.log('  📅 Date range:', { startDate, endDate });
    
    const q = query(
      collection(db, ACTIVITY_HISTORY_COLLECTION),
      where('userId', '==', userId),
      where('date', '>=', startDate),
      where('date', '<=', endDate)
    );
    
    const querySnapshot = await getDocs(q);
    console.log('  📊 Activity history records found:', querySnapshot.docs.length);
    
    const results = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as ActivityHistoryDocument[];
    
    console.log('  ✅ Successfully loaded monthly activity history');
    return results;
  } catch (error: any) {
    console.error('  ❌ Get monthly activity history error:', error);
    throw new Error(`Failed to get monthly activity history: ${error.message}`);
  }
};

// Get activity history for a specific date (for day modal)
export const getActivityHistoryForDate = async (
  userId: string,
  date: string // YYYY-MM-DD format
): Promise<ActivityHistoryDocument[]> => {
  try {
    console.log('📊 Firestore DEBUG - getActivityHistoryForDate:');
    console.log('  👤 UserId:', userId);
    console.log('  📅 Date:', date);
    
    const q = query(
      collection(db, ACTIVITY_HISTORY_COLLECTION),
      where('userId', '==', userId),
      where('date', '==', date)
    );
    
    const querySnapshot = await getDocs(q);
    console.log('  📊 Activity history records found:', querySnapshot.docs.length);
    
    const results = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as ActivityHistoryDocument[];
    
    console.log('  ✅ Successfully loaded daily activity history');
    return results;
  } catch (error: any) {
    console.error('  ❌ Get daily activity history error:', error);
    throw new Error(`Failed to get daily activity history: ${error.message}`);
  }
};

// ========================================
// NEW TIMESLOTS COLLECTION FUNCTIONS
// ========================================

// Save timeslots (detailed meal data) to separate collection
export const saveTimeslots = async (
  userId: string, 
  timeslotData: { [key: string]: { selectedFoods: SelectedFood[], externalNutrition: ExternalNutrition } },
  foodDatabase: any,
  date?: Date
): Promise<void> => {
  try {
    const planDate = formatDate(date || new Date());
    console.log('💾 Firestore DEBUG - saveTimeslots:');
    console.log('  👤 UserId:', userId);
    console.log('  📅 Date:', planDate);
    console.log('  🍽️ Timeslot data keys:', Object.keys(timeslotData));
    
    // Calculate combined totals from both timeslots
    let combinedMacros = { protein: 0, fats: 0, carbs: 0, calories: 0 };
    
    Object.values(timeslotData).forEach(data => {
      const foodMacros = calculateTotalMacros(data.selectedFoods, foodDatabase); // ✅ Pass foodDatabase
      combinedMacros.protein += foodMacros.protein + data.externalNutrition.protein;
      combinedMacros.fats += foodMacros.fats + data.externalNutrition.fats;
      combinedMacros.carbs += foodMacros.carbs + data.externalNutrition.carbs;
      combinedMacros.calories += foodMacros.calories + data.externalNutrition.calories;
    });

    const timeslotsData: Omit<TimeslotsDocument, 'id'> = {
      userId,
      date: planDate,
      timeslots: {
        '6pm': timeslotData['6pm'] || { selectedFoods: [], externalNutrition: { protein: 0, fats: 0, carbs: 0, calories: 0 } },
        '9:30pm': timeslotData['9:30pm'] || { selectedFoods: [], externalNutrition: { protein: 0, fats: 0, carbs: 0, calories: 0 } }
      },
      totalMacros: combinedMacros,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    };

    const docId = `${userId}_${planDate}`;
    await setDoc(doc(db, TIMESLOTS_COLLECTION, docId), timeslotsData);
    
    // Also update scheduled activities to indicate meals are planned
    await saveScheduledActivities(userId, {
      'meal-6pm': (timeslotData['6pm']?.selectedFoods?.length || 0) > 0,
      'meal-9:30pm': (timeslotData['9:30pm']?.selectedFoods?.length || 0) > 0,
      'gym': false // Keep existing gym schedule
    }, date);
    
    console.log('  ✅ Successfully saved timeslots with docId:', docId);
  } catch (error: any) {
    console.error('  ❌ Save timeslots error:', error);
    throw new Error(`Failed to save timeslots: ${error.message}`);
  }
};

// Load timeslots for a specific date
export const loadTimeslots = async (
  userId: string, 
  date?: Date
): Promise<TimeslotsDocument | null> => {
  try {
    const planDate = formatDate(date || new Date());
    const docId = `${userId}_${planDate}`;
    
    console.log('🔍 Loading timeslots for:', { userId, date: planDate, docId });
    
    const docSnap = await getDoc(doc(db, TIMESLOTS_COLLECTION, docId));
    
    if (docSnap.exists()) {
      const result = { id: docSnap.id, ...docSnap.data() } as TimeslotsDocument;
      console.log('✅ Timeslots found:', { hasTimeslots: !!result.timeslots });
      return result;
    }
    
    console.log('📭 No timeslots found for date:', planDate);
    return null;
  } catch (error: any) {
    console.error('❌ Load timeslots error:', error);
    throw new Error(`Failed to load timeslots: ${error.message}`);
  }
};

// Save scheduled activities (what's planned for the day)
export const saveScheduledActivities = async (
  userId: string,
  activities: {
    'meal-6pm': boolean;
    'meal-9:30pm': boolean;
    'gym': boolean;
  },
  date?: Date
): Promise<void> => {
  try {
    const planDate = formatDate(date || new Date());
    const docId = `${userId}_${planDate}`;
    
    console.log('📅 Saving scheduled activities:', { userId, date: planDate, activities });
    
    // Convert boolean activities to tasks array
    const newTasks: string[] = [];
    Object.entries(activities).forEach(([task, scheduled]) => {
      if (scheduled) {
        newTasks.push(task);
      }
    });
    
    // Get existing scheduled activities to merge
    const existingDoc = await getDoc(doc(db, SCHEDULED_ACTIVITIES_COLLECTION, docId));
    let existingTasks: string[] = [];
    let status = 'active';
    
    if (existingDoc.exists()) {
      const data = existingDoc.data();
      existingTasks = data.tasks || [];
      status = data.status || 'active';
    }
    
    // Merge tasks - remove old meal/gym tasks and add new ones
    const filteredExistingTasks = existingTasks.filter(task => 
      !['meal-6pm', 'meal-9:30pm', 'gym'].includes(task)
    );
    const allTasks = [...filteredExistingTasks, ...newTasks];
    
    const scheduledData: Omit<ScheduledActivitiesDocument, 'id'> = {
      userId,
      date: planDate,
      status: status as 'active' | 'completed' | 'cancelled',
      tasks: allTasks,
      createdAt: existingDoc.exists() ? existingDoc.data().createdAt : Timestamp.now(),
      updatedAt: Timestamp.now()
    };

    await setDoc(doc(db, SCHEDULED_ACTIVITIES_COLLECTION, docId), scheduledData);
    console.log('✅ Successfully saved scheduled activities');
  } catch (error: any) {
    console.error('❌ Save scheduled activities error:', error);
    throw new Error(`Failed to save scheduled activities: ${error.message}`);
  }
};

// Load scheduled activities for a specific date
export const loadScheduledActivities = async (
  userId: string, 
  date?: Date
): Promise<ScheduledActivitiesDocument | null> => {
  try {
    const planDate = formatDate(date || new Date());
    const docId = `${userId}_${planDate}`;
    
    const docSnap = await getDoc(doc(db, SCHEDULED_ACTIVITIES_COLLECTION, docId));
    
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as ScheduledActivitiesDocument;
    }
    
    return null;
  } catch (error: any) {
    throw new Error(`Failed to load scheduled activities: ${error.message}`);
  }
};

// Get scheduled activities for a month (for calendar display)
export const getScheduledActivitiesForMonth = async (
  userId: string, 
  year: number, 
  month: number
): Promise<ScheduledActivitiesDocument[]> => {
  try {
    const startOfMonth = new Date(year, month, 1);
    const endOfMonth = new Date(year, month + 1, 0);
    
    const startDateString = formatDate(startOfMonth);
    const endDateString = formatDate(endOfMonth);
    
    console.log('🔍 Getting scheduled activities for month:', { userId, year, month, startDateString, endDateString });
    
    const q = query(
      collection(db, SCHEDULED_ACTIVITIES_COLLECTION),
      where('userId', '==', userId),
      where('date', '>=', startDateString),
      where('date', '<=', endDateString)
    );
    
    const querySnapshot = await getDocs(q);
    console.log('📊 Scheduled activities found:', querySnapshot.docs.length);
    
    const results = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as ScheduledActivitiesDocument[];
    
    return results.sort((a, b) => a.date.localeCompare(b.date));
  } catch (error: any) {
    console.error('❌ Get scheduled activities for month error:', error);
    throw new Error(`Failed to get scheduled activities: ${error.message}`);
  }
};

// Get scheduled workouts for calendar integration
export const getScheduledWorkoutsForMonth = async (
  userId: string, 
  year: number, 
  month: number // 0-based month
): Promise<ScheduledWorkoutDocument[]> => {
  try {
    const startOfMonth = new Date(year, month, 1);
    const endOfMonth = new Date(year, month + 1, 0);
    
    const startDateString = formatDate(startOfMonth);
    const endDateString = formatDate(endOfMonth);
    
    console.log('🔍 Getting scheduled workouts for calendar:', { userId, year, month, startDateString, endDateString });
    
    const q = query(
      collection(db, SCHEDULED_WORKOUTS_COLLECTION),
      where('userId', '==', userId),
      where('scheduledDate', '>=', startDateString),
      where('scheduledDate', '<=', endDateString),
      orderBy('scheduledDate', 'asc')
    );
    
    const querySnapshot = await getDocs(q);
    const results = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as ScheduledWorkoutDocument[];
    
    console.log('  📊 Calendar scheduled workouts found:', results.length);
    return results.sort((a, b) => a.scheduledDate.localeCompare(b.scheduledDate));
  } catch (error: any) {
    console.error('❌ Get calendar scheduled workouts error:', error);
    throw new Error(`Failed to get calendar scheduled workouts: ${error.message}`);
  }
};
