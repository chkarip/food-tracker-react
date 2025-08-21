import React from 'react';
import { Box, Typography, Paper, useTheme } from '@mui/material';
import { NutritionData, ExternalNutrition } from '../../types/nutrition';
interface MacroProgressProps {
  current: NutritionData;
  preview?: NutritionData;
  showPreview?: boolean;
  foodMacros: NutritionData;
  externalMacros: ExternalNutrition;
}

const MacroProgress: React.FC<MacroProgressProps> = ({
  current,
  preview,
  showPreview = false,
  foodMacros,
  externalMacros,
}) => {
  const theme = useTheme();
  
  // Define your macro goals
  const goals = {
    protein: 120, // grams
    fats: 60,     // grams
    carbs: 200,   // grams
    calories: 2000 // calories
  };

  const renderMacroBar = (
    label: string,
    currentValue: number,
    previewValue: number,
    goal: number,
    color: string
  ) => {
    const currentPercent = Math.min((currentValue / goal) * 100, 100);
    const previewPercent = Math.min((previewValue / goal) * 100, 100);

    return (
      <Box sx={{ mb: 2 }}>
        <Box display="flex" justifyContent="space-between" mb={1}>
          <Typography variant="body2" fontWeight="medium">
            {label}
          </Typography>
          <Typography variant="body2">
            {showPreview ? (
              <>
                <span style={{ opacity: 0.7 }}>{Math.round(currentValue)}</span>
                <span style={{ color: theme.palette.primary.main }}>
                  → {Math.round(previewValue)}
                </span>
                <span> / {goal}</span>
              </>
            ) : (
              `${Math.round(currentValue)} / ${goal}`
            )}
          </Typography>
        </Box>
        
        <Box
          sx={{
            position: 'relative',
            height: 8,
            bgcolor: 'grey.200',
            borderRadius: 1,
            overflow: 'hidden',
          }}
        >
          {/* Current progress bar */}
          <Box
            sx={{
              position: 'absolute',
              left: 0,
              top: 0,
              height: '100%',
              width: `${currentPercent}%`,
              bgcolor: color,
              transition: 'width 0.3s ease-in-out',
            }}
          />
          
          {/* Preview overlay bar */}
          {showPreview && previewValue > currentValue && (
            <Box
              sx={{
                position: 'absolute',
                left: `${currentPercent}%`,
                top: 0,
                height: '100%',
                width: `${previewPercent - currentPercent}%`,
                bgcolor: color,
                opacity: 0.4,
                transition: 'all 0.3s ease-in-out',
                '&::after': {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  background: `repeating-linear-gradient(
                    45deg,
                    transparent,
                    transparent 2px,
                    rgba(255,255,255,0.3) 2px,
                    rgba(255,255,255,0.3) 4px
                  )`,
                },
              }}
            />
          )}
        </Box>
      </Box>
    );
  };

  return (
    <Paper elevation={2} sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>
        📊 Macro Progress {showPreview && '(Preview)'}
      </Typography>
      
      {renderMacroBar(
        'Protein (g)',
        current.protein,
        preview?.protein || current.protein,
        goals.protein,
        theme.palette.success.main
      )}
      
      {renderMacroBar(
        'Fats (g)',
        current.fats,
        preview?.fats || current.fats,
        goals.fats,
        theme.palette.warning.main
      )}
      
      {renderMacroBar(
        'Carbs (g)',
        current.carbs,
        preview?.carbs || current.carbs,
        goals.carbs,
        theme.palette.info.main
      )}
      
      {renderMacroBar(
        'Calories',
        current.calories,
        preview?.calories || current.calories,
        goals.calories,
        theme.palette.primary.main
      )}
    </Paper>
  );
};
  export default MacroProgress;
