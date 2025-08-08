import { Timestamp } from 'firebase/firestore';

// Helper to format date as YYYY-MM-DD (timezone-safe)
export const formatDate = (date: Date): string => {
  // Use local date components to avoid timezone issues
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Collection names
export const COLLECTIONS = {
  DAILY_PLANS: 'dailyPlans', // Legacy - being phased out
  MEAL_PLANS: 'mealPlans',   // New meal plans collection
  USER_PREFERENCES: 'userPreferences',
  FOOD_HISTORY: 'foodHistory',
  ACTIVITY_HISTORY: 'activityHistory',
  TIMESLOTS: 'timeslots',
  SCHEDULED_ACTIVITIES: 'scheduledActivities',
  SCHEDULED_WORKOUTS: 'scheduledWorkouts',
} as const;

// Common Firestore utilities
export const createTimestamp = () => Timestamp.now();
