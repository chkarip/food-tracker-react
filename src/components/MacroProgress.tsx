import React, { useMemo } from 'react';
import { Box, Card, CardContent, Typography, LinearProgress } from '@mui/material';
import { NutritionData, ExternalNutrition } from '../types/nutrition';
import { MACRO_TARGETS } from '../config/nutritionTargets'; // ✅ Fixed import
import { formatMacroValue } from '../utils/nutritionCalculations';

interface MacroProgressProps {
  foodMacros: NutritionData;
  externalNutrition: ExternalNutrition;
}

const MacroProgress: React.FC<MacroProgressProps> = ({ foodMacros, externalNutrition }) => {
  // Calculate totals including external nutrition - memoized
  const totals = useMemo(() => ({
    protein: foodMacros.protein + externalNutrition.protein,
    fats: foodMacros.fats + externalNutrition.fats,
    carbs: foodMacros.carbs + externalNutrition.carbs,
    calories: foodMacros.calories + externalNutrition.calories
  }), [foodMacros, externalNutrition]);

  // Calculate progress percentages - memoized
  const progress = useMemo(() => ({
    protein: Math.min(totals.protein / MACRO_TARGETS.protein, 1.0),
    fats: Math.min(totals.fats / MACRO_TARGETS.fats, 1.0),
    carbs: Math.min(totals.carbs / MACRO_TARGETS.carbs, 1.0),
    calories: Math.min(totals.calories / MACRO_TARGETS.caloriesMax, 1.0)
  }), [totals]);

  const MacroCard: React.FC<{
    emoji: string;
    label: string;
    current: number;
    target: number | string;
    progress: number;
    unit: string;
  }> = ({ emoji, label, current, target, progress, unit }) => (
    <Card sx={{ mb: 2 }}>
      <CardContent sx={{ p: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
          <Typography variant="body2">
            {emoji} {label}
          </Typography>
          <Typography variant="body2">
            {formatMacroValue(current, 0)}{unit} / {target}{unit}
          </Typography>
        </Box>
        <LinearProgress 
          variant="determinate" 
          value={progress * 100} 
          sx={{ mb: 1, height: 8, borderRadius: 4 }}
        />
        <Typography variant="caption" color="text.secondary">
          {formatMacroValue(progress * 100, 0)}%
        </Typography>
      </CardContent>
    </Card>
  );

  return (
    <Box>
      <Typography variant="h6" sx={{ mb: 2 }}>
        📊 Daily Nutrition Progress
      </Typography>
      
      <MacroCard 
        emoji="💪" 
        label="Protein" 
        current={totals.protein} 
        target={MACRO_TARGETS.protein} 
        progress={progress.protein} 
        unit="g" 
      />
      <MacroCard 
        emoji="🥑" 
        label="Fats" 
        current={totals.fats} 
        target={MACRO_TARGETS.fats} 
        progress={progress.fats} 
        unit="g" 
      />
      <MacroCard 
        emoji="🍞" 
        label="Carbs" 
        current={totals.carbs} 
        target={MACRO_TARGETS.carbs} 
        progress={progress.carbs} 
        unit="g" 
      />
      <MacroCard 
        emoji="🔥" 
        label="Calories" 
        current={totals.calories} 
        target={MACRO_TARGETS.caloriesMax} 
        progress={progress.calories} 
        unit="kcal" 
      />
    </Box>
  );
};

export default MacroProgress;
