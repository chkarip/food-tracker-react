import React, { useState, useMemo, useEffect } from 'react';
import {
  Box,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  ToggleButtonGroup,
  ToggleButton,
  Paper,
  Alert,
  Checkbox,
  FormControlLabel,
  FormGroup,
  CircularProgress
} from '@mui/material';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { useAuth } from '../../contexts/AuthContext';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { ScheduledWorkoutDocument } from '../../types/firebase';
import { COLLECTIONS } from '../../services/firebase/shared/utils';

interface ExerciseDataPoint {
  date: string;
  reps?: number;
  kg?: number;
  rest?: number;
}

const ProgressTab: React.FC = () => {
  const { user } = useAuth();
  const [timeframe, setTimeframe] = useState<7 | 30 | 90>(30);
  const [selectedExercise, setSelectedExercise] = useState<string>('');
  const [workouts, setWorkouts] = useState<ScheduledWorkoutDocument[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Metric visibility toggles
  const [showReps, setShowReps] = useState(true);
  const [showKg, setShowKg] = useState(true);
  const [showRest, setShowRest] = useState(false);

  // Load completed workouts
  useEffect(() => {
    if (!user?.uid) return;

    const loadWorkouts = async () => {
      try {
        setLoading(true);
        const today = new Date();
        const startDate = new Date(today);
        startDate.setDate(today.getDate() - timeframe);

        const startStr = startDate.toISOString().split('T')[0];
        const endStr = today.toISOString().split('T')[0];

        console.log('🔍 Querying workouts:', { userId: user.uid, startStr, endStr });

        // Simplified query without date range to avoid index requirements
        const q = query(
          collection(db, COLLECTIONS.SCHEDULED_WORKOUTS),
          where('userId', '==', user.uid),
          where('status', '==', 'completed')
        );

        const snapshot = await getDocs(q);
        console.log('📊 Raw query results:', snapshot.size, 'documents');
        
        let workoutsList = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as ScheduledWorkoutDocument[];

        // Filter by date range in memory
        workoutsList = workoutsList
          .filter(w => w.scheduledDate >= startStr && w.scheduledDate <= endStr)
          .sort((a, b) => a.scheduledDate.localeCompare(b.scheduledDate));

        console.log('✅ Filtered workouts:', workoutsList.length, 'in range');
        setWorkouts(workoutsList);

        // Auto-select first exercise if none selected
        if (!selectedExercise && workoutsList.length > 0) {
          const firstExercise = workoutsList[0].exercises?.[0];
          if (firstExercise) {
            setSelectedExercise(firstExercise.name);
          }
        }
      } catch (error) {
        console.error('❌ Error loading workouts:', error);
      } finally {
        setLoading(false);
      }
    };

    loadWorkouts();
  }, [user?.uid, timeframe]);

  // Extract unique exercise names from completed workouts
  const exerciseNames = useMemo(() => {
    const names = new Set<string>();
    workouts.forEach(workout => {
      workout.exercises?.forEach(ex => names.add(ex.name));
    });
    return Array.from(names).sort();
  }, [workouts]);

  // Build chart data for selected exercise
  const chartData = useMemo(() => {
    if (!selectedExercise) return [];

    const dataPoints: ExerciseDataPoint[] = [];

    workouts.forEach(workout => {
      const exercise = workout.exercises?.find(ex => ex.name === selectedExercise);
      if (exercise) {
        dataPoints.push({
          date: workout.scheduledDate,
          reps: exercise.reps || undefined,
          kg: exercise.kg || undefined,
          rest: exercise.rest || undefined
        });
      }
    });

    return dataPoints;
  }, [workouts, selectedExercise]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (workouts.length === 0) {
    return (
      <Alert severity="info" sx={{ borderRadius: 2 }}>
        <Typography variant="h6" gutterBottom>
          📊 No Completed Workouts Yet
        </Typography>
        <Typography>
          Complete some workouts to see your progress here. Mark workouts as done from the dashboard!
        </Typography>
      </Alert>
    );
  }

  return (
    <Box>
      {/* Controls */}
      <Paper sx={{ p: 3, mb: 3, bgcolor: 'var(--card-bg)', border: '1px solid var(--border-color)' }}>
        <Box sx={{ 
          display: 'flex', 
          gap: { xs: 2, sm: 3 }, 
          flexWrap: 'wrap', 
          alignItems: 'center',
          flexDirection: { xs: 'column', sm: 'row' }
        }}>
          {/* Exercise Selector */}
          <FormControl sx={{ minWidth: { xs: '100%', sm: 200 } }}>
            <InputLabel>Exercise</InputLabel>
            <Select
              value={selectedExercise}
              label="Exercise"
              onChange={(e) => setSelectedExercise(e.target.value)}
            >
              {exerciseNames.map(name => (
                <MenuItem key={name} value={name}>{name}</MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Timeframe Toggle */}
          <ToggleButtonGroup
            value={timeframe}
            exclusive
            onChange={(e, newValue) => newValue && setTimeframe(newValue)}
            size="small"
            sx={{ width: { xs: '100%', sm: 'auto' } }}
          >
            <ToggleButton value={7}>7 Days</ToggleButton>
            <ToggleButton value={30}>30 Days</ToggleButton>
            <ToggleButton value={90}>90 Days</ToggleButton>
          </ToggleButtonGroup>

          {/* Metric Toggles */}
          <FormGroup row sx={{ 
            ml: { xs: 0, sm: 'auto' },
            width: { xs: '100%', sm: 'auto' },
            justifyContent: { xs: 'space-between', sm: 'flex-start' }
          }}>
            <FormControlLabel
              control={<Checkbox checked={showReps} onChange={(e) => setShowReps(e.target.checked)} />}
              label="Reps"
            />
            <FormControlLabel
              control={<Checkbox checked={showKg} onChange={(e) => setShowKg(e.target.checked)} />}
              label="Weight (kg)"
            />
            <FormControlLabel
              control={<Checkbox checked={showRest} onChange={(e) => setShowRest(e.target.checked)} />}
              label="Rest (s)"
            />
          </FormGroup>
        </Box>
      </Paper>

      {/* Chart */}
      {chartData.length === 0 ? (
        <Alert severity="warning">
          No data found for <strong>{selectedExercise}</strong> in the selected timeframe.
        </Alert>
      ) : (
        <Paper sx={{ p: 3, bgcolor: 'var(--card-bg)', border: '1px solid var(--border-color)' }}>
          <Typography variant="h6" gutterBottom sx={{ color: 'var(--text-primary)' }}>
            Progress: {selectedExercise}
          </Typography>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
              <XAxis 
                dataKey="date" 
                stroke="var(--text-secondary)"
                tick={{ fill: 'var(--text-secondary)' }}
              />
              <YAxis 
                stroke="var(--text-secondary)"
                tick={{ fill: 'var(--text-secondary)' }}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'var(--surface-bg)', 
                  border: '1px solid var(--border-color)',
                  color: 'var(--text-primary)'
                }}
              />
              <Legend />
              {showReps && <Line type="monotone" dataKey="reps" stroke="#8884d8" strokeWidth={2} name="Reps" />}
              {showKg && <Line type="monotone" dataKey="kg" stroke="#82ca9d" strokeWidth={2} name="Weight (kg)" />}
              {showRest && <Line type="monotone" dataKey="rest" stroke="#ffc658" strokeWidth={2} name="Rest (s)" />}
            </LineChart>
          </ResponsiveContainer>
        </Paper>
      )}

      {/* Summary Stats */}
      <Paper sx={{ p: 3, mt: 3, bgcolor: 'var(--card-bg)', border: '1px solid var(--border-color)' }}>
        <Typography variant="h6" gutterBottom sx={{ color: 'var(--text-primary)' }}>
          Summary
        </Typography>
        <Box sx={{ 
          display: 'grid', 
          gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(auto-fit, minmax(150px, 1fr))' }, 
          gap: 2 
        }}>
          <Box>
            <Typography variant="caption" sx={{ color: 'var(--text-secondary)' }}>Total Sessions</Typography>
            <Typography variant="h5" sx={{ color: 'var(--text-primary)' }}>{chartData.length}</Typography>
          </Box>
          {showReps && chartData.some(d => d.reps) && (
            <Box>
              <Typography variant="caption" sx={{ color: 'var(--text-secondary)' }}>Avg Reps</Typography>
              <Typography variant="h5" sx={{ color: 'var(--text-primary)' }}>
                {(() => {
                  const validReps = chartData.filter(d => d.reps);
                  return validReps.length > 0
                    ? (chartData.reduce((sum, d) => sum + (d.reps || 0), 0) / validReps.length).toFixed(1)
                    : '0';
                })()}
              </Typography>
            </Box>
          )}
          {showKg && chartData.some(d => d.kg) && (
            <Box>
              <Typography variant="caption" sx={{ color: 'var(--text-secondary)' }}>Avg Weight (kg)</Typography>
              <Typography variant="h5" sx={{ color: 'var(--text-primary)' }}>
                {(() => {
                  const validKg = chartData.filter(d => d.kg);
                  return validKg.length > 0
                    ? (chartData.reduce((sum, d) => sum + (d.kg || 0), 0) / validKg.length).toFixed(1)
                    : '0';
                })()}
              </Typography>
            </Box>
          )}
        </Box>
      </Paper>
    </Box>
  );
};

export default ProgressTab;
