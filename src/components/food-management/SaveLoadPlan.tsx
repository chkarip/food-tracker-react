import React, { useState, useEffect } from 'react';
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
  Slider
} from '@mui/material';
import {
  Save as SaveIcon,
  CloudDownload as LoadIcon,
  History as HistoryIcon
} from '@mui/icons-material';

import { useAuth } from '../../contexts/AuthContext';
import {
  saveScheduledActivities,
  loadScheduledActivities,
  saveDailyPlan
} from '../../services/firebase/dailyPlansService';
import { getAllFoods, convertToLegacyFoodFormat } from '../../services/foodService';
import { SelectedFood, ExternalNutrition } from '../../types/nutrition';

interface SaveLoadPlanProps {
  timeslotData: {
    [key: string]: { selectedFoods: SelectedFood[]; externalNutrition: ExternalNutrition };
  };
}

const SaveLoadPlan: React.FC<SaveLoadPlanProps> = ({ timeslotData }) => {
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

  const [foodDatabase, setFoodDatabase] = useState<Record<string, any>>({});
  const [foodDatabaseLoading, setFoodDatabaseLoading] = useState(true);

  // Load food database from Firebase
  useEffect(() => {
    const loadFoodDB = async () => {
      try {
        setFoodDatabaseLoading(true);
        const firebaseFoods = await getAllFoods();
        const converted = convertToLegacyFoodFormat(firebaseFoods);
        setFoodDatabase(converted);
      } catch (error) {
        console.error('❌ Error loading food database:', error);
        setMessage({ type: 'error', text: 'Failed to load food database' });
      } finally {
        setFoodDatabaseLoading(false);
      }
    };
    loadFoodDB();
  }, []);

  const getTotalSelectedFoods = () =>
    Object.values(timeslotData).reduce((total, data) => total + data.selectedFoods.length, 0);

  const hasAnySelectedFoods = getTotalSelectedFoods() > 0;

  const handleSingleDaySave = async () => {
    if (!user) return;
    if (Object.keys(foodDatabase).length === 0) {
      setMessage({ type: 'error', text: 'Food database not loaded yet. Please wait...' });
      return;
    }
    setLoading(true);
    setMessage(null);

    try {
      const today = new Date();
      const localDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());

      await saveDailyPlan(user.uid, timeslotData, foodDatabase, localDate);

      const newTasks: string[] = [];
      if (timeslotData['6pm']?.selectedFoods?.length > 0) newTasks.push('meal-6pm');
      if (timeslotData['9:30pm']?.selectedFoods?.length > 0) newTasks.push('meal-9:30pm');

      const existing = await loadScheduledActivities(user.uid, localDate);
      const existingTasks = existing?.tasks || [];
      const finalTasks = [...existingTasks.filter(task => !task.startsWith('meal-')), ...newTasks];

      await saveScheduledActivities(user.uid, finalTasks, localDate);
      setCurrentScheduledActivities({ status: 'active', tasks: finalTasks });
      setMessage({ type: 'success', text: 'Daily meal plan saved successfully!' });
      setShowMultiDayDialog(false);
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleMultiDaySave = async () => {
    if (!user) return;
    if (Object.keys(foodDatabase).length === 0) {
      setMessage({ type: 'error', text: 'Food database not loaded yet. Please wait...' });
      return;
    }
    setLoading(true);
    setMessage(null);

    try {
      const startObj = new Date(startDate);
      const savedDates: string[] = [];

      for (let i = 0; i < numberOfDays; i++) {
        const currentDate = new Date(startObj);
        currentDate.setDate(startObj.getDate() + i);

        await saveDailyPlan(user.uid, timeslotData, foodDatabase, currentDate);

        const newTasks: string[] = [];
        if (timeslotData['6pm']?.selectedFoods?.length > 0) newTasks.push('meal-6pm');
        if (timeslotData['9:30pm']?.selectedFoods?.length > 0) newTasks.push('meal-9:30pm');

        const existing = await loadScheduledActivities(user.uid, currentDate);
        const existingTasks = existing?.tasks || [];
        const finalTasks = [...existingTasks.filter(task => !task.startsWith('meal-')), ...newTasks];

        await saveScheduledActivities(user.uid, finalTasks, currentDate);
        savedDates.push(currentDate.toLocaleDateString());
      }

      setMessage({ type: 'success', text: `Saved meal plan for: ${savedDates.join(', ')}` });
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
      const today = new Date();
      const localDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const activities = await loadScheduledActivities(user.uid, localDate);

      if (activities) {
        setCurrentScheduledActivities(activities);
        setMessage({
          type: 'success',
          text: `Loaded plan for ${localDate.toLocaleDateString()}`
        });
      } else {
        setMessage({ type: 'error', text: 'No saved plan for today' });
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setLoading(false);
    }
  };

  if (foodDatabaseLoading) {
    return (
      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <CircularProgress size={20} />
            <Typography>Loading food database...</Typography>
          </Box>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" sx={{ mb: 2 }}>
          💾 Save/Load Meal Plan
        </Typography>

        {message && (
          <Alert severity={message.type} sx={{ mb: 2 }} onClose={() => setMessage(null)}>
            {message.text}
          </Alert>
        )}

        <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
          <Button
            startIcon={loading ? <CircularProgress size={16} /> : <SaveIcon />}
            onClick={() => setShowMultiDayDialog(true)}
            disabled={loading || !hasAnySelectedFoods || !isAuthenticated}
            size="small"
            variant="contained"
          >
            Save Plan
          </Button>
          <Button
            startIcon={<LoadIcon />}
            onClick={handleLoad}
            disabled={loading || !isAuthenticated}
            size="small"
            variant="outlined"
          >
            Load Today
          </Button>
          {currentScheduledActivities && (
            <Button startIcon={<HistoryIcon />} size="small" variant="outlined" disabled>
              {currentScheduledActivities.tasks.length} activities
            </Button>
          )}
        </Box>

        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <Chip
            label={`${getTotalSelectedFoods()} foods selected`}
            color={hasAnySelectedFoods ? 'primary' : 'default'}
            size="small"
          />
          <Chip
            label={`${Object.keys(foodDatabase).length} foods in database`}
            color="success"
            size="small"
          />
        </Box>

        {!isAuthenticated && (
          <Alert severity="warning" sx={{ mt: 2 }}>
            Please log in to save/load meal plans
          </Alert>
        )}

        {/* Multi-day Save Dialog */}
        <Dialog open={showMultiDayDialog} onClose={() => setShowMultiDayDialog(false)}>
          <DialogTitle>Save Meal Plan</DialogTitle>
          <DialogContent>
            <Box sx={{ pt: 2 }}>
              <TextField
                fullWidth
                type="date"
                label="Start Date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                sx={{ mb: 3 }}
                InputLabelProps={{ shrink: true }}
              />

              <Typography gutterBottom>Number of days: {numberOfDays}</Typography>
              <Slider
                value={numberOfDays}
                onChange={(_, val) => setNumberOfDays(val as number)}
                min={1}
                max={14}
                marks
                valueLabelDisplay="auto"
                sx={{ mb: 2 }}
              />

              <Typography variant="body2" color="text.secondary">
                This will save the plan for {numberOfDays} day(s) starting from {startDate}.
              </Typography>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setShowMultiDayDialog(false)}>Cancel</Button>
            <Button
              onClick={numberOfDays === 1 ? handleSingleDaySave : handleMultiDaySave}
              variant="contained"
              disabled={loading}
            >
              {loading ? <CircularProgress size={20} /> : 'Save'}
            </Button>
          </DialogActions>
        </Dialog>
      </CardContent>
    </Card>
  );
};

export default SaveLoadPlan;
