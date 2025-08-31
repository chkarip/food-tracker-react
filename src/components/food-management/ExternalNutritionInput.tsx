import React, { useState } from 'react';
import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Typography,
  Box,
  IconButton
} from '@mui/material';
import { NumberStepper } from '../shared/inputs';

import  AccentButton  from '../shared/AccentButton';
import { ExpandMore } from '@mui/icons-material';
import { ExternalNutrition } from '../../types/nutrition';

interface ExternalNutritionInputProps {
  nutrition: ExternalNutrition;                    // ✅ CHANGED from externalNutrition
  onUpdateNutrition: (nutrition: ExternalNutrition) => void;  // ✅ CHANGED from onUpdateExternal
}

const ExternalNutritionInput: React.FC<ExternalNutritionInputProps> = ({
  nutrition,              // ✅ CHANGED prop name
  onUpdateNutrition      // ✅ CHANGED prop name
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

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

  const handleAccordionChange = (event: React.SyntheticEvent, expanded: boolean) => {
    setIsExpanded(expanded);
  };

  const hasExternalNutrition = Object.values(nutrition).some(value => value > 0);

  return (
    <Accordion 
      expanded={isExpanded}
      onChange={handleAccordionChange}
      sx={{ 
        mt: 2,
        background: 'var(--card-bg)',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-md)',
        boxShadow: 'var(--elevation-1)',
        '&:before': {
          display: 'none',
        },
        '&.Mui-expanded': {
          boxShadow: 'var(--elevation-2)',
          borderColor: 'var(--accent-green)',
          background: 'var(--meal-row-bg-hover)'
        }
      }}
    >
      <AccordionSummary 
        expandIcon={<ExpandMore sx={{ color: 'var(--text-secondary)' }} />}
        sx={{
          background: 'var(--meal-row-bg)',
          borderRadius: 'var(--radius-md) var(--radius-md) 0 0',
          '&:hover': {
            background: 'var(--meal-row-bg-hover)'
          },
          '&.Mui-expanded': {
            background: 'var(--meal-row-bg-hover)',
            borderBottom: '1px solid var(--border-color)'
          }
        }}
      >
        <Typography variant="h6" sx={{ 
          color: 'var(--text-primary)', 
          fontWeight: 600,
          opacity: 0.94,
          position: 'relative',
          '&::before': {
            content: '""',
            position: 'absolute',
            left: -16,
            top: 0,
            bottom: 0,
            width: '3px',
            backgroundColor: 'var(--accent-green)',
            borderRadius: '2px'
          },
          paddingLeft: '12px'
        }}>
          External Nutrition
        </Typography>
        {hasExternalNutrition && isExpanded && (
          <Box sx={{ ml: 'auto', mr: 2 }}>
            <AccentButton
              onClick={(e) => {
                e?.stopPropagation();
                clearAll();
              }}
              size="small"
              variant="secondary"
            >
              🧹 Clear All
            </AccentButton>
          </Box>
        )}
      </AccordionSummary>

      <AccordionDetails sx={{ background: 'var(--card-bg)', borderRadius: '0 0 var(--radius-md) var(--radius-md)' }}>
        <Typography variant="body2" sx={{ mb: 2, color: 'var(--text-secondary)' }}>
          Add macros from foods eaten outside the app (restaurants, snacks, etc.)
        </Typography>

        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 2 }}>
          {/* Protein NumberStepper */}
          <Box>
            <Typography variant="body2" sx={{ mb: 1, fontWeight: 500, color: 'var(--text-primary)' }}>
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
            <Typography variant="body2" sx={{ mb: 1, fontWeight: 500, color: 'var(--text-primary)' }}>
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
            <Typography variant="body2" sx={{ mb: 1, fontWeight: 500, color: 'var(--text-primary)' }}>
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
            <Typography variant="body2" sx={{ mb: 1, fontWeight: 500, color: 'var(--text-primary)' }}>
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
          <Typography variant="caption" sx={{ mt: 2, display: 'block', color: 'var(--text-secondary)' }}>
            External Total: {nutrition.protein}g protein, {nutrition.fats}g fats,{' '}   {/* ✅ CHANGED prop name */}
            {nutrition.carbs}g carbs, {nutrition.calories} calories                      {/* ✅ CHANGED prop name */}
          </Typography>
        )}
      </AccordionDetails>
    </Accordion>
  );
};

export default ExternalNutritionInput;
