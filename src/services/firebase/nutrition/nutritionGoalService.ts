import {
  doc,
  setDoc,
  getDoc,
  onSnapshot,
  Timestamp
} from 'firebase/firestore';
import { db } from '../../../config/firebase';
import { NutritionGoal, NutritionGoalFormData } from '../../../types/food';

export const getNutritionGoal = async (userId: string): Promise<NutritionGoal | null> => {
  const docRef = doc(db, 'nutritionGoals', userId);
  const docSnap = await getDoc(docRef);
  
  if (docSnap.exists()) {
    const data = docSnap.data();
    return {
      ...data,
      createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : data.createdAt,
      updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : data.updatedAt,
    } as NutritionGoal;
  }
  return null;
};

export const saveNutritionGoal = async (userId: string, goalData: NutritionGoalFormData): Promise<void> => {
  const docRef = doc(db, 'nutritionGoals', userId);
  const existingGoal = await getDoc(docRef);
  
  const timestamp = new Date();
  const nutritionGoal: NutritionGoal = {
    ...goalData,
    userId,
    createdAt: existingGoal.exists() ? existingGoal.data().createdAt : timestamp,
    updatedAt: timestamp
  };

  await setDoc(docRef, nutritionGoal);
  console.log('✅ Nutrition goals saved successfully:', userId);
};

export const subscribeToNutritionGoal = (
  userId: string,
  onNext: (goal: NutritionGoal | null) => void,
  onError?: (err: Error) => void
): (() => void) => {
  const docRef = doc(db, 'nutritionGoals', userId);
  
  return onSnapshot(
    docRef,
    (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        onNext({
          ...data,
          createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : data.createdAt,
          updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : data.updatedAt,
        } as NutritionGoal);
      } else {
        onNext(null);
      }
    },
    (error) => {
      console.error('Error in nutrition goals subscription:', error);
      if (onError) onError(error as Error);
    }
  );
};
