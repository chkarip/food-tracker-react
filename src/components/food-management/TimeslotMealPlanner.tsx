/**
 * FILE: TimeslotMealPlanner.tsx
 * ------------------------------------------------------------------
 * PURPOSE
 * • Core meal-planning workspace with two fixed timeslots (6 pm and
 *   9:30 pm) where a user selects foods, adds external macros, tracks
 *   progress and sees live cost.
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
 *   foods and fixed amounts from the admin panel.
 * • Swapping food between timeslots is O(1) and keeps amounts intact.
 * • All child components communicate upward via pure callbacks, so this
 *   file remains the single source-of-truth for meal-draft state.
 *
 * EXTENSIBILITY
 * • TIMESLOTS array is the only place to add breakfast / lunch etc.
 * • Ready for dark/light theme thanks to MUI token usage.
 */

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { subscribeToNutritionGoal } from '../../services/firebase/nutrition/nutritionGoalService';
import { useAuth } from '../../contexts/AuthContext';
import { Box, Divider, Typography } from '@mui/material';
import {
  WbSunny as AfternoonIcon,
  Nightlight as EveningIcon,
} from '@mui/icons-material';

import MacroProgress from './MacroProgress';
import FoodSelectorWithFirebase from './FoodSelectorWithFirebase';
import { calculateMacros } from '../../utils/nutritionCalculations';
import ExternalNutritionInput from './ExternalNutritionInput';
import MealCostDisplay from './MealCostDisplay';

import {
  SelectedFood,
  ExternalNutrition,
  NutritionData,
} from '../../types/nutrition';
import { calculateTotalMacros } from '../../utils/nutritionCalculations';
import { useFoodDatabase } from '../../contexts/FoodContext';

/* ---------- local types ---------- */
interface TimeslotData {
  selectedFoods: SelectedFood[];
  externalNutrition: ExternalNutrition;
}

/* ---------- constants ---------- */
const TIMESLOTS = [
  {
    id: '6pm',
    label: '6:00 PM',
    icon: <AfternoonIcon />,
  },
  {
    id: '9:30pm',
    label: '9:30 PM',
    icon: <EveningIcon />,
  },
];

const STORAGE_KEY = 'mealPlanner_timeslotData';

/* ---------- local storage helpers ---------- */
const saveToLocalStorage = (data: Record<string, TimeslotData>) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.warn('Failed to save meal plan to localStorage:', error);
  }
};

const loadFromLocalStorage = (): Record<string, TimeslotData> | null => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch (error) {
    console.warn('Failed to load meal plan from localStorage:', error);
    return null;
  }
};

const clearLocalStorage = () => {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.warn('Failed to clear meal plan from localStorage:', error);
  }
};

/* ================================================================== */
interface PreviewFood {
  name: string;
  amount: number;
}

