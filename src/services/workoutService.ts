import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  orderBy,
  Timestamp,
  updateDoc,
  deleteDoc
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { ScheduledWorkout } from '../components/SaveWorkoutModal';

const SCHEDULED_WORKOUTS_COLLECTION = 'scheduledWorkouts';

// Helper to format date as YYYY-MM-DD (timezone-safe)
const formatDate = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export interface ScheduledWorkoutDocument extends Omit<ScheduledWorkout, 'id' | 'scheduledDate' | 'createdAt'> {
  id: string;
  userId: string;
  scheduledDate: string; // YYYY-MM-DD format
  createdAt: Timestamp;
  updatedAt: Timestamp;
  completedAt?: Timestamp;
}

// Save scheduled workout to Firestore
export const saveScheduledWorkout = async (
  userId: string,
  workout: ScheduledWorkout
): Promise<void> => {
  try {
    console.log('💾 Firestore DEBUG - saveScheduledWorkout:');
    console.log('  👤 UserId:', userId);
    console.log('  🏋️ Workout:', workout.name);
    console.log('  📅 Date:', formatDate(workout.scheduledDate));
    
    const workoutDate = formatDate(workout.scheduledDate);
    const docId = `${userId}_${workoutDate}_${Date.now()}`;
    
    const workoutData: Omit<ScheduledWorkoutDocument, 'id'> = {
      userId,
      name: workout.name,
      workoutType: workout.workoutType,
      exercises: workout.exercises,
      scheduledDate: workoutDate,
      estimatedDuration: workout.estimatedDuration,
      notes: workout.notes,
      status: workout.status,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    };

    await setDoc(doc(db, SCHEDULED_WORKOUTS_COLLECTION, docId), workoutData);
    console.log('  ✅ Successfully saved scheduled workout with docId:', docId);
  } catch (error: any) {
    console.error('  ❌ Save workout error:', error);
    throw new Error(`Failed to save scheduled workout: ${error.message}`);
  }
};

// Get scheduled workouts for a specific date
export const getScheduledWorkoutsForDate = async (
  userId: string, 
  date: Date
): Promise<ScheduledWorkoutDocument[]> => {
  try {
    const workoutDate = formatDate(date);
    console.log('🔍 Getting scheduled workouts for date:', { userId, date: workoutDate });
    
    const q = query(
      collection(db, SCHEDULED_WORKOUTS_COLLECTION),
      where('userId', '==', userId),
      where('scheduledDate', '==', workoutDate),
      orderBy('createdAt', 'asc')
    );
    
    const querySnapshot = await getDocs(q);
    const results = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as ScheduledWorkoutDocument[];
    
    console.log('  📊 Scheduled workouts found:', results.length);
    return results;
  } catch (error: any) {
    console.error('❌ Get scheduled workouts error:', error);
    throw new Error(`Failed to get scheduled workouts: ${error.message}`);
  }
};

// Get scheduled workouts for a month (for calendar display)
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
    
    console.log('🔍 Getting scheduled workouts for month:', { 
      userId, 
      year, 
      month, 
      startDateString, 
      endDateString 
    });
    
    const q = query(
      collection(db, SCHEDULED_WORKOUTS_COLLECTION),
      where('userId', '==', userId),
      where('scheduledDate', '>=', startDateString),
      where('scheduledDate', '<=', endDateString),
      orderBy('scheduledDate', 'asc'),
      orderBy('createdAt', 'asc')
    );
    
    const querySnapshot = await getDocs(q);
    const results = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as ScheduledWorkoutDocument[];
    
    console.log('  📊 Monthly scheduled workouts found:', results.length);
    return results.sort((a, b) => a.scheduledDate.localeCompare(b.scheduledDate));
  } catch (error: any) {
    console.error('❌ Get monthly scheduled workouts error:', error);
    throw new Error(`Failed to get monthly scheduled workouts: ${error.message}`);
  }
};

// Update workout status (completed, skipped, etc.)
export const updateWorkoutStatus = async (
  workoutId: string,
  status: 'scheduled' | 'completed' | 'skipped',
  completedAt?: Date
): Promise<void> => {
  try {
    console.log('🔄 Updating workout status:', { workoutId, status, completedAt });
    
    const workoutRef = doc(db, SCHEDULED_WORKOUTS_COLLECTION, workoutId);
    const updateData: any = {
      status,
      updatedAt: Timestamp.now()
    };
    
    if (status === 'completed' && completedAt) {
      updateData.completedAt = Timestamp.fromDate(completedAt);
    }
    
    await updateDoc(workoutRef, updateData);
    console.log('  ✅ Successfully updated workout status');
  } catch (error: any) {
    console.error('  ❌ Update workout status error:', error);
    throw new Error(`Failed to update workout status: ${error.message}`);
  }
};

// Delete scheduled workout
export const deleteScheduledWorkout = async (workoutId: string): Promise<void> => {
  try {
    console.log('🗑️ Deleting scheduled workout:', workoutId);
    
    await deleteDoc(doc(db, SCHEDULED_WORKOUTS_COLLECTION, workoutId));
    console.log('  ✅ Successfully deleted scheduled workout');
  } catch (error: any) {
    console.error('  ❌ Delete scheduled workout error:', error);
    throw new Error(`Failed to delete scheduled workout: ${error.message}`);
  }
};

// Get workout by ID
export const getScheduledWorkoutById = async (workoutId: string): Promise<ScheduledWorkoutDocument | null> => {
  try {
    const docSnap = await getDoc(doc(db, SCHEDULED_WORKOUTS_COLLECTION, workoutId));
    
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as ScheduledWorkoutDocument;
    }
    
    return null;
  } catch (error: any) {
    console.error('❌ Get workout by ID error:', error);
    throw new Error(`Failed to get workout: ${error.message}`);
  }
};

// Get user's recent workouts (for history/analytics)
export const getRecentWorkouts = async (
  userId: string, 
  limit: number = 10
): Promise<ScheduledWorkoutDocument[]> => {
  try {
    const q = query(
      collection(db, SCHEDULED_WORKOUTS_COLLECTION),
      where('userId', '==', userId),
      orderBy('scheduledDate', 'desc'),
      orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    const results = querySnapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() }))
      .slice(0, limit) as ScheduledWorkoutDocument[];
    
    console.log('📊 Recent workouts found:', results.length);
    return results;
  } catch (error: any) {
    console.error('❌ Get recent workouts error:', error);
    throw new Error(`Failed to get recent workouts: ${error.message}`);
  }
};
