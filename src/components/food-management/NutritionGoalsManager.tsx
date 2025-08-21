/**
 * components/food-management/NutritionGoalsManager.tsx
 * ----------------------------------------------------
 * Simple editor for the app-wide daily macro targets.
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Stack,
  Alert
} from '@mui/material';
import { NumberStepper } from '../shared/inputs';

/* ---------- types ---------- */
export interface NutritionGoals {
  protein: number;
  fats: number;
  carbs: number;
  calories: number;
}

interface Props {
  onGoalsChange?: (goals: NutritionGoals) => void;
}

/* ---------- defaults ---------- */
const DEFAULT_GOALS: NutritionGoals = {
  protein: 127,
  fats: 65,
  carbs: 300,
  calories: 2_300
};

const STORAGE_KEY = 'nutritionGoals';

/* ==================================================== */
/*  COMPONENT                                            */
/* ==================================================== */

const NutritionGoalsManager: React.FC<Props> = ({ onGoalsChange }) => {
  const [goals, setGoals] = useState<NutritionGoals>(DEFAULT_GOALS);
  const [saved, setSaved] = useState(false);

  /* load goals once */
  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) setGoals(JSON.parse(raw));
  }, []);

  /* propagate to parent when goals change */
  useEffect(() => {
    onGoalsChange?.(goals);
  }, [goals, onGoalsChange]);

  /* handlers */
  const handleChange = (field: keyof NutritionGoals, value: string) => {
    setGoals(prev => ({ ...prev, [field]: Number(value) || 0 }));
  };

  const handleSave = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(goals));
    setSaved(true);
    setTimeout(() => setSaved(false), 2_000);
  };

  /* render */
  return (
    <Card sx={{ maxWidth: 480, mx: 'auto' }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Daily Nutrition Targets
        </Typography>

        <Stack spacing={2}>
          {(['protein', 'fats', 'carbs', 'calories'] as const).map(key => (
            <Box key={key} sx={{ mb: 2 }}>
              <Typography variant="body2" sx={{ mb: 1, fontWeight: 500 }}>
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

          <Box>
            <Button variant="contained" onClick={handleSave}>
              Save Goals
            </Button>
          </Box>

          {saved && (
            <Alert severity="success" sx={{ mt: 1 }}>
              Goals saved!
            </Alert>
          )}
        </Stack>
      </CardContent>
    </Card>
  );
};

export default NutritionGoalsManager;
