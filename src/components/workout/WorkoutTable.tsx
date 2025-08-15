/**
 * WorkoutTable.tsx - Gym Workout Builder & Scheduling Interface
 * 
 * BUSINESS PURPOSE:
 * Primary interface for creating and scheduling detailed gym workouts including:
 * - Exercise selection from categorized library (chest, back, legs, etc.)
 * - Workout parameter configuration (sets, reps, weight, rest periods)
 * - Workout template creation and reuse for program consistency
 * - Calendar integration through dual-system architecture
 * - Real-time time estimation
 * 
 * KEY BUSINESS LOGIC:
 * 1. DUAL-SYSTEM INTEGRATION: Saves detailed workout to scheduledWorkouts AND registers 'gym-workout' task in scheduledActivities
 * 2. EXERCISE LIBRARY MANAGEMENT: Categorized exercise database with muscle groups and equipment specs
 * 3. WORKOUT TEMPLATES: Save/load workout configurations for program consistency
 * 4. REAL-TIME CALCULATIONS: Auto-calculates workout duration, set volume, and progression metrics
 * 5. PROGRAM VALIDATION: Ensures workout completeness before scheduling
 * 
 * CORE WORKOUT FEATURES:
 * - Parameter Configuration: Sets, reps, weight, rest period customization
 * - Template Management: Save successful workouts as reusable templates
 * - Calendar Scheduling: Direct integration with calendar system
 * - Progress Tracking: Maintains exercise progression data
 * 
 * BUSINESS VALUE:
 * - Enables structured fitness program creation and execution
 * - Supports progressive overload through detailed exercise parameter tracking
 * - Provides workout consistency through template reuse
 * - Integrates seamlessly with calendar for comprehensive program management
 * - Maintains exercise form and progression data for optimal fitness results
 */
import React, { useState, useEffect, useMemo } from 'react';
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
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Snackbar,
  Alert,
  Menu
} from '@mui/material';
import {
  Add as AddIcon,
  Save as SaveIcon,
  ExpandMore as ExpandMoreIcon,
  Schedule as ScheduleIcon
} from '@mui/icons-material';
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
  onSaveWorkout?: () => void; // Make optional since we're replacing it
}

interface WorkoutTemplate {
  id: string;
  name: string;
  workoutType: WorkoutType;
  exercises: WorkoutExercise[];
}

interface DeletedExercise {
  exercise: WorkoutExercise;
  index: number;
}

