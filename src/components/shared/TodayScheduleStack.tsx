import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Button,
  CircularProgress,
  Typography,
  ButtonGroup,
  LinearProgress,
  alpha,
  useTheme
} from '@mui/material';
import { Restaurant as MealIcon, FitnessCenter as WorkoutIcon, LocalDrink as WaterIcon, Clear as ClearIcon } from '@mui/icons-material';
import { useScheduleData } from '../../hooks/useScheduleData';
import { MealCardContent } from './content/MealCardContent';
import { WorkoutCardContent } from './content/WorkoutCardContent';
import { useAuth } from '../../contexts/AuthContext';
import {
  getTodayWaterIntake,
  addWaterIntake,
  useTodayWaterIntake,
  clearTodayWaterIntake
} from '../../services/firebase/water/waterService';
import { 
  updateWorkoutStatus,
  updateWorkoutDetails,
  getRecentScheduledWorkouts
} from '../../services/firebase/workout/workoutService';
import { WaterIntakeDocument, WATER_PRESETS } from '../../types/water';
import { ScheduledWorkoutDocument } from '../../types/firebase';
import { ActivityData } from '../../modules/shared/types';
import { useQueryClient } from '@tanstack/react-query';
import { createTimestamp } from '../../services/firebase/shared/utils';

interface TodayScheduleStackProps {
  date?: Date;
  gymStats?: any;
  gymActivityData?: ActivityData[];
  onWorkoutStatusChange?: (workout: ScheduledWorkoutDocument) => void;
}

type ViewType = 'meal' | 'workout';

