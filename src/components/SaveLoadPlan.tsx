import React, { useState } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Button,
  Box,
  Alert,
  CircularProgress,
  Chip,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Slider,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import { 
  Save as SaveIcon,
  CloudDownload as LoadIcon,
  History as HistoryIcon
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { saveScheduledActivities, loadScheduledActivities, saveMealPlan } from '../services/firebase';
import { SelectedFood, ExternalNutrition } from '../types/nutrition';

interface SaveLoadPlanProps {
  timeslotData: { [key: string]: { selectedFoods: SelectedFood[], externalNutrition: ExternalNutrition } };
}

const SaveLoadPlan: React.FC<SaveLoadPlanProps> = ({
  timeslotData
}) => {
  const { user, isAuthenticated } = useAuth();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showMultiDayDialog, setShowMultiDayDialog] = useState(false);
  const [numberOfDays, setNumberOfDays] = useState(1);
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [currentScheduledActivities, setCurrentScheduledActivities] = useState<{
    status: string;
    tasks: string[];
  } | null>(null);

  const handleSave = async () => {
    setShowMultiDayDialog(true);
  };

  const handleSingleDaySave = async () => {
    if (!user) return;

    setLoading(true);
    setMessage(null);

    try {
      // Use a specific date to ensure consistency with calendar
      const todayDate = new Date();
      // Create date in local timezone to match calendar
      const localDate = new Date(todayDate.getFullYear(), todayDate.getMonth(), todayDate.getDate());
      
      console.log('Saving meal plan and scheduled activities for date:', localDate.toISOString().split('T')[0]);
      
      // 1. Save detailed meal plan data to mealPlans collection
      await saveMealPlan(user.uid, timeslotData, localDate);
      
      // 2. Update unified scheduled activities
      const newTasks: string[] = [];
      
      // Add meal tasks based on current plan
      if (timeslotData['6pm']?.selectedFoods?.length > 0) {
        newTasks.push('meal-6pm');
      }
      if (timeslotData['9:30pm']?.selectedFoods?.length > 0) {
        newTasks.push('meal-9:30pm');
      }
      
      // Get existing scheduled activities to preserve gym/morning tasks
      const existing = await loadScheduledActivities(user.uid, localDate);
      const existingTasks = existing?.tasks || [];
      
      // Build new tasks array - keep existing gym/morning, update meals based on plan
      const finalTasks = [...existingTasks.filter(task => !task.startsWith('meal-')), ...newTasks];
      
      await saveScheduledActivities(user.uid, finalTasks, localDate);
      
      // Update the displayed scheduled activities
      setCurrentScheduledActivities({
        status: 'active', // Default status when saving
        tasks: finalTasks
      });
      
      setMessage({ 
        type: 'success', 
        text: 'Meal plan and schedule updated successfully! Detailed data saved to mealPlans collection, unified view updated in scheduled activities.' 
      });
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleMultiDaySave = async () => {
    if (!user) return;

    setLoading(true);
    setMessage(null);

    try {
      const promises = [];
      const start = new Date(startDate);
      
      for (let i = 0; i < numberOfDays; i++) {
        const currentDate = new Date(start);
        currentDate.setDate(start.getDate() + i);
        
        // Save both detailed meal plan AND update scheduled activities for each day
        promises.push(
          (async () => {
            // 1. Save detailed meal plan data
            await saveMealPlan(user.uid, timeslotData, currentDate);
            
            // 2. Update unified scheduled activities
            const existing = await loadScheduledActivities(user.uid, currentDate);
            const existingTasks = existing?.tasks || [];
            
            // Build new tasks array - keep existing gym/morning, update meals based on plan
            const newTasks = [...existingTasks.filter(task => !task.startsWith('meal-'))]; // Remove old meal tasks
            
            // Add meal tasks based on current plan
            if (timeslotData['6pm']?.selectedFoods?.length > 0) {
              newTasks.push('meal-6pm');
            }
            if (timeslotData['9:30pm']?.selectedFoods?.length > 0) {
              newTasks.push('meal-9:30pm');
            }
            
            return saveScheduledActivities(user.uid, newTasks, currentDate);
          })()
        );
      }
      
      await Promise.all(promises);
      setMessage({ 
        type: 'success', 
        text: `Meal plans and schedule updated for ${numberOfDays} day${numberOfDays > 1 ? 's' : ''}! Both detailed meal data and unified schedule saved.` 
      });
      setShowMultiDayDialog(false);
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleLoad = async () => {
    if (!user) return;

    setLoading(true);
    setMessage(null);

    try {
      const activities = await loadScheduledActivities(user.uid);
      if (activities && activities.tasks.length > 0) {
        setCurrentScheduledActivities({
          status: activities.status,
          tasks: activities.tasks
        });
        
        // For now, just show what's scheduled
        const scheduledMeals = activities.tasks.filter(task => task.startsWith('meal-'));
        setMessage({ 
          type: 'success', 
          text: `Found scheduled activities: ${scheduledMeals.join(', ') || 'None'}` 
        });
      } else {
        setCurrentScheduledActivities(null);
        setMessage({ type: 'error', text: 'No scheduled activities found for today' });
      }
    } catch (error: any) {
      setCurrentScheduledActivities(null);
      setMessage({ type: 'error', text: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleLoadRecent = async () => {
    if (!user) return;

    setLoading(true);
    setMessage(null);

    try {
      // For now, just show current scheduled activities
      const activities = await loadScheduledActivities(user.uid);
      if (activities) {
        setCurrentScheduledActivities({
          status: activities.status,
          tasks: activities.tasks
        });
        setMessage({ 
          type: 'success', 
          text: `Current scheduled activities loaded: ${activities.tasks.join(', ') || 'None'}` 
        });
      } else {
        setCurrentScheduledActivities(null);
        setMessage({ type: 'error', text: 'No recent scheduled activities found' });
      }
    } catch (error: any) {
      setCurrentScheduledActivities(null);
      setMessage({ type: 'error', text: error.message });
    } finally {
      setLoading(false);
    }
  };

  // Remove these unused functions since we're not using daily plans anymore
  // const handleLoadSpecificPlan = ...
  // const getTotalCalories = ...

  /*
   * PATTERN FOR OTHER COMPONENTS (Gym, Future Activities):
   * 
   * To maintain dual-system approach:
   * 1. Save detailed data to your specific collection (e.g., scheduledWorkouts for gym)
   * 2. Add task to unified schedule using helper functions:
   * 
   * import { addTaskToUnifiedSchedule } from '../services/firebase';
   * 
   * // Save detailed gym workout
   * await saveScheduledWorkout(userId, workoutData, date);
   * 
   * // Add to unified schedule view
   * await addTaskToUnifiedSchedule(userId, 'gym-workout', date);
   * 
   * This keeps detailed data separate while maintaining unified task view.
   */

  // Check if there are any selected foods in any timeslot
  const hasSelectedFoods = Object.values(timeslotData).some(data => data.selectedFoods.length > 0);

  if (!isAuthenticated) {
    return (
      <Card sx={{ mb: 3, borderRadius: 4 }}>
        <CardContent sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="h6" gutterBottom>
            🔐 Save Your Progress
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Sign in to save and sync your meal plans and schedule across devices
          </Typography>
          <Button variant="outlined" disabled>
            Sign In Required
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card sx={{ mb: 3, borderRadius: 4 }}>
      <CardContent sx={{ p: 3 }}>
        {message && (
          <Alert severity={message.type} sx={{ mb: 2 }}>
            {message.text}
          </Alert>
        )}

        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 2 }}>
          <Button
            variant="contained"
            startIcon={loading ? <CircularProgress size={16} /> : <SaveIcon />}
            onClick={handleSave}
            disabled={loading || !hasSelectedFoods}
            size="small"
          >
            Save
          </Button>

          <Button
            variant="outlined"
            startIcon={loading ? <CircularProgress size={16} /> : <LoadIcon />}
            onClick={handleLoad}
            disabled={loading}
            size="small"
          >
            Load
          </Button>

          <Button
            variant="outlined"
            startIcon={loading ? <CircularProgress size={16} /> : <HistoryIcon />}
            onClick={handleLoadRecent}
            disabled={loading}
            size="small"
          >
            Recent
          </Button>
        </Box>

        {currentScheduledActivities && (
          <Box sx={{ mt: 3, p: 2, bgcolor: 'background.paper', borderRadius: 1, border: 1, borderColor: 'divider' }}>
            <Typography variant="subtitle2" gutterBottom>
              Today's Scheduled Activities
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Status: <strong>{currentScheduledActivities.status}</strong>
            </Typography>
            {currentScheduledActivities.tasks && currentScheduledActivities.tasks.length > 0 ? (
              <Box>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  Scheduled tasks:
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {currentScheduledActivities.tasks.map((task, index) => (
                    <Chip 
                      key={index} 
                      label={task} 
                      size="small" 
                      color={task.startsWith('meal-') ? 'primary' : 'default'}
                      variant="outlined"
                    />
                  ))}
                </Box>
              </Box>
            ) : (
              <Typography variant="body2" color="text.secondary">
                No tasks scheduled
              </Typography>
            )}
          </Box>
        )}
      </CardContent>

      {/* Multi-day Save Dialog */}
      <Dialog open={showMultiDayDialog} onClose={() => setShowMultiDayDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Schedule Meals</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <TextField
              label="Start Date"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              fullWidth
              sx={{ mb: 3 }}
              InputLabelProps={{
                shrink: true,
              }}
            />
            
            <Typography gutterBottom>
              Number of Days: {numberOfDays}
            </Typography>
            <Slider
              value={numberOfDays}
              onChange={(_, value) => setNumberOfDays(value as number)}
              min={1}
              max={30}
              marks={[
                { value: 1, label: '1 day' },
                { value: 7, label: '1 week' },
                { value: 14, label: '2 weeks' },
                { value: 30, label: '1 month' }
              ]}
              sx={{ mb: 2 }}
            />
            
            <Typography variant="body2" color="text.secondary">
              This will schedule the current meal plan for {numberOfDays} consecutive day{numberOfDays > 1 ? 's' : ''} starting from {new Date(startDate).toLocaleDateString()}.
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowMultiDayDialog(false)}>Cancel</Button>
          <Button onClick={handleSingleDaySave} disabled={loading}>
            Schedule Today Only
          </Button>
          <Button onClick={handleMultiDaySave} variant="contained" disabled={loading}>
            {loading ? <CircularProgress size={20} /> : `Schedule ${numberOfDays} Day${numberOfDays > 1 ? 's' : ''}`}
          </Button>
        </DialogActions>
      </Dialog>
    </Card>
  );
};

export default SaveLoadPlan;
