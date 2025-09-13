import {
  doc,
  setDoc,
  getDoc,
  onSnapshot,
  Timestamp,
  collection,
  query,
  where,
  getDocs,
  updateDoc
} from 'firebase/firestore';
import { db } from '../../../config/firebase';
import { UserProfile, UserProfileFormData } from '../../../types/food';
import { WaterIntakeDocument } from '../../../types/water';
import { COLLECTIONS, createTimestamp } from '../shared/utils';

/**
 * Update water intake goal for user
 */
export const updateWaterIntakeGoal = async (
  userId: string,
  waterIntakeGoal: number
): Promise<void> => {
  const userRef = doc(db, COLLECTIONS.USER_PROFILES, userId);
  const userDoc = await getDoc(userRef);

  if (userDoc.exists()) {
    await updateDoc(userRef, {
      waterIntakeGoal,
      updatedAt: createTimestamp()
    });
  } else {
    // Create profile if it doesn't exist
    const baseProfile: UserProfile = {
      userId,
      gender: 'male',
      age: 30,
      height: 175,
      weight: 70,
      activityLevel: 'moderate',
      goal: 'maintain',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Only add waterIntakeGoal if it has a value
    const newProfile: any = { ...baseProfile };
    if (waterIntakeGoal !== undefined) {
      newProfile.waterIntakeGoal = waterIntakeGoal;
    }

    await setDoc(userRef, newProfile);
  }
};

/**
 * Get user's water intake goal
 */
export const getUserWaterGoal = async (userId: string): Promise<number> => {
  const userRef = doc(db, COLLECTIONS.USER_PROFILES, userId);
  const userDoc = await getDoc(userRef);

  if (userDoc.exists()) {
    return userDoc.data().waterIntakeGoal || 2500;
  }
  return 2500; // default
};
const updateWaterIntakeDocuments = async (userId: string, newWaterGoal: number): Promise<void> => {
  try {
    // Get all water intake documents for the user (last 30 days to avoid too many updates)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const q = query(
      collection(db, COLLECTIONS.WATER_INTAKE),
      where('userId', '==', userId)
    );

    const querySnapshot = await getDocs(q);
    
    const updatePromises = querySnapshot.docs.map(async (document) => {
      const data = document.data();
      const currentTarget = data.targetAmount || 2500; // Default fallback
      
      // Only update if the target is different from the new goal
      if (currentTarget !== newWaterGoal) {
        await updateDoc(document.ref, {
          targetAmount: newWaterGoal,
          goalAchieved: data.totalAmount >= newWaterGoal,
          updatedAt: createTimestamp()
        });
      }
    });

    await Promise.all(updatePromises);
  } catch (error) {
    // Don't throw error - profile save should still succeed even if water updates fail
  }
};

export const getUserProfile = async (userId: string): Promise<UserProfile | null> => {
  const docRef = doc(db, COLLECTIONS.USER_PROFILES, userId);
  const docSnap = await getDoc(docRef);
  
  if (docSnap.exists()) {
    const data = docSnap.data();
    return {
      ...data,
      createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : data.createdAt,
      updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : data.updatedAt,
      bodyFatPercentage: data.bodyFatPercentage ?? undefined,
      waterIntakeGoal: data.waterIntakeGoal ?? undefined
    } as UserProfile;
  }
  return null;
};

export const saveUserProfile = async (userId: string, profileData: UserProfileFormData): Promise<void> => {
  const docRef = doc(db, COLLECTIONS.USER_PROFILES, userId);
  const existingProfile = await getDoc(docRef);

  const timestamp = new Date();

  // Create base profile object
  const baseProfile: UserProfile = {
    ...profileData,
    userId,
    createdAt: existingProfile.exists() ? existingProfile.data().createdAt : timestamp,
    updatedAt: timestamp,
  };

  // Only add optional fields if they have values (Firebase doesn't allow undefined)
  const userProfile: any = { ...baseProfile };
  if (profileData.bodyFatPercentage !== undefined) {
    userProfile.bodyFatPercentage = profileData.bodyFatPercentage;
  }
  if (profileData.waterIntakeGoal !== undefined) {
    userProfile.waterIntakeGoal = profileData.waterIntakeGoal;
  }

  // Check if water intake goal has changed
  const existingWaterGoal = existingProfile.exists() ? existingProfile.data().waterIntakeGoal : undefined;
  const newWaterGoal = profileData.waterIntakeGoal;

  // Save the profile first
  await setDoc(docRef, userProfile);

  // If water intake goal changed, update existing water intake documents
  if (newWaterGoal && newWaterGoal !== existingWaterGoal) {
    await updateWaterIntakeDocuments(userId, newWaterGoal);
  }
};

export const subscribeToUserProfile = (
  userId: string,
  onNext: (profile: UserProfile | null) => void,
  onError?: (err: Error) => void
): (() => void) => {
  const docRef = doc(db, COLLECTIONS.USER_PROFILES, userId);
  
  return onSnapshot(
    docRef,
    (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        onNext({
          ...data,
          createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : data.createdAt,
          updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : data.updatedAt,
          bodyFatPercentage: data.bodyFatPercentage ?? undefined,
          waterIntakeGoal: data.waterIntakeGoal ?? undefined
        } as UserProfile);
      } else {
        onNext(null);
      }
    },
    (error) => {
      if (onError) onError(error as Error);
    }
  );
};
