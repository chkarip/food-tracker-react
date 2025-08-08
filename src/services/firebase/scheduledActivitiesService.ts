/**
 * scheduledActivitiesService.ts - Universal Task Scheduling & Tracking System
 * 
 * BUSINESS PURPOSE:
 * Central service for managing ALL types of scheduled activities and tasks:
 * - Single source of truth for any scheduled task across all life areas
 * - Calendar integration data (what tasks are scheduled for each day)
 * - Cross-module task coordination (meals, gym, finance, habits, projects, custom activities)
 * - Consistent task naming and date formatting across all activity types
 * - Scalable system that accommodates unlimited task categories
 * 
 * KEY BUSINESS LOGIC:
 * 1. UNIVERSAL TASK ARCHITECTURE: Works with ANY type of activity - not limited to predefined modules
 *    - Food tasks: meal-6pm, meal-9:30pm
 *    - Fitness tasks: gym-workout, cardio, yoga-session
 *    - Finance tasks: budget-review, expense-tracking
 *    - Habit tasks: morning-routine, meditation, reading
 *    - Custom tasks: project-work, skill-practice, social-activities
 * 2. UNIFIED CALENDAR DATA: Provides consistent task data for calendar visualization
 * 3. DATE CONSISTENCY: Ensures reliable date formatting (local timezone YYYY-MM-DD) across all operations
 * 4. EXTENSIBLE DESIGN: New task types can be added without system changes
 * 
 * CORE OPERATIONS:
 * - addTaskToUnifiedSchedule: Registers ANY task type from any module or custom activity
 * - removeTaskFromUnifiedSchedule: Removes tasks when activities are cancelled or completed
 * - updateUnifiedScheduleStatus: Changes day status (active, completed, cancelled)
 * - getUnifiedScheduleForDate: Retrieves all tasks for a specific date regardless of type
 * 
 * BUSINESS VALUE:
 * - Enables unified calendar view across ALL life management areas
 * - Supports unlimited task categories and custom user-defined activities
 * - Provides foundation for comprehensive life optimization and goal tracking
 * - Maintains data consistency across any number of activity modules
 * - Scales infinitely to accommodate evolving user needs and new activity types
 */
import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  query, 
  where, 
  getDocs, 
  orderBy, 
  limit,
  Timestamp 
} from 'firebase/firestore';
import { db } from '../../config/firebase';
import { ScheduledActivitiesDocument } from '../../types/firebase';

/**
 * Helper function to add a task to scheduled activities without affecting other tasks
 * This is useful for gym, future activities, etc. to register their tasks in the unified view
 */
export const addTaskToUnifiedSchedule = async (
  userId: string,
  task: string,
  date?: Date
): Promise<void> => {
  if (!userId) throw new Error('User ID is required');

  const targetDate = date || new Date();
  // Use local date to avoid timezone issues
  const year = targetDate.getFullYear();
  const month = (targetDate.getMonth() + 1).toString().padStart(2, '0');
  const day = targetDate.getDate().toString().padStart(2, '0');
  const dateKey = `${year}-${month}-${day}`;
  const docRef = doc(db, 'scheduledActivities', `${userId}_${dateKey}`);

  // Get existing scheduled activities
  const existing = await getDoc(docRef);
  let currentTasks: string[] = [];
  let currentStatus: 'active' | 'completed' | 'cancelled' = 'active';

  if (existing.exists()) {
    const data = existing.data() as ScheduledActivitiesDocument;
    currentTasks = data.tasks || [];
    currentStatus = data.status || 'active';
  }

  // Only add if task doesn't already exist
  if (!currentTasks.includes(task)) {
    const updatedTasks = [...currentTasks, task];
    
    const activityData: Omit<ScheduledActivitiesDocument, 'id'> = {
      userId,
      date: dateKey,
      tasks: updatedTasks,
      status: currentStatus,
      createdAt: existing.exists() ? (existing.data() as ScheduledActivitiesDocument).createdAt : Timestamp.now(),
      updatedAt: Timestamp.now()
    };

    await setDoc(docRef, activityData, { merge: true });
  }
};

/**
 * Helper function to remove a task from scheduled activities
 */
export const removeTaskFromUnifiedSchedule = async (
  userId: string,
  task: string,
  date?: Date
): Promise<void> => {
  if (!userId) throw new Error('User ID is required');

  const targetDate = date || new Date();
  // Use local date to avoid timezone issues
  const year = targetDate.getFullYear();
  const month = (targetDate.getMonth() + 1).toString().padStart(2, '0');
  const day = targetDate.getDate().toString().padStart(2, '0');
  const dateKey = `${year}-${month}-${day}`;
  const docRef = doc(db, 'scheduledActivities', `${userId}_${dateKey}`);

  // Get existing scheduled activities
  const existing = await getDoc(docRef);
  if (existing.exists()) {
    const data = existing.data() as ScheduledActivitiesDocument;
    const updatedTasks = data.tasks.filter(t => t !== task);
    
    const activityData: Omit<ScheduledActivitiesDocument, 'id'> = {
      userId,
      date: dateKey,
      tasks: updatedTasks,
      status: data.status,
      createdAt: data.createdAt,
      updatedAt: Timestamp.now()
    };

    await setDoc(docRef, activityData, { merge: true });
  }
};

/**
 * Helper function to update the status of scheduled activities
 */
export const updateUnifiedScheduleStatus = async (
  userId: string,
  status: 'active' | 'completed' | 'cancelled',
  date?: Date
): Promise<void> => {
  if (!userId) throw new Error('User ID is required');

  const targetDate = date || new Date();
  // Use local date to avoid timezone issues
  const year = targetDate.getFullYear();
  const month = (targetDate.getMonth() + 1).toString().padStart(2, '0');
  const day = targetDate.getDate().toString().padStart(2, '0');
  const dateKey = `${year}-${month}-${day}`;
  const docRef = doc(db, 'scheduledActivities', `${userId}_${dateKey}`);

  // Get existing scheduled activities
  const existing = await getDoc(docRef);
  if (existing.exists()) {
    const data = existing.data() as ScheduledActivitiesDocument;
    
    const activityData: Omit<ScheduledActivitiesDocument, 'id'> = {
      userId,
      date: dateKey,
      tasks: data.tasks,
      status: status,
      createdAt: data.createdAt,
      updatedAt: Timestamp.now()
    };

    await setDoc(docRef, activityData, { merge: true });
  }
};

/**
 * Helper function to get current scheduled activities
 */
export const getUnifiedScheduleForDate = async (
  userId: string,
  date?: Date
): Promise<ScheduledActivitiesDocument | null> => {
  if (!userId) throw new Error('User ID is required');

  const targetDate = date || new Date();
  // Use local date to avoid timezone issues
  const year = targetDate.getFullYear();
  const month = (targetDate.getMonth() + 1).toString().padStart(2, '0');
  const day = targetDate.getDate().toString().padStart(2, '0');
  const dateKey = `${year}-${month}-${day}`;

  const docRef = doc(db, 'scheduledActivities', `${userId}_${dateKey}`);
  const docSnap = await getDoc(docRef);

  if (docSnap.exists()) {
    return { id: docSnap.id, ...docSnap.data() } as ScheduledActivitiesDocument;
  }

  return null;
};
