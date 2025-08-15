/**
 * FILE: TimeslotMealPlanner.tsx
 * ------------------------------------------------------------------
 * PURPOSE
 * • The **core meal-planning workspace**: two fixed timeslots (6 pm and
 * 9:30 pm) where a user selects foods, adds external macros, tracks
 * progress and sees live cost.
 *
 * MAJOR COMPONENT COMPOSITION
 * ┌ Tabs (6 pm / 9:30 pm)
 * │ └─ FoodSelectorWithFirebase – choose foods + quantities
 * │ └─ ExternalNutritionInput – manual macro add-ons
 * ├ MacroProgress – daily macro bars (all slots)
 * ├ MealCostDisplay – € breakdown
 * └ SaveLoadPlan – persist to Firestore calendar
 *
 * STATE MODEL
 * • timeslotData → { '6pm': { selectedFoods[], externalNutrition }, … }
 * • foodDatabase → legacy-formatted food list for macro maths.
 * • currentTimeslot → index (0|1) for active tab.
 *
 * BUSINESS-LOGIC NOTES
 * • Macro totals use `calculateTotalMacros` which respects unit-vs-weight
 * foods and fixed amounts from the admin panel.
 * • Swapping food between timeslots is O(1) and keeps amounts intact.
 * • All child components communicate upward via pure callbacks, so this
 * file remains the single source-of-truth for meal-draft state.
 *
 * EXTENSIBILITY
 * • TIMESLOTS array is the only place to add breakfast / lunch etc.
 * • Ready for dark/light theme thanks to MUI token usage.
 */

import React, { useState, useCallback, useMemo, useEffect } from 'react';
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
import { SelectedFood, ExternalNutrition, NutritionData } from '../../types/nutrition';
import { calculateTotalMacros } from '../../utils/nutritionCalculations';
import { useFoodDatabase } from '../../contexts/FoodContext';

interface TimeslotData {
  selectedFoods: SelectedFood[];
  externalNutrition: ExternalNutrition;
}

const TIMESLOTS = [
  {
    id: '6pm',
    label: '6:00 PM',
    description: 'Afternoon Meal',
    icon: <AfternoonIcon />
  },
  {
    id: '9:30pm',
    label: '9:30 PM',
    description: 'Evening Meal',
    icon: <EveningIcon />
  }
];

const TimeslotMealPlanner: React.FC = () => {
  const [currentTimeslot, setCurrentTimeslot] = useState(0);
  const { foodDatabase } = useFoodDatabase();

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

  // Calculate combined food macros using Firebase food database
  const getCombinedFoodMacros = useMemo((): NutritionData => {
    // Wait for food database to load
    if (Object.keys(foodDatabase).length === 0) {
      return { protein: 0, fats: 0, carbs: 0, calories: 0 };
    }

    const combined = { protein: 0, fats: 0, carbs: 0, calories: 0 };
    Object.values(timeslotData).forEach(data => {
      const foodMacros = calculateTotalMacros(data.selectedFoods, foodDatabase);
      combined.protein += foodMacros.protein;
      combined.fats += foodMacros.fats;
      combined.carbs += foodMacros.carbs;
      combined.calories += foodMacros.calories;
    });
    return combined;
  }, [timeslotData, foodDatabase]);

  // Calculate combined external nutrition from both timeslots
  const getCombinedExternalNutrition = useMemo((): ExternalNutrition => {
    const combined = { protein: 0, fats: 0, carbs: 0, calories: 0 };
    Object.values(timeslotData).forEach(data => {
      combined.protein += data.externalNutrition.protein;
      combined.fats += data.externalNutrition.fats;
      combined.carbs += data.externalNutrition.carbs;
      combined.calories += data.externalNutrition.calories;
    });
    return combined;
  }, [timeslotData]);

  // ✅ Combine food + external macros for MacroProgress (single prop)
  const getTotalMacros = useMemo((): NutritionData => {
    const food = getCombinedFoodMacros;
    const external = getCombinedExternalNutrition;
    return {
      protein: food.protein + external.protein,
      fats: food.fats + external.fats,
      carbs: food.carbs + external.carbs,
      calories: food.calories + external.calories
    };
  }, [getCombinedFoodMacros, getCombinedExternalNutrition]);

  const updateTimeslotData = useCallback((timeslotId: string, updates: Partial<TimeslotData>) => {
    setTimeslotData(prev => ({
      ...prev,
      [timeslotId]: {
        ...prev[timeslotId],
        ...updates
      }
    }));
  }, []);

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

  const currentData = getCurrentData();

  // Debug logging for food database
  useEffect(() => {
    if (Object.keys(foodDatabase).length > 0) {
      console.log('🔍 Food database loaded:', Object.keys(foodDatabase));
    }
  }, [foodDatabase]);

  return (
    <Box sx={{ display: 'flex', gap: 3, maxWidth: 1200, mx: 'auto' }}>
      {/* Left Column: Meal Planner */}
      <Card sx={{ flex: 2 }}>
        <CardContent>
          {/* Timeslot Tabs */}
          <Tabs
            value={currentTimeslot}
            onChange={(_, newValue) => setCurrentTimeslot(newValue)}
            aria-label="meal timeslot tabs"
            variant="fullWidth"
            sx={{ mb: 2 }}
          >
            {TIMESLOTS.map((timeslot, index) => (
              <Tab
                key={timeslot.id}
                icon={timeslot.icon}
                label={
                  <Box>
                    <Typography variant="body2">{timeslot.label}</Typography>
                    <Typography variant="caption">{timeslot.description}</Typography>
                  </Box>
                }
                sx={{ minHeight: 'auto', p: 1.5 }}
              />
            ))}
          </Tabs>

          {/* Food Selector for Current Timeslot */}
          <FoodSelectorWithFirebase
            selectedFoods={currentData.selectedFoods}
            onAddFood={handleAddFood}
            onUpdateAmount={handleUpdateAmount}
            onRemoveFood={handleRemoveFood}
            onSwapFood={handleSwapFood}
          />

          {/* ✅ External Nutrition Input - use standard prop names */}
          <ExternalNutritionInput
            nutrition={currentData.externalNutrition}
            onUpdateNutrition={handleUpdateExternal}
          />
        </CardContent>
      </Card>

      {/* Right Column: Progress and Actions */}
      <Stack spacing={2} sx={{ flex: 1 }}>
        {/* ✅ Combined Nutrition Progress - single macros prop */}
        <MacroProgress
          macros={getTotalMacros}
        />

        {/* Meal Cost Display */}
        <MealCostDisplay timeslotData={timeslotData} />

        {/* ✅ Save/Load Plan - standard prop name */}
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              💾 Manage Plan
            </Typography>
            <SaveLoadPlan
              timeslotData={timeslotData}
              onLoad={setTimeslotData}
            />
          </CardContent>
        </Card>
      </Stack>
    </Box>
  );
};

export default TimeslotMealPlanner;
