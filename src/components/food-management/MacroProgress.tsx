import React from 'react';
import { Box, Typography, useTheme } from '@mui/material';
import { GenericCard } from '../shared/cards/GenericCard';
import { NutritionData, ExternalNutrition } from '../../types/nutrition';
import SaveLoadPlan from './SaveLoadPlan';
import { SelectedFood } from '../../types/nutrition';

interface MacroProgressProps {
  current: NutritionData;
  preview?: NutritionData;
  showPreview?: boolean;
  foodMacros: NutritionData;
  externalMacros: ExternalNutrition;
  goals: {
    protein: number;
    fats: number;
    carbs: number;
    calories: number;
  };
  // Required props for SaveLoadPlan
  timeslotData: {
    [key: string]: { selectedFoods: SelectedFood[]; externalNutrition: ExternalNutrition };
  };
  onLoad: (data: { 
    [key: string]: { selectedFoods: SelectedFood[]; externalNutrition: ExternalNutrition };
  }) => void;
  favoriteFoods?: string[]; // Optional prop for favorite foods
  onSelectFavorite?: (foodName: string) => void; // Optional callback for favorite selection
  onClear?: () => void; // Optional callback to clear selected foods
  size?: 'default' | 'compact'; // Size prop for SaveLoadPlan buttons
}

const MacroProgress: React.FC<MacroProgressProps> = ({
  current,
  preview,
  showPreview = false,
  foodMacros,
  externalMacros,
  goals,
  // Required props for SaveLoadPlan
  timeslotData,
  onLoad,
  favoriteFoods = [], // Optional prop for favorite foods
  onSelectFavorite,
  onClear,
  size = 'default', // Default size
}) => {
  const theme = useTheme();

  const Bar: React.FC<{
    label: string;
    value: number;
    preview?: number;
    goal: number;
    colorVar: string;
  }> = ({ label, value, preview, goal, colorVar }) => {
    const safeGoal = Math.max(1, goal);
    const pct = Math.max(0, Math.min(100, (value / safeGoal) * 100));
    const hasPreview = typeof preview === 'number' && preview > value;
    const previewPct = hasPreview ? Math.max(0, Math.min(100, (preview! / safeGoal) * 100)) : pct;

    return (
      <Box sx={{ display: 'grid', gap: 1.25, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <Typography variant="subtitle2" sx={{ color: 'var(--text-primary)', fontWeight: 600 }}>{label}</Typography>
          <Typography variant="caption" sx={{ color: 'var(--text-secondary)' }}>
            {hasPreview ? (
              <>
                <b style={{ color: 'var(--text-primary)' }}>{Math.round(value)}</b> → <b style={{ color: 'var(--accent-green)' }}>{Math.round(preview!)}</b> / {Math.round(goal)}
              </>
            ) : (
              <>
                <b style={{ color: 'var(--text-primary)' }}>{Math.round(value)}</b> / {Math.round(goal)}
              </>
            )}
          </Typography>
        </Box>

        <Box sx={{
          position: 'relative',
          height: 'var(--bar-height, 10px)',
          borderRadius: 'var(--bar-radius, 8px)',
          backgroundColor: 'var(--bar-rail, rgba(255,255,255,0.08))',
          boxShadow: 'inset 0 1px 0 rgba(0,0,0,0.25)',
          overflow: 'hidden',
        }}>
          {/* Current fill */}
          <Box sx={{
            position: 'absolute', left: 0, top: 0, bottom: 0,
            width: `${pct}%`,
            backgroundColor: colorVar,
            borderRadius: 'var(--bar-radius, 8px)',
            transition: 'width 200ms ease',
            boxShadow: '0 0 10px rgba(0,0,0,0.0)', // no glow on base
          }} />

          {/* Preview delta overlay */}
          {hasPreview && (
            <Box sx={{
              position: 'absolute', left: `${pct}%`, top: 0, bottom: 0,
              width: `${Math.max(0, previewPct - pct)}%`,
              backgroundColor: colorVar,
              opacity: 0.45,
              borderRadius: 0,
              transition: 'width 200ms ease, left 200ms ease',
              backgroundImage: 'repeating-linear-gradient(45deg, rgba(255,255,255,0.25) 0 2px, transparent 2px 4px)',
            }} />
          )}
        </Box>

        <Typography variant="caption" sx={{ color: 'var(--text-secondary)' }}>
          {((value / safeGoal) * 100).toFixed(1)}% of daily goal
        </Typography>
      </Box>
    );
  };

  return (
    <GenericCard
      variant="summary"
      headerSlot={
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, px: 2, py: 1.5 }}>
          <Typography 
            variant="h6" 
            sx={{ 
              color: 'var(--text-primary)',
              fontWeight: 700,
              opacity: 0.94,
              position: 'relative',
              '&::before': {
                content: '""',
                position: 'absolute',
                left: 0,
                top: 0,
                bottom: 0,
                width: '3px',
                backgroundColor: 'var(--accent-green)',
                borderRadius: '2px'
              },
              paddingLeft: '12px'
            }}
          >
            Macro Progress
            {showPreview && (
              <Box
                component="span"
                sx={{
                  display: 'inline-block',
                  ml: 1,
                  px: 0.75,
                  py: 0.2,
                  backgroundColor: 'var(--accent-green)',
                  color: 'white',
                  borderRadius: '3px',
                  fontSize: '0.6rem',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.3px'
                }}
              >
                Preview
              </Box>
            )}
          </Typography>
        </Box>
      }
      content={
        <Box>
          <Bar label="Protein (g)" value={current.protein} preview={showPreview ? preview?.protein : undefined} goal={goals.protein} colorVar={'var(--macro-protein)'} />
          <Bar label="Fats (g)"    value={current.fats}    preview={showPreview ? preview?.fats : undefined}    goal={goals.fats}    colorVar={'var(--macro-fats)'} />
          <Bar label="Carbs (g)"   value={current.carbs}   preview={showPreview ? preview?.carbs : undefined}   goal={goals.carbs}   colorVar={'var(--macro-carbs)'} />
          <Bar label="Calories"    value={current.calories}preview={showPreview ? preview?.calories : undefined}goal={goals.calories} colorVar={'var(--macro-calories)'} />

          {/* Always show SaveLoadPlan */}
          <Box sx={{ mt: 3 }}>
            <SaveLoadPlan
              timeslotData={timeslotData}
              onLoad={onLoad}
              favoriteFoods={favoriteFoods}
              onSelectFavorite={onSelectFavorite}
              onClear={onClear}
              size={size}
            />
          </Box>
        </Box>
      }
    />
  );
};
export default MacroProgress;
