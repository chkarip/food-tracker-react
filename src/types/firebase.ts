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
    'morning': boolean;
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
  activityType: '6pm' | '9:30pm' | 'gym' | 'morning';
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

// Simplified DailyPlan - now just tracks scheduled activities, not detailed meal data
export interface ScheduledActivitiesDocument {
  id?: string;
  userId: string;
  date: string; // YYYY-MM-DD format
  scheduledActivities: {
    'meal-6pm': boolean;
    'meal-9:30pm': boolean;
    'gym': boolean;
    'morning': boolean;
  };
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
