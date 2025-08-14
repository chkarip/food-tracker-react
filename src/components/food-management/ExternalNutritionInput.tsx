import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  FormControlLabel,
  Checkbox,
  Collapse
} from '@mui/material';
import { Restaurant as RestaurantIcon, Clear as ClearIcon } from '@mui/icons-material';
import { ExternalNutrition } from '../../types/nutrition';

interface ExternalNutritionInputProps {
  externalNutrition: ExternalNutrition;
  onUpdateExternal: (nutrition: ExternalNutrition) => void;
} // ✅ Added missing closing brace

const ExternalNutritionInput: React.FC<ExternalNutritionInputProps> = ({
  externalNutrition,
  onUpdateExternal
}) => { // ✅ Fixed arrow function
  const [isExternalEnabled, setIsExternalEnabled] = useState(false);

  const handleChange = (field: keyof ExternalNutrition, value: number) => {
    onUpdateExternal({
      ...externalNutrition,
      [field]: Math.max(0, value) // Ensure non-negative values
    });
  };

  const clearAll = () => {
    onUpdateExternal({
      protein: 0,
      fats: 0,
      carbs: 0,
      calories: 0
    });
  };

  const handleCheckboxChange = (event: React.ChangeEvent<HTMLInputElement>) => { // ✅ Fixed type
    const enabled = event.target.checked;
    setIsExternalEnabled(enabled);
    // If disabling, clear all external nutrition data
    if (!enabled) {
      clearAll();
    }
  };

  const hasExternalNutrition = Object.values(externalNutrition).some(value => value > 0);

  return (
    <Card>
      <CardContent>
        {/* Header with Checkbox */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
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
              <Typography variant="subtitle1">
                External Nutrition
              </Typography>
            }
          />
          {hasExternalNutrition && isExternalEnabled && (
            <Button
              size="small"
              startIcon={<ClearIcon />}
              onClick={clearAll}
            >
              Clear All
            </Button>
          )}
        </Box>

        {/* Collapsible Content */}
        <Collapse in={isExternalEnabled}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Add macros from foods eaten outside the app (restaurants, snacks, etc.)
          </Typography>
          
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 2, mb: 2 }}>
            <TextField
              label="Protein (g)"
              type="number"
              value={externalNutrition.protein}
              onChange={(e) => handleChange('protein', Number(e.target.value))}
              inputProps={{ min: 0, step: 0.1 }}
              size="small"
              fullWidth
            />
            <TextField
              label="Fats (g)"
              type="number"
              value={externalNutrition.fats}
              onChange={(e) => handleChange('fats', Number(e.target.value))}
              inputProps={{ min: 0, step: 0.1 }}
              size="small"
              fullWidth
            />
            <TextField
              label="Carbs (g)"
              type="number"
              value={externalNutrition.carbs}
              onChange={(e) => handleChange('carbs', Number(e.target.value))}
              inputProps={{ min: 0, step: 0.1 }}
              size="small"
              fullWidth
            />
            <TextField
              label="Calories"
              type="number"
              value={externalNutrition.calories}
              onChange={(e) => handleChange('calories', Number(e.target.value))}
              inputProps={{ min: 0, step: 1 }}
              size="small"
              fullWidth
            />
          </Box>

          {hasExternalNutrition && (
            <Typography variant="caption" color="text.secondary">
              External Total: {externalNutrition.protein}g protein, {externalNutrition.fats}g fats,{' '}
              {externalNutrition.carbs}g carbs, {externalNutrition.calories} calories
            </Typography>
          )}
        </Collapse>
      </CardContent>
    </Card>
  );
};

export default ExternalNutritionInput;