const WorkoutTable: React.FC<WorkoutTableProps> = ({
  workoutType,
  exercises,
  availableExercises,
  onExercisesChange,
  onSaveWorkout // Keep for backward compatibility but don't use
}) => {
  const { user } = useAuth();
  const [editingExercise, setEditingExercise] = useState<WorkoutExercise | null>(null);
  const [editingField, setEditingField] = useState<string | null>(null);
  const [openAddDialog, setOpenAddDialog] = useState(false);
  const [selectedExerciseId, setSelectedExerciseId] = useState('');
  const [deletedExercise, setDeletedExercise] = useState<DeletedExercise | null>(null);
  const [showUndoSnackbar, setShowUndoSnackbar] = useState(false);
  const [templateMenuAnchor, setTemplateMenuAnchor] = useState<null | HTMLElement>(null);
  const [savedTemplates, setSavedTemplates] = useState<WorkoutTemplate[]>([]);
  
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
    onExercisesChange(updatedExercises);
    
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
    onExercisesChange(updatedExercises);
    
    // Show undo snackbar
    setShowUndoSnackbar(true);
  };

  const handleUndoDelete = () => {
    if (!deletedExercise) return;
    
    const updatedExercises = [...exercises];
    updatedExercises.splice(deletedExercise.index, 0, deletedExercise.exercise);
    
    onExercisesChange(updatedExercises);
    setDeletedExercise(null);
    setShowUndoSnackbar(false);
  };

  const handleCloseUndoSnackbar = () => {
    setShowUndoSnackbar(false);
    setDeletedExercise(null);
  };

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
      order: exercises.length
    };

    onExercisesChange([...exercises, newWorkoutExercise]);
    setOpenAddDialog(false);
    setSelectedExerciseId('');
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

    onExercisesChange(reorderedExercises);
  };

  const handleSaveAsTemplate = () => {
    if (exercises.length === 0) return;
    
    const templateName = `${workoutType} Template ${new Date().toLocaleDateString()}`;
    const newTemplate: WorkoutTemplate = {
      id: `template_${Date.now()}`,
      name: templateName,
      workoutType,
      exercises: exercises.map(ex => ({ ...ex, id: `${ex.id}_template` }))
    };
    
    const updatedTemplates = [...savedTemplates, newTemplate];
    setSavedTemplates(updatedTemplates);
    
    // Save to localStorage
    localStorage.setItem('workoutTemplates', JSON.stringify(updatedTemplates));
    
    setTemplateMenuAnchor(null);
  };

  const handleLoadTemplate = (template: WorkoutTemplate) => {
    const templateExercises = template.exercises.map(ex => ({
      ...ex,
      id: `workout_ex_${Date.now()}_${Math.random()}`,
      order: ex.order
    }));
    
    onExercisesChange(templateExercises);
    setTemplateMenuAnchor(null);
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
      
      console.log('✅ Workout saved to both scheduledWorkouts and scheduledActivities collections');
    } catch (error) {
      console.error('Error saving scheduled workout:', error);
      throw error;
    }
  };

  // Load templates from localStorage on component mount
  React.useEffect(() => {
    const saved = localStorage.getItem('workoutTemplates');
    if (saved) {
      try {
        const templates = JSON.parse(saved);
        setSavedTemplates(templates);
      } catch (error) {
        console.error('Error loading templates:', error);
      }
    }
  }, []);

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 600, color: 'primary.main' }}>
          {workoutType} Workout
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<AddIcon />}
            onClick={() => setOpenAddDialog(true)}
          >
            Add Exercise
          </Button>
          
          <Button
            variant="outlined"
            startIcon={<SaveIcon />}
            endIcon={<ExpandMoreIcon />}
            onClick={(e) => setTemplateMenuAnchor(e.currentTarget)}
          >
            Template
          </Button>
          
          <Button
            variant="contained"
            onClick={() => setOpenSaveWorkoutModal(true)}
            disabled={exercises.length === 0}
            startIcon={<ScheduleIcon />}
            sx={{ minWidth: 120 }}
          >
            {exercises.length === 0 ? 'No Exercises' : `Schedule Workout (${exercises.length})`}
          </Button>
        </Box>
      </Box>

      <TableContainer component={Paper} sx={{ maxHeight: 800, mb: 3, width: '100%' }}>
        <Table stickyHeader size="small">
          <TableHead>
            <TableRow>
              <TableCell width={60} sx={{ fontSize: '0.9rem', fontWeight: 600, py: 1 }}>Order</TableCell>
              <TableCell width={220} sx={{ fontSize: '0.9rem', fontWeight: 600, py: 1 }}>Exercise</TableCell>
              <TableCell width={80} sx={{ fontSize: '0.9rem', fontWeight: 600, py: 1 }}>Muscle</TableCell>
              <TableCell width={100} sx={{ fontSize: '0.9rem', fontWeight: 600, py: 1 }}>Equipment</TableCell>
              <TableCell width={50} align="right" sx={{ fontSize: '0.9rem', fontWeight: 600, py: 1 }}>KG</TableCell>
              <TableCell width={50} align="right" sx={{ fontSize: '0.9rem', fontWeight: 600, py: 1 }}>Sets</TableCell>
              <TableCell width={50} align="right" sx={{ fontSize: '0.9rem', fontWeight: 600, py: 1 }}>Reps</TableCell>
              <TableCell width={60} align="right" sx={{ fontSize: '0.9rem', fontWeight: 600, py: 1 }}>Rest</TableCell>
              <TableCell sx={{ fontSize: '0.9rem', fontWeight: 600, py: 1 }}>Notes</TableCell>
              <TableCell width={80} sx={{ fontSize: '0.9rem', fontWeight: 600, py: 1 }}>Delete</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {exercises.map((exercise, index) => (
              <WorkoutTableRow
                key={exercise.id}
                exercise={exercise}
                index={index}
                editingExercise={editingExercise}
                editingField={editingField}
                onEditExercise={handleEditExercise}
                onStopEditing={handleStopEditing}
                onUpdateExercise={handleUpdateExercise}
                onDeleteExercise={handleDeleteExercise}
              />
            ))}
            {exercises.length === 0 && (
              <TableRow>
                <TableCell colSpan={10} align="center" sx={{ py: 4 }}>
                  <Typography variant="body1" color="text.secondary" sx={{ fontSize: '1rem' }}>
                    No exercises added yet. Click "Add Exercise" to get started.
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Template Menu */}
      <Menu
        anchorEl={templateMenuAnchor}
        open={Boolean(templateMenuAnchor)}
        onClose={() => setTemplateMenuAnchor(null)}
        sx={{ mt: 1 }}
      >
        <MenuItem onClick={handleSaveAsTemplate} disabled={exercises.length === 0}>
          <SaveIcon sx={{ mr: 1, fontSize: '1.1rem' }} />
          Save as Template
        </MenuItem>
        
        {/* Show separator only if we have both save option and load options */}
        {savedTemplates.filter(template => template.workoutType === workoutType).length > 0 && (
          <Box sx={{ borderTop: '1px solid', borderColor: 'divider', my: 1 }} />
        )}
        
        {/* Load template options */}
        {savedTemplates
          .filter(template => template.workoutType === workoutType)
          .map((template) => (
            <MenuItem key={template.id} onClick={() => handleLoadTemplate(template)}>
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  Load: {template.name}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {template.exercises.length} exercises
                </Typography>
              </Box>
            </MenuItem>
          ))}
          
        {/* Show message when no templates available */}
        {savedTemplates.filter(template => template.workoutType === workoutType).length === 0 && exercises.length === 0 && (
          <MenuItem disabled>
            <Typography variant="body2" color="text.secondary">
              No saved templates available
            </Typography>
          </MenuItem>
        )}
      </Menu>

      {/* Undo Snackbar */}
      <Snackbar
        open={showUndoSnackbar}
        autoHideDuration={5000}
        onClose={handleCloseUndoSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          severity="info" 
          action={
            <Button color="inherit" size="small" onClick={handleUndoDelete}>
              UNDO
            </Button>
          }
          onClose={handleCloseUndoSnackbar}
        >
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
        autoHideDuration={4000}
        onClose={() => setSaveSuccess(false)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert 
          severity="success" 
          onClose={() => setSaveSuccess(false)}
          sx={{ minWidth: 300 }}
        >
          <Typography variant="body2" sx={{ fontWeight: 600 }}>
            Workout Scheduled Successfully! 🎉
          </Typography>
          <Typography variant="caption">
            Your {workoutType.toLowerCase()} workout has been added to your schedule.
          </Typography>
        </Alert>
      </Snackbar>

      {/* Add Exercise Dialog */}
      <Dialog open={openAddDialog} onClose={() => setOpenAddDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontSize: '1.3rem', fontWeight: 600 }}>
          Add Exercise to {workoutType}
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <FormControl fullWidth sx={{ mt: 2 }}>
            <InputLabel sx={{ fontSize: '1.1rem' }}>Select Exercise</InputLabel>
            <Select
              value={selectedExerciseId}
              label="Select Exercise"
              onChange={(e) => setSelectedExerciseId(e.target.value)}
              sx={{ fontSize: '1rem' }}
            >
              {availableExercises
                .filter(ex => !exercises.some(we => we.exerciseId === ex.id))
                .map((exercise) => (
                  <MenuItem key={exercise.id} value={exercise.id} sx={{ py: 2 }}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                      <Typography variant="h6" sx={{ fontSize: '1.1rem', fontWeight: 600 }}>
                        {exercise.name}
                      </Typography>
                      <Typography variant="body1" color="text.secondary" sx={{ fontSize: '1rem' }}>
                        {exercise.primaryMuscle} • {exercise.equipment}
                      </Typography>
                    </Box>
                  </MenuItem>
                ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions sx={{ p: 3, gap: 2 }}>
          <Button onClick={() => setOpenAddDialog(false)} size="large">
            Cancel
          </Button>
          <Button 
            onClick={handleAddExercise}
            variant="contained"
            disabled={!selectedExerciseId}
            size="large"
          >
            Add Exercise
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default WorkoutTable;
