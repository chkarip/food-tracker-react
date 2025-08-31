/**
 * FILE: CategoryAccordion.tsx
 * ------------------------------------------------------------------
 * PURPOSE
 * • Render one expandable / collapsible block per food-category inside
 *   the Meal-Plan UI.
 *
 * KEY FEATURES
 * • Shows all foods that belong to a given category for the *current*
 *   timeslot.
 * • Displays a kcal-total badge in the accordion header (auto-updates).
 * • Lets the user edit amount, swap between timeslots, or remove items
 *   via callbacks supplied by the parent.
 *
 * PROPS
 *   category       { id:string; name:string }
 *   foods          SelectedFood[]         ← current timeslot only
 *   onUpdateAmount (idx:number, amount:number) → void
 *   onRemove       (idx:number) → void
 *   onSwap?        (idx:number) → void    (optional)
 *
 * INTERNAL DATA
 * • Pulls the global `foodDatabase` from FoodContext to calculate
 *   macros and determine “unit” vs “g”.
 *
 * EXTENSIBILITY
 * • If categories later gain icon / colour / order fields, you can show
 *   them in <AccordionSummary>.
 * • To switch the badge from kcal to protein/cost, change the reducer
 *   in `kcalTotal`.
 */

import React, { useMemo, useState, useRef, useEffect } from 'react';
import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Typography,
  Stack,
  Chip,
  IconButton,
  Box,
} from '@mui/material';
import {NumberStepper}  from '../shared/inputs';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import SwapIcon from '@mui/icons-material/SwapHoriz';
import DeleteIcon from '@mui/icons-material/Delete';

import { SelectedFood } from '../../types/nutrition';
import { calculateTotalMacros } from '../../utils/nutritionCalculations';
import { useFoodDatabase } from '../../contexts/FoodContext';
import { scrollIntoViewSafe } from '../../utils/scrollIntoViewSafe';

/* ---------- local types ---------- */
interface Category {
  id: string;
  name: string;
}

interface Props {
  category: Category;
  foods: SelectedFood[];
  onUpdateAmount: (foodIdx: number, amount: number) => void;
  onRemove: (foodIdx: number) => void;
  onSwap?: (foodIdx: number) => void;
}

