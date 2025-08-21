import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  FormControlLabel,
  Checkbox,
  Collapse
} from '@mui/material';

import { AccentButton } from '../shared';
import { Restaurant as RestaurantIcon, Clear as ClearIcon } from '@mui/icons-material';
import { ExternalNutrition } from '../../types/nutrition';

interface ExternalNutritionInputProps {
  nutrition: ExternalNutrition;                    // ✅ CHANGED from externalNutrition
  onUpdateNutrition: (nutrition: ExternalNutrition) => void;  // ✅ CHANGED from onUpdateExternal
}

const ExternalNutritionInput: React.FC<ExternalNutritionInputProps> = ({
  nutrition,              // ✅ CHANGED prop name
  onUpdateNutrition      // ✅ CHANGED prop name
}) => {
  const [isExternalEnabled, setIsExternalEnabled] = useState(false);

  const handleChange = (field: keyof ExternalNutrition, value: number) => {
    onUpdateNutrition({    // ✅ CHANGED function name
      ...nutrition,        // ✅ CHANGED prop name
      [field]: Math.max(0, value) // Ensure non-negative values
    });
  };

  const clearAll = () => {
    onUpdateNutrition({    // ✅ CHANGED function name
      protein: 0,
      fats: 0,
      carbs: 0,
      calories: 0
    });
  };

  const handleCheckboxChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const enabled = event.target.checked;
    setIsExternalEnabled(enabled);
    // If disabling, clear all external nutrition data
    if (!enabled) {
      clearAll();
    }
  };

  const hasExternalNutrition = Object.values(nutrition).some(value => value > 0);  // ✅ CHANGED prop name

  return (
    <Card sx={{ mt: 2 }}>
      <CardContent>
        {/* Header with Checkbox */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
          <FormControlLabel
            control={
              <Checkbox
                checked={isExternalEnabled}
                onChange={handleCheckboxChange}
                icon={<RestaurantIcon />}
                checkedIcon={<RestaurantIcon />}
              />
            }
            label={
              <Typography variant="h6">
                External Nutrition
              </Typography>
            }
          />
          {hasExternalNutrition && isExternalEnabled && (
            <AccentButton
              onClick={clearAll}
              size="small"
              variant="secondary"
            >
              🧹 Clear All
            </AccentButton>
          )}
        </Box>

        {/* Collapsible Content */}
        <Collapse in={isExternalEnabled}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Add macros from foods eaten outside the app (restaurants, snacks, etc.)
          </Typography>

          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 2 }}>
            <TextField
              label="Protein (g)"
              type="number"
              value={nutrition.protein}                              // ✅ CHANGED prop name
              onChange={(e) => handleChange('protein', Number(e.target.value))}
              inputProps={{ min: 0, step: 0.1 }}
              size="small"
              fullWidth
            />
            <TextField
              label="Fats (g)"
              type="number"
              value={nutrition.fats}                                 // ✅ CHANGED prop name
              onChange={(e) => handleChange('fats', Number(e.target.value))}
              inputProps={{ min: 0, step: 0.1 }}
              size="small"
              fullWidth
            />
            <TextField
              label="Carbs (g)"
              type="number"
              value={nutrition.carbs}                                // ✅ CHANGED prop name
              onChange={(e) => handleChange('carbs', Number(e.target.value))}
              inputProps={{ min: 0, step: 0.1 }}
              size="small"
              fullWidth
            />
            <TextField
              label="Calories"
              type="number"
              value={nutrition.calories}                             // ✅ CHANGED prop name
              onChange={(e) => handleChange('calories', Number(e.target.value))}
              inputProps={{ min: 0, step: 1 }}
              size="small"
              fullWidth
            />
          </Box>

          {hasExternalNutrition && (
            <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block' }}>
              External Total: {nutrition.protein}g protein, {nutrition.fats}g fats,{' '}   {/* ✅ CHANGED prop name */}
              {nutrition.carbs}g carbs, {nutrition.calories} calories                      {/* ✅ CHANGED prop name */}
            </Typography>
          )}
        </Collapse>
      </CardContent>
    </Card>
  );
};

export default ExternalNutritionInput;
