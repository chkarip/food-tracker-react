import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Box,
  Typography,
  Alert,
} from '@mui/material';
import { FitnessCenter as GymIcon } from '@mui/icons-material';
import { collection, getDocs, addDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import AccentButton from '../shared/AccentButton';
import ExerciseCard from './ExerciseCard';
import ExerciseDialog from './ExerciseDialog';
import ExerciseFilters from './ExerciseFilters';

// Exercise interface matching Firebase structure
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

const GymExercisesPage: React.FC = () => {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Debounced search handler
  const handleSearchChange = useCallback((value: string) => {
    setSearchTerm(value);
  }, []);
  const [filterMuscle, setFilterMuscle] = useState('');
  const [filterDifficulty, setFilterDifficulty] = useState('');
  const [openExerciseDialog, setOpenExerciseDialog] = useState(false);
  const [currentExercise, setCurrentExercise] = useState<Exercise | null>(null);
  const [exerciseForm, setExerciseForm] = useState<Omit<Exercise, 'id'>>({
    name: '',
    primaryMuscle: '',
    secondaryMuscles: [],
    category: 'Compound',
    equipment: '',
    difficulty: 'C Tier',
    instructions: '',
    isActive: true
  });

  // Load exercises from Firebase
  useEffect(() => {
    loadExercises();
  }, []);

  const loadExercises = async () => {
    try {
      setLoading(true);
      const exercisesRef = collection(db, 'exercises');
      const snapshot = await getDocs(exercisesRef);
      const exercisesList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Exercise[];
      setExercises(exercisesList.filter(ex => ex.isActive));
    } catch (error) {
      console.error('Error loading exercises:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddExercise = () => {
    setCurrentExercise(null);
    setExerciseForm({
      name: '',
      primaryMuscle: '',
      secondaryMuscles: [],
      category: 'Compound',
      equipment: '',
      difficulty: 'C Tier',
      instructions: '',
      isActive: true
    });
    setOpenExerciseDialog(true);
  };

  const handleEditExercise = (exercise: Exercise) => {
    setCurrentExercise(exercise);
    setExerciseForm({
      name: exercise.name,
      primaryMuscle: exercise.primaryMuscle,
      secondaryMuscles: exercise.secondaryMuscles,
      category: exercise.category,
      equipment: exercise.equipment,
      difficulty: exercise.difficulty,
      instructions: exercise.instructions || '',
      isActive: exercise.isActive
    });
    setOpenExerciseDialog(true);
  };

  const handleSaveExercise = async () => {
    try {
      if (currentExercise) {
        // Update existing exercise
        const exerciseRef = doc(db, 'exercises', currentExercise.id!);
        await updateDoc(exerciseRef, exerciseForm);
      } else {
        // Add new exercise
        const exercisesRef = collection(db, 'exercises');
        await addDoc(exercisesRef, exerciseForm);
      }
      setOpenExerciseDialog(false);
      loadExercises();
    } catch (error) {
      console.error('Error saving exercise:', error);
    }
  };

  const handleDeleteExercise = async (exerciseId: string) => {
    try {
      const exerciseRef = doc(db, 'exercises', exerciseId);
      await updateDoc(exerciseRef, { isActive: false });
      loadExercises();
    } catch (error) {
      console.error('Error deleting exercise:', error);
    }
  };

  // Filter exercises with memoization for performance
  const filteredExercises = useMemo(() => {
    return exercises.filter(exercise => {
      const matchesSearch = exercise.name.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
                           exercise.primaryMuscle.toLowerCase().includes(debouncedSearchTerm.toLowerCase());
      const matchesMuscle = !filterMuscle || exercise.primaryMuscle === filterMuscle;
      const matchesDifficulty = !filterDifficulty || exercise.difficulty === filterDifficulty;
      return matchesSearch && matchesMuscle && matchesDifficulty;
    });
  }, [exercises, debouncedSearchTerm, filterMuscle, filterDifficulty]);

  // Memoize unique muscles for performance
  const uniqueMuscles = useMemo(() => {
    return Array.from(new Set(exercises.map(ex => ex.primaryMuscle))).sort();
  }, [exercises]);

  return (
    <Box sx={{ width: '100%', minHeight: '100vh', px: 3, py: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 4, maxWidth: '1400px', mx: 'auto' }}>
        <Typography variant="h3" sx={{ fontWeight: 700, mb: 1, display: 'flex', alignItems: 'center', gap: 2 }}>
          <GymIcon fontSize="large" color="primary" />
          Exercise Library
        </Typography>
        <Typography variant="h6" color="text.secondary">
          Browse and manage your exercise database
        </Typography>
      </Box>

      {/* Content Container */}
      <Box sx={{ maxWidth: '1400px', mx: 'auto', width: '100%' }}>
        {/* Search and Filter Controls */}
        <ExerciseFilters
          searchTerm={searchTerm}
          filterMuscle={filterMuscle}
          filterDifficulty={filterDifficulty}
          uniqueMuscles={uniqueMuscles}
          onSearchChange={handleSearchChange}
          onMuscleChange={setFilterMuscle}
          onDifficultyChange={setFilterDifficulty}
          onClearFilters={() => {
            setSearchTerm('');
            setFilterMuscle('');
            setFilterDifficulty('');
          }}
        />

        {/* Exercise Cards Grid */}
        {loading ? (
          <Alert severity="info">Loading exercises...</Alert>
        ) : filteredExercises.length === 0 ? (
          <Alert severity="info">
            No exercises found. {searchTerm || filterMuscle || filterDifficulty ? 'Try adjusting your filters.' : 'Add your first exercise!'}
          </Alert>
        ) : (
          <Box sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' },
            gap: 3
          }}>
            {filteredExercises.map((exercise) => (
              <ExerciseCard
                key={exercise.id}
                exercise={exercise}
                onEdit={handleEditExercise}
                onDelete={handleDeleteExercise}
                onAddToWorkout={(exercise) => {
                  // TODO: Implement add to workout functionality
                  console.log('Adding to workout:', exercise.name);
                }}
              />
            ))}
          </Box>
        )}

        {/* Floating Action Button */}
        <AccentButton
          onClick={handleAddExercise}
          variant="primary"
          className="floating-action-button"
        >
          ➕
        </AccentButton>

        {/* Exercise Dialog */}
        <ExerciseDialog
          open={openExerciseDialog}
          exercise={currentExercise}
          exerciseForm={exerciseForm}
          onClose={() => setOpenExerciseDialog(false)}
          onSave={handleSaveExercise}
          onFormChange={setExerciseForm}
        />
      </Box>
    </Box>
  );
};

export default GymExercisesPage;
