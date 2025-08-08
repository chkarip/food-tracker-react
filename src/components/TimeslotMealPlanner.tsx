import React, { useState, useCallback, useMemo } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Tabs,
  Tab,
  Stack
} from '@mui/material';
import {
  WbSunny as AfternoonIcon,
  Nightlight as EveningIcon
} from '@mui/icons-material';
import MacroProgress from './MacroProgress';
import FoodSelectorWithFirebase from './FoodSelectorWithFirebase';
import ExternalNutritionInput from './ExternalNutritionInput';
import SaveLoadPlan from './SaveLoadPlan';
import MealCostDisplay from './MealCostDisplay';
import { SelectedFood, ExternalNutrition } from '../types/nutrition';
import { calculateTotalMacros } from '../utils/nutritionCalculations';

interface TimeslotData {
  selectedFoods: SelectedFood[];
  externalNutrition: ExternalNutrition;
}

interface TimeslotMealPlannerProps {
  // Props can be added here if needed for parent communication
}

const TIMESLOTS = [
  {
    id: '6pm',
    label: '6:00 PM',
    description: 'Afternoon Meal',
    icon: <AfternoonIcon />,
  },
  {
    id: '9:30pm',
    label: '9:30 PM', 
    description: 'Evening Meal',
    icon: <EveningIcon />,
  }
];

