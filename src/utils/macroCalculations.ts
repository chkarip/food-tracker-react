import { UserProfileFormData, CalculatedMacros, GoalType } from '../types/food';

// Activity level multipliers
const ACTIVITY_MULTIPLIERS: Record<string, number> = {
  sedentary: 1.2,      // Little/no exercise
  light: 1.375,        // Light exercise 1-3 days/week
  moderate: 1.55,      // Moderate exercise 3-5 days/week
  active: 1.725,       // Hard exercise 6-7 days/week
  very_active: 1.9     // Very hard exercise, physical job
};

// Goal adjustments (percentage of TDEE)
const GOAL_ADJUSTMENTS: Partial<Record<GoalType, number>> = {
  // Range-based goals
  lose_20_25: -0.225,
  lose_15_20: -0.175,
  lose_10_15: -0.125,
  lose_5_10: -0.075,
  lose_3_5: -0.04,
  lose_2_3: -0.025,
  maintain: 0,
  gain_2_3: 0.025,
  gain_3_5: 0.04,
  gain_5_10: 0.075,
  gain_10_15: 0.125,
  gain_15_20: 0.175,
  gain_20_25: 0.225,
  // Legacy support
  lose_weight: -0.15,
  gain_muscle: 0.15,
  lose_aggressive: -0.25,
  lose_moderate: -0.20,
  lose_gradual: -0.15,
  lose_conservative: -0.10,
  lose_mild: -0.05,
  gain_mild: 0.05,
  gain_conservative: 0.10,
  gain_gradual: 0.15,
  gain_moderate: 0.20,
  gain_aggressive: 0.25
};

// Calculate BMR using Mifflin-St Jeor formula
export const calculateBMR = (gender: 'male' | 'female', weight: number, height: number, age: number): number => {
  const baseCalc = (10 * weight) + (6.25 * height) - (5 * age);
  return gender === 'male' ? baseCalc + 5 : baseCalc - 161;
};

// Calculate TDEE
export const calculateTDEE = (bmr: number, activityLevel: keyof typeof ACTIVITY_MULTIPLIERS): number => {
  return bmr * ACTIVITY_MULTIPLIERS[activityLevel];
};

// Calculate adjusted calories based on goal
export const calculateAdjustedCalories = (tdee: number, goal: GoalType): number => {
  const adjustment = GOAL_ADJUSTMENTS[goal] ?? 0;
  return Math.round(tdee * (1 + adjustment));
};

// Calculate macro split
export const calculateMacroSplit = (calories: number, goal: GoalType) => {
  let proteinPercent: number, carbPercent: number, fatPercent: number;
  if (goal.startsWith('lose_') || goal === 'lose_weight') {
    const isAggressive = goal.includes('15_20') || goal.includes('20_25') || goal === 'lose_aggressive';
    const isModerate = goal.includes('10_15') || goal === 'lose_moderate';
    if (isAggressive) {
      proteinPercent = 0.35; carbPercent = 0.35; fatPercent = 0.30;
    } else if (isModerate) {
      proteinPercent = 0.30; carbPercent = 0.40; fatPercent = 0.30;
    } else {
      proteinPercent = 0.25; carbPercent = 0.45; fatPercent = 0.30;
    }
  } else if (goal.startsWith('gain_') || goal === 'gain_muscle') {
    proteinPercent = 0.25; carbPercent = 0.50; fatPercent = 0.25;
  } else {
    proteinPercent = 0.25; carbPercent = 0.45; fatPercent = 0.30;
  }

  return {
    protein: Math.round((calories * proteinPercent) / 4),
    carbs: Math.round((calories * carbPercent) / 4),
    fats: Math.round((calories * fatPercent) / 9),
    calories: Math.round(calories)
  };
};

// Main calculation function
export const calculateMacros = (profile: UserProfileFormData): CalculatedMacros => {
  const bmr = calculateBMR(profile.gender, profile.weight, profile.height, profile.age);
  const tdee = calculateTDEE(bmr, profile.activityLevel);
  const adjustedCalories = calculateAdjustedCalories(tdee, profile.goal);
  const macros = calculateMacroSplit(adjustedCalories, profile.goal);

  return {
    bmr: Math.round(bmr),
    tdee: Math.round(tdee),
    adjustedCalories,
    ...macros
  };
};
