import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Tabs,
  Tab,
  Alert,
  Fab
} from '@mui/material';
import {
  Add as AddIcon,
  FitnessCenter as GymIcon
} from '@mui/icons-material';
import { collection, getDocs, addDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import ExerciseCard from './ExerciseCard';
import ExerciseDialog from './ExerciseDialog';
import ExerciseFilters from './ExerciseFilters';
import WorkoutBuilder from './WorkoutBuilder';

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

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`gym-tabpanel-${index}`}
      aria-labelledby={`gym-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const GymPage: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
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

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
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

  // Filter exercises
  const filteredExercises = exercises.filter(exercise => {
    const matchesSearch = exercise.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         exercise.primaryMuscle.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesMuscle = !filterMuscle || exercise.primaryMuscle === filterMuscle;
    const matchesDifficulty = !filterDifficulty || exercise.difficulty === filterDifficulty;
    return matchesSearch && matchesMuscle && matchesDifficulty;
  });

  const uniqueMuscles = Array.from(new Set(exercises.map(ex => ex.primaryMuscle))).sort();

  return (
    <Box sx={{ width: '100%', minHeight: '100vh', px: 3, py: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 4, maxWidth: '1400px', mx: 'auto' }}>
        <Typography variant="h3" sx={{ fontWeight: 700, mb: 1, display: 'flex', alignItems: 'center', gap: 2 }}>
          <GymIcon fontSize="large" color="primary" />
          Gym Tracker
        </Typography>
        <Typography variant="h6" color="text.secondary">
          Manage your workouts and track your fitness progress
        </Typography>
      </Box>

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3, maxWidth: '1400px', mx: 'auto' }}>
        <Tabs value={tabValue} onChange={handleTabChange} aria-label="gym tabs">
          <Tab label="Exercise Library" />
          <Tab label="My Workouts" />
          <Tab label="Progress" />
        </Tabs>
      </Box>

      {/* Content Container */}
      <Box sx={{ maxWidth: '1400px', mx: 'auto', width: '100%' }}>

      {/* Tab 1: Exercise Library */}
      <TabPanel value={tabValue} index={0}>
        {/* Search and Filter Controls */}
        <ExerciseFilters
          searchTerm={searchTerm}
          filterMuscle={filterMuscle}
          filterDifficulty={filterDifficulty}
          uniqueMuscles={uniqueMuscles}
          onSearchChange={setSearchTerm}
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
        <Fab
          color="primary"
          sx={{ position: 'fixed', bottom: 16, right: 16 }}
          onClick={handleAddExercise}
        >
          <AddIcon />
        </Fab>
      </TabPanel>

      {/* Tab 2: My Workouts */}
      <TabPanel value={tabValue} index={1}>
        <WorkoutBuilder />
      </TabPanel>

      {/* Tab 3: Progress */}
      <TabPanel value={tabValue} index={2}>
        <Alert severity="info" sx={{ borderRadius: 2 }}>
          <Typography variant="h6" gutterBottom>
            📊 Coming Soon: Progress Tracking
          </Typography>
          <Typography>
            Track your strength gains, personal records, and workout analytics here.
          </Typography>
        </Alert>
      </TabPanel>

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

export default GymPage;
