import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Chip,
  IconButton
} from '@mui/material';
import { KeyboardArrowUp as BringToFrontIcon } from '@mui/icons-material';
import { ScheduledWorkoutDocument, MealPlanDocument } from '../../types/firebase';

interface ScheduleCardProps {
  type: 'meal' | 'workout';
  mealPlan?: MealPlanDocument | null;
  workout?: ScheduledWorkoutDocument | null;
  scheduledTasks: string[];
  onBringToFront?: () => void;
  zIndex?: number;
  isStacked?: boolean;
}

const ScheduleCard: React.FC<ScheduleCardProps> = ({
  type,
  mealPlan,
  workout,
  scheduledTasks,
  onBringToFront,
  zIndex = 1,
  isStacked = false
}) => {
  const [isHovered, setIsHovered] = useState(false);

  if (type === 'meal') {
    const hasMeals = scheduledTasks.some(task => task.startsWith('meal-'));

    if (!hasMeals) return null; // Only check if meals are scheduled, not if data is loaded

    return (
      <Paper
        sx={{
          position: 'relative',
          p: 3,
          borderRadius: 2,
          border: '1px solid var(--border-color)',
          bgcolor: 'var(--card-bg)',
          boxShadow: isStacked ? 'var(--elevation-2)' : 'var(--elevation-1)',
          transition: 'all 0.3s ease',
          zIndex,
          cursor: isStacked ? 'pointer' : 'default',
          '&:hover': {
            boxShadow: 'var(--elevation-3)',
            borderColor: 'var(--accent-green)'
          }
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={isStacked ? onBringToFront : undefined}
      >
        {/* Bring to Front Button */}
        {isStacked && (
          <IconButton
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              onBringToFront?.();
            }}
            sx={{
              position: 'absolute',
              top: 8,
              right: 8,
              bgcolor: 'var(--surface-bg)',
              border: '1px solid var(--border-color)',
              opacity: isHovered ? 1 : 0.7,
              transition: 'opacity 0.2s ease',
              '&:hover': {
                bgcolor: 'var(--accent-green)',
                color: 'white'
              }
            }}
          >
            <BringToFrontIcon fontSize="small" />
          </IconButton>
        )}

        <Typography variant="h6" gutterBottom sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          fontWeight: 600,
          color: 'var(--accent-green)',
          mb: 2
        }}>
          🍽️ Food Program
        </Typography>

        {/* Vertical layout for meals */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {/* 6PM Meal */}
          {scheduledTasks.includes('meal-6pm') && mealPlan?.timeslots?.['6pm'] && (
            <Box sx={{ p: 2, bgcolor: 'var(--surface-bg)', borderRadius: 1, border: '1px solid var(--border-color)' }}>
              <Typography variant="subtitle1" gutterBottom sx={{ color: 'var(--text-primary)', fontWeight: 600 }}>
                6:00 PM Meal
              </Typography>
              {mealPlan.timeslots['6pm'].selectedFoods.map((food, idx) => (
                <Box key={idx} display="flex" justifyContent="space-between" mb={0.5}>
                  <Typography variant="body2" sx={{ color: 'var(--text-primary)' }}>{food.name}</Typography>
                  <Typography variant="body2" sx={{ color: 'var(--text-secondary)' }}>{food.amount}g</Typography>
                </Box>
              ))}

              {mealPlan.timeslots['6pm'].externalNutrition.calories > 0 && (
                <Typography variant="caption" sx={{ color: 'var(--text-secondary)', mt: 1, display: 'block' }}>
                  + External: {mealPlan.timeslots['6pm'].externalNutrition.calories} cal
                </Typography>
              )}
            </Box>
          )}

          {/* 9:30PM Meal */}
          {scheduledTasks.includes('meal-9:30pm') && mealPlan?.timeslots?.['9:30pm'] && (
            <Box sx={{ p: 2, bgcolor: 'var(--surface-bg)', borderRadius: 1, border: '1px solid var(--border-color)' }}>
              <Typography variant="subtitle1" gutterBottom sx={{ color: 'var(--text-primary)', fontWeight: 600 }}>
                9:30 PM Meal
              </Typography>
              {mealPlan.timeslots['9:30pm'].selectedFoods.map((food, idx) => (
                <Box key={idx} display="flex" justifyContent="space-between" mb={0.5}>
                  <Typography variant="body2" sx={{ color: 'var(--text-primary)' }}>{food.name}</Typography>
                  <Typography variant="body2" sx={{ color: 'var(--text-secondary)' }}>{food.amount}g</Typography>
                </Box>
              ))}

              {mealPlan.timeslots['9:30pm'].externalNutrition.calories > 0 && (
                <Typography variant="caption" sx={{ color: 'var(--text-secondary)', mt: 1, display: 'block' }}>
                  + External: {mealPlan.timeslots['9:30pm'].externalNutrition.calories} cal
                </Typography>
              )}
            </Box>
          )}

          {/* Show loading state if meals are scheduled but data not loaded */}
          {scheduledTasks.some(task => task.startsWith('meal-')) && !mealPlan && (
            <Box sx={{ p: 2, bgcolor: 'var(--surface-bg)', borderRadius: 1, border: '1px solid var(--border-color)' }}>
              <Typography variant="subtitle1" sx={{ color: 'var(--text-primary)', fontWeight: 600 }}>
                Loading meal plan...
              </Typography>
            </Box>
          )}
        </Box>

        {/* Total Macros */}
        {mealPlan?.totalMacros && (
          <Box sx={{ mt: 2, p: 2, bgcolor: 'var(--accent-blue)', color: 'white', borderRadius: 1 }}>
            <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 600 }}>
              Total Macros
            </Typography>
            <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
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
            </Box>
          </Box>
        )}
      </Paper>
    );
  }

  if (type === 'workout') {
    const hasGym = scheduledTasks.includes('gym-workout');

    if (!hasGym) return null; // Only check if workouts are scheduled, not if data is loaded

    return (
      <Paper
        sx={{
          position: 'relative',
          p: 3,
          borderRadius: 2,
          border: '1px solid var(--border-color)',
          bgcolor: 'var(--card-bg)',
          boxShadow: isStacked ? 'var(--elevation-2)' : 'var(--elevation-1)',
          transition: 'all 0.3s ease',
          zIndex,
          cursor: isStacked ? 'pointer' : 'default',
          '&:hover': {
            boxShadow: 'var(--elevation-3)',
            borderColor: 'var(--accent-orange)'
          }
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={isStacked ? onBringToFront : undefined}
      >
        {/* Bring to Front Button */}
        {isStacked && (
          <IconButton
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              onBringToFront?.();
            }}
            sx={{
              position: 'absolute',
              top: 8,
              right: 8,
              bgcolor: 'var(--surface-bg)',
              border: '1px solid var(--border-color)',
              opacity: isHovered ? 1 : 0.7,
              transition: 'opacity 0.2s ease',
              '&:hover': {
                bgcolor: 'var(--accent-orange)',
                color: 'white'
              }
            }}
          >
            <BringToFrontIcon fontSize="small" />
          </IconButton>
        )}

        <Typography variant="h6" gutterBottom sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          fontWeight: 600,
          color: 'var(--accent-orange)',
          mb: 2
        }}>
          🏋️ Gym Workout
        </Typography>

        <Box sx={{ p: 2, bgcolor: 'var(--surface-bg)', borderRadius: 1, mb: 2, border: '1px solid var(--border-color)' }}>
          {workout ? (
            <>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" sx={{ color: 'var(--text-primary)' }}>
                  {workout.name}
                </Typography>
                <Chip
                  label={workout.status}
                  color={workout.status === 'completed' ? 'success' : 'default'}
                  size="small"
                />
              </Box>

              <Typography variant="subtitle2" gutterBottom sx={{ color: 'var(--text-secondary)' }}>
                {workout.exercises?.length || 0} Exercise{(workout.exercises?.length || 0) !== 1 ? 's' : ''}
              </Typography>
            </>
          ) : (
            <Typography variant="h6" sx={{ color: 'var(--text-primary)' }}>
              Loading workout...
            </Typography>
          )}
        </Box>

        {/* Render ALL exercises */}
        {workout && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {workout.exercises
              ?.sort((a, b) => a.order - b.order)
              .map((exercise) => (
                <Paper
                  key={exercise.id || `${exercise.name}-${exercise.order}`}
                  sx={{
                    bgcolor: 'var(--card-bg)',
                    border: '1px solid var(--border-color)',
                    borderRadius: 2,
                    p: 1.25,
                    mb: 1,
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      bgcolor: 'var(--card-hover-bg)',
                      transform: 'translateY(-1px)',
                      boxShadow: 'var(--elevation-1)'
                    }
                  }}
                >
                  <Typography variant="body2" sx={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                    {exercise.name}
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'var(--text-secondary)' }}>
                    {exercise.kg}kg • {exercise.sets} sets × {exercise.reps} reps
                  </Typography>
                  {exercise.notes && (
                    <Typography variant="caption" sx={{ color: 'var(--text-secondary)', display: 'block', mt: 0.5 }}>
                      {exercise.notes}
                    </Typography>
                  )}
                </Paper>
              ))}
          </Box>
        )}

        {workout?.notes && (
          <Box sx={{ mt: 2, p: 1.5, bgcolor: 'var(--surface-bg)', borderRadius: 1, border: '1px solid var(--border-color)' }}>
            <Typography variant="subtitle2" gutterBottom sx={{ color: 'var(--text-primary)' }}>
              Notes
            </Typography>
            <Typography variant="body2" sx={{ color: 'var(--text-primary)' }}>
              {workout.notes.length > 100
                ? `${workout.notes.substring(0, 100)}...`
                : workout.notes}
            </Typography>
          </Box>
        )}
      </Paper>
    );
  }

  return null;
};

export default ScheduleCard;