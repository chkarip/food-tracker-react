/**
 * components/food-management/NutritionGoalsManager.tsx
 * Simple two-column layout using Flexbox - no Grid component needed
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Button,
  Stack,
  Alert,
  Card,
  CardContent
} from '@mui/material';
import { NumberStepper } from '../shared/inputs';
import { saveNutritionGoal, getNutritionGoal } from '../../services/firebase/nutrition/nutritionGoalService';
import { getUserProfile } from '../../services/firebase/nutrition/userProfileService';
import { useAuth } from '../../contexts/AuthContext';
import { NutritionGoalFormData, CalculatedMacros, UserProfileFormData, GoalType } from '../../types/food';
import MacroCalculator from './MacroCalculator';
import AccentButton from '../shared/AccentButton';

interface Props {
  onGoalsChange?: (goals: NutritionGoalFormData) => void;
}

const NutritionGoalsManager: React.FC<Props> = ({ onGoalsChange }) => {
  const [goals, setGoals] = useState<NutritionGoalFormData | null>(null);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  // Goal options for the dropdown
  const goalOptions = [
    { value: 'lose_20_25' as GoalType, label: 'Lose 20-25%' },
    { value: 'lose_15_20' as GoalType, label: 'Lose 15-20%' },
    { value: 'lose_10_15' as GoalType, label: 'Lose 10-15%' },
    { value: 'lose_5_10' as GoalType, label: 'Lose 5-10%' },
    { value: 'lose_3_5' as GoalType, label: 'Lose 3-5%' },
    { value: 'lose_2_3' as GoalType, label: 'Lose 2-3%' },
    { value: 'maintain' as GoalType, label: 'Maintain Weight' },
    { value: 'gain_2_3' as GoalType, label: 'Gain 2-3%' },
    { value: 'gain_3_5' as GoalType, label: 'Gain 3-5%' },
    { value: 'gain_5_10' as GoalType, label: 'Gain 5-10%' },
    { value: 'gain_10_15' as GoalType, label: 'Gain 10-15%' },
    { value: 'gain_15_20' as GoalType, label: 'Gain 15-20%' },
    { value: 'gain_20_25' as GoalType, label: 'Gain 20-25%' }
  ];

  // Goal adjustments for macro calculations
  const goalAdjustments: Partial<Record<GoalType, number>> = {
    lose_20_25: 0.775,
    lose_15_20: 0.825,
    lose_10_15: 0.875,
    lose_5_10: 0.925,
    lose_3_5: 0.96,
    lose_2_3: 0.975,
    maintain: 1.0,
    gain_2_3: 1.025,
    gain_3_5: 1.04,
    gain_5_10: 1.075,
    gain_10_15: 1.125,
    gain_15_20: 1.175,
    gain_20_25: 1.225,
  };

  // Calculate macros from profile
  const calculateMacrosFromProfile = (userProfile: UserProfileFormData): CalculatedMacros => {
    const { gender, age, height, weight, activityLevel, goal, bodyFatPercentage } = userProfile;

    // BMR calculation
    let bmr: number;

    if (bodyFatPercentage && bodyFatPercentage > 0) {
      // Katch-McArdle formula for known body fat
      const leanBodyMass = weight * (1 - bodyFatPercentage / 100);
      bmr = 370 + 21.6 * leanBodyMass;
    } else {
      // Fallback to Mifflin-St Jeor
      bmr = gender === 'male'
        ? (10 * weight) + (6.25 * height) - (5 * age) + 5
        : (10 * weight) + (6.25 * height) - (5 * age) - 161;
    }

    // Activity multipliers
    const activityMultipliers: Record<string, number> = {
      sedentary: 1.2,
      light: 1.375,
      moderate: 1.55,
      active: 1.725,
      very_active: 1.9
    };

    const tdee = bmr * activityMultipliers[activityLevel];

    const adjustedCalories = Math.round(tdee * (goalAdjustments[goal] ?? 1.0));

    // Smart macro distribution based on goal
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

    const protein = Math.round((adjustedCalories * proteinPercent) / 4);
    const carbs = Math.round((adjustedCalories * carbPercent) / 4);
    const fats = Math.round((adjustedCalories * fatPercent) / 9);

    return {
      bmr: Math.round(bmr),
      tdee: Math.round(tdee),
      adjustedCalories,
      protein,
      carbs,
      fats,
      calories: adjustedCalories
    };
  };

  // Load goals from Firebase on mount
  useEffect(() => {
    const loadGoals = async () => {
      if (!user?.uid) {
        setLoading(false);
        return;
      }

      try {
        let firestoreGoals = await getNutritionGoal(user.uid);

        if (!firestoreGoals) {
          const defaultGoals: NutritionGoalFormData = {
            protein: 127,
            fats: 65,
            carbs: 300,
            calories: 2300
          };
          await saveNutritionGoal(user.uid, defaultGoals);
          firestoreGoals = await getNutritionGoal(user.uid);
        }

        if (firestoreGoals) {
          setGoals({
            protein: firestoreGoals.protein,
            fats: firestoreGoals.fats,
            carbs: firestoreGoals.carbs,
            calories: firestoreGoals.calories
          });
        }
      } catch (error) {
        console.error('Failed to load nutrition goals:', error);
      } finally {
        setLoading(false);
      }
    };

    loadGoals();
  }, [user?.uid]);

  useEffect(() => {
    if (goals) {
      onGoalsChange?.(goals);
    }
  }, [goals, onGoalsChange]);

  const handleChange = (field: keyof NutritionGoalFormData, value: string) => {
    if (!goals) return;
    setGoals((prev: NutritionGoalFormData | null) => ({ ...prev!, [field]: Number(value) || 0 }));
  };

  const handleSave = async () => {
    if (!user?.uid || !goals) return;

    try {
      await saveNutritionGoal(user.uid, goals);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (error) {
      console.error('Failed to save nutrition goals:', error);
    }
  };

  // Handle calculated macros from calculator
  const handleCalculatedMacros = useCallback((macros: CalculatedMacros) => {
    setGoals({
      protein: macros.protein,
      fats: macros.fats,
      carbs: macros.carbs,
      calories: macros.calories
    });
  }, []);

  // Calculate goals from user profile
  const handleCalculateFromProfile = async () => {
    if (!user?.uid) return;

    try {
      const userProfile = await getUserProfile(user.uid);
      if (userProfile) {
        const calculatedMacros = calculateMacrosFromProfile(userProfile);
        const newGoals: NutritionGoalFormData = {
          protein: calculatedMacros.protein,
          fats: calculatedMacros.fats,
          carbs: calculatedMacros.carbs,
          calories: calculatedMacros.calories
        };
        setGoals(newGoals);
        onGoalsChange?.(newGoals);
      }
    } catch (error) {
      // Failed to calculate goals from profile
    }
  };

  if (loading) {
    return <Typography>Loading nutrition goals...</Typography>;
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Nutrition Goals
      </Typography>

      {/* ✅ Flexbox two-column layout - no Grid needed */}
      <Box sx={{
        display: 'flex',
        flexDirection: { xs: 'column', md: 'row' },
        gap: 3,
        alignItems: 'flex-start'
      }}>

        {/* Left Column - Manual Input */}
        <Box sx={{
          flex: 1,
          minWidth: 0, // Prevents flex overflow
          width: { xs: '100%', md: 'auto' }
        }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Manual Input
              </Typography>

              {goals && (
                <Stack spacing={3}>
                  {(['protein', 'fats', 'carbs', 'calories'] as const).map(key => (
                    <Box key={key}>
                      <Typography variant="body2" sx={{ mb: 1 }}>
                        {key.charAt(0).toUpperCase() + key.slice(1)} ({key === 'calories' ? 'kcal' : 'g'})
                      </Typography>
                      <NumberStepper
                        value={goals[key]}
                        onChange={(value) => handleChange(key, value.toString())}
                        min={0}
                        max={key === 'calories' ? 5000 : key === 'carbs' ? 800 : 300}
                        step={key === 'calories' ? 10 : 1}
                        unit={key === 'calories' ? 'kcal' : 'g'}
                        size="medium"
                      />
                    </Box>
                  ))}

                  <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
                    <Button
                      variant="contained"
                      onClick={handleSave}
                      disabled={!user?.uid}
                      sx={{ flex: 1 }}
                    >
                      Save Goals
                    </Button>

                    <AccentButton
                      onClick={handleCalculateFromProfile}
                      disabled={!user?.uid}
                      variant="secondary"
                      style={{
                        flex: 1,
                        backgroundColor: 'var(--accent-blue)',
                        borderRadius: '8px'
                      }}
                    >
                      Calculate from Profile
                    </AccentButton>
                  </Box>

                  {saved && (
                    <Alert severity="success">
                      Goals saved!
                    </Alert>
                  )}
                </Stack>
              )}
            </CardContent>
          </Card>
        </Box>

        {/* Right Column - Calculator */}
        <Box sx={{
          flex: 1,
          minWidth: 0, // Prevents flex overflow
          width: { xs: '100%', md: 'auto' }
        }}>
          <MacroCalculator onCalculatedMacros={handleCalculatedMacros} />
        </Box>
      </Box>
    </Box>
  );
};

export default NutritionGoalsManager;
