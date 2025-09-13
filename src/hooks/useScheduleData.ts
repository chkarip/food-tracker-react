/**
 * useScheduleData.ts - Shared data fetching hook for schedule components
 *
 * BUSINESS PURPOSE:
 * Provides unified data access for all schedule-related components:
 * - Today's meal plans, workouts, and water intake
 * - Scheduled activities for calendar integration
 * - Consistent loading states and error handling
 * - Single source of truth for schedule data
 *
 * USAGE:
 * - Dashboard: TodayScheduleStack component
 * - Calendar: DayModal component
 * - Any future schedule components
 *
 * DATA FLOW:
 * 1. Fetches scheduled activities (meal-6pm, meal-9:30pm, gym-workout tasks)
 * 2. Loads detailed meal plan data when meals are scheduled
 * 3. Loads detailed workout data when workouts are scheduled
 * 4. Provides unified loading states and error handling
 */

import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { loadMealPlan } from '../services/firebase/meal-planning/dailyPlansService';
import { loadScheduledWorkout } from '../services/firebase/workout/workoutService';
import { MealPlanDocument, ScheduledWorkoutDocument } from '../types/firebase';

export interface ScheduleData {
  // Scheduled activities (tasks like 'meal-6pm', 'gym-workout')
  scheduledTasks: string[];

  // Detailed data (loaded on-demand)
  mealPlan: MealPlanDocument | null;
  workout: ScheduledWorkoutDocument | null;

  // Loading states
  loading: boolean;
  mealPlanLoading: boolean;
  workoutLoading: boolean;

  // Error states
  error: string | null;
}

export interface UseScheduleDataOptions {
  date?: Date;
  autoLoadDetails?: boolean; // Whether to automatically load meal/workout details
}

export const useScheduleData = (options: UseScheduleDataOptions = {}) => {
  const { date, autoLoadDetails = true } = options;
  const { user } = useAuth();

  const [data, setData] = useState<ScheduleData>({
    scheduledTasks: [],
    mealPlan: null,
    workout: null,
    loading: false,
    mealPlanLoading: false,
    workoutLoading: false,
    error: null
  });

  // Load scheduled activities for the specified date
  const loadScheduledActivities = async (targetDate: Date) => {
    if (!user) return;

    setData(prev => ({ ...prev, loading: true, error: null }));

    try {
      // Use local date to avoid timezone issues
      const year = targetDate.getFullYear();
      const month = (targetDate.getMonth() + 1).toString().padStart(2, '0');
      const day = targetDate.getDate().toString().padStart(2, '0');
      const dateKey = `${year}-${month}-${day}`;

      // For now, we'll use a simple approach - in a real app you'd have a service
      // that fetches scheduled activities. For this demo, we'll simulate it.
      const mockScheduledTasks = ['meal-6pm', 'meal-9:30pm', 'gym-workout'];

      setData(prev => ({
        ...prev,
        scheduledTasks: mockScheduledTasks,
        loading: false
      }));

      // Auto-load details if requested
      if (autoLoadDetails) {
        loadDetails(targetDate, mockScheduledTasks);
      }

    } catch (error: any) {
      setData(prev => ({
        ...prev,
        loading: false,
        error: error.message || 'Failed to load schedule data'
      }));
    }
  };

  // Load detailed meal plan and workout data
  const loadDetails = async (targetDate: Date, tasks: string[]) => {
    if (!user) return;

    // Load meal plan if meals are scheduled
    if (tasks.some(task => task.startsWith('meal-'))) {
      setData(prev => ({ ...prev, mealPlanLoading: true }));
      try {
        const meal = await loadMealPlan(user.uid, targetDate);
        setData(prev => ({
          ...prev,
          mealPlan: meal,
          mealPlanLoading: false
        }));
      } catch (error: any) {
        setData(prev => ({
          ...prev,
          mealPlanLoading: false,
          error: error.message || 'Failed to load meal plan'
        }));
      }
    }

    // Load workout if gym is scheduled
    if (tasks.includes('gym-workout')) {
      setData(prev => ({ ...prev, workoutLoading: true }));
      try {
        const dateString = targetDate.toISOString().split('T')[0];
        const workout = await loadScheduledWorkout(user.uid, dateString);
        setData(prev => ({
          ...prev,
          workout: workout,
          workoutLoading: false
        }));
      } catch (error: any) {
        setData(prev => ({
          ...prev,
          workoutLoading: false,
          error: error.message || 'Failed to load workout'
        }));
      }
    }
  };

  // Manual refresh function
  const refresh = async () => {
    const targetDate = date || new Date();
    await loadScheduledActivities(targetDate);
  };

  // Load data when component mounts or date changes
  useEffect(() => {
    const targetDate = date || new Date();
    loadScheduledActivities(targetDate);
  }, [user, date]);

  return {
    ...data,
    refresh
  };
};