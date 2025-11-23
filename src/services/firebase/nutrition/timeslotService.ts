import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../../config/firebase';
import { COLLECTIONS, createTimestamp } from '../shared/utils';
import { TimeslotConfig } from '../../../types/nutrition';

/**
 * Default timeslots (used when user hasn't configured custom ones)
 */
export const DEFAULT_TIMESLOTS: TimeslotConfig[] = [
  {
    id: '6pm',
    time: '6:00 PM',
    icon: '🌅',
    name: 'Afternoon'
  },
  {
    id: '9:30pm',
    time: '9:30 PM',
    icon: '🌙',
    name: 'Evening'
  }
];

/**
 * Get user's timeslot configuration
 */
export const getUserTimeslots = async (userId: string): Promise<TimeslotConfig[]> => {
  const userRef = doc(db, COLLECTIONS.USER_PROFILES, userId);
  const userDoc = await getDoc(userRef);

  if (userDoc.exists() && userDoc.data().timeslots) {
    return userDoc.data().timeslots;
  }
  
  return DEFAULT_TIMESLOTS;
};

/**
 * Save user's timeslot configuration
 * @param userId - User ID
 * @param timeslots - Array of timeslot configurations (max 5)
 */
export const saveUserTimeslots = async (
  userId: string,
  timeslots: TimeslotConfig[]
): Promise<void> => {
  if (timeslots.length > 5) {
    throw new Error('Maximum 5 timeslots allowed');
  }

  // Validate timeslot structure
  timeslots.forEach((slot, index) => {
    if (!slot.id || !slot.time || !slot.icon || !slot.name) {
      throw new Error(`Invalid timeslot at index ${index}: all fields required`);
    }
  });

  const userRef = doc(db, COLLECTIONS.USER_PROFILES, userId);
  const userDoc = await getDoc(userRef);

  if (userDoc.exists()) {
    await updateDoc(userRef, {
      timeslots,
      updatedAt: createTimestamp()
    });
  } else {
    throw new Error('User profile not found. Please create profile first.');
  }
};

/**
 * Validate timeslot ID uniqueness
 */
export const validateTimeslotIds = (timeslots: TimeslotConfig[]): boolean => {
  const ids = timeslots.map(t => t.id);
  return ids.length === new Set(ids).size;
};
