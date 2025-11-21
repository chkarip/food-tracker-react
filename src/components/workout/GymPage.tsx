import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Container,
  Typography,
  Tabs,
  Tab,
  Alert,
} from '@mui/material';
import  AccentButton  from '../shared/AccentButton';
import {
  FitnessCenter as GymIcon
} from '@mui/icons-material';
import { collection, getDocs, addDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import ExerciseCard from './ExerciseCard';
import ExerciseDialog from './ExerciseDialog';
import ExerciseFilters from './ExerciseFilters';
import ProgressTab from './ProgressTab';

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
    <Box sx={{ minHeight: '100vh', p: 2 }}>
      <Paper
        sx={{
          borderRadius: 4,
          overflow: 'hidden',
          backgroundColor: 'var(--card-bg)',
          border: '1px solid var(--border-color)',
          boxShadow: 'var(--elevation-1)',
          width: { xs: '100%', lg: '80%' },
          maxWidth: 1200,
          mx: 'auto'
        }}
      >
        {/* Tabs */}
        <Box sx={{ 
          borderBottom: '2px solid var(--meal-border-primary)',
          backgroundColor: 'var(--meal-bg-card)',
          px: 2
        }}>
          <Tabs 
            value={tabValue} 
            onChange={handleTabChange} 
            aria-label="gym tabs"
            variant="scrollable"
            scrollButtons="auto"
            sx={{
              '& .MuiTab-root': {
                color: 'var(--meal-subheading-color)',
                fontWeight: 600,
                fontSize: '0.9rem',
                minHeight: 56,
                borderRadius: '8px 8px 0 0',
                transition: 'all 0.3s ease',
                '&:hover': {
                  backgroundColor: 'var(--meal-bg-hover)',
                  color: 'var(--meal-primary)',
                  transform: 'translateY(-2px)'
                },
                '&.Mui-selected': {
                  backgroundColor: 'var(--meal-bg-primary)',
                  color: 'var(--meal-primary)',
                  fontWeight: 700,
                  boxShadow: 'var(--meal-shadow-primary)',
                  '&::after': {
                    content: '""',
                    position: 'absolute',
                    bottom: 0,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    width: '60%',
                    height: '3px',
                    background: 'var(--button-primary)',
                    borderRadius: '2px 2px 0 0'
                  }
                }
              },
              '& .MuiTabs-indicator': {
                display: 'none'
              }
            }}
          >
            <Tab label="Exercise Library" sx={{ minWidth: 120 }} />
            <Tab label="Progress" sx={{ minWidth: 120 }} />
          </Tabs>
        </Box>

        {/* Content Container */}
        <Box sx={{ 
          backgroundColor: 'var(--surface-bg)',
          minHeight: 'calc(100vh - 200px)',
          p: 2
        }}>

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
        <AccentButton
          onClick={handleAddExercise}
          variant="primary"
          className="floating-action-button"
        >
          ➕
        </AccentButton>
      </TabPanel>

      {/* Tab 2: Progress */}
      <TabPanel value={tabValue} index={1}>
        <ProgressTab />
      </TabPanel>

        </Box>
      </Paper>

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
  );
};

export default GymPage;
