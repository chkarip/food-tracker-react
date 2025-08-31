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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Chip,
  Stack,
  CircularProgress,
} from '@mui/material';
import AccentButton from '../shared/AccentButton';
import CollapsiblePanel from '../shared/CollapsiblePanel';
import {
  Restaurant as FoodIcon,
  FitnessCenter as GymIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import { CalendarDay } from '../../modules/shared/types';
import { ScheduledActivitiesDocument, MealPlanDocument, ScheduledWorkoutDocument } from '../../types/firebase';
import { loadMealPlan, loadScheduledWorkout } from '../../services/firebase';
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
    <Dialog open={!!selectedDay} onClose={onClose} fullWidth maxWidth="sm">
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

      <DialogContent dividers>
        {loading && (
          <Box display="flex" justifyContent="center" py={4}>
            <CircularProgress size={24} />
          </Box>
        )}

        {/* Food Program Tasks */}
        {(scheduled['meal-6pm'] || scheduled['meal-9:30pm']) && (
          <Box mb={3}>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <FoodIcon fontSize="small" />
              Food Program
            </Typography>

            {/* Show meal plan details if available */}
            {mealPlan && (
              <CollapsiblePanel
                title="📋 Meal Plan Details"
                variant="primary"
                icon={<FoodIcon />}
                defaultExpanded={true}
                size="compact"
              >
                {/* 6PM Meal */}
                {scheduled['meal-6pm'] && mealPlan.timeslots['6pm'] && (
                  <Box mb={2}>
                    <Typography variant="subtitle1" gutterBottom>
                      🍽️ 6:00 PM Meal
                    </Typography>
                    {mealPlan.timeslots['6pm'].selectedFoods.map((food, idx) => (
                      <Box key={idx} display="flex" justifyContent="space-between" mb={0.5}>
                        <Typography variant="body2">{food.name}</Typography>
                        <Typography variant="body2">{food.amount}g</Typography>
                      </Box>
                    ))}
                    
                    {mealPlan.timeslots['6pm'].externalNutrition.calories > 0 && (
                      <Typography variant="caption" color="text.secondary">
                        + External: {mealPlan.timeslots['6pm'].externalNutrition.calories} cal
                      </Typography>
                    )}
                  </Box>
                )}

                {/* 9:30PM Meal */}
                {scheduled['meal-9:30pm'] && mealPlan.timeslots['9:30pm'] && (
                  <Box mb={2}>
                    <Typography variant="subtitle1" gutterBottom>
                      🌙 9:30 PM Meal
                    </Typography>
                    {mealPlan.timeslots['9:30pm'].selectedFoods.map((food, idx) => (
                      <Box key={idx} display="flex" justifyContent="space-between" mb={0.5}>
                        <Typography variant="body2">{food.name}</Typography>
                        <Typography variant="body2">{food.amount}g</Typography>
                      </Box>
                    ))}
                    
                    {mealPlan.timeslots['9:30pm'].externalNutrition.calories > 0 && (
                      <Typography variant="caption" color="text.secondary">
                        + External: {mealPlan.timeslots['9:30pm'].externalNutrition.calories} cal
                      </Typography>
                    )}
                  </Box>
                )}

                {/* Total Macros */}
                {mealPlan.totalMacros && (
                  <Box>
                    <Typography variant="subtitle1" gutterBottom>
                      📊 Total Macros
                    </Typography>
                    <Stack direction="row" spacing={2}>
                      <Typography variant="body2">
                        Protein: {Math.round(mealPlan.totalMacros.protein)}g
                      </Typography>
                      <Typography variant="body2">
                        Fats: {Math.round(mealPlan.totalMacros.fats)}g
                      </Typography>
                      <Typography variant="body2">
                        Carbs: {Math.round(mealPlan.totalMacros.carbs)}g
                      </Typography>
                      <Typography variant="body2">
                        Calories: {Math.round(mealPlan.totalMacros.calories)}
                      </Typography>
                    </Stack>
                  </Box>
                )}
              </CollapsiblePanel>
            )}
          </Box>
        )}

        {/* Gym Program */}
        {scheduled.gym && (
          <Box>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <GymIcon fontSize="small" />
              Gym Workout
            </Typography>

            {/* Show workout details if available */}
            {scheduledWorkout && (
              <CollapsiblePanel
                title="🏋️ Workout Details"
                variant="secondary"
                icon={<GymIcon />}
                defaultExpanded={true}
                size="compact"
              >
                <Box mb={2}>
                  <Typography variant="h6" gutterBottom>
                    {scheduledWorkout.name}
                  </Typography>

                  <Chip
                    label={scheduledWorkout.status}
                    color={scheduledWorkout.status === 'completed' ? 'success' : 'default'}
                    size="small"
                  />
                </Box>

                <Typography variant="subtitle1" gutterBottom sx={{ mt: 2, mb: 1 }}>
                  📝 Exercises ({scheduledWorkout.exercises.length})
                </Typography>

                {scheduledWorkout.exercises
                  .sort((a, b) => a.order - b.order)
                  .map((exercise) => (
                    <Box key={exercise.id} mb={2}>
                      <Typography variant="body2" fontWeight="medium">
                        {exercise.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {exercise.kg}kg • {exercise.sets} sets × {exercise.reps} reps • {exercise.rest}s rest
                      </Typography>
                      
                      {exercise.notes && (
                        <Typography variant="caption" color="text.secondary">
                          💡 {exercise.notes}
                        </Typography>
                      )}
                    </Box>
                  ))}

                {scheduledWorkout.notes && (
                  <Box mt={2}>
                    <Typography variant="subtitle1" gutterBottom>
                      📄 Workout Notes
                    </Typography>
                    <Typography variant="body2">
                      {scheduledWorkout.notes}
                    </Typography>
                  </Box>
                )}
              </CollapsiblePanel>
            )}
          </Box>
        )}
      </DialogContent>

      <DialogActions>
        <Stack direction="row" spacing={1} sx={{ p: 1 }}>
          <AccentButton onClick={onCreateMealPlan} size="small" variant="secondary">
            Create Meal Plan
          </AccentButton>
          <AccentButton onClick={onCreateWorkout} size="small" variant="secondary">
            Create Workout
          </AccentButton>
          <AccentButton onClick={onClose} size="small">
            ✖️ Close
          </AccentButton>
        </Stack>
      </DialogActions>
    </Dialog>
  );
};

export default DayModal;
