import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  CircularProgress,
  Alert,
  Snackbar,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import {
  FitnessCenter as WorkoutIcon,
  Add as AddIcon,
  CalendarMonth as CalendarIcon
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { getUserTemplatesForWorkoutType } from '../../services/firebase/workout/templateService';
import { saveScheduledWorkout, getScheduledWorkoutsForMonth } from '../../services/firebase/workout/workoutService';
import { WorkoutTemplateDocument } from '../../types/template';
import { ScheduledWorkoutDocument } from '../../types/firebase';
import { CalendarDay } from '../../modules/shared/types';
import Calendar from '../calendar/Calendar';
import PageCard from '../shared/PageCard';
import { useNavigate } from 'react-router-dom';

const GymSchedulePage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [templates, setTemplates] = useState<WorkoutTemplateDocument[]>([]);
  const [scheduledWorkouts, setScheduledWorkouts] = useState<ScheduledWorkoutDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTemplate, setSelectedTemplate] = useState<WorkoutTemplateDocument | null>(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);

  // Load user's workout templates
  useEffect(() => {
    const loadTemplates = async () => {
      if (!user) return;
      
      try {
        setLoading(true);
        const userTemplates = await getUserTemplatesForWorkoutType(user.uid);
        setTemplates(userTemplates);
      } catch (error) {
        console.error('Error loading templates:', error);
        setSnackbarMessage('Failed to load workout templates');
        setSnackbarOpen(true);
      } finally {
        setLoading(false);
      }
    };

    loadTemplates();
  }, [user]);

  // Load scheduled workouts for the current month
  useEffect(() => {
    const loadScheduledWorkouts = async () => {
      if (!user) return;

      try {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth() + 1; // JavaScript months are 0-indexed
        const workouts = await getScheduledWorkoutsForMonth(user.uid, year, month);
        setScheduledWorkouts(workouts);
      } catch (error) {
        console.error('Error loading scheduled workouts:', error);
        setSnackbarMessage('Failed to load scheduled workouts');
        setSnackbarOpen(true);
      }
    };

    loadScheduledWorkouts();
  }, [user, currentDate]);

  // Generate calendar days for the current month
  const calendarDays: CalendarDay[] = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startingDayOfWeek = firstDay.getDay();
    const days: CalendarDay[] = [];

    // Create a map of scheduled workouts by date for quick lookup
    const workoutsByDate = new Map<string, ScheduledWorkoutDocument[]>();
    scheduledWorkouts.forEach(workout => {
      if (!workoutsByDate.has(workout.scheduledDate)) {
        workoutsByDate.set(workout.scheduledDate, []);
      }
      workoutsByDate.get(workout.scheduledDate)!.push(workout);
    });

    // Add empty days for alignment
    for (let i = 0; i < startingDayOfWeek; i++) {
      const prevMonthDate = new Date(year, month, -startingDayOfWeek + i + 1);
      const dateStr = prevMonthDate.toISOString().split('T')[0];
      const dayWorkouts = workoutsByDate.get(dateStr) || [];
      
      days.push({
        date: prevMonthDate,
        isCurrentMonth: false,
        isToday: false,
        hasEvents: dayWorkouts.length > 0,
        events: dayWorkouts.map(w => ({
          type: 'gym',
          title: w.name,
          completed: w.status === 'completed',
          workoutId: w.id
        })),
        scheduledTasks: dayWorkouts.map(w => `🏋️ ${w.name}`),
        moduleData: {
          gym: dayWorkouts.length > 0 ? {
            hasWorkout: true,
            completed: dayWorkouts[0].status === 'completed'
          } : undefined
        }
      });
    }

    // Add days of current month
    for (let day = 1; day <= lastDay.getDate(); day++) {
      const date = new Date(year, month, day);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      date.setHours(0, 0, 0, 0);
      
      const dateStr = date.toISOString().split('T')[0];
      const dayWorkouts = workoutsByDate.get(dateStr) || [];
      
      days.push({
        date: date,
        isCurrentMonth: true,
        isToday: date.getTime() === today.getTime(),
        hasEvents: dayWorkouts.length > 0,
        events: dayWorkouts.map(w => ({
          type: 'gym',
          title: w.name,
          completed: w.status === 'completed',
          workoutId: w.id
        })),
        scheduledTasks: dayWorkouts.map(w => `🏋️ ${w.name}`),
        moduleData: {
          gym: dayWorkouts.length > 0 ? {
            hasWorkout: true,
            completed: dayWorkouts[0].status === 'completed'
          } : undefined
        }
      });
    }

    // Add remaining days to fill the grid
    const remainingDays = 42 - days.length; // 6 rows × 7 days
    for (let i = 1; i <= remainingDays; i++) {
      const nextMonthDate = new Date(year, month + 1, i);
      const dateStr = nextMonthDate.toISOString().split('T')[0];
      const dayWorkouts = workoutsByDate.get(dateStr) || [];
      
      days.push({
        date: nextMonthDate,
        isCurrentMonth: false,
        isToday: false,
        hasEvents: dayWorkouts.length > 0,
        events: dayWorkouts.map(w => ({
          type: 'gym',
          title: w.name,
          completed: w.status === 'completed',
          workoutId: w.id
        })),
        scheduledTasks: dayWorkouts.map(w => `🏋️ ${w.name}`),
        moduleData: {
          gym: dayWorkouts.length > 0 ? {
            hasWorkout: true,
            completed: dayWorkouts[0].status === 'completed'
          } : undefined
        }
      });
    }

    return days;
  }, [currentDate, scheduledWorkouts]);

  const handleTemplateClick = (template: WorkoutTemplateDocument) => {
    setSelectedTemplate(template);
    setSnackbarMessage('Select a day on the calendar to schedule this workout');
    setSnackbarOpen(true);
  };

  const handleDayClick = (day: CalendarDay) => {
    if (!selectedTemplate) {
      setSnackbarMessage('Please select a workout template first');
      setSnackbarOpen(true);
      return;
    }

    setSelectedDay(day.date);
    setConfirmDialogOpen(true);
  };

  const handleScheduleWorkout = async () => {
    if (!user || !selectedTemplate || !selectedDay) return;

    try {
      // Calculate estimated duration (assume 3 minutes per exercise + rest time)
      const estimatedDuration = selectedTemplate.exercises.reduce((total, exercise) => {
        // Each exercise: sets * (exercise time + rest), roughly 3 min per set
        return total + (exercise.sets * 3);
      }, 0);

      await saveScheduledWorkout(user.uid, {
        name: selectedTemplate.name,
        workoutType: selectedTemplate.workoutType,
        exercises: selectedTemplate.exercises,
        scheduledDate: selectedDay,
        status: 'scheduled',
        completedAt: null,
        notes: selectedTemplate.description || '',
        estimatedDuration: estimatedDuration
      });

      setSnackbarMessage(`Workout scheduled for ${selectedDay.toLocaleDateString()}`);
      setSnackbarOpen(true);
      setSelectedTemplate(null);
      setConfirmDialogOpen(false);
      setSelectedDay(null);

      // Reload scheduled workouts to update the calendar
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth() + 1;
      const workouts = await getScheduledWorkoutsForMonth(user.uid, year, month);
      setScheduledWorkouts(workouts);
    } catch (error) {
      console.error('Error scheduling workout:', error);
      setSnackbarMessage('Failed to schedule workout');
      setSnackbarOpen(true);
    }
  };

  const handleNavigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(newDate.getMonth() - 1);
      } else {
        newDate.setMonth(newDate.getMonth() + 1);
      }
      return newDate;
    });
  };

  const handleGoToToday = () => {
    setCurrentDate(new Date());
  };

  return (
    <PageCard title="Workout Schedule">
      <Box sx={{ display: 'flex', gap: 3, minHeight: '600px' }}>
        {/* Left Side: Workout Templates */}
        <Box sx={{ 
          flex: '0 0 300px',
          display: 'flex',
          flexDirection: 'column',
          gap: 2
        }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6" sx={{ fontWeight: 600, color: 'var(--text-primary)' }}>
              Workout Templates
            </Typography>
            <Button
              variant="outlined"
              startIcon={<AddIcon />}
              size="small"
              onClick={() => navigate('/gym/workouts')}
              sx={{ borderRadius: 2 }}
            >
              New
            </Button>
          </Box>

          {selectedTemplate && (
            <Alert severity="info" sx={{ borderRadius: 2 }}>
              <Typography variant="body2">
                <strong>{selectedTemplate.name}</strong> selected. Click a day to schedule.
              </Typography>
            </Alert>
          )}

          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress size={24} />
            </Box>
          ) : templates.length === 0 ? (
            <Paper sx={{ 
              p: 3, 
              textAlign: 'center',
              bgcolor: 'var(--surface-bg)',
              border: '1px solid var(--border-color)',
              borderRadius: 2
            }}>
              <WorkoutIcon sx={{ fontSize: 48, color: 'var(--text-secondary)', opacity: 0.5, mb: 2 }} />
              <Typography variant="body2" sx={{ color: 'var(--text-secondary)', mb: 2 }}>
                No workout templates yet
              </Typography>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => navigate('/gym/workouts')}
                sx={{ 
                  bgcolor: 'var(--accent-orange)',
                  '&:hover': { bgcolor: 'var(--accent-orange-dark)' }
                }}
              >
                Create Template
              </Button>
            </Paper>
          ) : (
            <Box sx={{ 
              display: 'flex',
              flexDirection: 'column',
              gap: 1.5,
              overflowY: 'auto',
              maxHeight: 'calc(100vh - 300px)'
            }}>
              {templates.map((template) => (
                <Paper
                  key={template.id}
                  onClick={() => handleTemplateClick(template)}
                  sx={{
                    p: 2,
                    cursor: 'pointer',
                    border: selectedTemplate?.id === template.id 
                      ? '2px solid var(--accent-orange)'
                      : '1px solid var(--border-color)',
                    bgcolor: selectedTemplate?.id === template.id 
                      ? 'rgba(255, 152, 0, 0.1)'
                      : 'var(--card-bg)',
                    borderRadius: 2,
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      boxShadow: 'var(--elevation-2)',
                      borderColor: 'var(--accent-orange)'
                    }
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                    <WorkoutIcon sx={{ 
                      color: selectedTemplate?.id === template.id 
                        ? 'var(--accent-orange)' 
                        : 'var(--text-secondary)',
                      fontSize: 24,
                      mt: 0.5
                    }} />
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography 
                        variant="subtitle1" 
                        sx={{ 
                          fontWeight: 600,
                          color: 'var(--text-primary)',
                          mb: 0.5
                        }}
                      >
                        {template.name}
                      </Typography>
                      <Chip 
                        label={template.workoutType}
                        size="small"
                        sx={{ 
                          mb: 1,
                          bgcolor: 'var(--accent-blue)',
                          color: 'white',
                          fontSize: '0.7rem'
                        }}
                      />
                      <Typography 
                        variant="caption" 
                        sx={{ 
                          color: 'var(--text-secondary)',
                          display: 'block'
                        }}
                      >
                        {template.exercises.length} exercises
                      </Typography>
                      {template.description && (
                        <Typography 
                          variant="caption" 
                          sx={{ 
                            color: 'var(--text-secondary)',
                            display: 'block',
                            mt: 0.5,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                          }}
                        >
                          {template.description}
                        </Typography>
                      )}
                    </Box>
                  </Box>
                </Paper>
              ))}
            </Box>
          )}
        </Box>

        {/* Right Side: Calendar */}
        <Box sx={{ flex: 1 }}>
          {scheduledWorkouts.length > 0 && (
            <Alert severity="success" sx={{ mb: 2, borderRadius: 2 }}>
              <Typography variant="body2">
                <strong>{scheduledWorkouts.length}</strong> workout{scheduledWorkouts.length !== 1 ? 's' : ''} scheduled this month
              </Typography>
            </Alert>
          )}
          <Calendar
            currentDate={currentDate}
            calendarDays={calendarDays}
            onNavigateMonth={handleNavigateMonth}
            onGoToToday={handleGoToToday}
            onDayClick={handleDayClick}
          />
        </Box>
      </Box>

      {/* Confirmation Dialog */}
      <Dialog
        open={confirmDialogOpen}
        onClose={() => setConfirmDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <CalendarIcon sx={{ color: 'var(--accent-orange)' }} />
          Schedule Workout
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ mb: 2 }}>
            Schedule <strong>{selectedTemplate?.name}</strong> for{' '}
            <strong>{selectedDay?.toLocaleDateString('en-US', { 
              weekday: 'long',
              month: 'long',
              day: 'numeric',
              year: 'numeric'
            })}</strong>?
          </Typography>
          {selectedTemplate && (
            <Box sx={{ 
              p: 2, 
              bgcolor: 'var(--surface-bg)', 
              borderRadius: 2,
              border: '1px solid var(--border-color)'
            }}>
              <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                Workout Details:
              </Typography>
              <Typography variant="body2" sx={{ color: 'var(--text-secondary)' }}>
                • Type: {selectedTemplate.workoutType}
              </Typography>
              <Typography variant="body2" sx={{ color: 'var(--text-secondary)' }}>
                • Exercises: {selectedTemplate.exercises.length}
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDialogOpen(false)}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleScheduleWorkout}
            sx={{
              bgcolor: 'var(--accent-orange)',
              '&:hover': { bgcolor: 'var(--accent-orange-dark)' }
            }}
          >
            Schedule
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={4000}
        onClose={() => setSnackbarOpen(false)}
        message={snackbarMessage}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      />
    </PageCard>
  );
};

export default GymSchedulePage;
