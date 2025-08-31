import React from 'react';
import { Box, Typography, useTheme } from '@mui/material';
import { GenericCard } from '../shared/cards/GenericCard';
import { NutritionData, ExternalNutrition } from '../../types/nutrition';
import { SelectedFood } from '../../types/nutrition';

// Circular Progress Ring Component
const CircularProgressRing: React.FC<{
  label: string;
  value: number;
  preview?: number;
  goal: number;
  color: string;
  size?: number;
}> = ({ label, value, preview, goal, color, size = 95 }) => {
  const safeGoal = Math.max(1, goal);
  const pct = Math.max(0, Math.min(100, (value / safeGoal) * 100));
  const hasPreview = typeof preview === 'number' && preview > value;
  const previewPct = hasPreview ? Math.max(0, Math.min(100, (preview! / safeGoal) * 100)) : pct;
  const circumference = 2 * Math.PI * (size / 2 - 4);
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (pct / 100) * circumference;
  const previewStrokeDashoffset = circumference - (previewPct / 100) * circumference;

  const tooltipText = hasPreview
    ? `Adds +${Math.round(preview! - value)}g - Will be ${Math.round(preview!)}g of ${Math.round(goal)}g`
    : `${Math.round(value)}g of ${Math.round(goal)}g`;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5 }}>
      <Box sx={{ position: 'relative', width: size, height: size }}>
        {/* Background circle */}
        <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
          <circle
            cx={size / 2}
            cy={size / 2}
            r={size / 2 - 4}
            fill="none"
            stroke="var(--bar-rail, rgba(255,255,255,0.08))"
            strokeWidth="4"
          />
          {/* Current progress circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={size / 2 - 4}
            fill="none"
            stroke={color}
            strokeWidth="4"
            strokeDasharray={strokeDasharray}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            style={{
              transition: 'stroke-dashoffset 0.5s ease',
            }}
          />
          {/* Preview delta overlay */}
          {hasPreview && (
            <circle
              cx={size / 2}
              cy={size / 2}
              r={size / 2 - 4}
              fill="none"
              stroke={color}
              strokeWidth="4"
              strokeDasharray={strokeDasharray}
              strokeDashoffset={previewStrokeDashoffset}
              strokeLinecap="round"
              opacity="0.45"
              style={{
                transition: 'stroke-dashoffset 0.5s ease',
              }}
            />
          )}
        </svg>
        {/* Center text */}
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            textAlign: 'center',
            cursor: 'pointer',
          }}
          title={tooltipText}
        >
          {hasPreview ? (
            // Preview state: show x → x+y
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <Typography
                variant="h6"
                sx={{
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  color: 'var(--text-primary)',
                  lineHeight: 1,
                }}
              >
                <span style={{ color: 'var(--text-primary)' }}>{Math.round(value)}</span>
                <span style={{ color: 'var(--accent-green)', fontSize: '0.7rem', marginLeft: '2px', opacity: 0.75 }}>
                  →{Math.round(preview!)}
                </span>
              </Typography>
              <Typography
                variant="caption"
                sx={{
                  fontSize: '0.5rem',
                  color: 'var(--text-secondary)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  mt: 0.2,
                }}
              >
                / {Math.round(goal)}
              </Typography>
            </Box>
          ) : (
            // Non-preview state: show x / max
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <Typography
                variant="h6"
                sx={{
                  fontSize: '0.9rem',
                  fontWeight: 700,
                  color: 'var(--text-primary)',
                  lineHeight: 1,
                }}
              >
                {Math.round(value)}
              </Typography>
              <Typography
                variant="caption"
                sx={{
                  fontSize: '0.6rem',
                  color: 'var(--text-secondary)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                }}
              >
                / {Math.round(goal)}
              </Typography>
            </Box>
          )}
        </Box>
      </Box>
      {/* Label */}
      <Typography
        variant="caption"
        sx={{
          color: 'var(--text-secondary)',
          fontWeight: 600,
          textAlign: 'center',
          fontSize: '0.7rem',
        }}
      >
        {label}
      </Typography>
      {/* Now → After percentage */}
      <Typography
        variant="caption"
        sx={{
          color: 'var(--text-secondary)',
          textAlign: 'center',
          fontSize: '0.65rem',
        }}
      >
        {hasPreview ? (
          <>
            <span style={{ color: 'var(--text-primary)' }}>{pct.toFixed(0)}%</span>
            <span style={{ color: 'var(--accent-green)', fontSize: '0.6rem', opacity: 0.75, marginLeft: '2px' }}>
              →{previewPct.toFixed(0)}%
            </span>
          </>
        ) : (
          `${pct.toFixed(0)}%`
        )}
      </Typography>
    </Box>
  );
};

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
}

const MacroProgress: React.FC<MacroProgressProps> = ({
  current,
  preview,
  showPreview = false,
  foodMacros,
  externalMacros,
  goals,
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
                  letterSpacing: '0.3px',
                  animation: 'previewPulse 2s ease-in-out infinite',
                  '@keyframes previewPulse': {
                    '0%, 100%': {
                      opacity: 1,
                      transform: 'scale(1)',
                    },
                    '50%': {
                      opacity: 0.8,
                      transform: 'scale(1.05)',
                    },
                  },
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
          {/* Circular Progress Rings */}
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'space-around', 
            alignItems: 'center',
            mb: 3,
            flexWrap: 'wrap',
            gap: 2
          }}>
            <CircularProgressRing 
              label="Protein" 
              value={current.protein} 
              preview={preview?.protein}
              goal={goals.protein} 
              color={'var(--macro-protein)'} 
            />
            <CircularProgressRing 
              label="Fats" 
              value={current.fats} 
              preview={preview?.fats}
              goal={goals.fats} 
              color={'var(--macro-fats)'} 
            />
            <CircularProgressRing 
              label="Carbs" 
              value={current.carbs} 
              preview={preview?.carbs}
              goal={goals.carbs} 
              color={'var(--macro-carbs)'} 
            />
            <CircularProgressRing 
              label="Calories" 
              value={current.calories} 
              preview={preview?.calories}
              goal={goals.calories} 
              color={'var(--macro-calories)'} 
            />
          </Box>
        </Box>
      }
    />
  );
};
export default MacroProgress;
