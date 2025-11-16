import React, { useState, useEffect } from 'react';
import { useTemplates } from '../../hooks/useTemplates';
import {
  Box,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Paper,
  Alert
} from '@mui/material';

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

  // New template system hook
  const {
    templates,
    selectedTemplate,
    loadTemplatesForWorkoutType,
    loadTemplate,
    saveTemplate,
    clearSelectedTemplate
  } = useTemplates();

  const workoutTypes: WorkoutType[] = ['Lower A', 'Lower B', 'Upper A', 'Upper B'];

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

  // New function to fetch templates for the selected workout type
  // ✅ FIXED VERSION
  const fetchTemplates = async () => {
    if (!user) return;
    await loadTemplatesForWorkoutType(selectedWorkoutType); // Correct function name, no setTemplates needed
  };

  const handleWorkoutTypeChange = (workoutType: WorkoutType) => {
    setSelectedWorkoutType(workoutType);
    clearSelectedTemplate(); // ✅ Clear template when changing workout type
  };

  const handleExercisesChange = (exercises: WorkoutExercise[]) => {
    console.log('Updating exercises:', exercises);
    setCurrentWorkout(prev => ({
      ...prev,
      exercises,
      lastModified: new Date()
    }));
  };

  // Handle template loading
  const handleLoadTemplate = async (templateId: string) => {
    const template = await loadTemplate(templateId);
    console.log('Loaded template:', template);
    if (template) {
      setCurrentWorkout({
        name: template.name,
        exercises: template.exercises,
        lastModified: new Date(),
        isActive: true,
      });
    }
  };

  // Handle template saving/updating
  const handleSaveTemplate = async () => {
    try {
      const templateName = selectedTemplate?.name || 
        `${selectedWorkoutType} - ${new Date().toLocaleDateString()}`;
      
      const templateData: SaveTemplateInput = {
        name: templateName,
        workoutType: selectedWorkoutType,
        exercises: currentWorkout.exercises,
        description: selectedTemplate ? 'Updated template' : 'New template'
      };

      await saveTemplate(templateData, selectedTemplate?.id);
      
      // Success notification
      console.log(selectedTemplate ? 'Template updated!' : 'Template created!');
      
    } catch (error) {
      console.error('Error saving template:', error);
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
    <Box component={Paper} p={3}>
      {/* Header */}
      <Typography variant="h4" gutterBottom>
        My Workouts
      </Typography>

      {/* Workout Type Selector */}
      <FormControl fullWidth sx={{ mb: 2 }}>
        <InputLabel id="workout-type-label">Workout Type</InputLabel>
        <Select
          labelId="workout-type-label"
          value={selectedWorkoutType}
          label="Workout Type"
          onChange={(e) => handleWorkoutTypeChange(e.target.value as WorkoutType)}
        >
          {workoutTypes.map((type) => (
            <MenuItem key={type} value={type}>
              {type}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Create and manage your workout routines. Each workout can contain multiple exercises with specific weights, sets, reps, and rest periods.
      </Typography>

      {/* Current Workout Info */}
      {currentWorkout.exercises.length > 0 && (
        <Alert severity="info" sx={{ mb: 2 }}>
          Current workout: {currentWorkout.exercises.length} exercises, {' '}
          {currentWorkout.exercises.reduce((total, ex) => total + ex.sets, 0)} total sets
          <br />
          Last modified: {currentWorkout.lastModified.toLocaleDateString()} at {' '}
          {currentWorkout.lastModified.toLocaleTimeString()}
        </Alert>
      )}

      {/* Template Controls */}
      <Box sx={{ mb: 3, display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
        {/* Load Template Button */}
        <AccentButton 
          onClick={fetchTemplates}
          variant="secondary"
        >
          Load Template
        </AccentButton>

        {/* Template Dropdown */}
        {templates.length > 0 && (
          <FormControl sx={{ minWidth: 200 }}>
            <InputLabel id="template-select-label">Select Template</InputLabel>
            <Select
              labelId="template-select-label"
              value={selectedTemplate?.id || ''}
              label="Select Template"
              onChange={(e) => e.target.value && handleLoadTemplate(e.target.value as string)}
            >
              <MenuItem value="">
                <em>Select a template...</em>
              </MenuItem>
              {templates.map((template) => (
                <MenuItem key={template.id} value={template.id}>
                  {template.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        )}

        {/* Save/Update Template Button */}
        <AccentButton 
          onClick={handleSaveTemplate}
          variant="primary"
          disabled={currentWorkout.exercises.length === 0}
        >
          {selectedTemplate ? `Update "${selectedTemplate.name}"` : 'Save as New Template'}
        </AccentButton>

        {/* Clear Selection Button */}
        {selectedTemplate && (
          <AccentButton 
            onClick={clearSelectedTemplate}
            variant="secondary"
          >
            Clear Selection
          </AccentButton>
        )}
      </Box>

      {/* Workout Table */}
      <WorkoutTable
        workoutType={selectedWorkoutType}
        exercises={currentWorkout.exercises}
        availableExercises={availableExercises}
        onExercisesChange={handleExercisesChange}
      />

      {/* Saving Indicator */}
      {saving && (
        <Alert severity="info" sx={{ mt: 2 }}>
          Saving {selectedWorkoutType} workout...
        </Alert>
      )}
    </Box>
  );
};

export default WorkoutBuilder;
