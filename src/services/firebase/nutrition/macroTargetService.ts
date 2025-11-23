import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../../config/firebase';
import { COLLECTIONS, createTimestamp } from '../shared/utils';
import { MacroTargets } from '../../../types/nutrition';

/**
 * Default macro targets (based on the project requirements)
 */
export const DEFAULT_MACRO_TARGETS: MacroTargets = {
  protein: 125,
  fats: 61,
  carbs: 287,
  calories: 2150 // Average of 2100-2200 range
};

/**
 * Get user's macro targets from userProfiles
 */
export const getUserMacroTargets = async (userId: string): Promise<MacroTargets> => {
  const userRef = doc(db, COLLECTIONS.USER_PROFILES, userId);
  const userDoc = await getDoc(userRef);

  if (userDoc.exists() && userDoc.data().macroTargets) {
    return userDoc.data().macroTargets;
  }
  
  return DEFAULT_MACRO_TARGETS;
};

/**
 * Save user's macro targets to userProfiles
 * @param userId - User ID
 * @param macroTargets - Macro targets object
 */
export const saveUserMacroTargets = async (
  userId: string,
  macroTargets: MacroTargets
): Promise<void> => {
  // Validate macro targets
  if (
    macroTargets.protein < 0 ||
    macroTargets.fats < 0 ||
    macroTargets.carbs < 0 ||
    macroTargets.calories < 0
  ) {
    throw new Error('Macro targets must be positive numbers');
  }

  const userRef = doc(db, COLLECTIONS.USER_PROFILES, userId);
  const userDoc = await getDoc(userRef);

  if (userDoc.exists()) {
    await updateDoc(userRef, {
      macroTargets,
      updatedAt: createTimestamp()
    });
  } else {
    throw new Error('User profile not found. Please create profile first.');
  }
};

/**
 * Calculate calories from macros for validation
 */
export const calculateCaloriesFromMacros = (
  protein: number,
  fats: number,
  carbs: number
): number => {
  // 1g protein = 4 cal, 1g fat = 9 cal, 1g carb = 4 cal
  return Math.round(protein * 4 + fats * 9 + carbs * 4);
};

/**
 * Validate if manual calorie input is reasonable compared to calculated
 */
export const validateCalorieInput = (
  manualCalories: number,
  protein: number,
  fats: number,
  carbs: number
): { valid: boolean; calculatedCalories: number; difference: number } => {
  const calculatedCalories = calculateCaloriesFromMacros(protein, fats, carbs);
  const difference = Math.abs(manualCalories - calculatedCalories);
  const percentDiff = (difference / calculatedCalories) * 100;

  return {
    valid: percentDiff <= 10, // Allow 10% variance
    calculatedCalories,
    difference
  };
};
