import React, { useState, useEffect } from 'react';
import { useTemplates } from '../../hooks/useTemplates';
import {
  Box,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  IconButton,
  Tooltip
} from '@mui/material';
import { Delete as DeleteIcon } from '@mui/icons-material';

import  AccentButton  from '../shared/AccentButton';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { WorkoutType, WorkoutExercise } from '../../types/workout';
import { SaveTemplateInput } from '../../types/template'; // ✅ Proper import
import WorkoutTable from './WorkoutTable';

interface Exercise {
  id?: string;
  name: string;
  primaryMuscle: string;
  secondaryMuscles: string[];
  category: 'Compound' | 'Isolation' | 'Isometric';
  equipment: string;
  difficulty: 'S Tier' | 'A Tier' | 'B Tier' | 'C Tier' | 'D Tier';
  instructions?: string;
  isActive: boolean;
}

const WorkoutBuilder: React.FC = () => {
  const { user } = useAuth();
  const [selectedWorkoutType, setSelectedWorkoutType] = useState<WorkoutType>('Lower A');
  const [currentWorkout, setCurrentWorkout] = useState({
    name: 'Lower A',
    exercises: [] as WorkoutExercise[],
    lastModified: new Date(),
    isActive: true
  });

  console.log('Initial currentWorkout state:', currentWorkout);
  const [availableExercises, setAvailableExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [newWorkoutTypeDialog, setNewWorkoutTypeDialog] = useState(false);
  const [newWorkoutTypeName, setNewWorkoutTypeName] = useState('');
  const [customWorkoutTypes, setCustomWorkoutTypes] = useState<WorkoutType[]>([]);
  const [newTemplateDialog, setNewTemplateDialog] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState('');
  
  // Track original template state to detect changes
  const [originalTemplateName, setOriginalTemplateName] = useState('');
  const [originalExercises, setOriginalExercises] = useState<WorkoutExercise[]>([]);

  // New template system hook
  const {
    templates,
    selectedTemplate,
    loadTemplatesForWorkoutType,
    loadTemplate,
    saveTemplate,
    clearSelectedTemplate,
    deleteTemplate
  } = useTemplates();

  const defaultWorkoutTypes: WorkoutType[] = ['Lower A', 'Lower B', 'Upper A', 'Upper B'];
  const workoutTypes: WorkoutType[] = [...defaultWorkoutTypes, ...customWorkoutTypes];

  // Load available exercises from Firebase
  useEffect(() => {
    loadExercises();
  }, []);

  // Load latest template when workout type changes
  useEffect(() => {
    const loadLatestTemplate = async () => {
      if (!user) return;
      
      // Clear current selection when changing workout type
      clearSelectedTemplate();
      
      // Load templates for the selected workout type
      await loadTemplatesForWorkoutType(selectedWorkoutType);
    };
    
    loadLatestTemplate();
  }, [selectedWorkoutType, user, loadTemplatesForWorkoutType, clearSelectedTemplate]);

  // Auto-select latest template when templates are loaded
  useEffect(() => {
    if (templates.length > 0 && !selectedTemplate) {
      // Auto-load the most recent template (sorted by lastUsed desc)
      const latestTemplate = templates[0];
      loadTemplate(latestTemplate.id).then(template => {
        if (template) {
          setCurrentWorkout({
            name: template.name,
            exercises: template.exercises,
            lastModified: new Date(),
            isActive: true,
          });
          setTemplateName(template.name);
          
          // Store original state for change detection
          setOriginalTemplateName(template.name);
          setOriginalExercises([...template.exercises]);
        }
      });
    } else if (templates.length === 0 && !selectedTemplate) {
      // No templates available, show empty workout
      setCurrentWorkout({
        name: selectedWorkoutType,
        exercises: [],
        lastModified: new Date(),
        isActive: true,
      });
      setTemplateName(`${selectedWorkoutType} Template`);
      
      // Clear original state
      setOriginalTemplateName('');
      setOriginalExercises([]);
    }
  }, [templates, selectedTemplate, loadTemplate, selectedWorkoutType]);

  const loadExercises = async () => {
    try {
      const exercisesRef = collection(db, 'exercises');
      const snapshot = await getDocs(exercisesRef);
      const exercisesList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Exercise[];
      setAvailableExercises(exercisesList.filter(ex => ex.isActive));
    } catch (error) {
      console.error('Error loading exercises:', error);
    } finally {
      setLoading(false);
    }
  };

  // Removed legacy loadWorkout function

  const handleWorkoutTypeChange = (value: string) => {
    if (value === '__new__') {
      setNewWorkoutTypeDialog(true);
      return;
    }
    setSelectedWorkoutType(value as WorkoutType);
    clearSelectedTemplate(); // ✅ Clear template when changing workout type
  };

  const handleCreateNewWorkoutType = () => {
    if (!newWorkoutTypeName.trim()) {
      alert('Please enter a workout type name');
      return;
    }

    const newType = newWorkoutTypeName.trim() as WorkoutType;
    setCustomWorkoutTypes(prev => [...prev, newType]);
    setSelectedWorkoutType(newType);
    setNewWorkoutTypeDialog(false);
    setNewWorkoutTypeName('');
    setTemplateName(`${newType} Template`);
  };

  const handleCreateNewTemplate = () => {
    // Open dialog to enter template name
    setNewTemplateDialog(true);
    setNewTemplateName('');
  };

  const handleConfirmNewTemplate = () => {
    if (!newTemplateName.trim()) {
      alert('Please enter a template name');
      return;
    }

    // Clear current template selection and set up for new template
    clearSelectedTemplate();
    setTemplateName(newTemplateName.trim());
    setCurrentWorkout({
      name: newTemplateName.trim(),
      exercises: [],
      lastModified: new Date(),
      isActive: true,
    });
    
    // Clear original state since this is a new template
    setOriginalTemplateName('');
    setOriginalExercises([]);
    
    setNewTemplateDialog(false);
    setNewTemplateName('');
  };

  const handleDeleteTemplate = async () => {
    if (!selectedTemplate?.id) return;

    const confirmDelete = window.confirm(
      `Are you sure you want to delete the template "${selectedTemplate.name}"? This action cannot be undone.`
    );

    if (!confirmDelete) return;

    try {
      await deleteTemplate(selectedTemplate.id);
      
      // Clear current state and reload templates
      clearSelectedTemplate();
      setCurrentWorkout({
        name: selectedWorkoutType,
        exercises: [],
        lastModified: new Date(),
        isActive: true,
      });
      setTemplateName(`${selectedWorkoutType} Template`);
      
      // Clear original state
      setOriginalTemplateName('');
      setOriginalExercises([]);
      
      // Reload templates for current workout type
      await loadTemplatesForWorkoutType(selectedWorkoutType);
      
      console.log('Template deleted successfully');
    } catch (error) {
      console.error('Error deleting template:', error);
      alert('Failed to delete template. Please try again.');
    }
  };

  const handleExercisesChange = (exercises: WorkoutExercise[]) => {
    console.log('Updating exercises:', exercises);
    setCurrentWorkout(prev => ({
      ...prev,
      exercises,
      lastModified: new Date()
    }));
  };

  // Check if there are unsaved changes
  const hasChanges = () => {
    if (!selectedTemplate) return false; // No template selected, so no changes to track
    
    const nameChanged = templateName !== originalTemplateName;
    const exercisesChanged = JSON.stringify(currentWorkout.exercises) !== JSON.stringify(originalExercises);
    
    return nameChanged || exercisesChanged;
  };

  // Reset to original template state
  const handleReset = () => {
    if (!selectedTemplate) return;
    
    setTemplateName(originalTemplateName);
    setCurrentWorkout(prev => ({
      ...prev,
      exercises: [...originalExercises],
      lastModified: new Date()
    }));
  };

  // Handle template loading
  const handleLoadTemplate = async (templateId: string) => {
    const template = await loadTemplate(templateId);
    console.log('Loaded template:', template);
    if (template) {
      const workoutState = {
        name: template.name,
        exercises: template.exercises,
        lastModified: new Date(),
        isActive: true,
      };
      
      setCurrentWorkout(workoutState);
      setTemplateName(template.name);
      
      // Store original state for change detection
      setOriginalTemplateName(template.name);
      setOriginalExercises([...template.exercises]);
    }
  };

  // Handle template saving/updating
  const handleSaveTemplate = async () => {
    if (!templateName.trim()) {
      alert('Please enter a template name');
      return;
    }

    setSaving(true);
    try {
      const templateData: SaveTemplateInput = {
        name: templateName.trim(),
        workoutType: selectedWorkoutType,
        exercises: currentWorkout.exercises,
        description: selectedTemplate ? 'Updated template' : 'New template'
      };

      await saveTemplate(templateData, selectedTemplate?.id);
      
      // Update original state after successful save
      setOriginalTemplateName(templateName.trim());
      setOriginalExercises([...currentWorkout.exercises]);
      
      // Success notification
      console.log(selectedTemplate ? 'Template updated!' : 'Template created!');
      
    } catch (error) {
      console.error('Error saving template:', error);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Box p={3}>
        <Alert severity="info">
          Loading exercises and workouts...
        </Alert>
      </Box>
    );
  }

  return (
    <Box>
      {/* Workout Type Selector */}
      <FormControl fullWidth sx={{ mb: 2 }}>
        <InputLabel id="workout-type-label">Workout Type</InputLabel>
        <Select
          labelId="workout-type-label"
          value={selectedWorkoutType}
          label="Workout Type"
          onChange={(e) => handleWorkoutTypeChange(e.target.value)}
        >
          {workoutTypes.map((type) => (
            <MenuItem key={type} value={type}>
              {type}
            </MenuItem>
          ))}
          <MenuItem 
            value="__new__" 
            sx={{ 
              color: 'primary.main', 
              fontWeight: 600,
              borderTop: '1px solid',
              borderColor: 'divider',
              mt: 1
            }}
          >
            + Create New Workout Type
          </MenuItem>
        </Select>
      </FormControl>

      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Create and manage your workout routines. Each workout can contain multiple exercises with specific weights, sets, reps, and rest periods.
      </Typography>

      {/* Template Controls */}
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'flex-start', mb: 2 }}>
        {/* Template Dropdown with Delete Button */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <FormControl sx={{ minWidth: 200 }}>
            <InputLabel id="template-select-label">Select Template</InputLabel>
            <Select
              labelId="template-select-label"
              value={selectedTemplate?.id || ''}
              label="Select Template"
              onChange={(e) => {
                if (e.target.value === '__new__') {
                  handleCreateNewTemplate();
                } else if (e.target.value) {
                  handleLoadTemplate(e.target.value as string);
                }
              }}
            >
              <MenuItem value="">
                <em>Select a template...</em>
              </MenuItem>
              {templates.map((template) => (
                <MenuItem key={template.id} value={template.id}>
                  {template.name}
                </MenuItem>
              ))}
              <MenuItem 
                value="__new__" 
                sx={{ 
                  color: 'primary.main', 
                  fontWeight: 600,
                  borderTop: '1px solid',
                  borderColor: 'divider',
                  mt: 1
                }}
              >
                + Create New Template
              </MenuItem>
            </Select>
          </FormControl>
          
          {/* Delete Template Icon Button */}
          {selectedTemplate && (
            <Tooltip title="Delete Template">
              <IconButton 
                onClick={handleDeleteTemplate}
                color="error"
                sx={{ 
                  mt: 1,
                  '&:hover': { 
                    backgroundColor: 'rgba(211, 47, 47, 0.1)' 
                  }
                }}
              >
                <DeleteIcon />
              </IconButton>
            </Tooltip>
          )}
        </Box>          {/* Template Name Input */}
          <TextField
            label="Template Name"
            value={templateName}
            onChange={(e) => setTemplateName(e.target.value)}
            placeholder={`e.g., "${selectedWorkoutType} - Monday"`}
            sx={{ minWidth: 300, flex: 1 }}
            size="medium"
            helperText={selectedTemplate ? "Editing existing template name" : "Enter a name for your new template"}
          />

        {/* Save/Update Template Button - Show conditionally */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, pt: 1 }}>
          {selectedTemplate ? (
            // Show Update and Reset buttons only when there are changes
            hasChanges() && (
              <>
                <AccentButton 
                  onClick={handleSaveTemplate}
                  variant="primary"
                  disabled={currentWorkout.exercises.length === 0 || !templateName.trim()}
                >
                  Update Template
                </AccentButton>
                <AccentButton 
                  onClick={handleReset}
                  variant="secondary"
                >
                  Reset
                </AccentButton>
              </>
            )
          ) : (
            // Show Save button for new templates
            <AccentButton 
              onClick={handleSaveTemplate}
              variant="primary"
              disabled={currentWorkout.exercises.length === 0 || !templateName.trim()}
            >
              Save as New Template
            </AccentButton>
          )}
        </Box>
      </Box>        {selectedTemplate && templateName !== selectedTemplate.name && (
          <Alert severity="warning" sx={{ mt: 1 }}>
            You're changing the template name from "<strong>{selectedTemplate.name}</strong>" to "<strong>{templateName}</strong>"
          </Alert>
        )}
      </Box>

      {/* Workout Table */}
      <WorkoutTable
        workoutType={selectedWorkoutType}
        exercises={currentWorkout.exercises}
        availableExercises={availableExercises}
        onExercisesChange={handleExercisesChange}
      />

      {/* Current Workout Info */}
      {currentWorkout.exercises.length > 0 && (
        <Alert severity="info" sx={{ mt: 2 }}>
          Current workout: {currentWorkout.exercises.length} exercises, {' '}
          {currentWorkout.exercises.reduce((total, ex) => total + ex.sets, 0)} total sets
          <br />
          Last modified: {currentWorkout.lastModified.toLocaleDateString()} at {' '}
          {currentWorkout.lastModified.toLocaleTimeString()}
        </Alert>
      )}

      {/* Saving Indicator */}
      {saving && (
        <Alert severity="info" sx={{ mt: 2 }}>
          Saving {selectedWorkoutType} workout...
        </Alert>
      )}

      {/* Create New Workout Type Dialog */}
      <Dialog 
        open={newWorkoutTypeDialog} 
        onClose={() => {
          setNewWorkoutTypeDialog(false);
          setNewWorkoutTypeName('');
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Create New Workout Type</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Workout Type Name"
            fullWidth
            value={newWorkoutTypeName}
            onChange={(e) => setNewWorkoutTypeName(e.target.value)}
            placeholder="e.g., Full Body, Push/Pull, Cardio"
            helperText="Enter a custom name for your workout type"
            sx={{ mt: 2 }}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                handleCreateNewWorkoutType();
              }
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setNewWorkoutTypeDialog(false);
            setNewWorkoutTypeName('');
          }}>
            Cancel
          </Button>
          <Button 
            onClick={handleCreateNewWorkoutType}
            variant="contained"
            disabled={!newWorkoutTypeName.trim()}
          >
            Create
          </Button>
        </DialogActions>
      </Dialog>

      {/* Create New Template Dialog */}
      <Dialog 
        open={newTemplateDialog} 
        onClose={() => {
          setNewTemplateDialog(false);
          setNewTemplateName('');
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Create New Template</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Enter a name for your new {selectedWorkoutType} template. You'll be able to add exercises after creating it.
          </Typography>
          <TextField
            autoFocus
            margin="dense"
            label="Template Name"
            fullWidth
            value={newTemplateName}
            onChange={(e) => setNewTemplateName(e.target.value)}
            placeholder={`e.g., ${selectedWorkoutType} - Monday, Heavy Day, Volume Focus`}
            helperText="Give your template a descriptive name"
            sx={{ mt: 1 }}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                handleConfirmNewTemplate();
              }
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setNewTemplateDialog(false);
            setNewTemplateName('');
          }}>
            Cancel
          </Button>
          <Button 
            onClick={handleConfirmNewTemplate}
            variant="contained"
            disabled={!newTemplateName.trim()}
          >
            Create & Add Exercises
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default WorkoutBuilder;
