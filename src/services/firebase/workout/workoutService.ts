/**
 * workoutService.ts – Gym Workout Management System
 *
 * BUSINESS PURPOSE
 * ------------------------------------------------------------------
 * Handles the full life-cycle of scheduled gym workouts:
 * • Creation with detailed exercise planning
 * • Calendar integration (scheduledActivities)
 * • Workout status (scheduled → completed / skipped)
 * • Workout history & analytics
 */

import {
  collection,
  doc,
  setDoc,
  getDocs,
  query,
  where,
  orderBy,
  updateDoc,
  deleteDoc
} from 'firebase/firestore';
import { db } from '../../../config/firebase';
import { ScheduledWorkoutDocument } from '../../../types/firebase';
import {
  formatDate,
  COLLECTIONS,
  createTimestamp
} from '../shared/utils';

/* ------------------------------------------------------------------
 * Types
 * ---------------------------------------------------------------- */
export interface SaveWorkoutInput
  extends Omit<
    ScheduledWorkoutDocument,
    'id' | 'userId' | 'createdAt' | 'updatedAt' | 'scheduledDate'
  > {
  scheduledDate: Date;                // Date comes from the UI layer
}

/* ------------------------------------------------------------------
 * Save a scheduled workout
 * ---------------------------------------------------------------- */
export const saveScheduledWorkout = async (
  userId: string,
  workout: SaveWorkoutInput
): Promise<string> => {
  try {
    // Convert Date → YYYY-MM-DD string for Firestore queries/indexes
    const scheduledDateString = formatDate(workout.scheduledDate);

    const workoutId = `${userId}_${scheduledDateString}_${Date.now()}`;
    const workoutRef = doc(db, COLLECTIONS.SCHEDULED_WORKOUTS, workoutId);

    console.log('🏋️ Firestore DEBUG – saveScheduledWorkout:', {
      userId,
      scheduledDate: scheduledDateString,
      workoutType: workout.workoutType,
      exercises: workout.exercises.length
    });

    const baseStatus = workout.status ?? 'scheduled';

    const workoutDoc: Omit<ScheduledWorkoutDocument, 'id'> = {
      ...workout,
      status: baseStatus,
      completedAt: baseStatus === 'completed' ? createTimestamp() : null,
      scheduledDate: scheduledDateString, // ✅ store as string
      userId,
      createdAt: createTimestamp(),
      updatedAt: createTimestamp()
    };

    await setDoc(workoutRef, workoutDoc);
    console.log('✅ Successfully saved scheduled workout');
    return workoutId;

  } catch (error: any) {
    console.error('❌ Save scheduled workout error:', error);
    throw new Error(`Failed to save scheduled workout: ${error.message}`);
  }
};

/* ------------------------------------------------------------------
 * Load scheduled workout for a specific date
 * ---------------------------------------------------------------- */
export const loadScheduledWorkout = async (
  userId: string,
  date: string                // YYYY-MM-DD
): Promise<ScheduledWorkoutDocument | null> => {
  try {
    const q = query(
      collection(db, COLLECTIONS.SCHEDULED_WORKOUTS),
      where('userId', '==', userId),
      where('scheduledDate', '==', date),
      orderBy('createdAt', 'desc')
    );

    const querySnapshot = await getDocs(q);
    if (querySnapshot.empty) {
      console.log('ℹ️ No scheduled workout found for date');
      return null;
    }

    const docSnap = querySnapshot.docs[0];
    return { id: docSnap.id, ...docSnap.data() } as ScheduledWorkoutDocument;

  } catch (error: any) {
    console.error('❌ Load scheduled workout error:', error);
    throw new Error(`Failed to load scheduled workout: ${error.message}`);
  }
};

/* ------------------------------------------------------------------
 * Delete a scheduled workout
 * ---------------------------------------------------------------- */
export const deleteScheduledWorkout = async (
  workoutId: string
): Promise<void> => {
  try {
    await deleteDoc(
      doc(db, COLLECTIONS.SCHEDULED_WORKOUTS, workoutId)
    );
    console.log('✅ Successfully deleted scheduled workout');
  } catch (error: any) {
    console.error('❌ Delete scheduled workout error:', error);
    throw new Error(`Failed to delete scheduled workout: ${error.message}`);
  }
};

/* ------------------------------------------------------------------
 * Get all scheduled workouts for a month (calendar display)
 * ---------------------------------------------------------------- */
