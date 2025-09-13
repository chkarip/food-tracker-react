/**
 * DayModal.tsx - Day Activity Details Modal
 * 
 * LOGIC SUMMARY:
 * - Opens when a DayCard is clicked in the calendar grid.
 * - Shows detailed plans for the selected day: meals, workouts, and other scheduled activities.
 * - Loads and displays meal ingredients, macros, workout exercises, and status in read-only mode.
 * - Integrates with scheduledActivities, mealPlans, and scheduledWorkouts for complete data.
 * - No editing; purely for review and program visibility.
 * 
 *                                 <Paper
                                  key={exercise.id}
                                  sx={{
                                    bgcolor: 'var(--surface-bg)',
                                    border: '1px solid var(--border-color)',
                                    borderRadius: 2,
                                    p: 1.5,
                                    mb: 1,
                                    transition: 'all 200ms ease',
                                    position: 'relative',
                                    '&:hover': {
                                      bgcolor: 'var(--meal-bg-card)',
                                      transform: 'translateY(-1px)',
                                      boxShadow: 'var(--elevation-1)',
                                      borderColor: 'var(--accent-orange)'
                                    },
                                    '&::before': {
                                      content: '""',
                                      position: 'absolute',
                                      inset: 0,
                                      pointerEvents: 'none',
                                      background: 'linear-gradient(135deg, rgba(255, 152, 0, 0.02), rgba(255,255,255,0.02))',
                                      opacity: 0,
                                      transition: 'opacity 200ms ease',
                                      borderRadius: 2
                                    },
                                    '&:hover::before': { opacity: 1 }
                                  }}
                                >
 * - Provides a focused, uncluttered view of daily plans and progress.
 * - Supports consistency and engagement by making all details visible on demand.
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Chip,
  Stack,
  CircularProgress,
  Paper,
  alpha,
  useTheme
} from '@mui/material';
import AccentButton from '../shared/AccentButton';
import CollapsiblePanel from '../shared/CollapsiblePanel';
import { GenericCard } from '../shared/cards/GenericCard';
import {
  Restaurant as FoodIcon,
  FitnessCenter as GymIcon,
  Close as CloseIcon,
  LocalDrink as WaterIcon
} from '@mui/icons-material';
import { CalendarDay } from '../../modules/shared/types';
import { ScheduledActivitiesDocument, MealPlanDocument, ScheduledWorkoutDocument } from '../../types/firebase';
import { loadMealPlan, loadScheduledWorkout } from '../../services/firebase';
import { getWaterIntakeForDate } from '../../services/firebase/water/waterService';
import { WaterIntakeDocument } from '../../types/water';
import { useAuth } from '../../contexts/AuthContext';

interface DayModalProps {
  selectedDay: CalendarDay | null;
  scheduledActivities: ScheduledActivitiesDocument[];
  onClose: () => void;
  onCreateMealPlan: () => void;
  onCreateWorkout: () => void;
}

const DayModal: React.FC<DayModalProps> = ({
  selectedDay,
  scheduledActivities,
  onClose,
  onCreateMealPlan,
  onCreateWorkout
}) => {
  const { user } = useAuth();
  const theme = useTheme();
  const [loading, setLoading] = useState(false);
  const [mealPlan, setMealPlan] = useState<MealPlanDocument | null>(null);
  const [scheduledWorkout, setScheduledWorkout] = useState<ScheduledWorkoutDocument | null>(null);
  const [waterIntake, setWaterIntake] = useState<WaterIntakeDocument | null>(null);

  // Load detailed data when a day is selected
  useEffect(() => {
    const loadDetailedData = async () => {
      if (!selectedDay || !user) return;
      setLoading(true);
      try {
        // Use local date format to match calendar
        const year = selectedDay.date.getFullYear();
        const month = (selectedDay.date.getMonth() + 1).toString().padStart(2, '0');
        const day = selectedDay.date.getDate().toString().padStart(2, '0');
        const localDayKey = `${year}-${month}-${day}`;

        const scheduledActivity = scheduledActivities.find(activity => activity.date === localDayKey);
        const scheduledTasks = scheduledActivity?.tasks || [];

        // Load meal plan if meals are scheduled
        if (scheduledTasks.some(task => task.startsWith('meal-'))) {
          const meal = await loadMealPlan(user.uid, selectedDay.date);
          setMealPlan(meal);
        } else {
          setMealPlan(null);
        }

        // Load workout if gym is scheduled
        if (scheduled.gym) {
          const workout = await loadScheduledWorkout(user.uid, selectedDay.date.toISOString().split('T')[0]);
          setScheduledWorkout(workout);
        }

        // Load water intake for the day
        const water = await getWaterIntakeForDate(user.uid, selectedDay.date);
        setWaterIntake(water);

      } catch (error) {
        console.error('Error loading detailed data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadDetailedData();
  }, [selectedDay, scheduledActivities, user]);

  if (!selectedDay) return null;

  const dayKey = selectedDay.date.toISOString().split('T')[0];

  // Use local date format to match calendar
  const year = selectedDay.date.getFullYear();
  const month = (selectedDay.date.getMonth() + 1).toString().padStart(2, '0');
  const day = selectedDay.date.getDate().toString().padStart(2, '0');
  const localDayKey = `${year}-${month}-${day}`;

  const scheduledActivity = scheduledActivities.find(activity => activity.date === localDayKey);

  // Get scheduled tasks or default to empty array
  const scheduledTasks = scheduledActivity?.tasks || [];

  // Create convenience flags for easier checking
  const scheduled = {
    'meal-6pm': scheduledTasks.includes('meal-6pm'),
    'meal-9:30pm': scheduledTasks.includes('meal-9:30pm'),
    'gym': scheduledTasks.includes('gym-workout') // Fix: check for 'gym-workout' task
  };

  return (
    <Dialog open={!!selectedDay} onClose={onClose} fullWidth maxWidth="sm">
      <style>
        {`
          @keyframes slideIn {
            from {
              opacity: 0;
              transform: translateY(-10px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
          @keyframes fadeInScale {
            from {
              opacity: 0;
              transform: scale(0.95);
            }
            to {
              opacity: 1;
              transform: scale(1);
            }
          }
          @keyframes shimmer {
            0% { background-position: -200% 0; }
            100% { background-position: 200% 0; }
          }
        `}
      </style>
      <DialogTitle>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box>
            <Typography variant="h6">
              {selectedDay.date.toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </Typography>
          </Box>

          <IconButton onClick={onClose} size="small" aria-label="Close">
            <CloseIcon />
          </IconButton>
        </Box>

        <Typography variant="body2" color="text.secondary">
          {(() => {
            const scheduledCount = Object.values(scheduled).filter(Boolean).length;
            return scheduledCount > 0
              ? `${scheduledCount} task${scheduledCount > 1 ? 's' : ''} scheduled`
              : 'No tasks scheduled';
          })()}
        </Typography>
      </DialogTitle>

      <DialogContent dividers sx={{
        p: 3,
        background: 'linear-gradient(135deg, var(--meal-bg-card) 0%, rgba(255,255,255,0.5) 100%)',
        borderRadius: 3,
        minHeight: '60vh',
        position: 'relative',
        '&::before': {
          content: '""',
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          background: 'linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0.02))',
          opacity: 0,
          transition: 'opacity 200ms ease',
          borderRadius: 3
        },
        '&:hover::before': { opacity: 1 }
      }}>
        {loading && (
          <Box display="flex" justifyContent="center" py={4}>
            <CircularProgress size={24} />
          </Box>
        )}

        {/* Responsive two-column layout for Food and Gym */}
        <Box
          sx={{
            display: 'flex',
            gap: { xs: 2.5, md: 4 },
            flexDirection: { xs: 'column', md: 'row' },
            alignItems: 'start'
          }}
        >
          {/* Food Program Section */}
          {(scheduled['meal-6pm'] || scheduled['meal-9:30pm']) && (
            <Box
              sx={{
                flexBasis: { xs: '100%', md: '60%' },
                minWidth: 0
              }}
            >
              <GenericCard
                title="Food Program"
                variant="recipe"
                size="md"
                sx={{
                  height: 'fit-content',
                  '& .MuiCardContent-root': {
                    p: 0
                  },
                  transition: 'all 200ms ease',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: 'var(--elevation-2)'
                  }
                }}
                content={
                  <Box sx={{ p: 0 }}>
                    {/* Show meal plan details if available */}
                    {mealPlan && (
                      <Box sx={{ p: 0 }}>
                        {/* 6PM Meal */}
                        {scheduled['meal-6pm'] && mealPlan.timeslots['6pm'] && (
                          <Box sx={{
                            p: 2.5,
                            borderBottom: '1px solid',
                            borderColor: 'divider',
                            animation: 'slideIn 0.3s ease-out',
                            position: 'relative'
                          }}>
                            <Typography variant="subtitle1" gutterBottom sx={{ 
                              fontWeight: 600, 
                              color: 'var(--accent-green)',
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
                            }}>
                              6:00 PM Meal
                            </Typography>
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                              {mealPlan.timeslots['6pm'].selectedFoods.map((food, idx) => (
                                <Box
                                  key={idx}
                                  sx={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    p: 1.5,
                                    bgcolor: 'var(--surface-bg)',
                                    borderRadius: 2,
                                    border: '1px solid var(--border-color)',
                                    transition: 'all 200ms ease',
                                    position: 'relative',
                                    '&:hover': {
                                      bgcolor: 'var(--meal-bg-card)',
                                      transform: 'translateY(-1px)',
                                      boxShadow: 'var(--elevation-1)',
                                      borderColor: 'var(--accent-green)'
                                    },
                                    '&::before': {
                                      content: '""',
                                      position: 'absolute',
                                      inset: 0,
                                      pointerEvents: 'none',
                                      background: 'linear-gradient(135deg, rgba(59, 186, 117, 0.02), rgba(255,255,255,0.02))',
                                      opacity: 0,
                                      transition: 'opacity 200ms ease',
                                      borderRadius: 2
                                    },
                                    '&:hover::before': { opacity: 1 }
                                  }}
                                >
                                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                    {food.name}
                                  </Typography>
                                  <Typography variant="body2" sx={{ fontWeight: 600, color: 'var(--accent-green)' }}>
                                    {food.amount}g
                                  </Typography>
                                </Box>
                              ))}
                            </Box>

                            {mealPlan.timeslots['6pm'].externalNutrition.calories > 0 && (
                              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                                + External: {mealPlan.timeslots['6pm'].externalNutrition.calories} cal
                              </Typography>
                            )}
                          </Box>
                        )}

                        {/* 9:30PM Meal */}
                        {scheduled['meal-9:30pm'] && mealPlan.timeslots['9:30pm'] && (
                          <Box sx={{
                            p: 2.5,
                            borderBottom: scheduled['meal-6pm'] && mealPlan.timeslots['6pm'] ? '1px solid' : 'none',
                            borderColor: 'divider',
                            animation: 'slideIn 0.4s ease-out',
                            position: 'relative'
                          }}>
                            <Typography variant="subtitle1" gutterBottom sx={{ 
                              fontWeight: 600, 
                              color: 'var(--accent-green)',
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
                            }}>
                              9:30 PM Meal
                            </Typography>
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                              {mealPlan.timeslots['9:30pm'].selectedFoods.map((food, idx) => (
                                <Box
                                  key={idx}
                                  sx={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    p: 1.5,
                                    bgcolor: 'var(--surface-bg)',
                                    borderRadius: 2,
                                    border: '1px solid var(--border-color)',
                                    transition: 'all 200ms ease',
                                    position: 'relative',
                                    '&:hover': {
                                      bgcolor: 'var(--meal-bg-card)',
                                      transform: 'translateY(-1px)',
                                      boxShadow: 'var(--elevation-1)',
                                      borderColor: 'var(--accent-green)'
                                    },
                                    '&::before': {
                                      content: '""',
                                      position: 'absolute',
                                      inset: 0,
                                      pointerEvents: 'none',
                                      background: 'linear-gradient(135deg, rgba(59, 186, 117, 0.02), rgba(255,255,255,0.02))',
                                      opacity: 0,
                                      transition: 'opacity 200ms ease',
                                      borderRadius: 2
                                    },
                                    '&:hover::before': { opacity: 1 }
                                  }}
                                >
                                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                    {food.name}
                                  </Typography>
                                  <Typography variant="body2" sx={{ fontWeight: 600, color: 'var(--accent-green)' }}>
                                    {food.amount}g
                                  </Typography>
                                </Box>
                              ))}
                            </Box>

                            {mealPlan.timeslots['9:30pm'].externalNutrition.calories > 0 && (
                              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                                + External: {mealPlan.timeslots['9:30pm'].externalNutrition.calories} cal
                              </Typography>
                            )}
                          </Box>
                        )}
                      </Box>
                    )}

                    {/* Total Macros */}
                    {mealPlan?.totalMacros && (
                      <Box sx={{ 
                        p: 2.5, 
                        bgcolor: 'var(--surface-bg)', 
                        borderTop: '1px solid var(--border-color)',
                        borderRadius: 2,
                        mt: 1,
                        position: 'relative',
                        transition: 'all 200ms ease',
                        '&:hover': {
                          bgcolor: 'var(--meal-bg-card)',
                          transform: 'translateY(-1px)',
                          boxShadow: 'var(--elevation-1)'
                        },
                        '&::before': {
                          content: '""',
                          position: 'absolute',
                          inset: 0,
                          pointerEvents: 'none',
                          background: 'linear-gradient(135deg, rgba(59, 186, 117, 0.02), rgba(255,255,255,0.02))',
                          opacity: 0,
                          transition: 'opacity 200ms ease',
                          borderRadius: 2
                        },
                        '&:hover::before': { opacity: 1 }
                      }}>
                        <Typography variant="subtitle1" gutterBottom sx={{ 
                          fontWeight: 600, 
                          color: 'var(--text-primary)',
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
                          paddingLeft: '12px',
                          mb: 2
                        }}>
                          Total Macros
                        </Typography>
                        <Box sx={{ 
                          display: 'grid', 
                          gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, 
                          gap: 1.5,
                          pl: '12px'
                        }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <Typography variant="body2" sx={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                              Protein:
                            </Typography>
                            <Typography variant="body2" sx={{ fontWeight: 700, color: 'var(--accent-green)' }}>
                              {Math.round(mealPlan.totalMacros.protein)}g
                            </Typography>
                          </Box>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <Typography variant="body2" sx={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                              Fats:
                            </Typography>
                            <Typography variant="body2" sx={{ fontWeight: 700, color: 'var(--accent-orange)' }}>
                              {Math.round(mealPlan.totalMacros.fats)}g
                            </Typography>
                          </Box>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <Typography variant="body2" sx={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                              Carbs:
                            </Typography>
                            <Typography variant="body2" sx={{ fontWeight: 700, color: 'var(--accent-blue)' }}>
                              {Math.round(mealPlan.totalMacros.carbs)}g
                            </Typography>
                          </Box>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <Typography variant="body2" sx={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                              Calories:
                            </Typography>
                            <Typography variant="body2" sx={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                              {Math.round(mealPlan.totalMacros.calories)}
                            </Typography>
                          </Box>
                        </Box>
                      </Box>
                    )}
                  </Box>
                }
              />
            </Box>
          )}

          {/* Gym Program Section */}
          {scheduled.gym && (
            <Box
              sx={{
                flexBasis: { xs: '100%', md: '40%' },
                minWidth: 0,
                maxHeight: { md: 560, lg: 680 },
                overflowY: 'auto',
                pr: 0.5
              }}
            >
              <GenericCard
                title="Gym Workout"
                variant="exercise"
                size="md"
                sx={{
                  height: 'fit-content',
                  mb: 2,
                  '& .MuiCardContent-root': {
                    p: 0
                  },
                  transition: 'all 200ms ease',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: 'var(--elevation-2)'
                  }
                }}
                content={
                  <Box sx={{ p: 0 }}>
                    {/* Show workout details if available */}
                    {scheduledWorkout && (
                      <Box sx={{ p: 0 }}>
                        {/* Workout Header */}
                        <Box sx={{
                          p: 2.5,
                          borderBottom: '1px solid',
                          borderColor: 'divider',
                          animation: 'slideIn 0.3s ease-out',
                          position: 'relative'
                        }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                            <Typography variant="h6" sx={{ fontWeight: 600 }}>
                              {scheduledWorkout.name}
                            </Typography>
                            <Chip
                              label={scheduledWorkout.status}
                              color={scheduledWorkout.status === 'completed' ? 'success' : 'default'}
                              size="small"
                              sx={{ fontWeight: 600 }}
                            />
                          </Box>
                          <Typography variant="subtitle2" sx={{ color: 'text.secondary', fontWeight: 500 }}>
                            {scheduledWorkout.exercises.length} Exercise{scheduledWorkout.exercises.length !== 1 ? 's' : ''}
                          </Typography>
                        </Box>

                        {/* Exercises Grid - Show ALL exercises */}
                        <Box sx={{
                          p: 2.5,
                          animation: 'slideIn 0.4s ease-out',
                          position: 'relative'
                        }}>
                          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                            {scheduledWorkout.exercises
                              .sort((a, b) => a.order - b.order)
                              .map((exercise) => (
                                <Paper
                                  key={exercise.id}
                                  sx={{
                                    bgcolor: 'var(--surface-bg)',
                                    border: '1px solid var(--border-color)',
                                    borderRadius: 2,
                                    p: 1.5,
                                    mb: 1,
                                    transition: 'all 200ms ease',
                                    '&:hover': {
                                      bgcolor: 'var(--meal-bg-card)',
                                      transform: 'translateY(-1px)',
                                      boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
                                    }
                                  }}
                                >
                                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                    {exercise.name}
                                  </Typography>
                                  <Typography variant="caption" color="text.secondary">
                                    {exercise.kg}kg • {exercise.sets} sets × {exercise.reps} reps
                                  </Typography>

                                  {exercise.notes && (
                                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                                      {exercise.notes}
                                    </Typography>
                                  )}
                                </Paper>
                              ))}
                          </Box>
                        </Box>

                        {/* Workout Notes */}
                        {scheduledWorkout.notes && (
                          <Box sx={{
                            p: 2.5,
                            bgcolor: 'var(--surface-bg)',
                            borderTop: '1px solid var(--border-color)',
                            borderRadius: 2,
                            position: 'relative',
                            transition: 'all 200ms ease',
                            '&:hover': {
                              bgcolor: 'var(--meal-bg-card)',
                              transform: 'translateY(-1px)',
                              boxShadow: 'var(--elevation-1)'
                            },
                            '&::before': {
                              content: '""',
                              position: 'absolute',
                              inset: 0,
                              pointerEvents: 'none',
                              background: 'linear-gradient(135deg, rgba(255, 152, 0, 0.02), rgba(255,255,255,0.02))',
                              opacity: 0,
                              transition: 'opacity 200ms ease',
                              borderRadius: 2
                            },
                            '&:hover::before': { opacity: 1 }
                          }}>
                            <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 600 }}>
                              Workout Notes
                            </Typography>
                            <Typography variant="body2" sx={{ lineHeight: 1.5 }}>
                              {scheduledWorkout.notes}
                            </Typography>
                          </Box>
                        )}
                      </Box>
                    )}
                  </Box>
                }
              />
            </Box>
          )}

          {/* Water Intake Section */}
          {waterIntake && waterIntake.totalAmount > 0 && (
            <Box
              sx={{
                flexBasis: { xs: '100%', md: '30%' },
                minWidth: 0
              }}
            >
              <GenericCard
                title="Water Intake"
                variant="default"
                size="md"
                sx={{
                  height: 'fit-content',
                  '& .MuiCardContent-root': {
                    p: 0
                  },
                  transition: 'all 200ms ease',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: 'var(--elevation-2)'
                  }
                }}
                content={
                  <Box sx={{ p: 2.5 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                      <WaterIcon sx={{ color: waterIntake.goalAchieved ? '#4CAF50' : '#2196F3' }} />
                      <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        {waterIntake.totalAmount}ml / {waterIntake.targetAmount}ml
                      </Typography>
                      {waterIntake.goalAchieved && (
                        <Chip
                          label="Goal Met"
                          color="success"
                          size="small"
                          sx={{ fontWeight: 600 }}
                        />
                      )}
                    </Box>

                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      {waterIntake.entries.length} intake{waterIntake.entries.length !== 1 ? 's' : ''} logged
                    </Typography>

                    {/* Show recent entries */}
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                      {waterIntake.entries.slice(-3).map((entry, idx) => (
                        <Box
                          key={entry.id}
                          sx={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            p: 1,
                            bgcolor: 'var(--surface-bg)',
                            borderRadius: 1,
                            border: '1px solid var(--border-color)'
                          }}
                        >
                          <Typography variant="body2">
                            +{entry.amount}ml
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {entry.timestamp.toDate().toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </Typography>
                        </Box>
                      ))}
                    </Box>

                    {waterIntake.streakCount > 0 && (
                      <Box sx={{ mt: 2, p: 1.5, bgcolor: 'var(--accent-blue)', borderRadius: 1 }}>
                        <Typography variant="body2" sx={{ fontWeight: 600, color: 'white' }}>
                          🔥 {waterIntake.streakCount} day streak
                        </Typography>
                      </Box>
                    )}
                  </Box>
                }
              />
            </Box>
          )}
        </Box>
      </DialogContent>

      <DialogActions sx={{
        p: 3,
        bgcolor: 'var(--surface-bg)',
        borderTop: '1px solid var(--border-color)',
        position: 'relative',
        '&::before': {
          content: '""',
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          background: 'linear-gradient(135deg, rgba(59, 186, 117, 0.02), rgba(255,255,255,0.02))',
          opacity: 0,
          transition: 'opacity 200ms ease'
        },
        '&:hover::before': { opacity: 1 }
      }}>
        <Stack direction="row" spacing={2} sx={{ width: '100%', justifyContent: 'center' }}>
          <Box sx={{
            flex: 1,
            transition: 'all 300ms cubic-bezier(0.4, 0, 0.2, 1)',
            '&:hover': {
              transform: 'translateY(-3px) scale(1.02)'
            },
            '& .MuiButton-root': {
              boxShadow: 'var(--elevation-2)',
              background: scheduled['meal-6pm'] || scheduled['meal-9:30pm']
                ? 'linear-gradient(135deg, var(--accent-green) 0%, rgba(59, 186, 117, 0.8) 100%)'
                : 'linear-gradient(135deg, var(--surface-bg) 0%, rgba(255,255,255,0.1) 100%)',
              border: '1px solid var(--border-color)',
              color: scheduled['meal-6pm'] || scheduled['meal-9:30pm'] ? 'white' : 'var(--text-primary)',
              fontWeight: 600,
              fontSize: '0.9rem',
              py: 1.5,
              px: 2,
              borderRadius: 2,
              position: 'relative',
              overflow: 'hidden',
              '&::before': {
                content: '""',
                position: 'absolute',
                inset: 0,
                background: scheduled['meal-6pm'] || scheduled['meal-9:30pm']
                  ? 'linear-gradient(135deg, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0.05) 100%)'
                  : 'linear-gradient(135deg, rgba(59, 186, 117, 0.1) 0%, rgba(59, 186, 117, 0.05) 100%)',
                opacity: 0,
                transition: 'opacity 300ms ease'
              },
              '&:hover::before': { opacity: 1 },
              '&:hover': {
                boxShadow: 'var(--elevation-3)',
                borderColor: 'var(--accent-green)',
                color: scheduled['meal-6pm'] || scheduled['meal-9:30pm'] ? 'white' : 'var(--accent-green)'
              }
            }
          }}>
            <AccentButton onClick={onCreateMealPlan} size="small" variant="secondary">
              {scheduled['meal-6pm'] || scheduled['meal-9:30pm'] ? 'Edit Meal Plan' : 'Create Meal Plan'}
            </AccentButton>
          </Box>
          <Box sx={{
            flex: 1,
            transition: 'all 300ms cubic-bezier(0.4, 0, 0.2, 1)',
            '&:hover': {
              transform: 'translateY(-3px) scale(1.02)'
            },
            '& .MuiButton-root': {
              boxShadow: 'var(--elevation-2)',
              background: scheduled.gym
                ? 'linear-gradient(135deg, var(--accent-orange) 0%, rgba(255, 152, 0, 0.8) 100%)'
                : 'linear-gradient(135deg, var(--surface-bg) 0%, rgba(255,255,255,0.1) 100%)',
              border: '1px solid var(--border-color)',
              color: scheduled.gym ? 'white' : 'var(--text-primary)',
              fontWeight: 600,
              fontSize: '0.9rem',
              py: 1.5,
              px: 2,
              borderRadius: 2,
              position: 'relative',
              overflow: 'hidden',
              '&::before': {
                content: '""',
                position: 'absolute',
                inset: 0,
                background: scheduled.gym
                  ? 'linear-gradient(135deg, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0.05) 100%)'
                  : 'linear-gradient(135deg, rgba(255, 152, 0, 0.1) 0%, rgba(255, 152, 0, 0.05) 100%)',
                opacity: 0,
                transition: 'opacity 300ms ease'
              },
              '&:hover::before': { opacity: 1 },
              '&:hover': {
                boxShadow: 'var(--elevation-3)',
                borderColor: 'var(--accent-orange)',
                color: scheduled.gym ? 'white' : 'var(--accent-orange)'
              }
            }
          }}>
            <AccentButton onClick={onCreateWorkout} size="small" variant="secondary">
              {scheduled.gym ? 'Edit Workout' : 'Create Workout'}
            </AccentButton>
          </Box>
          <Box sx={{
            flex: 1,
            transition: 'all 300ms cubic-bezier(0.4, 0, 0.2, 1)',
            '&:hover': {
              transform: 'translateY(-3px) scale(1.02)'
            },
            '& .MuiButton-root': {
              boxShadow: 'var(--elevation-2)',
              background: 'linear-gradient(135deg, var(--surface-bg) 0%, rgba(255,255,255,0.1) 100%)',
              border: '1px solid var(--border-color)',
              color: 'var(--text-primary)',
              fontWeight: 600,
              fontSize: '0.9rem',
              py: 1.5,
              px: 2,
              borderRadius: 2,
              position: 'relative',
              overflow: 'hidden',
              '&::before': {
                content: '""',
                position: 'absolute',
                inset: 0,
                background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)',
                opacity: 0,
                transition: 'opacity 300ms ease'
              },
              '&:hover::before': { opacity: 1 },
              '&:hover': {
                boxShadow: 'var(--elevation-3)',
                borderColor: 'var(--text-secondary)',
                color: 'var(--text-secondary)'
              }
            }
          }}>
            <AccentButton onClick={onClose} size="small">
              Close
            </AccentButton>
          </Box>
        </Stack>
      </DialogActions>
    </Dialog>
  );
};

export default DayModal;
