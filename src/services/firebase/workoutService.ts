/**
 * workoutService.ts - Gym Workout Management System
 * 
 * BUSINESS PURPOSE:
 * Dedicated service for the gym/fitness program that handles:
 * - Scheduled workout creation with detailed exercise planning
 * - Exercise library integration (sets, reps, weights, rest periods)
 * - Workout status tracking (scheduled, completed, skipped)
 * - Program progression and workout history analytics
 * - Integration with calendar system for unified activity scheduling
 * 
 * KEY BUSINESS LOGIC:
 * 1. STRUCTURED WORKOUT PROGRAMS: Supports predefined workout types (Lower A/B, Upper A/B)
 * 2. DETAILED EXERCISE TRACKING: Each workout contains multiple exercises with complete specifications
 * 3. PROGRESSION TRACKING: Maintains workout history for program progression and analytics
 * 4. DUAL-SYSTEM INTEGRATION: Saves detailed workout data while registering 'gym-workout' tasks in scheduledActivities
 * 
 * CORE WORKOUT OPERATIONS:
 * - saveScheduledWorkout: Creates detailed workout plans with exercise specifications
 * - loadScheduledWorkout: Retrieves complete workout details for specific dates
 * - getScheduledWorkoutsForMonth: Provides monthly workout data for calendar integration
 * - updateWorkoutStatus: Tracks completion, skipping, or rescheduling of workouts
 * - updateWorkoutDetails: Allows modification of exercise parameters (weight, reps, etc.)
 * 
 * EXERCISE DATA STRUCTURE:
 * - Exercise specifications: name, muscle group, equipment, weight, sets, reps, rest
 * - Workout metadata: type, duration, notes, scheduling information
 * - Status tracking: scheduled → completed/skipped with timestamps
 * 
 * BUSINESS VALUE:
 * - Enables structured fitness program planning and execution
 * - Supports progressive overload through detailed exercise tracking
 * - Provides workout history for program optimization and progress analysis
 * - Integrates with calendar system for comprehensive health program management
 * - Maintains consistency in gym program adherence through detailed scheduling
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
  updateDoc 
} from 'firebase/firestore';
import { db } from '../../config/firebase';
import { ScheduledWorkoutDocument } from '../../types/firebase';
import { formatDate, COLLECTIONS, createTimestamp } from './utils';

// Save a scheduled workout
export const saveScheduledWorkout = async (
  userId: string,
  workout: Omit<ScheduledWorkoutDocument, 'id' | 'userId' | 'createdAt' | 'updatedAt'>
): Promise<string> => {
  try {
    const workoutId = `${userId}_${workout.scheduledDate}_${Date.now()}`;
    const workoutRef = doc(db, COLLECTIONS.SCHEDULED_WORKOUTS, workoutId);
    
    console.log('🏋️ Firestore DEBUG - saveScheduledWorkout:');
    console.log('  👤 UserId:', userId);
    console.log('  📅 Scheduled Date:', workout.scheduledDate);
    console.log('  🏋️ Workout Type:', workout.workoutType);
    console.log('  💪 Exercises count:', workout.exercises.length);
    console.log('  ⏱️ Duration:', workout.estimatedDuration, 'min');
    
    const workoutDoc: Omit<ScheduledWorkoutDocument, 'id'> = {
      ...workout,
      userId,
      createdAt: createTimestamp(),
      updatedAt: createTimestamp()
    };
    
    await setDoc(workoutRef, workoutDoc);
    
    console.log('  ✅ Successfully saved scheduled workout');
    return workoutId;
  } catch (error: any) {
    console.error('  ❌ Save scheduled workout error:', error);
    throw new Error(`Failed to save scheduled workout: ${error.message}`);
  }
};

// Load scheduled workout for a specific date
export const loadScheduledWorkout = async (
  userId: string,
  date: string // YYYY-MM-DD format
): Promise<ScheduledWorkoutDocument | null> => {
  try {
    console.log('🏋️ Firestore DEBUG - loadScheduledWorkout:');
    console.log('  👤 UserId:', userId);
    console.log('  📅 Date:', date);
    
    const q = query(
      collection(db, COLLECTIONS.SCHEDULED_WORKOUTS),
      where('userId', '==', userId),
      where('scheduledDate', '==', date),
      orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      const doc = querySnapshot.docs[0]; // Get the most recent workout for the date
      const workout = {
        id: doc.id,
        ...doc.data()
      } as ScheduledWorkoutDocument;
      
      console.log('  📋 Found scheduled workout:', {
        name: workout.name,
        type: workout.workoutType,
        exercises: workout.exercises.length,
        status: workout.status
      });
      
      return workout;
    } else {
      console.log('  ❌ No scheduled workout found for date');
      return null;
    }
  } catch (error: any) {
    console.error('  ❌ Load scheduled workout error:', error);
    throw new Error(`Failed to load scheduled workout: ${error.message}`);
  }
};

// Get all scheduled workouts for a specific month
export const getScheduledWorkoutsForMonth = async (
  userId: string,
  year: number,
  month: number // 1-based month (1-12)
): Promise<ScheduledWorkoutDocument[]> => {
  try {
    console.log('🏋️ Firestore DEBUG - getScheduledWorkoutsForMonth:');
    console.log('  👤 UserId:', userId);
    console.log('  📅 Year/Month:', year, month);
    
    // Calculate start and end dates for the month
    const startDate = `${year}-${month.toString().padStart(2, '0')}-01`;
    const lastDay = new Date(year, month, 0).getDate(); // Get last day of month
    const endDate = `${year}-${month.toString().padStart(2, '0')}-${lastDay.toString().padStart(2, '0')}`;
    
    console.log('  📅 Date range:', { startDate, endDate });
    
    const q = query(
      collection(db, COLLECTIONS.SCHEDULED_WORKOUTS),
      where('userId', '==', userId),
      where('scheduledDate', '>=', startDate),
      where('scheduledDate', '<=', endDate),
      orderBy('scheduledDate', 'desc'),
      orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    console.log('  🏋️ Scheduled workouts found:', querySnapshot.docs.length);
    
    const results = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as ScheduledWorkoutDocument[];
    
    console.log('  ✅ Successfully loaded monthly workouts');
    return results;
  } catch (error: any) {
    console.error('  ❌ Get monthly workouts error:', error);
    throw new Error(`Failed to get monthly workouts: ${error.message}`);
  }
};

// Get recent scheduled workouts (last N days)
export const getRecentScheduledWorkouts = async (
  userId: string,
  daysBack: number = 7
): Promise<ScheduledWorkoutDocument[]> => {
  try {
    console.log('🏋️ Firestore DEBUG - getRecentScheduledWorkouts:');
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
      collection(db, COLLECTIONS.SCHEDULED_WORKOUTS),
      where('userId', '==', userId),
      where('scheduledDate', '>=', startDateString),
      where('scheduledDate', '<=', endDateString),
      orderBy('scheduledDate', 'desc'),
      orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    console.log('  🏋️ Recent workouts found:', querySnapshot.docs.length);
    
    const results = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as ScheduledWorkoutDocument[];
    
    console.log('  ✅ Successfully loaded recent workouts');
    return results;
  } catch (error: any) {
    console.error('  ❌ Get recent workouts error:', error);
    throw new Error(`Failed to get recent workouts: ${error.message}`);
  }
};

// Update workout status (scheduled -> completed/skipped)
export const updateWorkoutStatus = async (
  workoutId: string,
  status: ScheduledWorkoutDocument['status']
): Promise<void> => {
  try {
    console.log('🏋️ Firestore DEBUG - updateWorkoutStatus:');
    console.log('  🆔 Workout ID:', workoutId);
    console.log('  📊 New status:', status);
    
    const workoutRef = doc(db, COLLECTIONS.SCHEDULED_WORKOUTS, workoutId);
    
    const updateData: Partial<ScheduledWorkoutDocument> = {
      status,
      updatedAt: createTimestamp()
    };
    
    // Add completion timestamp if marking as completed
    if (status === 'completed') {
      updateData.completedAt = createTimestamp();
    }
    
    await updateDoc(workoutRef, updateData);
    
    console.log('  ✅ Successfully updated workout status');
  } catch (error: any) {
    console.error('  ❌ Update workout status error:', error);
    throw new Error(`Failed to update workout status: ${error.message}`);
  }
};

// Update workout details (exercises, duration, notes)
export const updateWorkoutDetails = async (
  workoutId: string,
  updates: Partial<Pick<ScheduledWorkoutDocument, 'name' | 'exercises' | 'estimatedDuration' | 'notes'>>
): Promise<void> => {
  try {
    console.log('🏋️ Firestore DEBUG - updateWorkoutDetails:');
    console.log('  🆔 Workout ID:', workoutId);
    console.log('  📝 Updates:', {
      name: updates.name,
      exerciseCount: updates.exercises?.length,
      duration: updates.estimatedDuration,
      notesLength: updates.notes?.length
    });
    
    const workoutRef = doc(db, COLLECTIONS.SCHEDULED_WORKOUTS, workoutId);
    
    await updateDoc(workoutRef, {
      ...updates,
      updatedAt: createTimestamp()
    });
    
    console.log('  ✅ Successfully updated workout details');
  } catch (error: any) {
    console.error('  ❌ Update workout details error:', error);
    throw new Error(`Failed to update workout details: ${error.message}`);
  }
};

// Get workout statistics for analytics
export const getWorkoutStatistics = async (
  userId: string,
  daysBack: number = 30
): Promise<{
  totalWorkouts: number;
  completedWorkouts: number;
  skippedWorkouts: number;
  completionRate: number;
  workoutTypeBreakdown: Record<string, number>;
  averageDuration: number;
}> => {
  try {
    console.log('📊 Firestore DEBUG - getWorkoutStatistics:');
    console.log('  👤 UserId:', userId);
    console.log('  📅 Days back:', daysBack);
    
    const workouts = await getRecentScheduledWorkouts(userId, daysBack);
    console.log('  📊 Total workouts for analysis:', workouts.length);
    
    if (workouts.length === 0) {
      return {
        totalWorkouts: 0,
        completedWorkouts: 0,
        skippedWorkouts: 0,
        completionRate: 0,
        workoutTypeBreakdown: {},
        averageDuration: 0
      };
    }
    
    const completedWorkouts = workouts.filter(w => w.status === 'completed').length;
    const skippedWorkouts = workouts.filter(w => w.status === 'skipped').length;
    const completionRate = Math.round((completedWorkouts / workouts.length) * 100);
    
    // Workout type breakdown
    const workoutTypeBreakdown: Record<string, number> = {};
    workouts.forEach(workout => {
      workoutTypeBreakdown[workout.workoutType] = (workoutTypeBreakdown[workout.workoutType] || 0) + 1;
    });
    
    // Average duration for completed workouts
    const completedDurations = workouts
      .filter(w => w.status === 'completed')
      .map(w => w.estimatedDuration);
    const averageDuration = completedDurations.length > 0 
      ? Math.round(completedDurations.reduce((sum, dur) => sum + dur, 0) / completedDurations.length)
      : 0;
    
    const stats = {
      totalWorkouts: workouts.length,
      completedWorkouts,
      skippedWorkouts,
      completionRate,
      workoutTypeBreakdown,
      averageDuration
    };
    
    console.log('  📊 Statistics calculated:', stats);
    
    return stats;
  } catch (error: any) {
    console.error('  ❌ Get workout statistics error:', error);
    throw new Error(`Failed to get workout statistics: ${error.message}`);
  }
};
