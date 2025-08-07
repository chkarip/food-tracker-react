import React, { useMemo } from 'react';
import { Box, Card, CardContent, Typography, LinearProgress } from '@mui/material';
import { NutritionData, ExternalNutrition } from '../types/nutrition';
import { MACRO_TARGETS } from '../data/foodDatabase';
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

  // Color function - memoized
  const getProgressColor = useMemo(() => (current: number, target: number): string => {
    if (current > target) return '#ef4444'; // red if over target
    if (current >= target * 0.8) return '#10b981'; // green if close to target
    return '#f59e0b'; // yellow if under target
  }, []);

  const MacroCard: React.FC<{
    emoji: string;
    label: string;
    current: number;
    target: number | string;
    progress: number;
    unit: string;
  }> = ({ emoji, label, current, target, progress, unit }) => (
    <Box sx={{ textAlign: 'center' }}>
      <Typography variant="caption" color="text.secondary" gutterBottom>
        {emoji} {label}
      </Typography>
      <Typography variant="body1" fontWeight="bold" gutterBottom>
        {formatMacroValue(current, 0)}{unit} / {target}{unit}
      </Typography>
      <LinearProgress
        variant="determinate"
        value={progress * 100}
        sx={{
          height: 6,
          borderRadius: 3,
          backgroundColor: '#e5e7eb',
          '& .MuiLinearProgress-bar': {
            backgroundColor: getProgressColor(current, typeof target === 'number' ? target : 0),
            borderRadius: 3,
          },
        }}
      />
      <Typography variant="caption" color="text.secondary" sx={{ mt: 0.3, fontSize: '0.7rem' }}>
        {formatMacroValue(progress * 100, 0)}%
      </Typography>
    </Box>
  );

  return (
    <Card sx={{ mb: 2, borderRadius: 3, boxShadow: 'none', bgcolor: 'transparent' }}>
      <CardContent sx={{ p: 1 }}>
        <Typography variant="body1" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1, fontWeight: 600, mb: 2 }}>
          📊 Daily Nutrition Progress
        </Typography>
        
        <Box 
          sx={{ 
            display: 'grid', 
            gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(4, 1fr)' },
            gap: 2
          }}
        >
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
            target={`${MACRO_TARGETS.caloriesMin}-${MACRO_TARGETS.caloriesMax}`}
            progress={progress.calories}
            unit=""
          />
        </Box>
      </CardContent>
    </Card>
  );
};

export default MacroProgress;
