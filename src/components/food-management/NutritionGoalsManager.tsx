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
  TextField,
  Button,
  Stack,
  Alert
} from '@mui/material';

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
  protein: 125,
  fats: 61,
  carbs: 287,
  calories: 2_150
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
            <TextField
              key={key}
              label={key.charAt(0).toUpperCase() + key.slice(1)}
              type="number"
              value={goals[key]}
              onChange={e => handleChange(key, e.target.value)}
              inputProps={{ min: 0 }}
            />
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