export const TodayScheduleStack: React.FC<TodayScheduleStackProps> = ({
  date,
  gymStats,
  gymActivityData,
  onWorkoutStatusChange
}) => {
  const { user } = useAuth();
  const theme = useTheme();
  const queryClient = useQueryClient();
  const { scheduledTasks, mealPlan, workout, loading, mealPlanLoading, workoutLoading, error, refresh } = useScheduleData({
    date,
    autoLoadDetails: true
  });

  const [currentView, setCurrentView] = useState<ViewType>('meal');
  const [waterData, setWaterData] = useState<WaterIntakeDocument | null>(null);
  const [waterLoading, setWaterLoading] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState<number | null>(null);
  const [workoutData, setWorkoutData] = useState<ScheduledWorkoutDocument | null>(null);
  const [workoutStatusLoading, setWorkoutStatusLoading] = useState(false);

  // Use React Query for water data instead of real-time listeners
  const { data: waterQueryData, isLoading: waterQueryLoading } = useTodayWaterIntake(user?.uid || '');

  // Sync React Query data to local state for compatibility
  useEffect(() => {
    if (waterQueryData) {
      setWaterData(waterQueryData);
    }
  }, [waterQueryData]);

  useEffect(() => {
    setWorkoutData(workout ?? null);
  }, [workout]);

  const hasMeals = scheduledTasks.some(task => task.startsWith('meal-'));
  const hasWorkout = scheduledTasks.includes('gym-workout');

  // Auto-select the first available view
  React.useEffect(() => {
    if (!loading) {
      if (hasWorkout) {
        setCurrentView('workout');
      } else if (hasMeals) {
        setCurrentView('meal');
      }
    }
  }, [hasMeals, hasWorkout, loading]);

  const handleAddWater = async (amount: number, source: string) => {
    if (!user || !waterData || waterLoading) return;

    // Store previous state for rollback
    const previousWaterData = waterData;
    
    // Set loading BEFORE optimistic update to prevent race conditions
    setWaterLoading(true);
    setSelectedPreset(amount);

    // Optimistically update the local state for instant UI feedback
    const newTotalAmount = waterData.totalAmount + amount;
    const optimisticEntry = {
      id: `temp-${Date.now()}`, // Temporary ID for optimistic update
      amount,
      timestamp: createTimestamp(),
      source: source as any
    };
    const optimisticWaterData = {
      ...waterData,
      totalAmount: newTotalAmount,
      entries: [...waterData.entries, optimisticEntry],
      goalAchieved: newTotalAmount >= waterData.targetAmount
    };
    setWaterData(optimisticWaterData);

    try {
      await addWaterIntake(user.uid, amount, source as any);

      // Add small delay to prevent race condition with Firestore
      await new Promise(resolve => setTimeout(resolve, 100));

      // Invalidate cache in background after successful API call
      queryClient.invalidateQueries({
        queryKey: ['waterIntake', user.uid, 'today']
      });
    } catch (error) {
      console.error('Error adding water intake:', error);
      // Revert optimistic update on error
      setWaterData(previousWaterData);
    } finally {
      setWaterLoading(false);
      // Clear selection after animation
      setTimeout(() => setSelectedPreset(null), 500);
    }
  };

  const handleClearWater = async () => {
    if (!user || !waterData) return;

    // If no water to clear, just return without doing anything
    if (waterData.totalAmount === 0) return;

    setWaterLoading(true);
    try {
      await clearTodayWaterIntake(user.uid);
      
      // Immediately invalidate and refetch the water data
      await queryClient.invalidateQueries({
        queryKey: ['waterIntake', user.uid, 'today']
      });
    } catch (error) {
      console.error('Error clearing water intake:', error);
    } finally {
      setWaterLoading(false);
    }
  };

  const handleWorkoutStatusChange = async (completed: boolean) => {
    if (!user || !workoutData?.id || workoutStatusLoading) return;

    const previousWorkout = workoutData;
    const nextStatus: ScheduledWorkoutDocument['status'] = completed ? 'completed' : 'scheduled';
    const optimisticWorkout: ScheduledWorkoutDocument = {
      ...previousWorkout,
      status: nextStatus,
      completedAt: completed ? createTimestamp() : null
    };

    setWorkoutData(optimisticWorkout);
    setWorkoutStatusLoading(true);

    try {
      await updateWorkoutStatus(previousWorkout.id!, nextStatus);

      onWorkoutStatusChange?.(optimisticWorkout);

      queryClient.invalidateQueries({
        queryKey: ['workout-progress', user.uid]
      });

      await refresh();
    } catch (error) {
      console.error('Error updating workout status:', error);
      setWorkoutData(previousWorkout);
    } finally {
      setWorkoutStatusLoading(false);
    }
  };

  const handleUpdateExercise = async (
    exerciseId: string, 
    updates: { kg?: number; reps?: number; rest?: number }
  ) => {
    if (!user || !workoutData?.id) return;

    const exerciseIndex = workoutData.exercises.findIndex(ex => ex.id === exerciseId);
    if (exerciseIndex === -1) return;

    // Store previous state for rollback
    const previousWorkout = workoutData;

    const updatedExercises = [...workoutData.exercises];
    updatedExercises[exerciseIndex] = {
      ...updatedExercises[exerciseIndex],
      ...updates
    };

    const optimisticWorkout = {
      ...workoutData,
      exercises: updatedExercises
    };

    setWorkoutData(optimisticWorkout);

    try {
      await updateWorkoutDetails(workoutData.id, { exercises: updatedExercises });
      await refresh();
    } catch (error) {
      console.error('Error updating exercise:', error);
      // Rollback to previous state on error
      setWorkoutData(previousWorkout);
    }
  };

  const handleSwapExercise = async (exerciseId: string, newExerciseName: string) => {
    if (!user || !workoutData?.id) return;

    // Store previous state for rollback
    const previousWorkout = workoutData;

    // Find last stats for the new exercise from history
    try {
      const recentWorkouts = await getRecentScheduledWorkouts(user.uid, 90);
      
      let lastStats = { kg: 20, reps: 10, sets: 3, rest: 90 }; // defaults
      
      for (const workout of recentWorkouts) {
        const exercise = workout.exercises?.find(ex => ex.name === newExerciseName);
        if (exercise) {
          lastStats = {
            kg: exercise.kg,
            reps: exercise.reps,
            sets: exercise.sets,
            rest: exercise.rest
          };
          break;
        }
      }

      const exerciseIndex = workoutData.exercises.findIndex(ex => ex.id === exerciseId);
      if (exerciseIndex === -1) return;

      const updatedExercises = [...workoutData.exercises];
      updatedExercises[exerciseIndex] = {
        ...updatedExercises[exerciseIndex],
        name: newExerciseName,
        ...lastStats
      };

      const optimisticWorkout = {
        ...workoutData,
        exercises: updatedExercises
      };

      setWorkoutData(optimisticWorkout);

      await updateWorkoutDetails(workoutData.id, { exercises: updatedExercises });
      await refresh();
    } catch (error) {
      console.error('Error swapping exercise:', error);
      // Rollback to previous state on error
      setWorkoutData(previousWorkout);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" py={4}>
        <CircularProgress size={24} />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 2, bgcolor: 'var(--surface-bg)', borderRadius: 1, border: '1px solid var(--border-color)' }}>
        <Typography variant="body2" sx={{ color: 'var(--error-color)' }}>
          Error loading schedule: {error}
        </Typography>
      </Box>
    );
  }

  const showToggle = hasMeals && hasWorkout;

  return (
    <Box sx={{ width: '100%' }}>
      {/* Toggle Buttons */}
      {showToggle && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
          <ButtonGroup variant="outlined" sx={{ borderRadius: 2 }}>
            <Button
              startIcon={<MealIcon />}
              variant={currentView === 'meal' ? 'contained' : 'outlined'}
              onClick={() => setCurrentView('meal')}
              sx={{
                px: 3,
                py: 1,
                borderRadius: '8px 0 0 8px',
                '&.MuiButton-contained': {
                  bgcolor: 'var(--accent-green)',
                  '&:hover': {
                    bgcolor: 'var(--accent-green-dark)'
                  }
                }
              }}
            >
              Meal Plan
            </Button>
            <Button
              startIcon={<WorkoutIcon />}
              variant={currentView === 'workout' ? 'contained' : 'outlined'}
              onClick={() => setCurrentView('workout')}
              sx={{
                px: 3,
                py: 1,
                borderRadius: '0 8px 8px 0',
                '&.MuiButton-contained': {
                  bgcolor: 'var(--accent-orange)',
                  '&:hover': {
                    bgcolor: 'var(--accent-orange-dark)'
                  }
                }
              }}
            >
              Workout
            </Button>
          </ButtonGroup>
        </Box>
      )}

      {/* Card Content */}
      <Box sx={{ position: 'relative', minHeight: 400 }}>
        {/* Meal Plan Card */}
        {hasMeals && currentView === 'meal' && (
          <Paper
            sx={{
              p: 3,
              borderRadius: 2,
              border: '1px solid var(--border-color)',
              bgcolor: 'var(--card-bg)',
              boxShadow: 'var(--elevation-1)',
              '&:hover': {
                boxShadow: 'var(--elevation-2)',
                borderColor: 'var(--accent-green)'
              }
            }}
          >
            <Box sx={{ display: 'flex', gap: 3, alignItems: 'stretch' }}>
              {/* Meal Plan Content - 70% */}
              <Box sx={{ flex: '0 0 70%', minWidth: 0 }}>
                <MealCardContent
                  mealPlan={mealPlan}
                  scheduledTasks={scheduledTasks}
                  loading={mealPlanLoading}
                />
              </Box>

              {/* Water Tracker - 30% */}
              <Box sx={{ flex: '0 0 30%', minWidth: 0 }}>
                {waterData ? (
                  <Box sx={{
                    height: '100%',
                    p: 2,
                    borderRadius: 2,
                    border: '1px solid var(--border-color)',
                    bgcolor: 'var(--surface-bg)',
                    display: 'flex',
                    flexDirection: 'column'
                  }}>
                    {/* Water Header */}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                      <WaterIcon sx={{ color: 'var(--accent-blue)', fontSize: 20 }} />
                      <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                        Water
                      </Typography>
                    </Box>

                    {/* Progress */}
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" sx={{ color: 'var(--text-secondary)', mb: 1, fontSize: '0.75rem' }}>
                        {Math.round(waterData.totalAmount)}ml / {waterData.targetAmount}ml
                      </Typography>
                      <LinearProgress
                        variant="determinate"
                        value={Math.min((waterData.totalAmount / waterData.targetAmount) * 100, 100)}
                        sx={{
                          height: 6,
                          borderRadius: 3,
                          backgroundColor: alpha(theme.palette.primary.main, 0.1),
                          '& .MuiLinearProgress-bar': {
                            backgroundColor: theme.palette.primary.main,
                            borderRadius: 3
                          }
                        }}
                      />
                    </Box>

                    {/* Mini Bottle */}
                    <Box sx={{
                      display: 'flex',
                      justifyContent: 'center',
                      mb: 0.5,
                      flex: 0.6
                    }}>
                      <Box sx={{
                        position: 'relative',
                        width: 40,
                        height: 60,
                        background: `linear-gradient(135deg, ${alpha('#E3F2FD', 0.8)} 0%, ${alpha('#BBDEFB', 0.6)} 100%)`,
                        borderRadius: '15px 15px 5px 5px',
                        border: `1px solid ${alpha(theme.palette.primary.main, 0.3)}`,
                        overflow: 'hidden'
                      }}>
                        <Box sx={{
                          position: 'absolute',
                          bottom: 0,
                          left: 0,
                          right: 0,
                          height: `${Math.min((waterData.totalAmount / waterData.targetAmount) * 100, 100)}%`,
                          background: `linear-gradient(180deg, ${alpha(theme.palette.primary.main, 0.8)} 0%, ${alpha(theme.palette.primary.main, 0.6)} 100%)`,
                          transition: 'height 0.5s ease-in-out'
                        }} />
                      </Box>
                    </Box>

                    {/* Quick Add Buttons */}
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.3, mb: 0.5 }}>
                      <Button
                        variant={selectedPreset === WATER_PRESETS.SMALL ? "contained" : "outlined"}
                        size="small"
                        onClick={() => handleAddWater(WATER_PRESETS.SMALL, 'preset-300ml')}
                        disabled={waterLoading}
                        sx={{
                          fontSize: '0.7rem',
                          py: 0.5,
                          borderRadius: 1,
                          fontWeight: 600,
                          minWidth: 'auto'
                        }}
                      >
                        +300ml
                      </Button>
                      <Button
                        variant={selectedPreset === WATER_PRESETS.MEDIUM ? "contained" : "outlined"}
                        size="small"
                        onClick={() => handleAddWater(WATER_PRESETS.MEDIUM, 'preset-700ml')}
                        disabled={waterLoading}
                        sx={{
                          fontSize: '0.7rem',
                          py: 0.5,
                          borderRadius: 1,
                          fontWeight: 600,
                          minWidth: 'auto'
                        }}
                      >
                        +700ml
                      </Button>
                      <Button
                        variant={selectedPreset === WATER_PRESETS.LARGE ? "contained" : "outlined"}
                        size="small"
                        onClick={() => handleAddWater(WATER_PRESETS.LARGE, 'preset-1L')}
                        disabled={waterLoading}
                        sx={{
                          fontSize: '0.7rem',
                          py: 0.5,
                          borderRadius: 1,
                          fontWeight: 600,
                          minWidth: 'auto'
                        }}
                      >
                        +1L
                      </Button>
                    </Box>

                    {/* Clear Button */}
                    <Box sx={{ display: 'flex', justifyContent: 'center', mt: 0.5 }}>
                      <Button
                        variant="outlined"
                        size="small"
                        startIcon={<ClearIcon sx={{ fontSize: 14 }} />}
                        onClick={handleClearWater}
                        disabled={waterLoading}
                        sx={{
                          minWidth: 70,
                          fontSize: '0.7rem',
                          py: 0.5,
                          px: 1.5,
                          borderRadius: 1,
                          fontWeight: 600,
                          borderColor: waterData.totalAmount === 0
                            ? alpha('#FF5722', 0.3)
                            : alpha('#FF5722', 0.5),
                          color: waterData.totalAmount === 0
                            ? alpha('#FF5722', 0.5)
                            : '#FF5722',
                          '&:hover': {
                            backgroundColor: waterData.totalAmount === 0
                              ? 'transparent'
                              : alpha('#FF5722', 0.1),
                            borderColor: waterData.totalAmount === 0
                              ? alpha('#FF5722', 0.3)
                              : '#FF5722',
                            transform: waterData.totalAmount === 0
                              ? 'none'
                              : 'translateY(-1px)',
                            boxShadow: waterData.totalAmount === 0
                              ? 'none'
                              : `0 2px 6px ${alpha('#FF5722', 0.3)}`
                          },
                          '&:disabled': {
                            borderColor: alpha('#FF5722', 0.3),
                            color: alpha('#FF5722', 0.3),
                            cursor: 'not-allowed'
                          }
                        }}
                      >
                        {waterData.totalAmount > 0 ? 'Clear' : 'None'}
                      </Button>
                    </Box>
                  </Box>
                ) : (
                  <Box sx={{
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    p: 2,
                    borderRadius: 2,
                    border: '1px solid var(--border-color)',
                    bgcolor: 'var(--surface-bg)'
                  }}>
                    <Typography variant="body2" sx={{ color: 'var(--text-secondary)' }}>
                      Loading water...
                    </Typography>
                  </Box>
                )}
              </Box>
            </Box>
          </Paper>
        )}

        {/* Workout Card */}
        {hasWorkout && currentView === 'workout' && (
          <Paper
            sx={{
              p: 3,
              borderRadius: 2,
              border: '1px solid var(--border-color)',
              bgcolor: 'var(--card-bg)',
              boxShadow: 'var(--elevation-1)',
              '&:hover': {
                boxShadow: 'var(--elevation-2)',
                borderColor: 'var(--accent-orange)'
              }
            }}
          >
            <WorkoutCardContent
              workout={workoutData}
              loading={workoutLoading}
              gymStats={gymStats}
              gymActivityData={gymActivityData}
              onToggleStatus={handleWorkoutStatusChange}
              statusUpdating={workoutStatusLoading}
              onUpdateExercise={handleUpdateExercise}
              onSwapExercise={handleSwapExercise}
            />
          </Paper>
        )}

        {/* No scheduled activities message */}
        {!hasMeals && !hasWorkout && (
          <Box sx={{ p: 2, bgcolor: 'var(--surface-bg)', borderRadius: 1, border: '1px solid var(--border-color)' }}>
            <Typography variant="body2" sx={{ color: 'var(--text-secondary)' }}>
              No scheduled activities for today
            </Typography>
          </Box>
        )}
      </Box>
    </Box>
  );
};