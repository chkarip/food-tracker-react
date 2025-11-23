/**
 * FILE: SaveLoadPlan.tsx
 * ------------------------------------------------------------------
 * (Same header comments...)
 */

import React, { useState, useEffect } from 'react';
import {
  Typography,
  Box,
  CircularProgress,
  Chip,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Slider,
  Stack,
  Snackbar,
  Alert
} from '@mui/material';
import { GenericCard } from '../shared/cards/GenericCard';
import  AccentButton  from '../shared/AccentButton';
import {  History as HistoryIcon } from '@mui/icons-material';
import { Clear as ClearIcon } from '@mui/icons-material';

import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import {
  saveScheduledActivities,
  loadScheduledActivities,
  saveDailyPlan,
  loadDailyPlan
} from '../../services/firebase/meal-planning/dailyPlansService';
import { getAllFoods, convertToLegacyFoodFormat } from '../../services/firebase/nutrition/foodService';
import { SelectedFood, ExternalNutrition } from '../../types/nutrition';
import { NumberStepper } from '../shared/inputs';
import { calculateMacros, formatMacroValue } from '../../utils/nutritionCalculations';
import { calculatePortionCost, formatCost } from '../../services/firebase/nutrition/foodService';

interface SaveLoadPlanProps {
  timeslotData: {
    [key: string]: { selectedFoods: SelectedFood[]; externalNutrition: ExternalNutrition };
  };
  onLoad: (data: {                                 // ✅ CHANGED from onLoadPlan to onLoad
    [key: string]: { selectedFoods: SelectedFood[]; externalNutrition: ExternalNutrition };
  }) => void;
  favoriteFoods?: string[]; // New prop for favorite foods
  onSelectFavorite?: (foodName: string) => void; // New callback when a favorite chip is clicked
  onClear?: () => void; // New callback to clear selected foods
  size?: 'default' | 'compact'; // New size prop for compact buttons
}

