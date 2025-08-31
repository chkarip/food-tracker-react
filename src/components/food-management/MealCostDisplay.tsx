/**
 * FILE: MealCostDisplay.tsx
 * ------------------------------------------------------------------
 * PURPOSE
 * • Provide a clear € breakdown of the user’s planned meals, showing:
 *     – cost per timeslot (6 pm, 9 : 30 pm, …)
 *     – individual food costs inside each slot
 *     – total daily food cost chip
 *
 * DATA FLOW
 * • Receives `timeslotData` (foods already chosen) from its parent.
 * • Delegates price maths to `calculateTotalMealCost`, keeping this file
 *   presentation-only.
 *
 * UX RULES
 * • Timeslots with no foods are hidden to minimise clutter.
 * • Grand total is always visible; if zero, helper text encourages the
 *   user to add items.
 * • Colour/theme aware: uses MUI tokens so it works in both light & dark
 *   modes out of the box.
 * • Expandable to show detailed breakdown of foods and costs
 */
import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  Typography,
  Collapse,
  IconButton,
} from '@mui/material';
import { ExpandMore as ExpandMoreIcon, ExpandLess as ExpandLessIcon } from '@mui/icons-material';
import { GenericCard } from '../shared/cards/GenericCard';
import { SelectedFood } from '../../types/nutrition';
import { calculateTotalMealCost, calculatePortionCost, formatCost } from '../../services/firebase/nutrition/foodService';
import { useFoodDatabase } from '../../contexts/FoodContext';
import { scrollIntoViewSafe } from '../../utils/scrollIntoViewSafe';

interface MealCostDisplayProps {
  timeslotData: Record<string, { selectedFoods: SelectedFood[] }>;
  previewFood?: { name: string; amount: number } | null;
  currentTimeslot?: string;
}

