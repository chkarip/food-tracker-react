import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Button,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Fab,
  Alert
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  FitnessCenter as GymIcon,
  Timer as TimerIcon,
  TrendingUp as ProgressIcon
} from '@mui/icons-material';

interface Exercise {
  id: string;
  name: string;
  type: 'strength' | 'cardio' | 'flexibility';
  category: string;
}

interface WorkoutSet {
  reps?: number;
  weight?: number;
  duration?: number; // in seconds for cardio
  distance?: number; // in km for cardio
}

interface WorkoutExercise {
  exerciseId: string;
  exercise: Exercise;
  sets: WorkoutSet[];
  notes?: string;
}

interface Workout {
  id: string;
  date: string;
  name: string;
  exercises: WorkoutExercise[];
  duration: number; // in minutes
  notes?: string;
  completed: boolean;
}

const GymPage: React.FC = () => {
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [openWorkoutDialog, setOpenWorkoutDialog] = useState(false);
  const [currentWorkout, setCurrentWorkout] = useState<Workout | null>(null);
  const [exercises] = useState<Exercise[]>([
    // Strength exercises
    { id: '1', name: 'Bench Press', type: 'strength', category: 'Chest' },
    { id: '2', name: 'Squats', type: 'strength', category: 'Legs' },
    { id: '3', name: 'Deadlift', type: 'strength', category: 'Back' },
    { id: '4', name: 'Pull-ups', type: 'strength', category: 'Back' },
    { id: '5', name: 'Push-ups', type: 'strength', category: 'Chest' },
    { id: '6', name: 'Shoulder Press', type: 'strength', category: 'Shoulders' },
    // Cardio exercises
    { id: '7', name: 'Running', type: 'cardio', category: 'Cardio' },
    { id: '8', name: 'Cycling', type: 'cardio', category: 'Cardio' },
    { id: '9', name: 'Rowing', type: 'cardio', category: 'Cardio' },
    // Flexibility
    { id: '10', name: 'Yoga', type: 'flexibility', category: 'Flexibility' },
    { id: '11', name: 'Stretching', type: 'flexibility', category: 'Flexibility' },
  ]);

  useEffect(() => {
    // Load workouts for selected date
    loadWorkoutsForDate(selectedDate);
  }, [selectedDate]);

  const loadWorkoutsForDate = (date: string) => {
    // This would typically fetch from a database
    // For now, we'll use local storage or mock data
    const storedWorkouts = localStorage.getItem(`gym-workouts-${date}`);
    if (storedWorkouts) {
      setWorkouts(JSON.parse(storedWorkouts));
    } else {
      setWorkouts([]);
    }
  };

  const saveWorkout = (workout: Workout) => {
    const updatedWorkouts = currentWorkout
      ? workouts.map(w => w.id === workout.id ? workout : w)
      : [...workouts, { ...workout, id: Date.now().toString() }];
    
    setWorkouts(updatedWorkouts);
    localStorage.setItem(`gym-workouts-${selectedDate}`, JSON.stringify(updatedWorkouts));
    setOpenWorkoutDialog(false);
    setCurrentWorkout(null);
  };

  const deleteWorkout = (workoutId: string) => {
    const updatedWorkouts = workouts.filter(w => w.id !== workoutId);
    setWorkouts(updatedWorkouts);
    localStorage.setItem(`gym-workouts-${selectedDate}`, JSON.stringify(updatedWorkouts));
  };

  const createNewWorkout = () => {
    setCurrentWorkout({
      id: '',
      date: selectedDate,
      name: '',
      exercises: [],
      duration: 0,
      completed: false
    });
    setOpenWorkoutDialog(true);
  };

  const editWorkout = (workout: Workout) => {
    setCurrentWorkout(workout);
    setOpenWorkoutDialog(true);
  };

  const getWorkoutTypeColor = (type: string) => {
    switch (type) {
      case 'strength': return 'primary';
      case 'cardio': return 'error';
      case 'flexibility': return 'secondary';
      default: return 'default';
    }
  };

  const getTodayStats = () => {
    const todayWorkouts = workouts.filter(w => w.completed);
    const totalDuration = todayWorkouts.reduce((sum, w) => sum + w.duration, 0);
    const totalExercises = todayWorkouts.reduce((sum, w) => sum + w.exercises.length, 0);
    
    return {
      workoutsCompleted: todayWorkouts.length,
      totalDuration,
      totalExercises,
      completionRate: workouts.length > 0 ? (todayWorkouts.length / workouts.length) * 100 : 0
    };
  };

  const stats = getTodayStats();

  return (
    <Container maxWidth="lg" sx={{ py: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h3" sx={{ fontWeight: 700, mb: 1, display: 'flex', alignItems: 'center', gap: 2 }}>
          <GymIcon fontSize="large" color="primary" />
          Gym Tracker
        </Typography>
        <Typography variant="h6" color="text.secondary">
          Track your workouts and monitor your fitness progress
        </Typography>
      </Box>

      {/* Date Selector */}
      <Card sx={{ mb: 3, borderRadius: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <TextField
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              sx={{ minWidth: 200 }}
            />
            <Typography variant="h6" sx={{ ml: 2 }}>
              {new Date(selectedDate).toLocaleDateString('en-US', { 
                weekday: 'long', 
                month: 'long', 
                day: 'numeric' 
              })}
            </Typography>
          </Box>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <Box sx={{ 
        display: 'grid', 
        gridTemplateColumns: { xs: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' },
        gap: 2, 
        mb: 3 
      }}>
        <Card sx={{ borderRadius: 3 }}>
          <CardContent sx={{ textAlign: 'center' }}>
            <Typography variant="h4" color="primary" sx={{ fontWeight: 700 }}>
              {stats.workoutsCompleted}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Workouts Completed
            </Typography>
          </CardContent>
        </Card>
        
        <Card sx={{ borderRadius: 3 }}>
          <CardContent sx={{ textAlign: 'center' }}>
            <Typography variant="h4" color="error" sx={{ fontWeight: 700 }}>
              {stats.totalDuration}m
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Total Duration
            </Typography>
          </CardContent>
        </Card>
        
        <Card sx={{ borderRadius: 3 }}>
          <CardContent sx={{ textAlign: 'center' }}>
            <Typography variant="h4" color="success.main" sx={{ fontWeight: 700 }}>
              {stats.totalExercises}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Exercises Done
            </Typography>
          </CardContent>
        </Card>
        
        <Card sx={{ borderRadius: 3 }}>
          <CardContent sx={{ textAlign: 'center' }}>
            <Typography variant="h4" color="warning.main" sx={{ fontWeight: 700 }}>
              {Math.round(stats.completionRate)}%
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Completion Rate
            </Typography>
          </CardContent>
        </Card>
      </Box>

      {/* Workouts List */}
      <Card sx={{ mb: 3, borderRadius: 3 }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
            <TimerIcon /> Today's Workouts
          </Typography>
          
          {workouts.length === 0 ? (
            <Alert severity="info" sx={{ borderRadius: 2 }}>
              No workouts planned for this day. Click the + button to add a new workout!
            </Alert>
          ) : (
            <List>
              {workouts.map((workout) => (
                <ListItem
                  key={workout.id}
                  sx={{
                    mb: 1,
                    bgcolor: workout.completed ? 'success.50' : 'background.default',
                    borderRadius: 2,
                    border: 1,
                    borderColor: workout.completed ? 'success.200' : 'divider'
                  }}
                >
                  <ListItemText
                    primary={workout.name || 'Unnamed Workout'}
                    secondary={
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          {workout.exercises.length} exercises • {workout.duration} minutes
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                          {workout.exercises.map((ex, index) => (
                            <Chip
                              key={index}
                              label={ex.exercise.name}
                              size="small"
                              color={getWorkoutTypeColor(ex.exercise.type) as any}
                              variant="outlined"
                            />
                          ))}
                        </Box>
                      </Box>
                    }
                  />
                  <ListItemSecondaryAction>
                    <IconButton onClick={() => editWorkout(workout)} size="small">
                      <EditIcon />
                    </IconButton>
                    <IconButton 
                      onClick={() => deleteWorkout(workout.id)} 
                      size="small"
                      color="error"
                    >
                      <DeleteIcon />
                    </IconButton>
                  </ListItemSecondaryAction>
                </ListItem>
              ))}
            </List>
          )}
        </CardContent>
      </Card>

      {/* Floating Action Button */}
      <Fab
        color="primary"
        sx={{ position: 'fixed', bottom: 16, right: 16 }}
        onClick={createNewWorkout}
      >
        <AddIcon />
      </Fab>

      {/* Workout Dialog */}
      <WorkoutDialog
        open={openWorkoutDialog}
        workout={currentWorkout}
        exercises={exercises}
        onSave={saveWorkout}
        onClose={() => {
          setOpenWorkoutDialog(false);
          setCurrentWorkout(null);
        }}
      />
    </Container>
  );
};

// Workout Dialog Component
interface WorkoutDialogProps {
  open: boolean;
  workout: Workout | null;
  exercises: Exercise[];
  onSave: (workout: Workout) => void;
  onClose: () => void;
}

const WorkoutDialog: React.FC<WorkoutDialogProps> = ({
  open,
  workout,
  exercises,
  onSave,
  onClose
}) => {
  const [workoutData, setWorkoutData] = useState<Workout>({
    id: '',
    date: new Date().toISOString().split('T')[0],
    name: '',
    exercises: [],
    duration: 0,
    completed: false
  });

  useEffect(() => {
    if (workout) {
      setWorkoutData(workout);
    } else {
      setWorkoutData({
        id: '',
        date: new Date().toISOString().split('T')[0],
        name: '',
        exercises: [],
        duration: 0,
        completed: false
      });
    }
  }, [workout]);

  const handleSave = () => {
    if (!workoutData.name.trim()) return;
    onSave(workoutData);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        {workout ? 'Edit Workout' : 'New Workout'}
      </DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
          <TextField
            label="Workout Name"
            value={workoutData.name}
            onChange={(e) => setWorkoutData({ ...workoutData, name: e.target.value })}
            fullWidth
          />
          
          <TextField
            label="Duration (minutes)"
            type="number"
            value={workoutData.duration}
            onChange={(e) => setWorkoutData({ ...workoutData, duration: parseInt(e.target.value) || 0 })}
            fullWidth
          />

          <FormControl fullWidth>
            <InputLabel>Status</InputLabel>
            <Select
              value={workoutData.completed ? 'completed' : 'planned'}
              onChange={(e) => setWorkoutData({ ...workoutData, completed: e.target.value === 'completed' })}
            >
              <MenuItem value="planned">Planned</MenuItem>
              <MenuItem value="completed">Completed</MenuItem>
            </Select>
          </FormControl>

          <TextField
            label="Notes"
            value={workoutData.notes || ''}
            onChange={(e) => setWorkoutData({ ...workoutData, notes: e.target.value })}
            multiline
            rows={3}
            fullWidth
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button 
          onClick={handleSave} 
          variant="contained"
          disabled={!workoutData.name.trim()}
        >
          Save Workout
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default GymPage;
