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
  Alert
} from '@mui/material';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import { NumberStepper } from '../shared/inputs';
import { saveNutritionGoal, getNutritionGoal } from '../../services/firebase/nutrition/nutritionGoalService';
import { useAuth } from '../../contexts/AuthContext';
import { NutritionGoalFormData, CalculatedMacros } from '../../types/food';
import MacroCalculator from './MacroCalculator';

interface Props {
  onGoalsChange?: (goals: NutritionGoalFormData) => void;
}

const NutritionGoalsManager: React.FC<Props> = ({ onGoalsChange }) => {
  const [goals, setGoals] = useState<NutritionGoalFormData | null>(null);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

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
    setGoals(prev => ({ ...prev!, [field]: Number(value) || 0 }));
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
                  
                  <Button 
                    variant="contained" 
                    onClick={handleSave}
                    disabled={!user?.uid}
                  >
                    Save Goals
                  </Button>
                  
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
