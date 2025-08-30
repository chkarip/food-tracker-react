import {
  doc,
  setDoc,
  getDoc,
  onSnapshot,
  Timestamp
} from 'firebase/firestore';
import { db } from '../../../config/firebase';
import { UserProfile, UserProfileFormData } from '../../../types/food';

export const getUserProfile = async (userId: string): Promise<UserProfile | null> => {
  const docRef = doc(db, 'userProfiles', userId);
  const docSnap = await getDoc(docRef);
  
  if (docSnap.exists()) {
    const data = docSnap.data();
    return {
      ...data,
      createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : data.createdAt,
      updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : data.updatedAt,
      bodyFatPercentage: data.bodyFatPercentage ?? undefined
    } as UserProfile;
  }
  return null;
};

export const saveUserProfile = async (userId: string, profileData: UserProfileFormData): Promise<void> => {
  const docRef = doc(db, 'userProfiles', userId);
  const existingProfile = await getDoc(docRef);
  
  const timestamp = new Date();
  const userProfile: UserProfile = {
    ...profileData,
    userId,
    createdAt: existingProfile.exists() ? existingProfile.data().createdAt : timestamp,
    updatedAt: timestamp,
    bodyFatPercentage: profileData.bodyFatPercentage ?? undefined
  };

  await setDoc(docRef, userProfile);
  console.log('✅ User profile saved successfully:', userId);
};

export const subscribeToUserProfile = (
  userId: string,
  onNext: (profile: UserProfile | null) => void,
  onError?: (err: Error) => void
): (() => void) => {
  const docRef = doc(db, 'userProfiles', userId);
  
  return onSnapshot(
    docRef,
    (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        onNext({
          ...data,
          createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : data.createdAt,
          updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : data.updatedAt,
          bodyFatPercentage: data.bodyFatPercentage ?? undefined
        } as UserProfile);
      } else {
        onNext(null);
      }
    },
    (error) => {
      console.error('Error in user profile subscription:', error);
      if (onError) onError(error as Error);
    }
  );
};
