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
import { Restaurant as MealIcon, FitnessCenter as WorkoutIcon, LocalDrink as WaterIcon } from '@mui/icons-material';
import { useScheduleData } from '../../hooks/useScheduleData';
import { MealCardContent } from './content/MealCardContent';
import { WorkoutCardContent } from './content/WorkoutCardContent';
import { useAuth } from '../../contexts/AuthContext';
import {
  getTodayWaterIntake,
  addWaterIntake,
  subscribeToTodayWaterIntake
} from '../../services/firebase/water/waterService';
import { WaterIntakeDocument, WATER_PRESETS } from '../../types/water';
import { ActivityData } from '../../modules/shared/types';

interface TodayScheduleStackProps {
  date?: Date;
  gymStats?: any;
  gymActivityData?: ActivityData[];
}

type ViewType = 'meal' | 'workout';

export const TodayScheduleStack: React.FC<TodayScheduleStackProps> = ({
  date,
  gymStats,
  gymActivityData
}) => {
  const { user } = useAuth();
  const theme = useTheme();
  const { scheduledTasks, mealPlan, workout, loading, mealPlanLoading, workoutLoading, error } = useScheduleData({
    date,
    autoLoadDetails: true
  });

  const [currentView, setCurrentView] = useState<ViewType>('meal');
  const [waterData, setWaterData] = useState<WaterIntakeDocument | null>(null);
  const [waterLoading, setWaterLoading] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState<number | null>(null);

  const hasMeals = scheduledTasks.some(task => task.startsWith('meal-'));
  const hasWorkout = scheduledTasks.includes('gym-workout');

  // Auto-select the first available view
  React.useEffect(() => {
    if (!loading) {
      if (hasMeals) {
        setCurrentView('meal');
      } else if (hasWorkout) {
        setCurrentView('workout');
      }
    }
  }, [hasMeals, hasWorkout, loading]);

  // Load water data
  useEffect(() => {
    if (!user) return;

    const loadData = async () => {
      try {
        const todayData = await getTodayWaterIntake(user.uid);
        setWaterData(todayData);
      } catch (error) {
        console.error('Error loading water data:', error);
      }
    };

    loadData();

    // Subscribe to real-time updates
    const unsubscribe = subscribeToTodayWaterIntake(user.uid, (data) => {
      setWaterData(data);
    });

    return () => unsubscribe();
  }, [user]);

  const handleAddWater = async (amount: number, source: string) => {
    if (!user || !waterData) return;

    setWaterLoading(true);
    try {
      await addWaterIntake(user.uid, amount, source as any);
      setSelectedPreset(amount);
      // Clear selection after animation
      setTimeout(() => setSelectedPreset(null), 500);
    } catch (error) {
      console.error('Error adding water intake:', error);
    } finally {
      setWaterLoading(false);
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
                      mb: 2,
                      flex: 1
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
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
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
              workout={workout}
              scheduledTasks={scheduledTasks}
              loading={workoutLoading}
              gymStats={gymStats}
              gymActivityData={gymActivityData}
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