import React, { useMemo } from 'react';
import {
  Box,
  Typography,
  Paper,
  Chip
} from '@mui/material';
import { ScheduledWorkoutDocument } from '../../../types/firebase';
import { ModuleStats, ActivityData } from '../../../modules/shared/types';
import ActivityGridSection from '../../activity/ActivityGridSection';

interface WorkoutCardContentProps {
  workout: ScheduledWorkoutDocument | null;
  scheduledTasks: string[];
  loading?: boolean;
  gymStats?: ModuleStats;
  gymActivityData?: ActivityData[];
}

export const WorkoutCardContent: React.FC<WorkoutCardContentProps> = ({
  workout,
  scheduledTasks,
  loading = false,
  gymStats,
  gymActivityData = []
}) => {
  // Convert ActivityData to ActivityGridDay format for the grid
  const gridActivityData = useMemo(() => {
    const days = [];
    const today = new Date();

    for (let i = 99; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateKey = date.toISOString().split('T')[0];

      // Find activity for this day
      const dayActivity = gymActivityData.find(activity =>
        activity.date === dateKey
      );

      days.push({
        date: dateKey,
        dateObj: date,
        completed: dayActivity?.completed || false,
        value: dayActivity?.value || 0,
        maxValue: dayActivity?.maxValue || 1,
        isToday: dateKey === today.toISOString().split('T')[0],
        isWeekend: date.getDay() === 0 || date.getDay() === 6
      });
    }

    return days;
  }, [gymActivityData]);
  if (loading) {
    return (
      <Box sx={{ p: 2, bgcolor: 'var(--surface-bg)', borderRadius: 1, border: '1px solid var(--border-color)' }}>
        <Typography variant="h6" sx={{ color: 'var(--text-primary)' }}>
          Loading workout...
        </Typography>
      </Box>
    );
  }

  return (
    <>
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

            {/* Activity Grid - Workout Progress Circles */}
            {gymStats && (
              <ActivityGridSection
                activityData={gridActivityData}
                size="small"
                preset="compact"
                primaryColor={gymStats.gradient}
                title="Workout Progress"
                showTitle={true}
                dayCount={100}
              />
            )}
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
    </>
  );
};