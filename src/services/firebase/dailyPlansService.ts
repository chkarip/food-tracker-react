/**
 * dailyPlansService.ts - Meal Planning & Nutrition Data Management
 * 
 * BUSINESS PURPOSE:
 * Core service for the food tracking program that manages:
 * - Daily meal plans with food selection and portion calculations
 * - Macro nutrition tracking (protein, fats, carbs, calories) with targets
 * - External nutrition integration (food eaten outside the planned program)
 * - Meal completion status and activity history tracking
 * - Monthly nutrition analytics and program adherence statistics
 * 
 * KEY BUSINESS LOGIC:
 * 1. DUAL-COLLECTION STRATEGY: 
 *    - dailyPlans: Legacy support for existing meal data
 *    - mealPlans: New streamlined meal planning (6pm & 9:30pm timeslots)
 * 2. MACRO CALCULATION: Automatic calculation of total macros from food portions + external nutrition
 * 3. PROGRAM INTEGRATION: Works with scheduledActivities for unified calendar display
 * 4. COMPLETION TRACKING: Links with activityHistory to track meal program adherence
 * 
 * CORE MEAL PLANNING OPERATIONS:
 * - saveMealPlan: Stores detailed meal plans with food selections and macro totals
 * - loadMealPlan: Retrieves meal plans for specific dates with all nutrition data
 * - getDailyPlansForMonth: Provides monthly meal plan data for calendar integration
 * - updateCompletionStatus: Tracks which meals (6pm, 9:30pm) have been completed
 * 
 * SCHEDULED ACTIVITIES INTEGRATION:
 * - saveScheduledActivities: Registers meal tasks (meal-6pm, meal-9:30pm) in unified schedule
 * - loadScheduledActivities: Retrieves scheduled meal flags for calendar display
 * - getScheduledActivitiesForMonth: Provides monthly activity data for dashboard
 * 
 * BUSINESS VALUE:
 * - Enables precise macro nutrition tracking for health/fitness goals
 * - Supports meal program consistency through detailed planning and tracking
 * - Provides nutrition analytics for program optimization
 * - Integrates with calendar system for comprehensive program management
 * - Maintains historical data for progress analysis and goal adjustment
 */
import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  updateDoc,
  deleteDoc
} from 'firebase/firestore';
import { db } from '../../config/firebase';
import { DailyPlanDocument, ScheduledActivitiesDocument, MealPlanDocument } from '../../types/firebase';
import { SelectedFood, ExternalNutrition } from '../../types/nutrition';
import { calculateTotalMacros } from '../../utils/nutritionCalculations';
import { formatDate, COLLECTIONS, createTimestamp } from './utils';
import { saveActivityHistory } from './activityHistoryService';

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
      const foodMacros = calculateTotalMacros(data.selectedFoods, foodDatabase); // <--- pass here
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
      createdAt: createTimestamp(),
      updatedAt: createTimestamp()
    };

    console.log('  📄 Final plan data to save:', planData);
    console.log('  🔥 Saving to Firestore collection:', COLLECTIONS.DAILY_PLANS);

    // Use userId_date as document ID for easy retrieval
    const docId = `${userId}_${planDate}`;
    console.log('  📝 Document ID to use:', docId);
    
    await setDoc(doc(db, COLLECTIONS.DAILY_PLANS, docId), planData);
    console.log('  ✅ Successfully saved meal plan with docId:', docId);
  } catch (error: any) {
    console.error('  ❌ Save error:', error);
    throw new Error(`Failed to save daily plan: ${error.message}`);
  }
};

