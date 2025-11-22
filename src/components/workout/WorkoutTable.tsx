/**
 * WorkoutTable.tsx - Gym Workout Builder & Scheduling Interface
 *
 * BUSINESS PURPOSE:
 * Primary interface for creating and scheduling detailed gym workouts including:
 * - Exercise selection from categorized library (chest, back, legs, etc.)
 * - Workout parameter configuration (sets, reps, weight, rest periods)
 * - Calendar integration through dual-system architecture
 * - Real-time time estimation
 *
 * KEY BUSINESS LOGIC:
 * 1. DUAL-SYSTEM INTEGRATION: Saves detailed workout to scheduledWorkouts AND registers 'gym-workout' task in scheduledActivities
 * 2. EXERCISE LIBRARY MANAGEMENT: Categorized exercise database with muscle groups and equipment specs
 * 3. REAL-TIME CALCULATIONS: Auto-calculates workout duration, set volume, and progression metrics
 * 4. PROGRAM VALIDATION: Ensures workout completeness before scheduling
 *
 * CORE WORKOUT FEATURES:
 * - Parameter Configuration: Sets, reps, weight, rest period customization
 * - Calendar Scheduling: Direct integration with calendar system
 * - Progress Tracking: Maintains exercise progression data
 *
 * BUSINESS VALUE:
 * - Enables structured fitness program creation and execution
 * - Supports progressive overload through detailed exercise parameter tracking
 * - Integrates seamlessly with calendar for comprehensive program management
 * - Maintains exercise form and progression data for optimal fitness results
 */

import React, { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Box,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Snackbar,
  Alert
} from '@mui/material';
import  AccentButton  from '../shared/AccentButton';

import { WorkoutExercise, WorkoutType } from '../../types/workout';
import WorkoutTableRow from './WorkoutTableRow';
import SaveWorkoutModal, { ScheduledWorkout } from './SaveWorkoutModal';
import { saveScheduledWorkout } from '../../services/firebase/workout/workoutService';
import { addTaskToUnifiedSchedule } from '../../services/firebase';
import { useAuth } from '../../contexts/AuthContext';

interface Exercise {
  id?: string;
  name: string;
  primaryMuscle: string;
  equipment: string;
}

interface WorkoutTableProps {
  workoutType: WorkoutType;
  exercises: WorkoutExercise[];
  availableExercises: Exercise[];
  onExercisesChange: (exercises: WorkoutExercise[]) => void;
}

interface DeletedExercise {
  exercise: WorkoutExercise;
  index: number;
}