const MealCostDisplay: React.FC<MealCostDisplayProps> = ({ timeslotData, previewFood, currentTimeslot }) => {
  const [expanded, setExpanded] = useState(false);
  const { foodDatabase } = useFoodDatabase();
  const headerRef = useRef<HTMLDivElement>(null);
  
  // Store mouse position for scroll anchoring
  const [mousePosition, setMousePosition] = useState<{ x: number; y: number } | null>(null);

  const toggleExpanded = (event?: React.MouseEvent) => {
    const newExpanded = !expanded;
    setExpanded(newExpanded);

    // Capture mouse position for scroll anchoring
    if (event) {
      setMousePosition({ x: event.clientX, y: event.clientY });
    }

    // Auto-scroll when component expands with improved timing
    if (newExpanded && headerRef.current) {
      console.log('[MCD] expanding meal cost display, triggering scroll');

      // Use double requestAnimationFrame to ensure layout is committed
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          console.log('[MCD] invoking scrollIntoViewSafe for meal cost display');
          scrollIntoViewSafe(headerRef.current!, {
            behavior: 'smooth',
            topOffset: 72, // Account for sticky navbar
            forceWindow: true // Always use window scrolling on this page
          });
        });
      });

      // Improved nudge delay with minimum smooth timing
      setTimeout(() => {
        if (headerRef.current) {
          console.log('[MCD] nudge scroll for meal cost display');
          scrollIntoViewSafe(headerRef.current!, {
            behavior: 'auto', // Use auto for nudge to avoid double animation
            topOffset: 72,
            forceWindow: true
          });
        }
      }, 350); // Slightly longer delay for smooth feel
    }
  };

  const timeslotCosts = Object.entries(timeslotData).reduce((acc, [timeslotId, data]) => {
    // ✅ Pass cached foodDatabase
    const costData = calculateTotalMealCost(data.selectedFoods, foodDatabase);
    acc[timeslotId] = costData;
    return acc;
  }, {} as Record<string, { totalCost: number; individualCosts: Record<string, number> }>);

  const totalDailyCost = Object.values(timeslotCosts).reduce((sum, costData) => sum + costData.totalCost, 0);

  // Calculate preview cost if preview food exists
  const previewCost = React.useMemo(() => {
    if (!previewFood) return 0;
    return calculatePortionCost(previewFood.name, previewFood.amount, foodDatabase) || 0;
  }, [previewFood, foodDatabase]);

  const totalDailyCostWithPreview = totalDailyCost + previewCost;

  return (
    <GenericCard
      variant="summary"
      headerSlot={
        <Box
          ref={headerRef}
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            px: 1.5,
            py: 1,
            cursor: 'pointer',
            transition: 'var(--transition-all-normal)',
            '&:hover': {
              backgroundColor: 'var(--meal-row-bg-hover)',
              transform: 'translateY(-1px)',
            }
          }}
          onClick={(event) => toggleExpanded(event)}
        >
          <Typography
            variant="subtitle1"
            sx={{
              color: 'var(--text-primary)',
              fontWeight: 700,
              opacity: 0.94,
              fontSize: '0.9rem'
            }}
          >
            Daily Cost
            {previewFood && (
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
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Typography
              variant="subtitle1"
              sx={{
                color: 'var(--text-primary)',
                fontWeight: 700,
                fontSize: '1rem'
              }}
            >
              {previewFood ? (
                <Box
                  component="span"
                  sx={{ cursor: 'pointer' }}
                  title={`Adds +${formatCost(previewCost)} - Will be ${formatCost(totalDailyCostWithPreview)} total`}
                >
                  <span style={{ color: 'var(--text-primary)' }}>{formatCost(totalDailyCost)}</span>
                  <span style={{ color: 'var(--accent-green)', fontSize: '0.8rem', marginLeft: '4px', opacity: 0.75 }}>
                    →{formatCost(totalDailyCostWithPreview)}
                  </span>
                </Box>
              ) : (
                formatCost(totalDailyCost)
              )}
            </Typography>
            <IconButton
              size="small"
              sx={{
                color: 'var(--text-secondary)',
                padding: '4px',
                transition: 'var(--transition-all-fast)',
                '&:hover': {
                  color: 'var(--text-primary)',
                  backgroundColor: 'var(--surface-bg)',
                  transform: 'scale(1.1)',
                }
              }}
            >
              {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            </IconButton>
          </Box>
        </Box>
      }
      content={
        <Collapse in={expanded} sx={{ transition: 'var(--transition-all-normal)' }}>
          <Box sx={{ pt: 0.5, px: 1 }}>
            {totalDailyCost === 0 ? (
              <Typography
                variant="body2"
                sx={{
                  color: 'var(--text-secondary)',
                  textAlign: 'center',
                  py: 1.5,
                  fontSize: '0.8rem'
                }}
              >
                Add foods to see cost breakdown
              </Typography>
            ) : (
              Object.entries(timeslotCosts).map(([timeslotId, costData]) => {
                const timeslotLabel = timeslotId === '6pm' ? '6:00 PM' : '9:30 PM';
                const timeslotFoods = timeslotData[timeslotId].selectedFoods;

                if (timeslotFoods.length === 0) return null;

                return (
                  <Box key={timeslotId} sx={{ mb: 1 }}>
                    <Typography
                      variant="subtitle2"
                      sx={{
                        color: 'var(--text-primary)',
                        fontWeight: 600,
                        mb: 0.5,
                        fontSize: '0.85rem'
                      }}
                    >
                      {timeslotLabel}
                    </Typography>

                    <Box sx={{ pl: 0.25 }}>
                      {timeslotFoods.map((food, index) => {
                        const cost = costData.individualCosts[food.name] || 0;
                        const previewCost = previewFood ? (calculatePortionCost(previewFood.name, previewFood.amount, foodDatabase) || 0) : 0;
                        const isPreviewFood = previewFood?.name === food.name;
                        const displayCost = isPreviewFood ? previewCost : cost;
                        const showPreview = previewFood && isPreviewFood;

                        return (
                          <Box
                            key={index}
                            sx={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              py: 0.25,
                              px: 0.5,
                              borderRadius: '4px',
                              backgroundColor: 'var(--meal-row-bg)',
                              mb: index < timeslotFoods.length - 1 ? 0.25 : 0,
                              transition: 'var(--transition-all-fast)',
                              '&:hover': {
                                backgroundColor: 'var(--meal-row-bg-hover)',
                                transform: 'translateX(2px)',
                              }
                            }}
                          >
                            <Box sx={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                              <Typography
                                variant="body2"
                                sx={{
                                  color: 'var(--text-primary)',
                                  fontWeight: 500,
                                  fontSize: '0.7rem'
                                }}
                              >
                                {food.name}
                              </Typography>
                              <Typography
                                variant="caption"
                                sx={{
                                  color: 'var(--text-secondary)',
                                  fontSize: '0.6rem'
                                }}
                              >
                                {food.amount}g
                              </Typography>
                            </Box>
                            <Typography
                              variant="body2"
                              sx={{
                                color: 'var(--text-primary)',
                                fontWeight: 600,
                                fontSize: '0.7rem'
                              }}
                            >
                              {showPreview ? (
                                <Box
                                  component="span"
                                  sx={{ cursor: 'pointer' }}
                                  title={`Adds +${formatCost(previewCost)} - Will be ${formatCost(displayCost)} for this food`}
                                >
                                  <span style={{ color: 'var(--text-primary)' }}>{formatCost(cost)}</span>
                                  <span style={{ color: 'var(--accent-green)', fontSize: '0.6rem', marginLeft: '2px', opacity: 0.75 }}>
                                    →{formatCost(displayCost)}
                                  </span>
                                </Box>
                              ) : (
                                formatCost(cost)
                              )}
                            </Typography>
                          </Box>
                        );
                      })}

                      <Box
                        sx={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          mt: 0.5,
                          pt: 0.5,
                          borderTop: '1px solid var(--border-color)',
                          px: 0.5,
                          transition: 'var(--transition-all-fast)',
                          '&:hover': {
                            backgroundColor: 'var(--meal-row-bg)',
                            borderRadius: '4px',
                            transform: 'scale(1.02)',
                          }
                        }}
                      >
                        <Typography
                          variant="body2"
                          sx={{
                            color: 'var(--text-primary)',
                            fontWeight: 600,
                            fontSize: '0.75rem'
                          }}
                        >
                          Subtotal
                        </Typography>
                        <Typography
                          variant="body2"
                          sx={{
                            color: 'var(--text-primary)',
                            fontWeight: 700,
                            fontSize: '0.75rem'
                          }}
                        >
                          {previewFood && timeslotId === currentTimeslot ? (
                            <Box
                              component="span"
                              sx={{ cursor: 'pointer' }}
                              title={`Adds +${formatCost(previewCost)} - Will be ${formatCost(costData.totalCost + previewCost)} for this timeslot`}
                            >
                              <span style={{ color: 'var(--text-primary)' }}>{formatCost(costData.totalCost)}</span>
                              <span style={{ color: 'var(--accent-green)', fontSize: '0.65rem', marginLeft: '2px', opacity: 0.75 }}>
                                →{formatCost(costData.totalCost + previewCost)}
                              </span>
                            </Box>
                          ) : (
                            formatCost(costData.totalCost)
                          )}
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                );
              })
            )}

            {Object.values(timeslotCosts).some(costData => costData.totalCost > 0) && (
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  mt: 1,
                  pt: 0.5,
                  borderTop: '2px solid var(--border-color)',
                  px: 0.5,
                  transition: 'var(--transition-all-normal)',
                  '&:hover': {
                    backgroundColor: 'var(--meal-row-bg)',
                    borderRadius: '6px',
                    transform: 'scale(1.01)',
                  }
                }}
              >
                <Typography
                  variant="subtitle1"
                  sx={{
                    color: 'var(--text-primary)',
                    fontWeight: 700,
                    fontSize: '0.85rem'
                  }}
                >
                  Total Daily Cost
                </Typography>
                <Typography
                  variant="h6"
                  sx={{
                    color: 'var(--text-primary)',
                    fontWeight: 700,
                    fontSize: '0.95rem'
                  }}
                >
                  {previewFood ? (
                    <Box
                      component="span"
                      sx={{ cursor: 'pointer' }}
                      title={`Adds +${formatCost(previewCost)} - Will be ${formatCost(totalDailyCostWithPreview)} total daily cost`}
                    >
                      <span style={{ color: 'var(--text-primary)' }}>{formatCost(totalDailyCost)}</span>
                      <span style={{ color: 'var(--accent-green)', fontSize: '0.8rem', marginLeft: '4px', opacity: 0.75 }}>
                        →{formatCost(totalDailyCostWithPreview)}
                      </span>
                    </Box>
                  ) : (
                    formatCost(totalDailyCost)
                  )}
                </Typography>
              </Box>
            )}
          </Box>
        </Collapse>
      }
    />
  );
};

export default MealCostDisplay;
