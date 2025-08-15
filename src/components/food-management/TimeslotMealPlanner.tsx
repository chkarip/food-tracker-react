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
import { getAllFoods, convertToLegacyFoodFormat } from '../../services/firebase/nutrition/foodService';

interface TimeslotData {
  selectedFoods: SelectedFood[];
  externalNutrition: ExternalNutrition;
} // ✅ Added missing closing brace

const TIMESLOTS = [
  {
    id: '6pm',
    label: '6:00 PM',
    description: 'Afternoon Meal',
    icon: <AfternoonIcon />, // ✅ Fixed JSX
  },
  {
    id: '9:30pm',
    label: '9:30 PM',
    description: 'Evening Meal',
    icon: <EveningIcon />, // ✅ Fixed JSX
  }
];

const TimeslotMealPlanner: React.FC = () => { // ✅ Fixed arrow function
  const [currentTimeslot, setCurrentTimeslot] = useState(0);
  
  // ✅ Added food database state for Firebase integration
  const [foodDatabase, setFoodDatabase] = useState<Record<string, any>>({});
  
  const [timeslotData, setTimeslotData] = useState<Record<string, TimeslotData>>({ // ✅ Fixed type
    '6pm': {
      selectedFoods: [],
      externalNutrition: { protein: 0, fats: 0, carbs: 0, calories: 0 }
    },
    '9:30pm': {
      selectedFoods: [],
      externalNutrition: { protein: 0, fats: 0, carbs: 0, calories: 0 }
    }
  });

  // ✅ Load food database from Firebase
  useEffect(() => {
    const loadFoodDatabase = async () => {
      try {
        console.log('🔄 Loading food database from Firebase...');
        const firebaseFoods = await getAllFoods();
        const converted = convertToLegacyFoodFormat(firebaseFoods);
        setFoodDatabase(converted);
        console.log('✅ Food database loaded for nutrition calculations:', Object.keys(converted).length, 'foods');
      } catch (error) {
        console.error('❌ Error loading food database:', error);
      }
    };
    loadFoodDatabase();
  }, []);

  const getCurrentTimeslotId = useCallback(() => TIMESLOTS[currentTimeslot].id, [currentTimeslot]);
  const getCurrentData = useCallback(() => timeslotData[getCurrentTimeslotId()], [timeslotData, getCurrentTimeslotId]);

  // ✅ Calculate combined food macros using Firebase food database
  const getCombinedFoodMacros = useMemo((): NutritionData => {
    // Wait for food database to load
    if (Object.keys(foodDatabase).length === 0) {
      return { protein: 0, fats: 0, carbs: 0, calories: 0 };
    }
    
    const combined = { protein: 0, fats: 0, carbs: 0, calories: 0 };
    Object.values(timeslotData).forEach(data => { // ✅ Fixed arrow function
      const foodMacros = calculateTotalMacros(data.selectedFoods, foodDatabase); // ✅ Pass foodDatabase
      combined.protein += foodMacros.protein;
      combined.fats += foodMacros.fats;
      combined.carbs += foodMacros.carbs;
      combined.calories += foodMacros.calories;
    });
    return combined;
  }, [timeslotData, foodDatabase]); // ✅ Added foodDatabase dependency

  // Calculate combined external nutrition from both timeslots
  const getCombinedExternalNutrition = useMemo((): ExternalNutrition => { // ✅ Fixed arrow function
    const combined = { protein: 0, fats: 0, carbs: 0, calories: 0 };
    Object.values(timeslotData).forEach(data => { // ✅ Fixed arrow function
      combined.protein += data.externalNutrition.protein;
      combined.fats += data.externalNutrition.fats;
      combined.carbs += data.externalNutrition.carbs;
      combined.calories += data.externalNutrition.calories;
    });
    return combined;
  }, [timeslotData]);

  const updateTimeslotData = useCallback((timeslotId: string, updates: Partial<TimeslotData>) => { // ✅ Fixed arrow function and type
    setTimeslotData(prev => ({ // ✅ Fixed arrow function
      ...prev,
      [timeslotId]: {
        ...prev[timeslotId],
        ...updates
      }
    }));
  }, []);

  const handleAddFood = useCallback((food: SelectedFood) => { // ✅ Fixed arrow function
    const timeslotId = getCurrentTimeslotId();
    const currentData = getCurrentData();
    updateTimeslotData(timeslotId, {
      selectedFoods: [...currentData.selectedFoods, food]
    });
  }, [getCurrentTimeslotId, getCurrentData, updateTimeslotData]);

  const handleUpdateAmount = useCallback((index: number, amount: number) => { // ✅ Fixed arrow function
    const timeslotId = getCurrentTimeslotId();
    const currentData = getCurrentData();
    updateTimeslotData(timeslotId, {
      selectedFoods: currentData.selectedFoods.map((food, i) => // ✅ Fixed arrow function
        i === index ? { ...food, amount } : food
      )
    });
  }, [getCurrentTimeslotId, getCurrentData, updateTimeslotData]);

  const handleRemoveFood = useCallback((index: number) => { // ✅ Fixed arrow function
    const timeslotId = getCurrentTimeslotId();
    const currentData = getCurrentData();
    updateTimeslotData(timeslotId, {
      selectedFoods: currentData.selectedFoods.filter((_, i) => i !== index) // ✅ Fixed arrow function
    });
  }, [getCurrentTimeslotId, getCurrentData, updateTimeslotData]);

  const handleUpdateExternal = useCallback((nutrition: ExternalNutrition) => { // ✅ Fixed arrow function
    const timeslotId = getCurrentTimeslotId();
    updateTimeslotData(timeslotId, {
      externalNutrition: nutrition
    });
  }, [getCurrentTimeslotId, updateTimeslotData]);

  const handleSwapFood = useCallback((index: number) => { // ✅ Fixed arrow function
    const currentTimeslotId = getCurrentTimeslotId();
    const currentData = getCurrentData();
    const foodToSwap = currentData.selectedFoods[index];

    // Remove from current timeslot
    updateTimeslotData(currentTimeslotId, {
      selectedFoods: currentData.selectedFoods.filter((_, i) => i !== index) // ✅ Fixed arrow function
    });

    // Add to other timeslot
    const otherTimeslotId = currentTimeslotId === '6pm' ? '9:30pm' : '6pm';
    const otherData = timeslotData[otherTimeslotId];
    updateTimeslotData(otherTimeslotId, {
      selectedFoods: [...otherData.selectedFoods, foodToSwap]
    });
  }, [getCurrentTimeslotId, getCurrentData, updateTimeslotData, timeslotData]);

  const currentData = getCurrentData();
  const combinedFoodMacros = getCombinedFoodMacros;
  const combinedExternalNutrition = getCombinedExternalNutrition;

  // ✅ Debug logging for food database
  useEffect(() => {
    if (Object.keys(foodDatabase).length > 0) {
      console.log('🔍 Food database loaded:', Object.keys(foodDatabase));
    }
  }, [foodDatabase]);

  return (
    <Box sx={{ display: 'flex', gap: 3, p: 3 }}>
      {/* Left Column: Meal Planner */}
      <Box sx={{ flex: 1 }}>
        <Card>
          <CardContent>
            {/* Timeslot Tabs */}
            <Tabs
              value={currentTimeslot}
              onChange={(_, newValue) => setCurrentTimeslot(newValue)} // ✅ Fixed arrow function
              aria-label="meal timeslot tabs"
              variant="fullWidth"
              sx={{ mb: 2 }}
            >
              {TIMESLOTS.map((timeslot, index) => ( // ✅ Fixed JSX
                <Tab
                  key={timeslot.id}
                  icon={timeslot.icon}
                  label={
                    <Box>
                      <Typography variant="body2" fontWeight="bold">
                        {timeslot.label}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {timeslot.description}
                      </Typography>
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

            {/* External Nutrition Input for Current Timeslot */}
            <Box sx={{ mt: 2 }}>
              <ExternalNutritionInput
                externalNutrition={currentData.externalNutrition}
                onUpdateExternal={handleUpdateExternal}
              />
            </Box>
          </CardContent>
        </Card>
      </Box>

      {/* Right Column: Progress and Actions */}
      <Box sx={{ flex: 1 }}>
        <Stack spacing={2}>
          {/* Combined Nutrition Progress */}
          <Card>
            <CardContent>
              <MacroProgress 
                foodMacros={combinedFoodMacros}
                externalNutrition={combinedExternalNutrition}
              />
            </CardContent>
          </Card>

          {/* Meal Cost Display */}
          <MealCostDisplay timeslotData={timeslotData} />

          {/* Save/Load Plan */}
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>
                💾 Manage Plan
              </Typography>
              <SaveLoadPlan timeslotData={timeslotData} />
            </CardContent>
          </Card>
        </Stack>
      </Box>
    </Box>
  );
};

export default TimeslotMealPlanner;