const SaveLoadPlan: React.FC<SaveLoadPlanProps> = ({ timeslotData, onLoad, favoriteFoods = [], onSelectFavorite, onClear, size = 'default' }) => {  // ✅ CHANGED prop name
  const { user, isAuthenticated } = useAuth();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [showMultiDayDialog, setShowMultiDayDialog] = useState(false);
  const [numberOfDays, setNumberOfDays] = useState(1);
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [currentScheduledActivities, setCurrentScheduledActivities] = useState<{
    status: string;
    tasks: string[];
  } | null>(null);
  const [foodDatabase, setFoodDatabase] = useState<Record<string, any>>({});
  const [foodDatabaseLoading, setFoodDatabaseLoading] = useState(true);
  const [selectedFavoriteFood, setSelectedFavoriteFood] = useState<string | null>(null);
  const [favoriteAmount, setFavoriteAmount] = useState(100);
  const [hasSavedPlan, setHasSavedPlan] = useState(false);

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
        showToast('Failed to load food database', 'error');
      } finally {
        setFoodDatabaseLoading(false);
      }
    };

    loadFoodDB();
  }, [showToast]);

  // Check if there's a saved plan for today
  useEffect(() => {
    const checkForSavedPlan = async () => {
      if (!user) {
        setHasSavedPlan(false);
        return;
      }

      try {
        const today = new Date();
        const localDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        const loadedPlan = await loadDailyPlan(user.uid, localDate);
        
        // Check if there's actually food in the saved plan
        const hasFood = loadedPlan?.timeslots && 
          (loadedPlan.timeslots['6pm']?.selectedFoods?.length > 0 || 
           loadedPlan.timeslots['9:30pm']?.selectedFoods?.length > 0);
        
        setHasSavedPlan(!!hasFood);
      } catch (error) {
        setHasSavedPlan(false);
      }
    };

    checkForSavedPlan();
  }, [user]);

  const getTotalSelectedFoods = () =>
    Object.values(timeslotData || {}).reduce((total, data) => total + (data?.selectedFoods?.length || 0), 0);

  const hasAnySelectedFoods = getTotalSelectedFoods() > 0;

  const readyToSave = isAuthenticated && Object.keys(foodDatabase).length > 0 && hasAnySelectedFoods && !loading;

  const onConfirmSingleDay = async () => {
    console.log('[SAVE] single-day clicked');
    await handleSingleDaySave();
  };

  const onConfirmMultiDay = async () => {
    console.log('[SAVE] multi-day clicked', { startDate, numberOfDays });
    await handleMultiDaySave();
  };

  const handleSingleDaySave = async () => {
    if (!user) {
      showToast('Please log in to save your plan.', 'error');
      return;
    }
    if (Object.keys(foodDatabase).length === 0) {
      showToast('Loading foods… try again in a moment.', 'error');
      return;
    }
    if (!hasAnySelectedFoods) {
      showToast('Add at least one food before saving.', 'error');
      return;
    }

    setLoading(true);

    try {
      const today = new Date();
      const localDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      console.log('[SAVE] saving to date', localDate.toDateString());

      const timeslots = timeslotData || {};
      await saveDailyPlan(user.uid, timeslots, foodDatabase, localDate);

      const newTasks: string[] = [];
      if (timeslots['6pm']?.selectedFoods?.length > 0) newTasks.push('meal-6pm');
      if (timeslots['9:30pm']?.selectedFoods?.length > 0) newTasks.push('meal-9:30pm');

      const existing = await loadScheduledActivities(user.uid, localDate);
      const existingTasks = existing?.tasks || [];
      const finalTasks = [...existingTasks.filter(task => !task.startsWith('meal-')), ...newTasks];

      await saveScheduledActivities(user.uid, finalTasks, localDate);
      setCurrentScheduledActivities({ status: 'active', tasks: finalTasks });

      showToast('Daily plan saved. Inventory updated automatically.', 'success');
      setShowMultiDayDialog(false);
      
      // Update hasSavedPlan state after saving
      setHasSavedPlan(true);
    } catch (error: any) {
      showToast(error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleMultiDaySave = async () => {
    if (!user) {
      showToast('Please log in to save your plan.', 'error');
      return;
    }
    if (Object.keys(foodDatabase).length === 0) {
      showToast('Loading foods… try again in a moment.', 'error');
      return;
    }
    if (!hasAnySelectedFoods) {
      showToast('Add at least one food before saving.', 'error');
      return;
    }

    setLoading(true);

    try {
      const startObj = new Date(startDate);
      const savedDates: string[] = [];

      for (let i = 0; i < numberOfDays; i++) {
        const currentDate = new Date(startObj);
        currentDate.setDate(startObj.getDate() + i);
        console.log('[SAVE] saving to date', currentDate.toDateString());

        const timeslots = timeslotData || {};
        await saveDailyPlan(user.uid, timeslots, foodDatabase, currentDate);

        const newTasks: string[] = [];
        if (timeslots['6pm']?.selectedFoods?.length > 0) newTasks.push('meal-6pm');
        if (timeslots['9:30pm']?.selectedFoods?.length > 0) newTasks.push('meal-9:30pm');

        const existing = await loadScheduledActivities(user.uid, currentDate);
        const existingTasks = existing?.tasks || [];
        const finalTasks = [...existingTasks.filter(task => !task.startsWith('meal-')), ...newTasks];

        await saveScheduledActivities(user.uid, finalTasks, currentDate);
        savedDates.push(currentDate.toLocaleDateString());
      }

      showToast(`Saved meal plan for: ${savedDates.join(', ')}. Inventory updated automatically.`, 'success');
      setShowMultiDayDialog(false);
    } catch (error: any) {
      showToast(error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleLoadPlan = async () => {                    // ✅ CHANGED function name for clarity
    if (!user) return;

    setLoading(true);

    try {
      const today = new Date();
      const localDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());

      // Load the meal plan from Firebase
      const loadedPlan = await loadDailyPlan(user.uid, localDate);

      if (loadedPlan && loadedPlan.timeslots) {
        // Extract the timeslot data from the loaded plan
        const loadedTimeslotData = {
          '6pm': loadedPlan.timeslots['6pm'] || { selectedFoods: [], externalNutrition: { protein: 0, fats: 0, carbs: 0, calories: 0 } },
          '9:30pm': loadedPlan.timeslots['9:30pm'] || { selectedFoods: [], externalNutrition: { protein: 0, fats: 0, carbs: 0, calories: 0 } }
        };

        // Load scheduled activities for status display
        const activities = await loadScheduledActivities(user.uid, localDate);
        if (activities) {
          setCurrentScheduledActivities(activities);
        }

        // ✅ Use onLoad callback to update parent state with loaded data
        onLoad(loadedTimeslotData);

        showToast(`Loaded plan for ${localDate.toLocaleDateString()}`, 'success');
        
        // Update hasSavedPlan state after loading
        setHasSavedPlan(true);
      } else {
        showToast('No saved plan for today', 'error');
        setHasSavedPlan(false);
      }
    } catch (error: any) {
      showToast(error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  if (foodDatabaseLoading) {
    return (
      <GenericCard
        variant="default"
        content={
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <CircularProgress size={24} sx={{ mr: 2, color: 'var(--accent-green)' }} />
            <Typography variant="body2" sx={{ color: 'var(--text-primary)' }}>Loading food database...</Typography>
          </Box>
        }
      />
    );
  }

  return (
    <>
      <GenericCard
        variant="default"
        content={
          <Box sx={{ p: 1 }}>
            <Box sx={{ 
              display: 'flex', 
              gap: 0.75, 
              flexWrap: 'wrap',
              alignItems: 'center'
            }}>
              {/* Save Plan - Only show if there are foods to save */}
              {hasAnySelectedFoods && (
                <AccentButton
                  onClick={() => {
                    console.log('[SAVE] opening dialog', { readyToSave });
                    setShowMultiDayDialog(true);
                  }}
                  disabled={!readyToSave}
                  variant="primary"
                  size="compact"
                >
                  Save Plan
                </AccentButton>
              )}

              {/* Load Today - Only show if there's a saved plan */}
              {hasSavedPlan && (
                <AccentButton
                  onClick={handleLoadPlan}
                  disabled={loading || !isAuthenticated}
                  size="compact"
                  variant="secondary"
                >
                  Load Today
                </AccentButton>
              )}

              {/* Clear Plan - Only show if there are foods to clear */}
              {hasAnySelectedFoods && (
                <AccentButton
                  onClick={() => {
                    if (onClear) {
                      onClear();
                      showToast('Meal plan cleared successfully!', 'success');
                    }
                  }}
                  disabled={loading}
                  size="compact"
                  variant="danger"
                >
                  Clear Plan
                </AccentButton>
              )}

              {currentScheduledActivities && (
                <Chip 
                  icon={<HistoryIcon />} 
                  label={`${currentScheduledActivities.tasks.length} activities`}
                  size="small" 
                  variant="outlined" 
                  disabled
                  sx={{
                    borderColor: 'var(--border-color)',
                    color: 'var(--text-secondary)',
                    backgroundColor: 'var(--surface-bg)',
                    '& .MuiChip-icon': {
                      color: 'var(--text-secondary)'
                    }
                  }}
                />
              )}
            </Box>

            {/* Favorite Foods Section */}
            {favoriteFoods.length > 0 ? (
              <Box sx={{ mt: 1.5 }}>
                <Typography 
                  variant="body2" 
                  sx={{ 
                    color: 'var(--text-secondary)', 
                    fontWeight: 600,
                    mb: 0.75,
                    fontSize: '0.8rem'
                  }}
                >
                  Favorite Foods
                </Typography>
                <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                  {favoriteFoods.map((foodName) => (
                    <Chip
                      key={foodName}
                      label={foodName}
                      size="small"
                      variant="outlined"
                      onClick={() => {
                        setSelectedFavoriteFood(foodName);
                        const defaultAmount = foodDatabase[foodName]?.isUnitFood 
                          ? (foodName === 'Eggs' ? 2 : 1) 
                          : (foodDatabase[foodName]?.useFixedAmount ? foodDatabase[foodName]?.fixedAmount || 100 : 100);
                        setFavoriteAmount(defaultAmount);
                        // Don't call onSelectFavorite here, just show controls
                      }}
                      clickable={!!onSelectFavorite}
                      aria-label={`Select favorite ${foodName}`}
                      sx={{
                        borderColor: selectedFavoriteFood === foodName ? 'var(--accent-green)' : 'var(--accent-green)',
                        color: selectedFavoriteFood === foodName ? 'white' : 'var(--accent-green)',
                        backgroundColor: selectedFavoriteFood === foodName ? 'var(--accent-green)' : 'var(--meal-bg-primary)',
                        fontSize: '0.7rem',
                        height: '24px',
                        cursor: onSelectFavorite ? 'pointer' : 'default',
                        '&:hover': {
                          backgroundColor: selectedFavoriteFood === foodName ? 'var(--accent-green)' : 'var(--meal-bg-hover)',
                          borderColor: 'var(--accent-green)',
                        }
                      }}
                    />
                  ))}
                </Box>
              </Box>
            ) : (
              <Box sx={{ mt: 1.5 }}>
                <Typography 
                  variant="body2" 
                  sx={{ 
                    color: 'var(--text-secondary)', 
                    fontWeight: 600,
                    mb: 0.75,
                    fontSize: '0.8rem'
                  }}
                >
                  Favorite Foods
                </Typography>
                <AccentButton
                  onClick={() => {
                    // TODO: Implement navigation to food management page
                    console.log('Navigate to food management to add favorites');
                  }}
                  variant="secondary"
                  size="small"
                  style={{
                    fontSize: '0.7rem',
                    padding: '4px 10px',
                    minHeight: '24px'
                  }}
                >
                  Add More Favorites
                </AccentButton>
              </Box>
            )}

            {/* Favorite Food Controls */}
            {selectedFavoriteFood && (
              <Box sx={{ mt: 1.5, p: 1.5, backgroundColor: 'var(--meal-row-bg)', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
                <Typography variant="subtitle2" sx={{ mb: 0.75, color: 'var(--text-primary)', fontWeight: 600, fontSize: '0.85rem' }}>
                  Configure {selectedFavoriteFood}
                </Typography>
                
                <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 1.5 }}>
                  <Typography variant="body2" sx={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                    Amount:
                  </Typography>
                  <NumberStepper
                    value={favoriteAmount}
                    onChange={setFavoriteAmount}
                    min={0}
                    max={10000}
                    step={foodDatabase[selectedFavoriteFood]?.isUnitFood ? 1 : 5}
                    unit={foodDatabase[selectedFavoriteFood]?.isUnitFood ? 'units' : 'g'}
                    size="small"
                  />
                </Stack>
                
                {/* Preview Macros */}
                {(() => {
                  const macros = calculateMacros(selectedFavoriteFood, favoriteAmount, foodDatabase);
                  const cost = calculatePortionCost(selectedFavoriteFood, favoriteAmount, foodDatabase);
                  
                  return (
                    <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1.5 }}>
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          background: 'var(--meal-chip-bg)',
                          padding: '4px 8px',
                          borderRadius: 'var(--radius-sm)',
                          color: 'var(--text-primary)',
                          fontWeight: 600,
                          fontSize: '0.75rem',
                          border: '1px solid var(--meal-chip-outline)'
                        }}
                      >
                        {formatMacroValue(macros.protein)}g P · {formatMacroValue(macros.fats)}g F · {formatMacroValue(macros.carbs)}g C · {formatMacroValue(macros.calories)} kcal
                      </Typography>
                      
                      {cost !== null && (
                        <Typography 
                          variant="body2" 
                          sx={{ 
                            background: 'var(--meal-chip-bg)',
                            padding: '4px 8px',
                            borderRadius: 'var(--radius-sm)',
                            color: 'var(--text-primary)',
                            fontWeight: 600,
                            fontSize: '0.8rem',
                            border: '1px solid var(--meal-chip-outline)'
                          }}
                        >
                          {formatCost(cost)}
                        </Typography>
                      )}
                    </Stack>
                  );
                })()}
                
                <Stack direction="row" spacing={0.75}>
                  <AccentButton 
                    onClick={() => {
                      // Add the favorite food to the current timeslot
                      const foodToAdd: SelectedFood = { name: selectedFavoriteFood, amount: favoriteAmount };
                      // We need to call the parent's onAddFood, but we don't have direct access
                      // Instead, we'll use the onSelectFavorite callback with a special flag
                      if (onSelectFavorite) {
                        onSelectFavorite(`${selectedFavoriteFood}|${favoriteAmount}`);
                      }
                      setSelectedFavoriteFood(null);
                      setFavoriteAmount(100);
                    }}
                    size="small"
                    style={{ minWidth: '70px', fontSize: '0.8rem' }}
                  >
                    Add
                  </AccentButton>
                  <AccentButton 
                    onClick={() => {
                      setSelectedFavoriteFood(null);
                      setFavoriteAmount(100);
                    }}
                    variant="secondary"
                    size="small"
                    style={{ minWidth: '70px', fontSize: '0.8rem' }}
                  >
                    Cancel
                  </AccentButton>
                </Stack>
              </Box>
            )}

            {!isAuthenticated && (
              <Typography variant="caption" sx={{ mt: 1, display: 'block', color: 'var(--text-secondary)', fontSize: '0.75rem' }}>
                Please log in to save/load meal plans
              </Typography>
            )}

            {isAuthenticated && !hasAnySelectedFoods && (
              <Typography variant="caption" sx={{ mt: 1, display: 'block', color: 'var(--warning-color)', fontSize: '0.75rem' }}>
                Add some foods to your meal plan before saving
              </Typography>
            )}

            {isAuthenticated && hasAnySelectedFoods && (
              <Typography variant="caption" sx={{ mt: 1, display: 'block', color: 'var(--accent-green)', fontSize: '0.75rem' }}>
                Ready to save {getTotalSelectedFoods()} food item(s)
              </Typography>
            )}
          </Box>
        }
      />

      {/* Multi-day Save Dialog */}
      <Dialog 
        open={showMultiDayDialog} 
        onClose={() => {
          console.log('Dialog close clicked');
          setShowMultiDayDialog(false);
        }}
        sx={{
          '& .MuiDialog-paper': {
            backgroundColor: 'var(--card-bg)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-lg)',
            boxShadow: 'var(--elevation-2)'
          }
        }}
      >
        <DialogTitle sx={{ color: 'var(--text-primary)', borderBottom: '1px solid var(--border-color)' }}>Save Meal Plan</DialogTitle>
        <DialogContent sx={{ backgroundColor: 'var(--card-bg)' }}>
          <TextField
            label="Start Date"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            sx={{ 
              mb: 3,
              '& .MuiInputBase-root': {
                backgroundColor: 'var(--surface-bg)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-md)',
                color: 'var(--text-primary)'
              },
              '& .MuiInputLabel-root': {
                color: 'var(--text-secondary)'
              }
            }}
            InputLabelProps={{ shrink: true }}
            fullWidth
          />

          <Typography gutterBottom sx={{ color: 'var(--text-primary)' }}>
            Number of days: {numberOfDays}
          </Typography>
          <Slider
            value={numberOfDays}
            onChange={(_, val) => setNumberOfDays(val as number)}
            min={1}
            max={14}
            marks
            valueLabelDisplay="auto"
            sx={{ 
              mb: 2,
              '& .MuiSlider-track': {
                backgroundColor: 'var(--accent-green)'
              },
              '& .MuiSlider-thumb': {
                backgroundColor: 'var(--accent-green)',
                '&:hover': {
                  boxShadow: 'var(--elevation-1)'
                }
              }
            }}
          />

          <Typography variant="body2" sx={{ color: 'var(--text-secondary)' }}>
            This will save the plan for {numberOfDays} day(s) starting from {startDate}.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ 
          backgroundColor: 'var(--surface-bg)', 
          borderTop: '1px solid var(--border-color)',
          padding: '12px 16px'
        }}>
          <AccentButton 
            onClick={() => setShowMultiDayDialog(false)}
            variant="secondary"
            size="medium"
          >
            Cancel
          </AccentButton>
          <AccentButton
            onClick={numberOfDays === 1 ? onConfirmSingleDay : onConfirmMultiDay}
            variant="primary"
            disabled={loading}
            loading={loading}
          >
            Save
          </AccentButton>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default SaveLoadPlan;
