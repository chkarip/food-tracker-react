/**
 * DayModal.tsx - Detailed Day Activity Management
 * 
 * BUSINESS PURPOSE:
 * Provides comprehensive day-specific activity management including:
 * - Scheduling/unscheduling of meal plans and gym workouts
 * - Detailed program viewing (meal ingredients, workout exercises)
 * - Activity completion status tracking
 * - Direct navigation to program planning interfaces
 * 
 * KEY BUSINESS LOGIC:
 * 1. ACTIVITY SCHEDULING: Toggle switches for meal-6pm, meal-9:30pm, gym-workout
 * 2. DETAILED DATA LOADING: Fetches specific program details from mealPlans and scheduledWorkouts collections
 * 3. PROGRAM PREVIEW: Shows meal ingredients, macros, workout exercises without full edit mode
 * 4. UNIFIED SCHEDULING: Updates both detailed collections and scheduledActivities for calendar display
 * 
 * DATA INTEGRATION:
 * - Reads from scheduledActivities for task flags
 * - Loads detailed data from mealPlans (food selection, macros, external nutrition)
 * - Loads workout data from scheduledWorkouts (exercises, sets, reps, duration)
 * - Updates database when users toggle activity scheduling
 * 
 * BUSINESS VALUE:
 * - Provides day-level program management without cluttering main calendar
 * - Enables users to preview scheduled programs before execution
 * - Maintains consistency between scheduling flags and detailed program data
 * - Supports informed decision-making with complete program visibility
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
  Switch,
  FormControlLabel,
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
  Add as AddIcon,
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
  onToggleSchedule: (taskType: 'meal-6pm' | 'meal-9:30pm' | 'gym', scheduled: boolean) => void;
}

const DayModal: React.FC<DayModalProps> = ({
  selectedDay,
  scheduledActivities,
  onClose,
  onCreateMealPlan,
  onCreateWorkout,
  onToggleSchedule
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
          <Typography variant="h6" gutterBottom>
            📅 Schedule Tasks for This Day
          </Typography>
          
          {/* Food Program Tasks */}
          <Card variant="outlined">
            <CardContent>
              <Typography variant="subtitle1" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <FoodIcon color="primary" />
                Food Program
              </Typography>
              
              <Stack spacing={2}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={scheduled['meal-6pm']}
                        onChange={(e) => onToggleSchedule('meal-6pm', e.target.checked)}
                        color="primary"
                      />
                    }
                    label="6:00 PM - Afternoon Meal"
                  />
                  {scheduled['meal-6pm'] && (
                    <Button size="small" variant="outlined" onClick={onCreateMealPlan}>
                      Plan Meal
                    </Button>
                  )}
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={scheduled['meal-9:30pm']}
                        onChange={(e) => onToggleSchedule('meal-9:30pm', e.target.checked)}
                        color="primary"
                      />
                    }
                    label="9:30 PM - Evening Meal"
                  />
                  {scheduled['meal-9:30pm'] && (
                    <Button size="small" variant="outlined" onClick={onCreateMealPlan}>
                      Plan Meal
                    </Button>
                  )}
                </Box>
                
                {/* Show meal plan details if available */}
                {(scheduled['meal-6pm'] || scheduled['meal-9:30pm']) && mealPlan && (
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
              </Stack>
            </CardContent>
          </Card>

          {/* Gym Program */}
          <Card variant="outlined">
            <CardContent>
              <Typography variant="subtitle1" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <GymIcon color="warning" />
                Gym Workout
              </Typography>
              
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={scheduled.gym}
                      onChange={(e) => onToggleSchedule('gym', e.target.checked)}
                      color="warning"
                    />
                  }
                  label="Gym Session Scheduled"
                />
                {scheduled.gym && (
                  <Button size="small" variant="outlined" onClick={onCreateWorkout}>
                    Plan Workout
                  </Button>
                )}
              </Box>
              
              {/* Show workout details if available */}
              {scheduled.gym && scheduledWorkout && (
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

          {/* Summary */}
          {Object.values(scheduled).some(Boolean) && (
            <Card variant="outlined" sx={{ 
              bgcolor: theme => alpha(theme.palette.primary.main, 0.08)
            }}>
              <CardContent>
                <Typography variant="subtitle2" gutterBottom>
                  📊 Scheduled Tasks Summary
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  {scheduled['meal-6pm'] && <Chip label="6PM Meal" size="small" color="primary" />}
                  {scheduled['meal-9:30pm'] && <Chip label="9:30PM Meal" size="small" color="primary" />}
                  {scheduled.gym && <Chip label="Gym" size="small" color="warning" />}
                </Box>
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
