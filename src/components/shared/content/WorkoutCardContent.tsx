import React, { useMemo, useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Chip,
  Checkbox,
  FormControlLabel,
  CircularProgress,
  IconButton,
  TextField,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemButton,
  ListItemText
} from '@mui/material';
import {
  Edit as EditIcon,
  SwapHoriz as SwapIcon,
  Check as CheckIcon,
  Close as CloseIcon,
  FitnessCenter as WorkoutIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { ScheduledWorkoutDocument } from '../../../types/firebase';
import { ModuleStats, ActivityData } from '../../../modules/shared/types';
import ActivityGridSection from '../../activity/ActivityGridSection';

interface WorkoutCardContentProps {
  workout: ScheduledWorkoutDocument | null;
  loading?: boolean;
  gymStats?: ModuleStats;
  gymActivityData?: ActivityData[];
  onToggleStatus?: (completed: boolean) => Promise<void> | void;
  statusUpdating?: boolean;
  onUpdateExercise?: (exerciseId: string, updates: { kg?: number; reps?: number; rest?: number }) => Promise<void>;
  onSwapExercise?: (exerciseId: string, newExerciseName: string) => Promise<void>;
}

export const WorkoutCardContent: React.FC<WorkoutCardContentProps> = ({
  workout,
  loading = false,
  gymStats,
  gymActivityData = [],
  onToggleStatus,
  statusUpdating = false,
  onUpdateExercise,
  onSwapExercise
}) => {
  const navigate = useNavigate();
  const [editingExerciseId, setEditingExerciseId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ kg: 0, reps: 0, rest: 0 });
  const [swapDialogOpen, setSwapDialogOpen] = useState(false);
  const [swappingExerciseId, setSwappingExerciseId] = useState<string | null>(null);
  const [availableExercises, setAvailableExercises] = useState<string[]>([]);

  const handleEditClick = (exercise: ScheduledWorkoutDocument['exercises'][0]) => {
    setEditingExerciseId(exercise.id);
    setEditForm({
      kg: exercise.kg,
      reps: exercise.reps,
      rest: exercise.rest
    });
  };

  const handleSaveEdit = async () => {
    if (editingExerciseId && onUpdateExercise) {
      await onUpdateExercise(editingExerciseId, editForm);
      setEditingExerciseId(null);
    }
  };

  const handleCancelEdit = () => {
    setEditingExerciseId(null);
  };

  const handleSwapClick = async (exerciseId: string) => {
    setSwappingExerciseId(exerciseId);
    
    // Load available exercises from Firestore
    try {
      const { collection, getDocs } = await import('firebase/firestore');
      const { db } = await import('../../../config/firebase');
      const exercisesSnapshot = await getDocs(collection(db, 'exercises'));
      const exercises = exercisesSnapshot.docs
        .map(doc => doc.data().name as string)
        .filter(name => name)
        .sort();
      setAvailableExercises(exercises);
    } catch (error) {
      console.error('Error loading exercises:', error);
      setAvailableExercises([]);
    }
    
    setSwapDialogOpen(true);
  };

  const handleSwapConfirm = async (newExerciseName: string) => {
    if (swappingExerciseId && onSwapExercise) {
      await onSwapExercise(swappingExerciseId, newExerciseName);
      setSwapDialogOpen(false);
      setSwappingExerciseId(null);
    }
  };
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

  // Show empty state if no workout data
  if (!workout) {
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
        <Box sx={{
          p: 4,
          bgcolor: 'var(--surface-bg)',
          borderRadius: 2,
          border: '1px solid var(--border-color)',
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 2
        }}>
          <WorkoutIcon sx={{ fontSize: 48, color: 'var(--text-secondary)', opacity: 0.5 }} />
          <Typography variant="h6" sx={{ color: 'var(--text-primary)', fontWeight: 500 }}>
            Nothing has been scheduled yet
          </Typography>
          <Typography variant="body2" sx={{ color: 'var(--text-secondary)', mb: 1 }}>
            Schedule your workouts to stay consistent with your fitness routine
          </Typography>
          <Button
            variant="contained"
            startIcon={<WorkoutIcon />}
            onClick={() => navigate('/gym/schedule')}
            sx={{
              bgcolor: 'var(--accent-orange)',
              '&:hover': {
                bgcolor: 'var(--accent-orange-dark)'
              }
            }}
          >
            Schedule Workout
          </Button>
        </Box>
      </>
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

            {onToggleStatus && (
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', mb: 2, gap: 1 }}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={workout.status === 'completed'}
                      onChange={(event) => onToggleStatus?.(event.target.checked)}
                      disabled={statusUpdating}
                      sx={{ color: 'var(--accent-orange)' }}
                    />
                  }
                  label="Mark complete"
                  sx={{ color: 'var(--text-secondary)' }}
                />
                {statusUpdating && <CircularProgress size={20} />}
              </Box>
            )}

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
            .map((exercise) => {
              const isEditing = editingExerciseId === exercise.id;
              
              return (
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
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="body2" sx={{ fontWeight: 600, color: 'var(--text-primary)', mb: 0.5 }}>
                        {exercise.name}
                      </Typography>
                      
                      {isEditing ? (
                        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
                          <TextField
                            size="small"
                            type="number"
                            label="kg"
                            value={editForm.kg}
                            onChange={(e) => setEditForm({ ...editForm, kg: Number(e.target.value) })}
                            sx={{ width: 80 }}
                          />
                          <TextField
                            size="small"
                            type="number"
                            label="reps"
                            value={editForm.reps}
                            onChange={(e) => setEditForm({ ...editForm, reps: Number(e.target.value) })}
                            sx={{ width: 80 }}
                          />
                          <TextField
                            size="small"
                            type="number"
                            label="rest (s)"
                            value={editForm.rest}
                            onChange={(e) => setEditForm({ ...editForm, rest: Number(e.target.value) })}
                            sx={{ width: 90 }}
                          />
                          <IconButton size="small" onClick={handleSaveEdit} color="success">
                            <CheckIcon />
                          </IconButton>
                          <IconButton size="small" onClick={handleCancelEdit} color="error">
                            <CloseIcon />
                          </IconButton>
                        </Box>
                      ) : (
                        <Typography variant="caption" sx={{ color: 'var(--text-secondary)' }}>
                          {exercise.kg}kg • {exercise.sets} sets × {exercise.reps} reps • {exercise.rest}s rest
                        </Typography>
                      )}
                      
                      {exercise.notes && !isEditing && (
                        <Typography variant="caption" sx={{ color: 'var(--text-secondary)', display: 'block', mt: 0.5 }}>
                          {exercise.notes}
                        </Typography>
                      )}
                    </Box>
                    
                    {!isEditing && (onUpdateExercise || onSwapExercise) && (
                      <Box sx={{ display: 'flex', gap: 0.5 }}>
                        {onUpdateExercise && (
                          <IconButton 
                            size="small" 
                            onClick={() => handleEditClick(exercise)}
                            sx={{ color: 'var(--text-secondary)' }}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                        )}
                        {onSwapExercise && (
                          <IconButton 
                            size="small" 
                            onClick={() => handleSwapClick(exercise.id)}
                            sx={{ color: 'var(--text-secondary)' }}
                          >
                            <SwapIcon fontSize="small" />
                          </IconButton>
                        )}
                      </Box>
                    )}
                  </Box>
                </Paper>
              );
            })}
        </Box>
      )}

      {/* Swap Exercise Dialog */}
      <Dialog open={swapDialogOpen} onClose={() => setSwapDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Swap Exercise</DialogTitle>
        <DialogContent>
          <List>
            {availableExercises.map((exerciseName) => (
              <ListItem key={exerciseName} disablePadding>
                <ListItemButton onClick={() => handleSwapConfirm(exerciseName)}>
                  <ListItemText primary={exerciseName} />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSwapDialogOpen(false)}>Cancel</Button>
        </DialogActions>
      </Dialog>

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