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
 * BUSINESS VALUE:
 * - Provides a focused, uncluttered view of daily plans and progress.
 * - Supports consistency and engagement by making all details visible on demand.
 */
import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Chip,
  alpha,
  Stack,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  CircularProgress,
  Divider
} from '@mui/material';
import {
  Restaurant as FoodIcon,
  FitnessCenter as GymIcon,
  Close as CloseIcon,
  ExpandMore as ExpandMoreIcon,
  Schedule as TimeIcon
} from '@mui/icons-material';
import { CalendarDay } from '../modules/shared/types';
import { ScheduledActivitiesDocument, MealPlanDocument, ScheduledWorkoutDocument } from '../types/firebase';
import { loadMealPlan, loadScheduledWorkout } from '../services/firebase';
import { useAuth } from '../contexts/AuthContext';

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
  const [loading, setLoading] = useState(false);
  const [mealPlan, setMealPlan] = useState<MealPlanDocument | null>(null);
  const [scheduledWorkout, setScheduledWorkout] = useState<ScheduledWorkoutDocument | null>(null);
  
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
        if (scheduledTasks.includes('gym-workout')) {
          const workout = await loadScheduledWorkout(user.uid, localDayKey);
          setScheduledWorkout(workout);
        } else {
          setScheduledWorkout(null);
        }
        
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
    <Dialog
      open={!!selectedDay}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box>
          <Typography variant="h6">
            {selectedDay.date.toLocaleDateString('en-US', { 
              weekday: 'long', 
              year: 'numeric',
              month: 'long', 
              day: 'numeric' 
            })}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {(() => {
              const scheduledCount = Object.values(scheduled).filter(Boolean).length;
              return scheduledCount > 0 
                ? `${scheduledCount} task${scheduledCount > 1 ? 's' : ''} scheduled`
                : 'No tasks scheduled';
            })()}
          </Typography>
        </Box>
        <IconButton onClick={onClose}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      
      <DialogContent>
        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
            <CircularProgress size={24} />
          </Box>
        )}
        
        <Stack spacing={3}>
          {/* Food Program Tasks */}
          {(scheduled['meal-6pm'] || scheduled['meal-9:30pm']) && (
            <Card variant="outlined">
              <CardContent>
                <Typography variant="subtitle1" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <FoodIcon color="primary" />
                  Food Program
                </Typography>
                
                {/* Show meal plan details if available */}
                {mealPlan && (
                  <Accordion>
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                      <Typography variant="subtitle2" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        📋 Meal Plan Details
                      </Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                      <Stack spacing={2}>
                        {/* 6PM Meal */}
                        {scheduled['meal-6pm'] && mealPlan.timeslots['6pm'] && (
                          <Box>
                            <Typography variant="subtitle2" gutterBottom>
                              🍽️ 6:00 PM Meal
                            </Typography>
                            <Stack spacing={1}>
                              {mealPlan.timeslots['6pm'].selectedFoods.map((food, idx) => (
                                <Box key={idx} sx={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                                  <span>{food.name}</span>
                                  <span>{food.amount}g</span>
                                </Box>
                              ))}
                              {mealPlan.timeslots['6pm'].externalNutrition.calories > 0 && (
                                <Box sx={{ fontSize: '0.9rem', color: 'text.secondary' }}>
                                  + External: {mealPlan.timeslots['6pm'].externalNutrition.calories} cal
                                </Box>
                              )}
                            </Stack>
                          </Box>
                        )}
                        
                        {/* 9:30PM Meal */}
                        {scheduled['meal-9:30pm'] && mealPlan.timeslots['9:30pm'] && (
                          <Box>
                            <Typography variant="subtitle2" gutterBottom>
                              🌙 9:30 PM Meal
                            </Typography>
                            <Stack spacing={1}>
                              {mealPlan.timeslots['9:30pm'].selectedFoods.map((food, idx) => (
                                <Box key={idx} sx={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                                  <span>{food.name}</span>
                                  <span>{food.amount}g</span>
                                </Box>
                              ))}
                              {mealPlan.timeslots['9:30pm'].externalNutrition.calories > 0 && (
                                <Box sx={{ fontSize: '0.9rem', color: 'text.secondary' }}>
                                  + External: {mealPlan.timeslots['9:30pm'].externalNutrition.calories} cal
                                </Box>
                              )}
                            </Stack>
                          </Box>
                        )}
                        
                        {/* Total Macros */}
                        {mealPlan.totalMacros && (
                          <Box sx={{ bgcolor: alpha('#1976d2', 0.1), p: 2, borderRadius: 1 }}>
                            <Typography variant="subtitle2" gutterBottom>
                              📊 Total Macros
                            </Typography>
                            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 1, fontSize: '0.9rem' }}>
                              <Box>Protein: {Math.round(mealPlan.totalMacros.protein)}g</Box>
                              <Box>Fats: {Math.round(mealPlan.totalMacros.fats)}g</Box>
                              <Box>Carbs: {Math.round(mealPlan.totalMacros.carbs)}g</Box>
                              <Box>Calories: {Math.round(mealPlan.totalMacros.calories)}</Box>
                            </Box>
                          </Box>
                        )}
                      </Stack>
                    </AccordionDetails>
                  </Accordion>
                )}
              </CardContent>
            </Card>
          )}

          {/* Gym Program */}
          {scheduled.gym && (
            <Card variant="outlined">
              <CardContent>
                <Typography variant="subtitle1" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <GymIcon color="warning" />
                  Gym Workout
                </Typography>
              
              {/* Show workout details if available */}
              {scheduledWorkout && (
                <Accordion>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography variant="subtitle2" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      🏋️ Workout Details
                    </Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Stack spacing={2}>
                      <Box>
                        <Typography variant="subtitle1" gutterBottom>
                          {scheduledWorkout.name}
                        </Typography>
                        <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
                          <Chip 
                            label={scheduledWorkout.workoutType} 
                            size="small" 
                            color="warning" 
                          />
                          <Chip 
                            label={`${scheduledWorkout.estimatedDuration} min`} 
                            size="small" 
                            icon={<TimeIcon fontSize="small" />}
                          />
                          <Chip 
                            label={scheduledWorkout.status} 
                            size="small" 
                            color={scheduledWorkout.status === 'completed' ? 'success' : 'default'}
                          />
                        </Stack>
                      </Box>
                      
                      <Divider />
                      
                      <Box>
                        <Typography variant="subtitle2" gutterBottom>
                          📝 Exercises ({scheduledWorkout.exercises.length})
                        </Typography>
                        <Stack spacing={1.5}>
                          {scheduledWorkout.exercises
                            .sort((a, b) => a.order - b.order)
                            .map((exercise) => (
                            <Box 
                              key={exercise.id}
                              sx={{ 
                                p: 1.5, 
                                bgcolor: alpha('#ed6c02', 0.1), 
                                borderRadius: 1,
                                fontSize: '0.9rem'
                              }}
                            >
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600, mb: 0.5 }}>
                                <span>{exercise.name}</span>
                                <span>{exercise.kg}kg</span>
                              </Box>
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', color: 'text.secondary' }}>
                                <span>{exercise.sets} sets × {exercise.reps} reps</span>
                                <span>{exercise.rest}s rest</span>
                              </Box>
                              {exercise.notes && (
                                <Typography variant="caption" sx={{ display: 'block', mt: 0.5, fontStyle: 'italic' }}>
                                  💡 {exercise.notes}
                                </Typography>
                              )}
                            </Box>
                          ))}
                        </Stack>
                      </Box>
                      
                      {scheduledWorkout.notes && (
                        <Box>
                          <Typography variant="subtitle2" gutterBottom>
                            📄 Workout Notes
                          </Typography>
                          <Typography variant="body2" sx={{ fontStyle: 'italic', color: 'text.secondary' }}>
                            {scheduledWorkout.notes}
                          </Typography>
                        </Box>
                      )}
                    </Stack>
                  </AccordionDetails>
                </Accordion>
              )}
            </CardContent>
          </Card>
          )}
        </Stack>
      </DialogContent>
      
      <DialogActions>
        <Button onClick={onClose}>
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default DayModal;
