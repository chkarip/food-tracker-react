import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  FormControlLabel,
  Checkbox,
  Collapse
} from '@mui/material';
import { NumberStepper } from '../shared/inputs';

import  AccentButton  from '../shared/AccentButton';
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
            {/* Protein NumberStepper */}
            <Box>
              <Typography variant="body2" sx={{ mb: 1, fontWeight: 500 }}>
                Protein (g)
              </Typography>
              <NumberStepper
                value={nutrition.protein}
                onChange={(value) => handleChange('protein', value)}
                min={0}
                max={200}
                step={0.1}
                unit="g"
                size="small"
              />
            </Box>

            {/* Fats NumberStepper */}
            <Box>
              <Typography variant="body2" sx={{ mb: 1, fontWeight: 500 }}>
                Fats (g)
              </Typography>
              <NumberStepper
                value={nutrition.fats}
                onChange={(value) => handleChange('fats', value)}
                min={0}
                max={150}
                step={0.1}
                unit="g"
                size="small"
              />
            </Box>

            {/* Carbs NumberStepper */}
            <Box>
              <Typography variant="body2" sx={{ mb: 1, fontWeight: 500 }}>
                Carbs (g)
              </Typography>
              <NumberStepper
                value={nutrition.carbs}
                onChange={(value) => handleChange('carbs', value)}
                min={0}
                max={300}
                step={0.1}
                unit="g"
                size="small"
              />
            </Box>

            {/* Calories NumberStepper */}
            <Box>
              <Typography variant="body2" sx={{ mb: 1, fontWeight: 500 }}>
                Calories
              </Typography>
              <NumberStepper
                value={nutrition.calories}
                onChange={(value) => handleChange('calories', value)}
                min={0}
                max={2000}
                step={1}
                unit="cal"
                size="small"
              />
            </Box>
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
