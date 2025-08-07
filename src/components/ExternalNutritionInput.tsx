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
import { ExternalNutrition } from '../types/nutrition';

interface ExternalNutritionInputProps {
  externalNutrition: ExternalNutrition;
  onUpdateExternal: (nutrition: ExternalNutrition) => void;
}

const ExternalNutritionInput: React.FC<ExternalNutritionInputProps> = ({
  externalNutrition,
  onUpdateExternal
}) => {
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

  const handleCheckboxChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const enabled = event.target.checked;
    setIsExternalEnabled(enabled);
    
    // If disabling, clear all external nutrition data
    if (!enabled) {
      clearAll();
    }
  };

  const hasExternalNutrition = Object.values(externalNutrition).some(value => value > 0);

  return (
    <Card sx={{ mb: 3, borderRadius: 4 }}>
      <CardContent sx={{ p: 3 }}>
        {/* Header with Checkbox */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <FormControlLabel
            control={
              <Checkbox
                checked={isExternalEnabled}
                onChange={handleCheckboxChange}
                color="primary"
              />
            }
            label={
              <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <RestaurantIcon />
                External Nutrition
              </Typography>
            }
          />
          {hasExternalNutrition && isExternalEnabled && (
            <Button
              variant="outlined"
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
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Add macros from foods eaten outside the app (restaurants, snacks, etc.)
          </Typography>

          <Box 
            sx={{ 
              display: 'grid', 
              gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(4, 1fr)' },
              gap: 2 
            }}
          >
            <TextField
              label="💪 Protein (g)"
              type="number"
              value={externalNutrition.protein}
              onChange={(e) => handleChange('protein', Number(e.target.value))}
              inputProps={{ min: 0, step: 0.1 }}
              size="small"
              fullWidth
            />
            
            <TextField
              label="🥑 Fats (g)"
              type="number"
              value={externalNutrition.fats}
              onChange={(e) => handleChange('fats', Number(e.target.value))}
              inputProps={{ min: 0, step: 0.1 }}
              size="small"
              fullWidth
            />
            
            <TextField
              label="🍞 Carbs (g)"
              type="number"
              value={externalNutrition.carbs}
              onChange={(e) => handleChange('carbs', Number(e.target.value))}
              inputProps={{ min: 0, step: 0.1 }}
              size="small"
              fullWidth
            />
            
            <TextField
              label="🔥 Calories"
              type="number"
              value={externalNutrition.calories}
              onChange={(e) => handleChange('calories', Number(e.target.value))}
              inputProps={{ min: 0, step: 1 }}
              size="small"
              fullWidth
            />
          </Box>

          {hasExternalNutrition && (
            <Box sx={{ mt: 2, p: 2, bgcolor: 'primary.50', borderRadius: 2 }}>
              <Typography variant="body2" color="primary.main">
                External Total: {externalNutrition.protein}g protein, {externalNutrition.fats}g fats, 
                {externalNutrition.carbs}g carbs, {externalNutrition.calories} calories
              </Typography>
            </Box>
          )}
        </Collapse>
      </CardContent>
    </Card>
  );
};

export default ExternalNutritionInput;