const CategoryAccordion: React.FC<Props> = ({
  category,
  foods,
  onUpdateAmount,
  onRemove,
  onSwap,
}) => {
const { foodDatabase } = useFoodDatabase();

  /* default-expand if it contains foods */
  const [open, setOpen] = useState<boolean>(foods.length > 0);
  const headerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll when accordion expands
  useEffect(() => {
    if (open && headerRef.current) {
      console.log('[CA] expanding category accordion, triggering scroll');

      // Use improved timing with double requestAnimationFrame
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          console.log('[CA] invoking scrollIntoViewSafe for category accordion');
          scrollIntoViewSafe(headerRef.current!, {
            behavior: 'smooth',
            topOffset: 72, // Account for sticky header
            forceWindow: true // Always use window scrolling on this page
          });

          // Additional nudge after CSS transition completes
          setTimeout(() => {
            if (headerRef.current) {
              console.log('[CA] 250ms nudge scroll for category accordion');
              scrollIntoViewSafe(headerRef.current, {
                behavior: 'smooth',
                topOffset: 72,
                forceWindow: true
              });
            }
          }, 250);
        });
      });
    }
  }, [open]);

  /* kcal badge */
  const kcalTotal = useMemo(() => {
    return foods.reduce((sum, f) => {
      const m = calculateTotalMacros([f], foodDatabase);
      return sum + m.calories;
    }, 0);
  }, [foods, foodDatabase]);

  /* helper */
  const getFoodUnit = (name: string) =>
    foodDatabase[name]?.isUnitFood ? 'units' : 'g';

  /* ---------- render ---------- */
  return (
    <Box sx={{ 
      backgroundColor: 'var(--surface-bg)',
      borderRadius: 2,
      border: '1px solid var(--border-color)',
      overflow: 'hidden',
      mb: 2
    }}>
      <Box 
        ref={headerRef}
        onClick={() => setOpen(!open)}
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          p: 2,
          cursor: 'pointer',
          backgroundColor: 'var(--meal-bg-primary)',
          borderBottom: open ? '1px solid var(--border-color)' : 'none',
          transition: 'all 200ms ease',
          '&:hover': {
            backgroundColor: 'var(--meal-row-bg)'
          }
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Typography 
            variant="subtitle1" 
            sx={{ 
              color: 'var(--text-primary)', 
              fontWeight: 600,
              position: 'relative',
              '&::before': {
                content: '""',
                position: 'absolute',
                left: 0,
                top: 0,
                bottom: 0,
                width: '3px',
                backgroundColor: 'var(--accent-blue)',
                borderRadius: '2px'
              },
              paddingLeft: '12px'
            }}
          >
            {category.name}
          </Typography>
          <Chip
            label={`${Math.round(kcalTotal)} kcal`}
            size="small"
            sx={{ 
              backgroundColor: 'var(--accent-green)',
              color: 'white',
              fontWeight: 600,
              fontSize: '0.75rem'
            }}
          />
        </Box>
        
        <Box sx={{
          transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
          transition: 'transform 200ms ease',
          color: 'var(--text-secondary)'
        }}>
          <ExpandMoreIcon />
        </Box>
      </Box>

      {open && (
        <Box sx={{ p: 2 }}>
          {foods.length === 0 ? (
            <Box sx={{ 
              textAlign: 'center', 
              py: 4,
              backgroundColor: 'var(--meal-row-bg)',
              borderRadius: 2,
              border: '2px dashed var(--border-color)'
            }}>
              <Typography variant="body2" sx={{ color: 'var(--text-secondary)' }}>
                No foods in this category yet
              </Typography>
            </Box>
          ) : (
            <Stack spacing={1.5}>
              {foods.map((food, idx) => {
                const macros = calculateTotalMacros([food], foodDatabase);

                return (
                  <Box
                    key={idx}
                    sx={{
                      backgroundColor: 'var(--meal-row-bg)',
                      borderRadius: 2,
                      border: '1px solid var(--border-color)',
                      p: 2,
                      transition: 'all 200ms ease',
                      '&:hover': {
                        backgroundColor: 'var(--surface-bg)',
                        transform: 'translateY(-1px)',
                        boxShadow: 'var(--elevation-1)'
                      }
                    }}
                  >
                    <Stack
                      direction="row"
                      spacing={2}
                      alignItems="center"
                      sx={{ flexWrap: 'wrap', gap: 1 }}
                    >
                      {/* Food name and amount */}
                      <Box sx={{ flex: 1, minWidth: 150 }}>
                        <Typography 
                          variant="body1" 
                          sx={{ 
                            fontWeight: 600, 
                            color: 'var(--text-primary)',
                            mb: 0.5
                          }}
                        >
                          {food.name}
                        </Typography>
                        <Typography 
                          variant="body2" 
                          sx={{ 
                            color: 'var(--text-secondary)',
                            fontSize: '0.8rem'
                          }}
                        >
                          {food.amount} {getFoodUnit(food.name)}
                        </Typography>
                      </Box>

                      {/* Amount editor */}
                      <Box sx={{ minWidth: 120 }}>
                        <NumberStepper
                          value={food.amount}
                          onChange={(value) => onUpdateAmount(idx, value)}
                          min={0}
                          max={10000}
                          step={getFoodUnit(food.name) === 'units' ? 1 : 5}
                          unit={getFoodUnit(food.name)}
                          size="small"
                        />
                      </Box>

                      {/* Macros display */}
                      <Box sx={{ 
                        backgroundColor: 'var(--meal-chip-bg)',
                        borderRadius: 2,
                        border: '1px solid var(--meal-chip-outline)',
                        px: 2,
                        py: 1,
                        minWidth: 120
                      }}>
                        <Typography
                          variant="body2"
                          sx={{ 
                            color: 'var(--text-primary)',
                            fontWeight: 600,
                            fontSize: '0.8rem',
                            textAlign: 'center'
                          }}
                        >
                          {Math.round(macros.calories)} kcal
                        </Typography>
                      </Box>

                      {/* Action buttons */}
                      <Stack direction="row" spacing={1}>
                        {onSwap && (
                          <IconButton
                            size="small"
                            onClick={() => onSwap(idx)}
                            title="Swap timeslot"
                            sx={{
                              color: 'var(--accent-blue)',
                              backgroundColor: 'var(--surface-bg)',
                              border: '1px solid var(--border-color)',
                              '&:hover': {
                                backgroundColor: 'var(--accent-blue-light)',
                                transform: 'scale(1.1)'
                              },
                              transition: 'all 200ms ease'
                            }}
                          >
                            <SwapIcon fontSize="small" />
                          </IconButton>
                        )}

                        <IconButton
                          size="small"
                          onClick={() => onRemove(idx)}
                          title="Remove"
                          sx={{
                            color: 'var(--error-color)',
                            backgroundColor: 'var(--surface-bg)',
                            border: '1px solid var(--border-color)',
                            '&:hover': {
                              backgroundColor: 'var(--error-color-light)',
                              transform: 'scale(1.1)'
                            },
                            transition: 'all 200ms ease'
                          }}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Stack>
                    </Stack>
                  </Box>
                );
              })}
            </Stack>
          )}
        </Box>
      )}
    </Box>
  );
};

export default CategoryAccordion;