// NEW: Save meal plan to mealPlans collection (replaces dailyPlans)
export const saveMealPlan = async (
  userId: string,
  timeslotData: { [key: string]: { selectedFoods: SelectedFood[], externalNutrition: ExternalNutrition } },
  foodDatabase: any,
  date?: Date,
  completionStatus?: { '6pm': boolean; '9:30pm': boolean }
): Promise<void> => {
  if (!userId) throw new Error('User ID is required');

  try {
    const planDate = formatDate(date || new Date());
    console.log('📅 Firestore DEBUG - saveMealPlan:');
    console.log('  👤 userId:', userId);
    console.log('  📆 date:', planDate);
    console.log('  🍽️ timeslotData keys:', Object.keys(timeslotData));
    
    // Calculate combined totals from both timeslots
    let combinedMacros = { protein: 0, fats: 0, carbs: 0, calories: 0 };
    
    Object.values(timeslotData).forEach(data => {
      const foodMacros = calculateTotalMacros(data.selectedFoods, foodDatabase);
      combinedMacros.protein += foodMacros.protein + data.externalNutrition.protein;
      combinedMacros.fats += foodMacros.fats + data.externalNutrition.fats;
      combinedMacros.carbs += foodMacros.carbs + data.externalNutrition.carbs;
      combinedMacros.calories += foodMacros.calories + data.externalNutrition.calories;
    });

    console.log('  📊 Combined macros calculated:', combinedMacros);

    const mealPlanData: Omit<MealPlanDocument, 'id'> = {
      userId,
      date: planDate,
      timeslots: {
        '6pm': timeslotData['6pm'] || { selectedFoods: [], externalNutrition: { protein: 0, fats: 0, carbs: 0, calories: 0 } },
        '9:30pm': timeslotData['9:30pm'] || { selectedFoods: [], externalNutrition: { protein: 0, fats: 0, carbs: 0, calories: 0 } }
      },
      totalMacros: combinedMacros,
      completionStatus: completionStatus || {
        '6pm': false,
        '9:30pm': false
      },
      createdAt: createTimestamp(),
      updatedAt: createTimestamp()
    };

    console.log('  📄 Final meal plan data to save:', mealPlanData);
    console.log('  🔥 Saving to Firestore collection:', COLLECTIONS.MEAL_PLANS);

    // Use userId_date as document ID for easy retrieval
    const docId = `${userId}_${planDate}`;
    console.log('  📝 Document ID to use:', docId);
    
    await setDoc(doc(db, COLLECTIONS.MEAL_PLANS, docId), mealPlanData);
    console.log('  ✅ Successfully saved meal plan to mealPlans collection with docId:', docId);
  } catch (error: any) {
    console.error('  ❌ Save meal plan error:', error);
    throw new Error(`Failed to save meal plan: ${error.message}`);
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
    
    const docSnap = await getDoc(doc(db, COLLECTIONS.DAILY_PLANS, docId));
    
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
    
    await deleteDoc(doc(db, COLLECTIONS.DAILY_PLANS, docId));
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
    const docRef = doc(db, COLLECTIONS.DAILY_PLANS, docId);
    
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
        updatedAt: createTimestamp()
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
        createdAt: createTimestamp(),
        updatedAt: createTimestamp()
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
      collection(db, COLLECTIONS.DAILY_PLANS),
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
    console.log('  🔥 Collection:', COLLECTIONS.DAILY_PLANS);
    
    const q = query(
      collection(db, COLLECTIONS.DAILY_PLANS),
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

// Migrate existing daily plan completion status to activity history
export const migrateCompletionStatusToHistory = async (userId: string): Promise<void> => {
  try {
    console.log('🔄 Starting migration of completion status to activity history for user:', userId);
    
    // Get all daily plans for the user
    const q = query(
      collection(db, COLLECTIONS.DAILY_PLANS),
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

// Save scheduled activities with simplified structure
export const saveScheduledActivities = async (
  userId: string,
  newTasks: string[], // Array of task names to schedule: ['meal-6pm', 'gym']
  date?: Date
): Promise<void> => {
  try {
    const planDate = formatDate(date || new Date());
    const docId = `${userId}_${planDate}`;
    
    console.log('📅 Firestore DEBUG - saveScheduledActivities:');
    console.log('  👤 UserId:', userId);
    console.log('  📅 Date:', planDate);
    console.log('  🎯 New Tasks to Schedule:', newTasks);
    
    const scheduledActivitiesRef = doc(db, COLLECTIONS.SCHEDULED_ACTIVITIES, docId);
    
    // Get existing document to preserve other tasks
    const existingDoc = await getDoc(scheduledActivitiesRef);
    let existingTasks: string[] = [];
    let status = 'active';
    
    if (existingDoc.exists()) {
      const data = existingDoc.data();
      existingTasks = data.tasks || [];
      status = data.status || 'active';
      console.log('  📋 Found existing tasks:', existingTasks);
    }
    
    // Merge new tasks with existing ones (avoid duplicates)
    const uniqueTasks = new Set([...existingTasks, ...newTasks]);
    const allTasks = Array.from(uniqueTasks);
    console.log('  🔄 Merged tasks list:', allTasks);
    
    const scheduledActivitiesDoc = {
      userId,
      date: planDate,
      status,
      tasks: allTasks,
      createdAt: existingDoc.exists() ? existingDoc.data()!.createdAt : createTimestamp(),
      updatedAt: createTimestamp()
    };
    
    await setDoc(scheduledActivitiesRef, scheduledActivitiesDoc);
    
    console.log('  ✅ Successfully saved scheduled activities with simplified structure');
    console.log('  📊 Final document:', { date: planDate, status, tasks: allTasks });
  } catch (error: any) {
    console.error('  ❌ Save scheduled activities error:', error);
    throw new Error(`Failed to save scheduled activities: ${error.message}`);
  }
};

// Load scheduled activities with simplified structure
export const loadScheduledActivities = async (
  userId: string,
  date?: Date
): Promise<ScheduledActivitiesDocument | null> => {
  try {
    const planDate = formatDate(date || new Date());
    const docId = `${userId}_${planDate}`;
    
    console.log('📅 Firestore DEBUG - loadScheduledActivities:');
    console.log('  👤 UserId:', userId);
    console.log('  📅 Date:', planDate);
    
    const docSnap = await getDoc(doc(db, COLLECTIONS.SCHEDULED_ACTIVITIES, docId));
    
    if (docSnap.exists()) {
      const data = docSnap.data();
      const result: ScheduledActivitiesDocument = {
        id: docSnap.id,
        userId: data.userId,
        date: data.date,
        status: (data.status || 'active') as 'active' | 'completed' | 'cancelled',
        tasks: data.tasks || [],
        createdAt: data.createdAt,
        updatedAt: data.updatedAt
      };
      console.log('  📋 Found scheduled activities:', result);
      return result;
    }
    
    console.log('  ❌ No scheduled activities found for date');
    return null;
  } catch (error: any) {
    console.error('  ❌ Load scheduled activities error:', error);
    throw new Error(`Failed to load scheduled activities: ${error.message}`);
  }
};

// Remove scheduled tasks
export const removeScheduledTasks = async (
  userId: string,
  tasksToRemove: string[], // Array of task names to remove: ['meal-6pm', 'gym']
  date?: Date
): Promise<void> => {
  try {
    const planDate = formatDate(date || new Date());
    const docId = `${userId}_${planDate}`;
    
    console.log('📅 Firestore DEBUG - removeScheduledTasks:');
    console.log('  👤 UserId:', userId);
    console.log('  📅 Date:', planDate);
    console.log('  🗑️ Tasks to Remove:', tasksToRemove);
    
    const scheduledActivitiesRef = doc(db, COLLECTIONS.SCHEDULED_ACTIVITIES, docId);
    
    // Get existing document
    const existingDoc = await getDoc(scheduledActivitiesRef);
    
    if (existingDoc.exists()) {
      const data = existingDoc.data();
      const currentTasks: string[] = data.tasks || [];
      const status = data.status || 'active';
      
      // Remove specified tasks
      const updatedTasks = currentTasks.filter(task => !tasksToRemove.includes(task));
      console.log('  🔄 Updated tasks list:', updatedTasks);
      
      // Update document
      const scheduledActivitiesDoc = {
        userId,
        date: planDate,
        status,
        tasks: updatedTasks,
        createdAt: data.createdAt,
        updatedAt: createTimestamp()
      };
      
      await setDoc(scheduledActivitiesRef, scheduledActivitiesDoc);
      
      console.log('  ✅ Successfully removed scheduled tasks');
    } else {
      console.log('  ❌ No scheduled activities document found to remove tasks from');
    }
  } catch (error: any) {
    console.error('  ❌ Remove scheduled tasks error:', error);
    throw new Error(`Failed to remove scheduled tasks: ${error.message}`);
  }
};

// Update status of scheduled activities
export const updateScheduledActivitiesStatus = async (
  userId: string,
  status: 'active' | 'completed' | 'cancelled',
  date?: Date
): Promise<void> => {
  try {
    const planDate = formatDate(date || new Date());
    const docId = `${userId}_${planDate}`;
    
    console.log('📅 Firestore DEBUG - updateScheduledActivitiesStatus:');
    console.log('  👤 UserId:', userId);
    console.log('  📅 Date:', planDate);
    console.log('  📊 New Status:', status);
    
    const scheduledActivitiesRef = doc(db, COLLECTIONS.SCHEDULED_ACTIVITIES, docId);
    
    // Get existing document
    const existingDoc = await getDoc(scheduledActivitiesRef);
    
    if (existingDoc.exists()) {
      const data = existingDoc.data();
      
      await updateDoc(scheduledActivitiesRef, {
        status,
        updatedAt: createTimestamp()
      });
      
      console.log('  ✅ Successfully updated status');
    } else {
      console.log('  ❌ No scheduled activities document found to update status');
    }
  } catch (error: any) {
    console.error('  ❌ Update status error:', error);
    throw new Error(`Failed to update scheduled activities status: ${error.message}`);
  }
};

// Get scheduled activities for a specific month
export const getScheduledActivitiesForMonth = async (
  userId: string,
  year: number,
  month: number // 0-based month (0-11)
): Promise<ScheduledActivitiesDocument[]> => {
  try {
    const startDate = formatDate(new Date(year, month, 1));
    const endDate = formatDate(new Date(year, month + 1, 0));
    
    console.log('📅 Firestore DEBUG - getScheduledActivitiesForMonth:');
    console.log('  👤 UserId:', userId);
    console.log('  📅 Date range:', { startDate, endDate, year, month });
    
    const q = query(
      collection(db, COLLECTIONS.SCHEDULED_ACTIVITIES),
      where('userId', '==', userId),
      where('date', '>=', startDate),
      where('date', '<=', endDate),
      orderBy('date', 'asc')
    );
    
    const querySnapshot = await getDocs(q);
    console.log('  📅 Scheduled activities found:', querySnapshot.docs.length);
    
    const results = querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        userId: data.userId,
        date: data.date,
        status: (data.status || 'active') as 'active' | 'completed' | 'cancelled',
        tasks: data.tasks || [],
        createdAt: data.createdAt,
        updatedAt: data.updatedAt
      };
    });
    
    console.log('  ✅ Successfully loaded scheduled activities for month');
    console.log('  📊 Sample result:', results[0] || 'No results');
    
    return results;
  } catch (error: any) {
    console.error('  ❌ Get scheduled activities error:', error);
    throw new Error(`Failed to get scheduled activities: ${error.message}`);
  }
};

// Load meal plan for a specific date
export const loadMealPlan = async (
  userId: string, 
  date?: Date
): Promise<MealPlanDocument | null> => {
  try {
    const planDate = formatDate(date || new Date());
    const docId = `${userId}_${planDate}`;
    
    const docSnap = await getDoc(doc(db, COLLECTIONS.MEAL_PLANS, docId));
    
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as MealPlanDocument;
    } else {
      return null;
    }
  } catch (error: any) {
    console.error('Error loading meal plan:', error);
    return null;
  }
};
