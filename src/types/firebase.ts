/**
 * firebase.ts - Core Data Type Definitions
 * 
 * BUSINESS PURPOSE:
 * Defines the complete data structure for the food tracking application including:
 * - Firebase document interfaces for all collections
 * - Type safety for meal planning, workout scheduling, and activity tracking
 * - Consistent data models across all application modules
 * - Integration points between different program systems
 * 
 * KEY BUSINESS DATA MODELS:
 * 1. MEAL PLANNING TYPES:
 *    - MealPlanDocument: Complete meal plans with 6pm/9:30pm timeslots
 *    - TimeslotMealData: Food selections and external nutrition per timeslot
 *    - DailyPlanDocument: Legacy meal plan structure for backward compatibility
 * 
 * 2. WORKOUT SYSTEM TYPES:
 *    - ScheduledWorkoutDocument: Complete workout specifications with exercises
 *    - Exercise specifications: Sets, reps, weight, rest periods, muscle groups
 *    - Workout status tracking: scheduled → completed/skipped
 * 
 * 3. UNIFIED SCHEDULING TYPES:
 *    - ScheduledActivitiesDocument: Central task scheduling for calendar integration
 *    - Task arrays: meal-6pm, meal-9:30pm, gym-workout
 *    - Activity status: active, completed, cancelled
 * 
 * 4. TRACKING & ANALYTICS TYPES:
 *    - ActivityHistoryDocument: Completion tracking for all program activities
 *    - UserPreferences: Macro targets and program configuration
 *    - TimeslotsDocument: Meal timing and scheduling data
 * 
 * BUSINESS VALUE:
 * - Ensures data consistency across all application modules
 * - Provides type safety for complex nutrition and fitness calculations
 * - Enables seamless integration between meal planning, workout scheduling, and calendar systems
 * - Supports program analytics through structured activity tracking
 * - Maintains data integrity across Firebase collections
 */
import { Timestamp } from 'firebase/firestore';
import { SelectedFood, ExternalNutrition } from './nutrition';

export interface FirebaseUser {
  uid: string;
  email: string | null;
  displayName: string | null;
}

export interface TimeslotMealData {
  selectedFoods: SelectedFood[];
  externalNutrition: ExternalNutrition;
}

export interface DailyPlanDocument {
  id?: string;
  userId: string;
  date: string; // YYYY-MM-DD format
  timeslots: {
    '6pm': TimeslotMealData;
    '9:30pm': TimeslotMealData;
  };
  totalMacros: {
    protein: number;
    fats: number;
    carbs: number;
    calories: number;
  };
  completionStatus?: {
    '6pm': boolean;
    '9:30pm': boolean;
    'gym': boolean;
  };
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// New: Clean meal plan document
export interface MealPlanDocument {
  id?: string;
  userId: string;
  date: string; // YYYY-MM-DD format
  timeslots: {
    '6pm': TimeslotMealData;
    '9:30pm': TimeslotMealData;
  };
  totalMacros: {
    protein: number;
    fats: number;
    carbs: number;
    calories: number;
  };
  completionStatus?: {
    '6pm': boolean;
    '9:30pm': boolean;
  };
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface UserPreferences {
  id?: string;
  userId: string;
  macroTargets: {
    protein: number;
    fats: number;
    carbs: number;
    caloriesMin: number;
    caloriesMax: number;
  };
  defaultFoodAmounts: Record<string, number>;
  theme: 'light' | 'dark' | 'auto';
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface FoodHistory {
  id?: string;
  userId: string;
  foodName: string;
  amount: number;
  frequency: number; // how many times this food was used
  lastUsed: Timestamp;
}

export interface ActivityHistoryDocument {
  id?: string;
  userId: string;
  activityType: '6pm' | '9:30pm' | 'gym';
  date: string; // YYYY-MM-DD format
  completed: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// New separate Timeslots collection
export interface TimeslotsDocument {
  id?: string;
  userId: string;
  date: string; // YYYY-MM-DD format
  timeslots: {
    '6pm': TimeslotMealData;
    '9:30pm': TimeslotMealData;
  };
  totalMacros: {
    protein: number;
    fats: number;
    carbs: number;
    calories: number;
  };
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// Simplified ScheduledActivities - tracks tasks with flexible task names
export interface ScheduledActivitiesDocument {
  id?: string;
  userId: string;
  date: string; // YYYY-MM-DD format
  status: 'active' | 'completed' | 'cancelled';
  tasks: string[]; // Array of task names: ['meal-6pm', 'gym', etc.]
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// Scheduled Workouts collection for gym functionality
export interface ScheduledWorkoutDocument {
  id?: string;
  userId: string;
  name: string;
  workoutType: 'Lower A' | 'Lower B' | 'Upper A' | 'Upper B';
  exercises: Array<{
    id: string;
    exerciseId: string;
    name: string;
    primaryMuscle: string;
    equipment: string;
    kg: number;
    sets: number;
    reps: number;
    rest: number;
    notes: string;
    order: number;
  }>;
  scheduledDate: string; // YYYY-MM-DD format
  estimatedDuration: number; // minutes
  notes: string;
  status: 'scheduled' | 'completed' | 'skipped';
  createdAt: Timestamp;
  updatedAt: Timestamp;
  completedAt?: Timestamp | null;
}

// Water Intake collection for hydration tracking
export interface WaterIntakeDocument {
  id?: string;
  userId: string;
  date: string; // YYYY-MM-DD format
  totalAmount: number; // ml
  targetAmount: number; // ml (default: 2500)
  entries: Array<{
    id: string;
    amount: number; // ml
    timestamp: Timestamp;
    source?: 'manual' | 'preset-300ml' | 'preset-700ml' | 'preset-1L';
  }>;
  goalAchieved: boolean;
  streakCount: number; // consecutive days meeting goal
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
