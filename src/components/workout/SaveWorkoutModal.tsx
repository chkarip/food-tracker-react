import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
  Card,
  CardContent,
  Chip,
  Alert,
  Divider,
  FormControl,
  InputLabel,
  OutlinedInput,
  InputAdornment
} from '@mui/material';

import {
  Save as SaveIcon,
  Schedule as ScheduleIcon,
  FitnessCenter as GymIcon,
  Timer as TimerIcon,
  Notes as NotesIcon
} from '@mui/icons-material';
import { WorkoutExercise, WorkoutType } from '../../types/workout';

interface SaveWorkoutModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (workoutData: ScheduledWorkout) => Promise<void>;
  workoutType: WorkoutType;
  exercises: WorkoutExercise[];
}

export interface ScheduledWorkout {
  id?: string;
  name: string;
  workoutType: WorkoutType;
  exercises: WorkoutExercise[];
  scheduledDate: Date;
  estimatedDuration: number; // minutes
  notes: string;
  status: 'scheduled' | 'completed' | 'skipped';
  createdAt: Date;
}

const SaveWorkoutModal: React.FC<SaveWorkoutModalProps> = ({
  open,
  onClose,
  onSave,
  workoutType,
  exercises
}) => {
  const [workoutName, setWorkoutName] = useState(`${workoutType} Workout`);
  const [scheduledDate, setScheduledDate] = useState<Date>(new Date());
  const [estimatedDuration, setEstimatedDuration] = useState(60); // default 60 minutes
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!workoutName.trim() || exercises.length === 0) return;

    setSaving(true);
    try {
      const workoutData: ScheduledWorkout = {
        name: workoutName.trim(),
        workoutType,
        exercises,
        scheduledDate,
        estimatedDuration,
        notes: notes.trim(),
        status: 'scheduled',
        createdAt: new Date()
      };

      await onSave(workoutData);
      onClose();
      
      // Reset form
      setWorkoutName(`${workoutType} Workout`);
      setScheduledDate(new Date());
      setEstimatedDuration(60);
      setNotes('');
    } catch (error) {
      console.error('Error saving workout:', error);
      // You might want to show an error snackbar here
    } finally {
      setSaving(false);
    }
  };

  const calculateTotalVolume = () => {
    return exercises.reduce((total, exercise) => {
      return total + (exercise.kg * exercise.sets * exercise.reps);
    }, 0);
  };

  const formatRestTime = (seconds: number): string => {
    if (seconds >= 60) {
      const minutes = Math.floor(seconds / 60);
      const remainingSeconds = seconds % 60;
      return remainingSeconds > 0 ? `${minutes}m ${remainingSeconds}s` : `${minutes}m`;
    }
    return `${seconds}s`;
  };

  const totalVolume = calculateTotalVolume();
  const totalSets = exercises.reduce((sum, ex) => sum + ex.sets, 0);

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="md" 
      fullWidth
      PaperProps={{
        sx: { borderRadius: 3, maxHeight: '90vh' }
      }}
    >
      <DialogTitle sx={{ pb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <GymIcon color="primary" />
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 600 }}>
              Schedule Workout
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Save and schedule your {workoutType.toLowerCase()} workout
            </Typography>
          </Box>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ pt: 2 }}>
        {/* Workout Summary Card */}
        <Card variant="outlined" sx={{ mb: 3, borderRadius: 2 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <GymIcon fontSize="small" />
              Workout Preview
            </Typography>
            
            <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
              <Chip 
                icon={<GymIcon />}
                label={`${exercises.length} exercises`} 
                color="primary" 
                variant="outlined"
              />
              <Chip 
                icon={<TimerIcon />}
                label={`${totalSets} total sets`} 
                color="secondary" 
                variant="outlined"
              />
              <Chip 
                label={`${totalVolume} kg volume`} 
                color="info" 
                variant="outlined"
              />
            </Box>

            {/* Exercise List Preview */}
            <Box sx={{ maxHeight: 200, overflowY: 'auto' }}>
              {exercises.map((exercise, index) => (
                <Box key={exercise.id} sx={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  py: 1,
                  borderBottom: index < exercises.length - 1 ? '1px solid' : 'none',
                  borderColor: 'divider'
                }}>
                  <Box>
                    <Typography variant="body2" fontWeight={600}>
                      {exercise.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {exercise.primaryMuscle} • {exercise.equipment}
                    </Typography>
                  </Box>
                  <Box sx={{ textAlign: 'right' }}>
                    <Typography variant="body2" fontWeight={600}>
                      {exercise.kg}kg × {exercise.sets}×{exercise.reps}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {formatRestTime(exercise.rest)} rest
                    </Typography>
                  </Box>
                </Box>
              ))}
            </Box>
          </CardContent>
        </Card>

        <Divider sx={{ my: 2 }} />

        {/* Form Fields */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {/* Workout Name */}
          <TextField
            label="Workout Name"
            value={workoutName}
            onChange={(e) => setWorkoutName(e.target.value)}
            placeholder={`e.g., ${workoutType} - Arms Focus`}
            fullWidth
            required
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <GymIcon />
                </InputAdornment>
              ),
            }}
          />

          {/* Date Picker */}
          <TextField
            label="Schedule Date"
            type="date"
            value={scheduledDate.toISOString().split('T')[0]}
            onChange={(e) => setScheduledDate(new Date(e.target.value))}
            fullWidth
            required
            InputLabelProps={{
              shrink: true,
            }}
            inputProps={{
              min: new Date().toISOString().split('T')[0]
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <ScheduleIcon />
                </InputAdornment>
              ),
            }}
          />

          {/* Estimated Duration */}
          <FormControl fullWidth>
            <InputLabel htmlFor="duration-input">Estimated Duration</InputLabel>
            <OutlinedInput
              id="duration-input"
              type="number"
              value={estimatedDuration}
              onChange={(e) => setEstimatedDuration(Math.max(15, parseInt(e.target.value) || 15))}
              endAdornment={<InputAdornment position="end">minutes</InputAdornment>}
              label="Estimated Duration"
              inputProps={{ min: 15, max: 180, step: 5 }}
              startAdornment={
                <InputAdornment position="start">
                  <TimerIcon />
                </InputAdornment>
              }
            />
          </FormControl>

          {/* Notes */}
          <TextField
            label="Notes (Optional)"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            multiline
            rows={3}
            placeholder="Add any notes about this workout session..."
            fullWidth
            InputProps={{
              startAdornment: (
                <InputAdornment position="start" sx={{ alignSelf: 'flex-start', mt: 2 }}>
                  <NotesIcon />
                </InputAdornment>
              ),
            }}
          />
        </Box>

        {/* Validation Alert */}
        {exercises.length === 0 && (
          <Alert severity="warning" sx={{ mt: 2 }}>
            No exercises added to this workout. Add some exercises before scheduling.
          </Alert>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 3, gap: 2 }}>
        <Button onClick={onClose} size="large">
          Cancel
        </Button>
        <Button 
          onClick={handleSave}
          variant="contained"
          disabled={!workoutName.trim() || exercises.length === 0 || saving}
          startIcon={<SaveIcon />}
          size="large"
          sx={{ minWidth: 140 }}
        >
          {saving ? 'Scheduling...' : 'Schedule Workout'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default SaveWorkoutModal;