const TimeslotMealPlanner: React.FC<TimeslotMealPlannerProps> = () => {
  const [currentTimeslot, setCurrentTimeslot] = useState(0);
  // Separate state for each timeslot
  const [timeslotData, setTimeslotData] = useState<Record<string, TimeslotData>>({
    '6pm': {
      selectedFoods: [],
      externalNutrition: { protein: 0, fats: 0, carbs: 0, calories: 0 }
    },
    '9:30pm': {
      selectedFoods: [],
      externalNutrition: { protein: 0, fats: 0, carbs: 0, calories: 0 }
    }
  });

  const getCurrentTimeslotId = useCallback(() => TIMESLOTS[currentTimeslot].id, [currentTimeslot]);
  const getCurrentData = useCallback(() => timeslotData[getCurrentTimeslotId()], [timeslotData, getCurrentTimeslotId]);

  // Calculate combined macros from both timeslots (food + external nutrition) - memoized
  const getCombinedMacros = useMemo(() => {
    const combined = { protein: 0, fats: 0, carbs: 0, calories: 0 };
    
    Object.values(timeslotData).forEach(data => {
      const foodMacros = calculateTotalMacros(data.selectedFoods);
      combined.protein += foodMacros.protein + data.externalNutrition.protein;
      combined.fats += foodMacros.fats + data.externalNutrition.fats;
      combined.carbs += foodMacros.carbs + data.externalNutrition.carbs;
      combined.calories += foodMacros.calories + data.externalNutrition.calories;
    });
    
    return combined;
  }, [timeslotData]);

  const updateTimeslotData = useCallback((timeslotId: string, updates: Partial<TimeslotData>) => {
    setTimeslotData(prev => ({
      ...prev,
      [timeslotId]: {
        ...prev[timeslotId],
        ...updates
      }
    }));
  }, []);

  // Handlers for current timeslot - all memoized
  const handleAddFood = useCallback((food: SelectedFood) => {
    const timeslotId = getCurrentTimeslotId();
    const currentData = getCurrentData();
    updateTimeslotData(timeslotId, {
      selectedFoods: [...currentData.selectedFoods, food]
    });
  }, [getCurrentTimeslotId, getCurrentData, updateTimeslotData]);

  const handleUpdateAmount = useCallback((index: number, amount: number) => {
    const timeslotId = getCurrentTimeslotId();
    const currentData = getCurrentData();
    updateTimeslotData(timeslotId, {
      selectedFoods: currentData.selectedFoods.map((food, i) => 
        i === index ? { ...food, amount } : food
      )
    });
  }, [getCurrentTimeslotId, getCurrentData, updateTimeslotData]);

  const handleRemoveFood = useCallback((index: number) => {
    const timeslotId = getCurrentTimeslotId();
    const currentData = getCurrentData();
    updateTimeslotData(timeslotId, {
      selectedFoods: currentData.selectedFoods.filter((_, i) => i !== index)
    });
  }, [getCurrentTimeslotId, getCurrentData, updateTimeslotData]);

  const handleUpdateExternal = useCallback((nutrition: ExternalNutrition) => {
    const timeslotId = getCurrentTimeslotId();
    updateTimeslotData(timeslotId, {
      externalNutrition: nutrition
    });
  }, [getCurrentTimeslotId, updateTimeslotData]);

  const handleSwapFood = useCallback((index: number) => {
    const currentTimeslotId = getCurrentTimeslotId();
    const currentData = getCurrentData();
    const foodToSwap = currentData.selectedFoods[index];
    
    // Remove from current timeslot
    updateTimeslotData(currentTimeslotId, {
      selectedFoods: currentData.selectedFoods.filter((_, i) => i !== index)
    });
    
    // Add to other timeslot
    const otherTimeslotId = currentTimeslotId === '6pm' ? '9:30pm' : '6pm';
    const otherData = timeslotData[otherTimeslotId];
    updateTimeslotData(otherTimeslotId, {
      selectedFoods: [...otherData.selectedFoods, foodToSwap]
    });
  }, [getCurrentTimeslotId, getCurrentData, updateTimeslotData, timeslotData]);

  const currentData = useMemo(() => getCurrentData(), [getCurrentData]);
  const currentFoodMacros = useMemo(() => calculateTotalMacros(currentData.selectedFoods), [currentData.selectedFoods]);
  const combinedMacros = getCombinedMacros;

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', gap: 3, flexDirection: { xs: 'column', md: 'row' } }}>
        {/* Left Column: Meal Planner - 50% width */}
        <Box sx={{ flex: 1 }}>
          <Card sx={{ borderRadius: 3, height: '100%' }}>
            <CardContent>
              {/* Timeslot Tabs */}
              <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                <Tabs 
                  value={currentTimeslot} 
                  onChange={(e, newValue) => setCurrentTimeslot(newValue)}
                  aria-label="meal timeslot tabs"
                  variant="fullWidth"
                >
                  {TIMESLOTS.map((timeslot) => (
                    <Tab 
                      key={timeslot.id}
                      icon={timeslot.icon}
                      iconPosition="start"
                      label={
                        <Box sx={{ textAlign: 'left', ml: 1 }}>
                          <Typography variant="body1" sx={{ fontWeight: 600, textTransform: 'none' }}>
                            {timeslot.label}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'none', display: 'block' }}>
                            {timeslot.description}
                          </Typography>
                        </Box>
                      }
                      sx={{ 
                        minHeight: 'auto',
                        p: 1.5
                      }}
                    />
                  ))}
                </Tabs>
              </Box>

              <Box sx={{ p: 2 }}>
                {/* Food Selector for Current Timeslot - Full Width */}
                <FoodSelectorWithFirebase
                  selectedFoods={currentData.selectedFoods}
                  onAddFood={handleAddFood}
                  onUpdateAmount={handleUpdateAmount}
                  onRemoveFood={handleRemoveFood}
                  onSwapFood={handleSwapFood}
                />

                {/* External Nutrition Input for Current Timeslot */}
                <ExternalNutritionInput
                  externalNutrition={currentData.externalNutrition}
                  onUpdateExternal={handleUpdateExternal}
                />
              </Box>
            </CardContent>
          </Card>
        </Box>

        {/* Right Column: Progress and Actions - 50% width */}
        <Box sx={{ flex: 1, minWidth: 300 }}>
          <Stack spacing={3}>
            {/* Combined Nutrition Progress */}
            <Card sx={{ borderRadius: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Daily Nutrition Progress
                </Typography>
                <MacroProgress 
                  foodMacros={{
                    protein: combinedMacros.protein,
                    fats: combinedMacros.fats,
                    carbs: combinedMacros.carbs,
                    calories: combinedMacros.calories
                  }}
                  externalNutrition={{ protein: 0, fats: 0, carbs: 0, calories: 0 }}
                />
              </CardContent>
            </Card>

            {/* Meal Cost Display */}
            <MealCostDisplay timeslotData={timeslotData} />

            {/* Save/Load Plan */}
            <Card sx={{ borderRadius: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Manage Plan
                </Typography>
                <SaveLoadPlan
                  timeslotData={timeslotData}
                />
              </CardContent>
            </Card>
          </Stack>
        </Box>
      </Box>
    </Box>
  );
};

export default TimeslotMealPlanner;