const TimeslotMealPlanner: React.FC = () => {
  /* ---------- state ---------- */
  const [currentTimeslot, setCurrentTimeslot] = useState(0);
  const { foodDatabase } = useFoodDatabase();
  const { user } = useAuth();

  const [timeslotData, setTimeslotData] = useState<Record<string, TimeslotData>>(() => {
    // Load from localStorage on initial render
    const storedData = loadFromLocalStorage();
    if (storedData) {
      return storedData;
    }
    // Default data if nothing in localStorage
    return {
      '6pm': {
        selectedFoods: [],
        externalNutrition: { protein: 0, fats: 0, carbs: 0, calories: 0 },
      },
      '9:30pm': {
        selectedFoods: [],
        externalNutrition: { protein: 0, fats: 0, carbs: 0, calories: 0 },
      },
    };
  });

  // Nutrition goals state
  const [nutritionGoals, setNutritionGoals] = useState<{
    protein: number;
    fats: number;
    carbs: number;
    calories: number;
  } | null>(null);

  // Live preview state
  const [previewFood, setPreviewFood] = useState<PreviewFood | null>(null);
  // Amount controls state
  const [selectedFoodName, setSelectedFoodName] = useState('');
  const [amount, setAmount] = useState(100);
  // Swap flow state
  const [isSwapping, setIsSwapping] = useState(false);
  const [targetCategory, setTargetCategory] = useState<string>('');

  // Subscribe to nutrition goals from Firebase
  useEffect(() => {
    if (!user?.uid) return;

    const unsubscribe = subscribeToNutritionGoal(
      user.uid,
      (goals) => {
        if (goals) {
          setNutritionGoals({
            protein: goals.protein,
            fats: goals.fats,
            carbs: goals.carbs,
            calories: goals.calories
          });
        }
      },
      (error) => {
        console.error('Failed to load nutrition goals:', error);
      }
    );

    return () => unsubscribe();
  }, [user?.uid]);

  // Save to localStorage whenever timeslotData changes
  useEffect(() => {
    saveToLocalStorage(timeslotData);
  }, [timeslotData]);

  /* ---------- helpers ---------- */
  const getCurrentTimeslotId = useCallback(
    () => TIMESLOTS[currentTimeslot].id,
    [currentTimeslot],
  );

  const getCurrentData = useCallback(
    () => timeslotData[getCurrentTimeslotId()],
    [timeslotData, getCurrentTimeslotId],
  );

  /* ---------- macro totals ---------- */
  const getCombinedFoodMacros = useMemo((): NutritionData => {
    if (!Object.keys(foodDatabase).length)
      return { protein: 0, fats: 0, carbs: 0, calories: 0 };

    const c = { protein: 0, fats: 0, carbs: 0, calories: 0 };
    Object.values(timeslotData).forEach((d) => {
      const m = calculateTotalMacros(d.selectedFoods, foodDatabase);
      c.protein += m.protein;
      c.fats += m.fats;
      c.carbs += m.carbs;
      c.calories += m.calories;
    });
    return c;
  }, [timeslotData, foodDatabase]);

  const getCombinedExternal = useMemo((): ExternalNutrition => {
    const c = { protein: 0, fats: 0, carbs: 0, calories: 0 };
    Object.values(timeslotData).forEach((d) => {
      c.protein += d.externalNutrition.protein;
      c.fats += d.externalNutrition.fats;
      c.carbs += d.externalNutrition.carbs;
      c.calories += d.externalNutrition.calories;
    });
    return c;
  }, [timeslotData]);

  const getTotalMacros = useMemo((): NutritionData => {
    const food = getCombinedFoodMacros;
    const ext = getCombinedExternal;
    return {
      protein: food.protein + ext.protein,
      fats: food.fats + ext.fats,
      carbs: food.carbs + ext.carbs,
      calories: food.calories + ext.calories,
    };
  }, [getCombinedFoodMacros, getCombinedExternal]);

  /* ---------- updaters ---------- */
  const updateTimeslotData = useCallback(
    (id: string, updates: Partial<TimeslotData>) => {
      setTimeslotData((prev) => ({ ...prev, [id]: { ...prev[id], ...updates } }));
    },
    [],
  );

  const handleAddFood = useCallback(
    (food: SelectedFood) => {
      const id = getCurrentTimeslotId();
      const d = getCurrentData();
      updateTimeslotData(id, { selectedFoods: [...d.selectedFoods, food] });
    },
    [getCurrentTimeslotId, getCurrentData, updateTimeslotData],
  );

  const handleUpdateAmount = useCallback(
    (idx: number, amount: number) => {
      const id = getCurrentTimeslotId();
      const d = getCurrentData();
      updateTimeslotData(id, {
        selectedFoods: d.selectedFoods.map((f, i) =>
          i === idx ? { ...f, amount } : f,
        ),
      });
    },
    [getCurrentTimeslotId, getCurrentData, updateTimeslotData],
  );

  const handleRemoveFood = useCallback(
    (idx: number) => {
      const id = getCurrentTimeslotId();
      const d = getCurrentData();
      updateTimeslotData(id, {
        selectedFoods: d.selectedFoods.filter((_, i) => i !== idx),
      });
    },
    [getCurrentTimeslotId, getCurrentData, updateTimeslotData],
  );

  const handleSwapFood = useCallback(
    (idx: number) => {
      const fromId = getCurrentTimeslotId();
      const fromData = getCurrentData();
      const food = fromData.selectedFoods[idx];

      updateTimeslotData(fromId, {
        selectedFoods: fromData.selectedFoods.filter((_, i) => i !== idx),
      });

      const toId = fromId === '6pm' ? '9:30pm' : '6pm';
      updateTimeslotData(toId, {
        selectedFoods: [...timeslotData[toId].selectedFoods, food],
      });

      // Set swap state for highlighting
      setIsSwapping(true);
      setTargetCategory(foodDatabase[food.name]?.metadata?.category || 'Other');
      
      // Clear swap state after animation
      setTimeout(() => {
        setIsSwapping(false);
        setTargetCategory('');
      }, 2000);
    },
    [getCurrentTimeslotId, getCurrentData, updateTimeslotData, timeslotData, foodDatabase],
  );

  const handleUpdateExternal = useCallback(
    (n: ExternalNutrition) =>
      updateTimeslotData(getCurrentTimeslotId(), { externalNutrition: n }),
    [getCurrentTimeslotId, updateTimeslotData],
  );

  const handleUpdateAmountForTimeslot = useCallback(
    (timeslotId: string, idx: number, amount: number) => {
      const d = timeslotData[timeslotId];
      updateTimeslotData(timeslotId, {
        selectedFoods: d.selectedFoods.map((f, i) =>
          i === idx ? { ...f, amount } : f,
        ),
      });
    },
    [timeslotData, updateTimeslotData],
  );

  const handleRemoveFoodForTimeslot = useCallback(
    (timeslotId: string, idx: number) => {
      const d = timeslotData[timeslotId];
      updateTimeslotData(timeslotId, {
        selectedFoods: d.selectedFoods.filter((_, i) => i !== idx),
      });
    },
    [timeslotData, updateTimeslotData],
  );

  const handleSwapFoodForTimeslot = useCallback(
    (timeslotId: string, idx: number) => {
      const fromData = timeslotData[timeslotId];
      const food = fromData.selectedFoods[idx];

      updateTimeslotData(timeslotId, {
        selectedFoods: fromData.selectedFoods.filter((_, i) => i !== idx),
      });

      const toId = timeslotId === '6pm' ? '9:30pm' : '6pm';
      updateTimeslotData(toId, {
        selectedFoods: [...timeslotData[toId].selectedFoods, food],
      });

      // Set swap state for highlighting
      setIsSwapping(true);
      setTargetCategory(foodDatabase[food.name]?.metadata?.category || 'Other');
      
      // Clear swap state after animation
      setTimeout(() => {
        setIsSwapping(false);
        setTargetCategory('');
      }, 2000);
    },
    [timeslotData, updateTimeslotData, foodDatabase],
  );

  const handleClearPlan = useCallback(() => {
    // Clear all selected foods and external nutrition from both timeslots
    setTimeslotData({
      '6pm': {
        selectedFoods: [],
        externalNutrition: { protein: 0, fats: 0, carbs: 0, calories: 0 },
      },
      '9:30pm': {
        selectedFoods: [],
        externalNutrition: { protein: 0, fats: 0, carbs: 0, calories: 0 },
      },
    });
    
    // Clear localStorage
    clearLocalStorage();
    
    // Clear preview state
    setPreviewFood(null);
    setSelectedFoodName('');
    setAmount(100);
  }, []);

  // Calculate preview macros including tentative selection
  const getPreviewMacros = useMemo((): NutritionData => {
    if (!previewFood || !foodDatabase[previewFood.name]) return getTotalMacros;
    // Add preview food macros to current selection
    const previewMacros = calculateMacros(previewFood.name, previewFood.amount, foodDatabase);
    return {
      protein: getTotalMacros.protein + previewMacros.protein,
      fats: getTotalMacros.fats + previewMacros.fats,
      carbs: getTotalMacros.carbs + previewMacros.carbs,
      calories: getTotalMacros.calories + previewMacros.calories,
    };
  }, [previewFood, getTotalMacros, foodDatabase]);

  /* ---------- localStorage ---------- */
  useEffect(() => {
    // Load timeslot data from localStorage on mount
    const storedData = localStorage.getItem('timeslotData');
    if (storedData) {
      setTimeslotData(JSON.parse(storedData));
    }
  }, []);

  useEffect(() => {
    // Save timeslot data to localStorage whenever it changes
    localStorage.setItem('timeslotData', JSON.stringify(timeslotData));
  }, [timeslotData]);

  /* ---------- render ---------- */
  const currentData = getCurrentData();

  // Get favorite foods from database
  const getFavoriteFoods = useMemo(() => {
    return Object.entries(foodDatabase)
      .filter(([_, food]) => food?.metadata?.favorite === true)
      .map(([name]) => name);
  }, [foodDatabase]);

  // Get available favorite foods (not already selected)
  const getAvailableFavoriteFoods = useMemo(() => {
    const allSelectedFoods = Object.values(timeslotData).flatMap(data => data.selectedFoods.map(f => f.name));
    return getFavoriteFoods.filter(favorite => !allSelectedFoods.includes(favorite));
  }, [getFavoriteFoods, timeslotData]);

  return (
    <Box 
      sx={{ 
        display: 'flex', 
        gap: 4, 
        height: '100%', 
        p: 3,
        flexDirection: { xs: 'column', md: 'row' },
        background: 'linear-gradient(135deg, var(--meal-bg-card) 0%, rgba(255,255,255,0.5) 100%)',
        borderRadius: 3,
        minHeight: 'calc(100vh - 200px)'
      }}
    >
      {/* ========== LEFT COLUMN: Food Selection & Settings ========== */}
      <Box 
        sx={{ 
          flexBasis: { xs: '100%', md: '60%' },
          minWidth: 0,
          overflowY: 'auto'
        }}
      >
        {/* Timeslot picker - Simple section without card wrapper */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" sx={{ 
            mb: 2, 
            color: 'var(--text-primary)', 
            fontWeight: 600,
            opacity: 0.94,
            position: 'relative',
            '&::before': {
              content: '""',
              position: 'absolute',
              left: 0,
              top: 0,
              bottom: 0,
              width: '3px',
              backgroundColor: 'var(--accent-green)',
              borderRadius: '2px'
            },
            paddingLeft: '12px'
          }}>
            Select Timeslot
          </Typography>
          <Box sx={{ 
            display: 'grid', 
            gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, 
            gap: 2,
            overflow: 'visible'
          }}>
            {TIMESLOTS.map((timeslot, index) => (
              <Box
                key={timeslot.id}
                onClick={() => setCurrentTimeslot(index)}
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '8px 12px',
                  borderRadius: '12px',
                  backgroundColor: currentTimeslot === index ? 'var(--meal-bg-card)' : 'var(--surface-bg)',
                  border: currentTimeslot === index 
                    ? `2px solid ${index === 0 ? 'var(--timeslot-afternoon)' : 'var(--timeslot-evening)'}` 
                    : '1px solid var(--border-color)',
                  boxShadow: currentTimeslot === index 
                    ? `inset 0 1px 0 rgba(255,255,255,0.1), 0 4px 12px ${index === 0 ? 'rgba(59, 186, 117, 0.15)' : 'rgba(255, 152, 0, 0.15)'}, 0 2px 4px ${index === 0 ? 'rgba(59, 186, 117, 0.1)' : 'rgba(255, 152, 0, 0.1)'}`
                    : 'inset 0 1px 0 rgba(255,255,255,0.05), 0 2px 8px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.04)',
                  cursor: 'pointer',
                  transition: 'all 200ms ease',
                  transform: currentTimeslot === index ? 'translateY(-2px)' : 'translateY(0)',
                  '&:hover': {
                    transform: currentTimeslot === index ? 'translateY(-2px)' : 'translateY(-1px)',
                    boxShadow: currentTimeslot === index 
                      ? `inset 0 1px 0 rgba(255,255,255,0.15), 0 6px 16px ${index === 0 ? 'rgba(59, 186, 117, 0.2)' : 'rgba(255, 152, 0, 0.2)'}, 0 3px 6px ${index === 0 ? 'rgba(59, 186, 117, 0.15)' : 'rgba(255, 152, 0, 0.15)'}`
                      : 'inset 0 1px 0 rgba(255,255,255,0.08), 0 4px 12px rgba(0,0,0,0.12), 0 2px 4px rgba(0,0,0,0.08)',
                    borderColor: currentTimeslot === index 
                      ? (index === 0 ? 'var(--timeslot-afternoon)' : 'var(--timeslot-evening)')
                      : 'var(--accent-green)'
                  },
                  position: 'relative',
                  overflow: 'visible',
                  minHeight: '60px'
                }}
              >
                {/* Icon */}
                <Box sx={{ 
                  mb: 0.5,
                  color: currentTimeslot === index 
                    ? (index === 0 ? 'var(--timeslot-afternoon)' : 'var(--timeslot-evening)')
                    : 'var(--text-secondary)',
                  transition: 'color 200ms ease',
                  fontSize: '1.5rem'
                }}>
                  {timeslot.icon}
                </Box>

                {/* Label */}
                <Typography 
                  variant="body1" 
                  sx={{ 
                    color: currentTimeslot === index 
                      ? (index === 0 ? 'var(--timeslot-afternoon)' : 'var(--timeslot-evening)')
                      : 'var(--text-primary)',
                    fontWeight: currentTimeslot === index ? 700 : 600,
                    fontSize: '0.9rem',
                    textAlign: 'center',
                    transition: 'color 200ms ease',
                    lineHeight: 1.2
                  }}
                >
                  {timeslot.label}
                </Typography>

                {/* Subtitle */}
                <Typography 
                  variant="caption" 
                  sx={{ 
                    color: currentTimeslot === index 
                      ? (index === 0 ? 'var(--timeslot-afternoon)' : 'var(--timeslot-evening)')
                      : 'var(--text-secondary)',
                    mt: 0.25,
                    textAlign: 'center',
                    transition: 'color 200ms ease',
                    fontSize: '0.7rem'
                  }}
                >
                  {timeslot.id === '6pm' ? 'Afternoon' : 'Evening'}
                </Typography>

                {/* Food count badge */}
                <Box
                  sx={{
                    position: 'absolute',
                    top: 4,
                    right: 4,
                    backgroundColor: currentTimeslot === index 
                      ? (index === 0 ? 'var(--timeslot-afternoon)' : 'var(--timeslot-evening)')
                      : 'var(--accent-green)',
                    color: 'white',
                    borderRadius: '50%',
                    width: 18,
                    height: 18,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.6rem',
                    fontWeight: 600,
                    boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
                  }}
                >
                  {timeslotData[timeslot.id]?.selectedFoods?.length || 0}
                </Box>
              </Box>
            ))}
          </Box>
        </Box>

        {/* Food selector - your existing component */}
        <Box sx={{ mb: 3 }}>
          <FoodSelectorWithFirebase
            selectedFoods={currentData.selectedFoods}
            onAddFood={handleAddFood}
            onUpdateAmount={handleUpdateAmount}
            onRemoveFood={handleRemoveFood}
            onSwapFood={handleSwapFood}
            onFoodPreview={(name, amount) => setPreviewFood({ name, amount })}
            onClearPreview={() => setPreviewFood(null)}
            onFoodSelect={(name) => {
              setSelectedFoodName(name);
              const defaultAmount = foodDatabase[name]?.isUnitFood 
                ? (name === 'Eggs' ? 2 : 1) 
                : (foodDatabase[name]?.useFixedAmount ? foodDatabase[name]?.fixedAmount || 100 : 100);
              setAmount(defaultAmount);
              setPreviewFood({ name, amount: defaultAmount });
            }}
            timeslotData={timeslotData}
            currentTimeslot={getCurrentTimeslotId()}
            isSwapping={isSwapping}
            targetCategory={targetCategory}
            onUpdateAmountForTimeslot={handleUpdateAmountForTimeslot}
            onRemoveFoodForTimeslot={handleRemoveFoodForTimeslot}
            onSwapFoodForTimeslot={handleSwapFoodForTimeslot}
            selectedFromFavorite={selectedFoodName}
          />
        </Box>

        {/* External nutrition input - your existing component */}
        <Box sx={{ mb: 3 }}>
          <ExternalNutritionInput
            nutrition={currentData.externalNutrition}
            onUpdateNutrition={handleUpdateExternal}
          />
        </Box>
      </Box>

      {/* ========== RIGHT COLUMN: Progress & Costs (Sticky) ========== */}
      <Box 
        sx={{ 
          flexBasis: { xs: '100%', md: '40%' },
          position: { md: 'sticky' },
          top: { md: 16 },
          alignSelf: { md: 'flex-start' },
          height: { md: 'fit-content' }
        }}
      >
        {/* Macro progress - your existing component */}
        <Box sx={{ mb: 3 }}>
          {nutritionGoals ? (
            <MacroProgress
              current={getTotalMacros}
              preview={getPreviewMacros}
              showPreview={!!previewFood}
              foodMacros={getCombinedFoodMacros}
              externalMacros={getCombinedExternal}
              goals={nutritionGoals}
              timeslotData={timeslotData}
              onLoad={setTimeslotData}
              favoriteFoods={getAvailableFavoriteFoods}
              onSelectFavorite={(foodName: string) => {
                // Handle special format from SaveLoadPlan: "foodName|amount"
                const parts = foodName.split('|');
                const actualFoodName = parts[0];
                const amount = parts[1] ? parseInt(parts[1]) : undefined;
                
                if (amount !== undefined) {
                  // This is a direct add from SaveLoadPlan
                  const foodToAdd: SelectedFood = { name: actualFoodName, amount };
                  handleAddFood(foodToAdd);
                  setSelectedFoodName('');
                  setAmount(100);
                  setPreviewFood(null);
                } else {
                  // This is a selection for configuration
                  setSelectedFoodName(actualFoodName);
                  const defaultAmount = foodDatabase[actualFoodName]?.isUnitFood 
                    ? (actualFoodName === 'Eggs' ? 2 : 1) 
                    : (foodDatabase[actualFoodName]?.useFixedAmount ? foodDatabase[actualFoodName]?.fixedAmount || 100 : 100);
                  setAmount(defaultAmount);
                  setPreviewFood({ name: actualFoodName, amount: defaultAmount });
                  
                  // Find and expand the category containing this food
                  const foodCategory = foodDatabase[actualFoodName]?.metadata?.category || 'Other';
                  // We need to trigger the FoodSelectorWithFirebase to expand this category
                  // This will be handled by the FoodSelectorWithFirebase component's handleFoodSelect
                }
              }}
              onClear={handleClearPlan}
            />
          ) : (
            <Typography>Loading nutrition goals...</Typography>
          )}
        </Box>

        {/* Meal cost display - your existing component */}
        <Box sx={{ mb: 3 }}>
          <MealCostDisplay
            timeslotData={timeslotData}
          />
        </Box>

        <Divider sx={{ my: 2 }} />
      </Box>
    </Box>
  );
};

export default TimeslotMealPlanner;
