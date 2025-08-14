import React, { useState, useEffect } from 'react';
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
import { collection, doc, getDocs, setDoc, getDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { saveScheduledActivities, loadScheduledActivities } from '../../services/firebase';
import { WorkoutType, Workout, WorkoutExercise } from '../../types/workout';
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
  const [currentWorkout, setCurrentWorkout] = useState<Workout>({
    name: 'Lower A',
    exercises: [],
    lastModified: new Date(),
    isActive: true
  });
  const [availableExercises, setAvailableExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const workoutTypes: WorkoutType[] = ['Lower A', 'Lower B', 'Upper A', 'Upper B'];

  // Load available exercises from Firebase
  useEffect(() => {
    loadExercises();
  }, []);

  // Load selected workout when workout type changes
  useEffect(() => {
    loadWorkout(selectedWorkoutType);
  }, [selectedWorkoutType]);

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

  const loadWorkout = async (workoutType: WorkoutType) => {
    try {
      const workoutRef = doc(db, 'workouts', workoutType.toLowerCase().replace(' ', '_'));
      const workoutDoc = await getDoc(workoutRef);
      
      if (workoutDoc.exists()) {
        const workoutData = workoutDoc.data() as any;
        setCurrentWorkout({
          ...workoutData,
          lastModified: workoutData.lastModified?.toDate ? workoutData.lastModified.toDate() : new Date()
        });
      } else {
        // Create empty workout
        setCurrentWorkout({
          name: workoutType,
          exercises: [],
          lastModified: new Date(),
          isActive: true
        });
      }
    } catch (error) {
      console.error('Error loading workout:', error);
    }
  };

  const handleWorkoutTypeChange = (workoutType: WorkoutType) => {
    setSelectedWorkoutType(workoutType);
  };

  const handleExercisesChange = (exercises: WorkoutExercise[]) => {
    setCurrentWorkout(prev => ({
      ...prev,
      exercises,
      lastModified: new Date()
    }));
  };

  const handleSaveWorkout = async () => {
    if (!user) return;
    
    try {
      setSaving(true);
      const workoutRef = doc(db, 'workouts', selectedWorkoutType.toLowerCase().replace(' ', '_'));
      await setDoc(workoutRef, {
        ...currentWorkout,
        lastModified: new Date()
      });
      
      // Update scheduled activities to mark gym as scheduled for today (preserve meal flags)
      const todayDate = new Date();
      const localDate = new Date(todayDate.getFullYear(), todayDate.getMonth(), todayDate.getDate());
      
      // Get existing scheduled activities to preserve meal flags
      const existing = await loadScheduledActivities(user.uid, localDate);
      const existingTasks = existing?.tasks || [];
      
      // Build new tasks array - keep existing meal tasks, update gym
      const newTasks = [...existingTasks.filter(task => task !== 'gym')]; // Remove old gym task
      
      // Add gym task if workout has exercises
      if (currentWorkout.exercises.length > 0) {
        newTasks.push('gym');
      }
      
      console.log('Updating scheduled activities for gym:', newTasks);
      await saveScheduledActivities(user.uid, newTasks, localDate);
      
      console.log(`${selectedWorkoutType} workout saved and scheduled successfully!`);
    } catch (error) {
      console.error('Error saving workout:', error);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Alert severity="info">
        Loading exercises and workouts...
      </Alert>
    );
  }

  return (
    <Box sx={{ width: '100%' }}>
      {/* Workout Type Selector */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, mb: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            My Workouts
          </Typography>
          <FormControl sx={{ minWidth: 250 }}>
            <InputLabel>Workout Type</InputLabel>
            <Select
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
        </Box>
        
        <Typography variant="body2" color="text.secondary">
          Create and manage your workout routines. Each workout can contain multiple exercises with specific weights, sets, reps, and rest periods.
          {currentWorkout.exercises.length > 0 && (
            <>
              <br />
              <strong>Current workout:</strong> {currentWorkout.exercises.length} exercises, {currentWorkout.exercises.reduce((total, ex) => total + ex.sets, 0)} total sets
              <br />
              Last modified: {currentWorkout.lastModified.toLocaleDateString()} at {currentWorkout.lastModified.toLocaleTimeString()}
            </>
          )}
        </Typography>
      </Paper>

      {/* Workout Table */}
      <WorkoutTable
        workoutType={selectedWorkoutType}
        exercises={currentWorkout.exercises}
        availableExercises={availableExercises}
        onExercisesChange={handleExercisesChange}
        onSaveWorkout={handleSaveWorkout}
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
