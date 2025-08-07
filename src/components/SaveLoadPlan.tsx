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
import { saveDailyPlan, loadDailyPlan, getRecentDailyPlans } from '../services/firestoreService';
import { SelectedFood, ExternalNutrition } from '../types/nutrition';
import { DailyPlanDocument, TimeslotMealData } from '../types/firebase';

interface SaveLoadPlanProps {
  timeslotData: { [key: string]: { selectedFoods: SelectedFood[], externalNutrition: ExternalNutrition } };
  onLoadPlan: (plan: DailyPlanDocument) => void;
}

const SaveLoadPlan: React.FC<SaveLoadPlanProps> = ({
  timeslotData,
  onLoadPlan
}) => {
  const { user, isAuthenticated } = useAuth();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [recentPlans, setRecentPlans] = useState<DailyPlanDocument[]>([]);
  const [showRecent, setShowRecent] = useState(false);
  const [showMultiDayDialog, setShowMultiDayDialog] = useState(false);
  const [numberOfDays, setNumberOfDays] = useState(1);
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);

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
      
      console.log('Saving plan for date:', localDate.toISOString().split('T')[0]);
      await saveDailyPlan(user.uid, timeslotData, localDate);
      setMessage({ type: 'success', text: 'Daily plan saved successfully!' });
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
        promises.push(saveDailyPlan(user.uid, timeslotData, currentDate));
      }
      
      await Promise.all(promises);
      setMessage({ 
        type: 'success', 
        text: `Meal plan saved for ${numberOfDays} day${numberOfDays > 1 ? 's' : ''}!` 
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
      const plan = await loadDailyPlan(user.uid);
      if (plan) {
        onLoadPlan(plan);
        setMessage({ type: 'success', text: 'Daily plan loaded successfully!' });
      } else {
        setMessage({ type: 'error', text: 'No saved plan found for today' });
      }
    } catch (error: any) {
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
      const plans = await getRecentDailyPlans(user.uid, 7);
      setRecentPlans(plans);
      setShowRecent(true);
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleLoadSpecificPlan = (plan: DailyPlanDocument) => {
    onLoadPlan(plan);
    setMessage({ type: 'success', text: `Loaded plan from ${plan.date}` });
    setShowRecent(false);
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  // Check if there are any selected foods in any timeslot
  const hasSelectedFoods = Object.values(timeslotData).some(data => data.selectedFoods.length > 0);

  const getTotalCalories = (plan: DailyPlanDocument): number => {
    return Math.round(plan.totalMacros.calories);
  };

  if (!isAuthenticated) {
    return (
      <Card sx={{ mb: 3, borderRadius: 4 }}>
        <CardContent sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="h6" gutterBottom>
            🔐 Save Your Progress
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Sign in to save and sync your daily meal plans across devices
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

        {showRecent && (
          <Box>
            <Typography variant="subtitle2" gutterBottom>
              Recent Plans (Last 7 Days)
            </Typography>
            {recentPlans.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                No recent plans found
              </Typography>
            ) : (
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {recentPlans.map((plan) => (
                  <Chip
                    key={plan.id}
                    label={`${formatDate(plan.date)} (${getTotalCalories(plan)} kcal)`}
                    onClick={() => handleLoadSpecificPlan(plan)}
                    variant="outlined"
                    sx={{ cursor: 'pointer' }}
                  />
                ))}
              </Box>
            )}
            <Button
              variant="text"
              size="small"
              onClick={() => setShowRecent(false)}
              sx={{ mt: 1 }}
            >
              Hide Recent Plans
            </Button>
          </Box>
        )}
      </CardContent>

      {/* Multi-day Save Dialog */}
      <Dialog open={showMultiDayDialog} onClose={() => setShowMultiDayDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Save Meal Plan</DialogTitle>
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
              This will save the current meal plan for {numberOfDays} consecutive day{numberOfDays > 1 ? 's' : ''} starting from {new Date(startDate).toLocaleDateString()}.
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowMultiDayDialog(false)}>Cancel</Button>
          <Button onClick={handleSingleDaySave} disabled={loading}>
            Save Today Only
          </Button>
          <Button onClick={handleMultiDaySave} variant="contained" disabled={loading}>
            {loading ? <CircularProgress size={20} /> : `Save ${numberOfDays} Day${numberOfDays > 1 ? 's' : ''}`}
          </Button>
        </DialogActions>
      </Dialog>
    </Card>
  );
};

export default SaveLoadPlan;
