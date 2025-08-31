import React, { useState, useRef, useEffect } from 'react';
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
  const headerRef = useRef<HTMLDivElement>(null);
  
  // Store mouse position for scroll anchoring
  const [mousePosition, setMousePosition] = useState<{ x: number; y: number } | null>(null);

  const STICKY_OFFSET = 72;

  // Small helper to decide if a nudge is needed
  const nudgeIfNeeded = (el: HTMLElement, topOffset = STICKY_OFFSET) => {
    const details = el.parentElement?.querySelector('.MuiAccordionDetails-root') as HTMLElement | null;
    const est = details ? (details.scrollHeight || details.clientHeight || 0) : 320;
    const r = el.getBoundingClientRect();
    const absTop = window.scrollY + r.top;
    const predictedBottom = absTop + r.height + est;
    const viewportBottom = window.scrollY + window.innerHeight;
    const need = (predictedBottom > viewportBottom) || (r.top < topOffset);
    if (!need) return null;
    return Math.max(0, absTop - topOffset);
  };

  // Effect: trigger scroll on expand with smoother timing
  useEffect(() => {
    if (!isExpanded || !headerRef.current) return;
    const el = headerRef.current;

    // First measurement after paint with smoother timing
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const firstTarget = nudgeIfNeeded(el);
        if (firstTarget != null) {
          console.log('[ENI] first scroll to:', firstTarget);
          // Use custom easing for smoother scroll
          window.scrollTo({
            top: firstTarget,
            behavior: 'smooth'
          });
        }
        
        // Compute nudge delay from actual CSS transition with minimum smooth delay
        const details = el.parentElement?.querySelector('.MuiAccordionDetails-root') as HTMLElement | null;
        const transitionDuration = details ? parseFloat(getComputedStyle(details).transitionDuration || '0') * 1000 : 0;
        const durMs = Math.max(300, transitionDuration + 100); // Minimum 300ms for smooth feel

        setTimeout(() => {
          const nudgeTarget = nudgeIfNeeded(el);
          if (nudgeTarget != null) {
            const delta = Math.abs(window.scrollY - nudgeTarget);
            if (delta > 5) { // More sensitive alignment check
              console.log('[ENI] nudge scroll to:', nudgeTarget, 'delta:', delta);
              // Use instant scroll for nudge to avoid double animation
              window.scrollTo({
                top: nudgeTarget,
                behavior: 'auto'
              });
            } else {
              console.log('[ENI] nudge skipped, already aligned (delta:', delta, ')');
            }
          } else {
            console.log('[ENI] nudge skipped, no scroll needed');
          }
        }, durMs);
      });
    });
  }, [isExpanded]);

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
    if (event && 'clientX' in event && 'clientY' in event) {
      const me = event as React.MouseEvent;
      setMousePosition({ x: me.clientX, y: me.clientY });
    }
  };

  const hasExternalNutrition = Object.values(nutrition).some(value => value > 0);

  return (
    <Box>
      <Accordion 
        expanded={isExpanded}
        onChange={handleAccordionChange}
        className="accordion-smooth"
        sx={{ 
          mt: 2,
          background: 'var(--card-bg)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-md)',
          boxShadow: 'var(--elevation-1)',
          transition: 'var(--transition-all-normal)',
          '&:before': {
            display: 'none',
          },
          '&:hover': {
            boxShadow: 'var(--elevation-2)',
            transform: 'translateY(-1px)',
          },
          '&.Mui-expanded': {
            boxShadow: 'var(--elevation-2)',
            borderColor: 'var(--accent-green)',
            background: 'var(--meal-row-bg-hover)',
            transform: 'translateY(0)',
          }
        }}
      >
        <AccordionSummary 
          ref={headerRef}
          expandIcon={<ExpandMore sx={{ color: 'var(--text-secondary)', transition: 'var(--transition-transform-normal)' }} />}
          sx={{
            background: 'var(--meal-row-bg)',
            borderRadius: 'var(--radius-md) var(--radius-md) 0 0',
            transition: 'var(--transition-all-normal)',
            '&:hover': {
              background: 'var(--meal-row-bg-hover)',
              transform: 'translateY(-1px)',
            },
            '&.Mui-expanded': {
              background: 'var(--meal-row-bg-hover)',
              borderBottom: '1px solid var(--border-color)',
              transform: 'translateY(0)',
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
          {hasExternalNutrition && !isExpanded && (
            <Typography 
              component="span" 
              variant="body2" 
              sx={{ 
                display: 'block',
                color: 'var(--text-secondary)',
                fontWeight: 400,
                fontSize: '0.75rem',
                mt: 0.5,
                opacity: 0.8
              }}
            >
              {nutrition.protein}g P · {nutrition.fats}g F · {nutrition.carbs}g C · {nutrition.calories} cal
            </Typography>
          )}
        </Typography>
        {hasExternalNutrition && (
          <Box sx={{ ml: 'auto', mr: 2 }}>
            <AccentButton
              onClick={(e) => {
                e?.stopPropagation();
                clearAll();
              }}
              size="small"
              variant="secondary"
            >
              Clear All
            </AccentButton>
          </Box>
        )}
      </AccordionSummary>

      <AccordionDetails sx={{ 
        background: 'var(--card-bg)', 
        borderRadius: '0 0 var(--radius-md) var(--radius-md)',
        transition: 'var(--transition-all-normal)'
      }}>
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
    </Box>
  );
};

export default ExternalNutritionInput;
