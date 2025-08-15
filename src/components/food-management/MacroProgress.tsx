/**
 * FILE: MacroProgress.tsx
 * ------------------------------------------------------------------
 * PURPOSE
 * • Display real-time progress bars that compare the user's current
 * nutrient intake against their daily macro targets.
 *
 * INPUTS
 * • macros → combined totals from food + external nutrition
 *
 * BUSINESS RULES
 * • Each bar is capped at 100 % so visuals do not exceed the card width.
 * • Target values are hardcoded defaults to prevent config issues.
 *
 * UI CONSIDERATIONS
 * • Uses MUI's LinearProgress for lightweight visuals.
 * • Outputs both the numeric "X g / target g" and the progress bar,
 * catering to power users and quick-look users simultaneously.
 */

import React, { useMemo } from 'react';
import { Box, Card, CardContent, Typography, LinearProgress } from '@mui/material';
import { NutritionData } from '../../types/nutrition';
import { formatMacroValue } from '../../utils/nutritionCalculations';

// Default targets
const DEFAULT_MACRO_TARGETS = {
  protein: 125,
  fats: 61,
  carbs: 287,
  caloriesMax: 2150
};

interface MacroProgressProps {
  macros: NutritionData;  // ✅ CHANGED to single macros prop
}

const MacroProgress: React.FC<MacroProgressProps> = ({ macros }) => {  // ✅ CHANGED prop name
  // Calculate progress percentages - memoized
  const progress = useMemo(() => ({
    protein: Math.min(macros.protein / DEFAULT_MACRO_TARGETS.protein, 1.0),      // ✅ CHANGED to use macros
    fats: Math.min(macros.fats / DEFAULT_MACRO_TARGETS.fats, 1.0),              // ✅ CHANGED to use macros
    carbs: Math.min(macros.carbs / DEFAULT_MACRO_TARGETS.carbs, 1.0),           // ✅ CHANGED to use macros
    calories: Math.min(macros.calories / DEFAULT_MACRO_TARGETS.caloriesMax, 1.0) // ✅ CHANGED to use macros
  }), [macros]);                                                                 // ✅ CHANGED dependency

  const MacroCard: React.FC<{
    emoji: string;
    label: string;
    current: number;
    target: number | string;
    progress: number;
    unit: string;
  }> = ({ emoji, label, current, target, progress, unit }) => (
    <Box sx={{ mb: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
        <Typography variant="body2" fontWeight="medium">
          {emoji} {label}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {formatMacroValue(current, 0)}{unit} / {target}{unit}
        </Typography>
      </Box>
      <LinearProgress
        variant="determinate"
        value={progress * 100}
        color={progress < 0.8 ? 'error' : progress < 0.95 ? 'warning' : 'success'}
        sx={{ height: 8, borderRadius: 5 }}
      />
      <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
        {formatMacroValue(progress * 100, 0)}%
      </Typography>
    </Box>
  );

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          📊 Daily Nutrition Progress
        </Typography>

        <MacroCard
          emoji="💪"
          label="Protein"
          current={macros.protein}                    // ✅ CHANGED to use macros
          target={DEFAULT_MACRO_TARGETS.protein}
          progress={progress.protein}
          unit="g"
        />

        <MacroCard
          emoji="🥑"
          label="Fats"
          current={macros.fats}                       // ✅ CHANGED to use macros
          target={DEFAULT_MACRO_TARGETS.fats}
          progress={progress.fats}
          unit="g"
        />

        <MacroCard
          emoji="🍞"
          label="Carbs"
          current={macros.carbs}                      // ✅ CHANGED to use macros
          target={DEFAULT_MACRO_TARGETS.carbs}
          progress={progress.carbs}
          unit="g"
        />

        <MacroCard
          emoji="🔥"
          label="Calories"
          current={macros.calories}                   // ✅ CHANGED to use macros
          target={DEFAULT_MACRO_TARGETS.caloriesMax}
          progress={progress.calories}
          unit=""
        />
      </CardContent>
    </Card>
  );
};

export default MacroProgress;