export const getScheduledWorkoutsForMonth = async (
  userId: string,
  year: number,
  month: number               // 1–12
): Promise<ScheduledWorkoutDocument[]> => {
  try {
    const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
    const lastDay  = new Date(year, month, 0).getDate();
    const endDate  = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

    const q = query(
      collection(db, COLLECTIONS.SCHEDULED_WORKOUTS),
      where('userId', '==', userId),
      where('scheduledDate', '>=', startDate),
      where('scheduledDate', '<=', endDate),
      orderBy('scheduledDate', 'desc'),
      orderBy('createdAt', 'desc')
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => ({ id: d.id, ...d.data() })) as ScheduledWorkoutDocument[];

  } catch (error: any) {
    console.error('❌ Get monthly workouts error:', error);
    throw new Error(`Failed to get monthly workouts: ${error.message}`);
  }
};

/* ------------------------------------------------------------------
 * Get recent scheduled workouts (history / analytics)
 * ---------------------------------------------------------------- */
export const getRecentScheduledWorkouts = async (
  userId: string,
  daysBack = 7
): Promise<ScheduledWorkoutDocument[]> => {
  try {
    const today       = new Date();
    const startDate   = new Date(today);
    startDate.setDate(today.getDate() - daysBack + 1);

    const startStr = formatDate(startDate);
    const endStr   = formatDate(today);

    const q = query(
      collection(db, COLLECTIONS.SCHEDULED_WORKOUTS),
      where('userId', '==', userId),
      where('scheduledDate', '>=', startStr),
      where('scheduledDate', '<=', endStr),
      orderBy('scheduledDate', 'desc'),
      orderBy('createdAt', 'desc')
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => ({ id: d.id, ...d.data() })) as ScheduledWorkoutDocument[];

  } catch (error: any) {
    console.error('❌ Get recent workouts error:', error);
    throw new Error(`Failed to get recent workouts: ${error.message}`);
  }
};

/* ------------------------------------------------------------------
 * Update workout status (scheduled → completed / skipped)
 * ---------------------------------------------------------------- */
export const updateWorkoutStatus = async (
  workoutId: string,
  status: ScheduledWorkoutDocument['status']
): Promise<void> => {
  try {
    await updateDoc(
      doc(db, COLLECTIONS.SCHEDULED_WORKOUTS, workoutId),
      {
        status,
        completedAt: status === 'completed' ? createTimestamp() : null,
        updatedAt: createTimestamp()
      }
    );
    console.log('✅ Successfully updated workout status');
  } catch (error: any) {
    console.error('❌ Update workout status error:', error);
    throw new Error(`Failed to update workout status: ${error.message}`);
  }
};

/* ------------------------------------------------------------------
 * Update workout details (exercises, notes, etc.)
 * ---------------------------------------------------------------- */
export const updateWorkoutDetails = async (
  workoutId: string,
  updates: Partial<ScheduledWorkoutDocument>
): Promise<void> => {
  try {
    await updateDoc(
      doc(db, COLLECTIONS.SCHEDULED_WORKOUTS, workoutId),
      {
        ...updates,
        updatedAt: createTimestamp()
      }
    );
    console.log('✅ Successfully updated workout details');
  } catch (error: any) {
    console.error('❌ Update workout details error:', error);
    throw new Error(`Failed to update workout details: ${error.message}`);
  }
};

/* ------------------------------------------------------------------
 * Analytics: basic statistics over recent workouts
 * ---------------------------------------------------------------- */
export const getWorkoutStatistics = async (
  userId: string,
  daysBack = 30
): Promise<{
  totalWorkouts: number;
  completedWorkouts: number;
  skippedWorkouts: number;
  completionRate: number;
  workoutTypeBreakdown: Record<string, number>;
  averageDuration: number;
}> => {
  const workouts = await getRecentScheduledWorkouts(userId, daysBack);
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

  const completed   = workouts.filter(w => w.status === 'completed');
  const skipped     = workouts.filter(w => w.status === 'skipped');
  const breakdown: Record<string, number> = {};

  workouts.forEach(w => {
    breakdown[w.workoutType] = (breakdown[w.workoutType] || 0) + 1;
  });

  const avgDuration =
    completed.length > 0
      ? Math.round(
          completed.reduce((sum, w) => sum + w.estimatedDuration, 0) /
            completed.length
        )
      : 0;

  return {
    totalWorkouts: workouts.length,
    completedWorkouts: completed.length,
    skippedWorkouts: skipped.length,
    completionRate: Math.round((completed.length / workouts.length) * 100),
    workoutTypeBreakdown: breakdown,
    averageDuration: avgDuration
  };
};