const WorkoutTable: React.FC<WorkoutTableProps> = ({
  workoutType,
  exercises,
  availableExercises,
  onExercisesChange
}) => {
  const { user } = useAuth();
  const [editingExercise, setEditingExercise] = useState<WorkoutExercise | null>(null);
  const [editingField, setEditingField] = useState<string | null>(null);
  const [openAddDialog, setOpenAddDialog] = useState(false);
  const [selectedExerciseId, setSelectedExerciseId] = useState('');
  const [deletedExercise, setDeletedExercise] = useState<DeletedExercise | null>(null);
  const [showUndoSnackbar, setShowUndoSnackbar] = useState(false);
  const [insertAtIndex, setInsertAtIndex] = useState<number | null>(null);

  // New state for Save Workout Modal
  const [openSaveWorkoutModal, setOpenSaveWorkoutModal] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleEditExercise = (exercise: WorkoutExercise, field?: keyof WorkoutExercise) => {
    setEditingExercise(exercise);
    setEditingField(field || null);
  };

  const handleStopEditing = () => {
    setEditingExercise(null);
    setEditingField(null);
  };

  const handleUpdateExercise = (field: keyof WorkoutExercise, value: string | number) => {
    if (!editingExercise) return;

    const updatedExercises = exercises.map(ex =>
      ex.id === editingExercise.id
        ? { ...ex, [field]: value }
        : ex
    );

    handleExercisesChange(updatedExercises);
    // Update local editing state
    setEditingExercise({ ...editingExercise, [field]: value });
  };

  const handleDeleteExercise = (exerciseId: string) => {
    const exerciseIndex = exercises.findIndex(ex => ex.id === exerciseId);
    const exerciseToDelete = exercises[exerciseIndex];

    if (!exerciseToDelete) return;

    // Store deleted exercise for undo
    setDeletedExercise({ exercise: exerciseToDelete, index: exerciseIndex });

    // Remove from exercises
    const updatedExercises = exercises.filter(ex => ex.id !== exerciseId);
    handleExercisesChange(updatedExercises);

    // Show undo snackbar
    setShowUndoSnackbar(true);
  };

  const handleUndoDelete = () => {
    if (!deletedExercise) return;

    const updatedExercises = [...exercises];
    updatedExercises.splice(deletedExercise.index, 0, deletedExercise.exercise);
    handleExercisesChange(updatedExercises);

    setDeletedExercise(null);
    setShowUndoSnackbar(false);
  };

  const handleCloseUndoSnackbar = () => {
    setShowUndoSnackbar(false);
    setDeletedExercise(null);
  };

  // ✅ NEW: Add exercise at specific position
  const handleAddExerciseAtIndex = (targetIndex: number) => {
    setInsertAtIndex(targetIndex);
    setOpenAddDialog(true);
  };

  // ✅ UPDATED: Add exercise function with position support
  const handleAddExercise = () => {
    const selectedExercise = availableExercises.find(ex => ex.id === selectedExerciseId);
    if (!selectedExercise) return;

    const newWorkoutExercise: WorkoutExercise = {
      id: `workout_ex_${Date.now()}`,
      exerciseId: selectedExercise.id!,
      name: selectedExercise.name,
      primaryMuscle: selectedExercise.primaryMuscle,
      equipment: selectedExercise.equipment,
      kg: 0,
      sets: 3,
      reps: 10,
      rest: 60,
      notes: '',
      order: 0 // Will be updated below
    };

    let updatedExercises;
    if (insertAtIndex !== null) {
      // Insert at specific position
      updatedExercises = [...exercises];
      updatedExercises.splice(insertAtIndex, 0, newWorkoutExercise);
    } else {
      // Add at end
      updatedExercises = [...exercises, newWorkoutExercise];
    }

    // Update order values
    updatedExercises.forEach((ex, index) => {
      ex.order = index;
    });

    handleExercisesChange(updatedExercises);
    setOpenAddDialog(false);
    setSelectedExerciseId('');
    setInsertAtIndex(null);
  };

  const handleMoveExercise = (exerciseId: string, direction: 'up' | 'down') => {
    const currentIndex = exercises.findIndex(ex => ex.id === exerciseId);
    if (currentIndex === -1) return;

    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (newIndex < 0 || newIndex >= exercises.length) return;

    const reorderedExercises = [...exercises];
    [reorderedExercises[currentIndex], reorderedExercises[newIndex]] =
      [reorderedExercises[newIndex], reorderedExercises[currentIndex]];

    // Update order values
    reorderedExercises.forEach((ex, index) => {
      ex.order = index;
    });

    handleExercisesChange(reorderedExercises);
  };

  const handleSaveScheduledWorkout = async (workoutData: ScheduledWorkout): Promise<void> => {
    if (!user) {
      throw new Error('User not authenticated');
    }

    try {
      // 1. Save detailed workout data to scheduledWorkouts collection
      await saveScheduledWorkout(user.uid, workoutData);

      // 2. Add workout task to unified scheduled activities
      const workoutDate = new Date(workoutData.scheduledDate);
      await addTaskToUnifiedSchedule(user.uid, 'gym-workout', workoutDate);

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);

      console.log('Workout saved to both scheduledWorkouts and scheduledActivities collections');
    } catch (error) {
      console.error('Error saving scheduled workout:', error);
      throw error;
    }
  };

  // Logging wrapper for exercise state updates
  const handleExercisesChange = (updatedExercises: WorkoutExercise[]) => {
    console.log('Exercises changed:', updatedExercises);
    onExercisesChange(updatedExercises);
  };

  return (
    <Box>
      {/* ✅ IMPROVED: Button group with consistent spacing (Add Exercise button removed as requested) */}
      <Box style={{ marginBottom: 24, display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
        <Typography variant="h6" component="h2" style={{ marginRight: 'auto' }}>
          {workoutType} Workout
        </Typography>
        <AccentButton
          variant="success"
          onClick={() => setOpenSaveWorkoutModal(true)}
          disabled={exercises.length === 0}
          style={{ minWidth: '140px' }}
        >
          {exercises.length === 0 ? 'No Exercises' : `Schedule Workout (${exercises.length})`}
        </AccentButton>
      </Box>

      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Order</TableCell>
              <TableCell>Exercise</TableCell>
              <TableCell>Muscle</TableCell>
              <TableCell>Equipment</TableCell>
              <TableCell align="right">KG</TableCell>
              <TableCell align="right">Sets</TableCell>
              <TableCell align="right">Reps</TableCell>
              <TableCell align="right">Rest</TableCell>
              <TableCell>Notes</TableCell>
              <TableCell>Delete</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {exercises.map((exercise, index) => (
              <React.Fragment key={exercise.id}>
                <WorkoutTableRow
                  exercise={exercise}
                  index={index}
                  editingExercise={editingExercise}
                  editingField={editingField}
                  onEditExercise={handleEditExercise}
                  onStopEditing={handleStopEditing}
                  onUpdateExercise={handleUpdateExercise}
                  onDeleteExercise={handleDeleteExercise}
                  onMoveExercise={handleMoveExercise}
                  canMoveUp={index > 0}
                  canMoveDown={index < exercises.length - 1}
                />
                {/* ✅ Only show after the LAST exercise */}
                {index === exercises.length - 1 && (
                  <TableRow>
                    <TableCell colSpan={10} sx={{ py: 1, borderBottom: 'none' }}>
                      <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                        <AccentButton
                          size="small"
                          variant="primary"
                          onClick={() => handleAddExerciseAtIndex(index + 1)}
                          className="add-exercise-hover"
                        >
                          Add Exercise Here
                        </AccentButton>
                      </Box>
                    </TableCell>
                  </TableRow>
                )}
              </React.Fragment>
            ))}
          </TableBody>
        </Table>

        {exercises.length === 0 && (
          <Box style={{ padding: 48, textAlign: 'center' }}>
            <Typography variant="h6" color="text.secondary" gutterBottom>
              Ready to build your workout?
            </Typography>
            <Typography variant="body2" color="text.secondary" style={{ marginBottom: 24 }}>
              Start by adding exercises to create your {workoutType} routine
            </Typography>
            <AccentButton
              variant="primary"
              size="large"
              onClick={() => {
                setInsertAtIndex(null);
                setOpenAddDialog(true);
              }}
              style={{ fontWeight: 600 }}
            >
              Add First Exercise
            </AccentButton>
          </Box>
        )}
      </TableContainer>

      {/* Undo Snackbar */}
      <Snackbar
        open={showUndoSnackbar}
        autoHideDuration={6000}
        onClose={handleCloseUndoSnackbar}
        action={
              <AccentButton variant="secondary" size="small" onClick={handleUndoDelete}>
            UNDO
              </AccentButton>
        }
      >
        <Alert onClose={handleCloseUndoSnackbar} severity="info" sx={{ width: '100%' }}>
          Exercise deleted
        </Alert>
      </Snackbar>

      {/* Save Workout Modal */}
      <SaveWorkoutModal
        open={openSaveWorkoutModal}
        onClose={() => setOpenSaveWorkoutModal(false)}
        onSave={handleSaveScheduledWorkout}
        workoutType={workoutType}
        exercises={exercises}
      />

      {/* Success Snackbar */}
      <Snackbar
        open={saveSuccess}
        autoHideDuration={6000}
        onClose={() => setSaveSuccess(false)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSaveSuccess(false)}
          severity="success"
          sx={{ minWidth: 300 }}
        >
          <Typography variant="subtitle2" gutterBottom>
            Workout Scheduled Successfully!
          </Typography>
          Your {workoutType.toLowerCase()} workout has been added to your schedule.
        </Alert>
      </Snackbar>

      {/* Add Exercise Dialog */}
      <Dialog open={openAddDialog} onClose={() => setOpenAddDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {insertAtIndex !== null ? `Add Exercise After Position ${insertAtIndex}` : `Add Exercise to ${workoutType}`}
        </DialogTitle>
        <DialogContent>
          <FormControl fullWidth sx={{ mt: 2 }}>
            <InputLabel id="exercise-select-label">Select Exercise</InputLabel>
            <Select
              labelId="exercise-select-label"
              value={selectedExerciseId}
              label="Select Exercise"
              onChange={(e) => setSelectedExerciseId(e.target.value)}
              sx={{ fontSize: '1rem' }}
            >
              {availableExercises
                .filter(ex => !exercises.some(we => we.exerciseId === ex.id))
                .map((exercise) => (
                  <MenuItem key={exercise.id} value={exercise.id}>
                    <Box>
                      <Typography variant="body1">{exercise.name}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {exercise.primaryMuscle} • {exercise.equipment}
                      </Typography>
                    </Box>
                  </MenuItem>
                ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
            <AccentButton 
              onClick={() => {
                setOpenAddDialog(false);
                setInsertAtIndex(null);
              }} 
              size="large"
              variant="secondary"
            >
              Cancel
            </AccentButton>
            <AccentButton
              onClick={handleAddExercise}
              variant="primary"
              disabled={!selectedExerciseId}
              size="large"
            >
              Add Exercise
            </AccentButton>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default WorkoutTable;
