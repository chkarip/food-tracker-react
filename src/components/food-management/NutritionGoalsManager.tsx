import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Alert,
  Stack,
  Divider,
  Paper
} from '@mui/material';
import {
  Save as SaveIcon,
  RestartAlt as ResetIcon,
  TrendingUp as GoalIcon
} from '@mui/icons-material';

interface NutritionGoals {
  protein: number;
  fats: number;
  carbs: number;
  calories: number;
}

const DEFAULT_GOALS: NutritionGoals = {
  protein: 125,
  fats: 61,
  carbs: 287,
  calories: 2150
};

const NutritionGoalsManager: React.FC = () => {
  const [goals, setGoals] = useState<NutritionGoals>(DEFAULT_GOALS);
  const [tempGoals, setTempGoals] = useState<NutritionGoals>(DEFAULT_GOALS);
  const [hasChanges, setHasChanges] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);

  // Load goals from localStorage on mount
  useEffect(() => {
    const savedGoals = localStorage.getItem('nutritionGoals');
    if (savedGoals) {
      try {
        const parsed = JSON.parse(savedGoals);
        setGoals(parsed);
        setTempGoals(parsed);
      } catch (error) {
        console.error('Error loading nutrition goals:', error);
      }
    }
  }, []);

  // Check for changes
  useEffect(() => {
    const changed = 
      tempGoals.protein !== goals.protein ||
      tempGoals.fats !== goals.fats ||
      tempGoals.carbs !== goals.carbs ||
      tempGoals.calories !== goals.calories;
    setHasChanges(changed);
  }, [tempGoals, goals]);

  const handleInputChange = (field: keyof NutritionGoals, value: string) => {
    const numValue = parseFloat(value) || 0;
    setTempGoals(prev => ({
      ...prev,
      [field]: numValue
    }));
    setSuccess(null);
  };

  const handleSave = () => {
    setGoals({ ...tempGoals });
    localStorage.setItem('nutritionGoals', JSON.stringify(tempGoals));
    setSuccess('✅ Nutrition goals saved successfully!');
    
    // Clear success message after 3 seconds
    setTimeout(() => setSuccess(null), 3000);
  };

  const handleReset = () => {
    setTempGoals({ ...DEFAULT_GOALS });
    setSuccess(null);
  };

  const handleCancel = () => {
    setTempGoals({ ...goals });
    setSuccess(null);
  };

  // Calculate macro percentages (rough estimate for 2150 calories)
  const calculatePercentage = (macro: string, value: number) => {
    const caloriesPerGram = {
      protein: 4,
      fats: 9,
      carbs: 4
    };
    
    if (macro === 'calories') return 100;
    
    const macroCalories = value * caloriesPerGram[macro as keyof typeof caloriesPerGram];
    return Math.round((macroCalories / tempGoals.calories) * 100);
  };

  return (
    <Box>
      <Card sx={{ mb: 3, borderRadius: 4 }}>
        <CardContent sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <GoalIcon />
            Nutrition Goals Manager
          </Typography>

          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Set your daily nutrition targets. These goals will be used in the Meal Plan progress tracking.
          </Typography>

          {success && <Alert severity="success" sx={{ mb: 3 }}>{success}</Alert>}

          <Stack spacing={4}>
            {/* Current Goals Overview */}
            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
                Current Goals
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', justifyContent: 'space-between' }}>
                <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'primary.50', minWidth: '150px', flex: 1 }}>
                  <Typography variant="h5" color="primary.main">
                    {goals.protein}g
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Protein ({calculatePercentage('protein', goals.protein)}%)
                  </Typography>
                </Paper>
                <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'warning.50', minWidth: '150px', flex: 1 }}>
                  <Typography variant="h5" color="warning.main">
                    {goals.fats}g
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Fats ({calculatePercentage('fats', goals.fats)}%)
                  </Typography>
                </Paper>
                <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'success.50', minWidth: '150px', flex: 1 }}>
                  <Typography variant="h5" color="success.main">
                    {goals.carbs}g
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Carbs ({calculatePercentage('carbs', goals.carbs)}%)
                  </Typography>
                </Paper>
                <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'secondary.50', minWidth: '150px', flex: 1 }}>
                  <Typography variant="h5" color="secondary.main">
                    {goals.calories}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Calories
                  </Typography>
                </Paper>
              </Box>
            </Box>

            <Divider />

            {/* Edit Goals */}
            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
                Update Goals
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <TextField
                  label="Protein (g)"
                  type="number"
                  value={tempGoals.protein}
                  onChange={(e) => handleInputChange('protein', e.target.value)}
                  sx={{ minWidth: '150px', flex: 1 }}
                  inputProps={{ min: 0, step: 5 }}
                  helperText="Daily protein target"
                />
                <TextField
                  label="Fats (g)"
                  type="number"
                  value={tempGoals.fats}
                  onChange={(e) => handleInputChange('fats', e.target.value)}
                  sx={{ minWidth: '150px', flex: 1 }}
                  inputProps={{ min: 0, step: 5 }}
                  helperText="Daily fat target"
                />
                <TextField
                  label="Carbohydrates (g)"
                  type="number"
                  value={tempGoals.carbs}
                  onChange={(e) => handleInputChange('carbs', e.target.value)}
                  sx={{ minWidth: '150px', flex: 1 }}
                  inputProps={{ min: 0, step: 10 }}
                  helperText="Daily carb target"
                />
                <TextField
                  label="Calories (kcal)"
                  type="number"
                  value={tempGoals.calories}
                  onChange={(e) => handleInputChange('calories', e.target.value)}
                  sx={{ minWidth: '150px', flex: 1 }}
                  inputProps={{ min: 0, step: 50 }}
                  helperText="Daily calorie target"
                />
              </Box>
            </Box>

            {/* Action Buttons */}
            <Box sx={{ display: 'flex', gap: 2, pt: 2 }}>
              <Button
                variant="contained"
                startIcon={<SaveIcon />}
                onClick={handleSave}
                disabled={!hasChanges}
                size="large"
              >
                Save Goals
              </Button>
              
              <Button
                variant="outlined"
                onClick={handleCancel}
                disabled={!hasChanges}
                size="large"
              >
                Cancel
              </Button>

              <Button
                variant="outlined"
                startIcon={<ResetIcon />}
                onClick={handleReset}
                size="large"
                color="warning"
              >
                Reset to Default
              </Button>
            </Box>

            {/* Goals Summary */}
            <Box sx={{ bgcolor: 'action.hover', p: 2, borderRadius: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                Goals Summary
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total Daily Intake: {tempGoals.calories} calories
                <br />
                Protein: {tempGoals.protein}g ({calculatePercentage('protein', tempGoals.protein)}% of calories)
                <br />
                Fats: {tempGoals.fats}g ({calculatePercentage('fats', tempGoals.fats)}% of calories)
                <br />
                Carbs: {tempGoals.carbs}g ({calculatePercentage('carbs', tempGoals.carbs)}% of calories)
              </Typography>
            </Box>
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
};

export default NutritionGoalsManager;

// Export the function to get current goals
export const getNutritionGoals = (): NutritionGoals => {
  const savedGoals = localStorage.getItem('nutritionGoals');
  if (savedGoals) {
    try {
      return JSON.parse(savedGoals);
    } catch (error) {
      console.error('Error loading nutrition goals:', error);
    }
  }
  return DEFAULT_GOALS;
};
