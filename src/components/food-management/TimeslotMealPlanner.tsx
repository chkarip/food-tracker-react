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
import { Box, Typography, Paper } from '@mui/material';
import {
  WbSunny as AfternoonIcon,
  Nightlight as EveningIcon,
} from '@mui/icons-material';

import MacroProgress from './MacroProgress';
import FoodSelectorWithFirebase from './FoodSelectorWithFirebase';
import { PageCard } from '../shared/PageCard';
import { calculateMacros } from '../../utils/nutritionCalculations';
import ExternalNutritionInput from './ExternalNutritionInput';
import SaveLoadPlan from './SaveLoadPlan';
import MealCostDisplay from './MealCostDisplay';
import { useLocalStorageWithExpiry } from '../../hooks/useLocalStorage';

import {
  SelectedFood,
  ExternalNutrition,
  NutritionData,
} from '../../types/nutrition';
import { calculateTotalMacros } from '../../utils/nutritionCalculations';
import { useFoodDatabase, convertToLegacyFoodFormat } from '../../services/firebase/nutrition/foodService';

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

/* ================================================================== */
interface PreviewFood {
  name: string;
  amount: number;
}

const TimeslotMealPlanner: React.FC = () => {
  /* ---------- state ---------- */
  const [currentTimeslot, setCurrentTimeslot] = useState(0);
  const { data: firestoreFoods = [] } = useFoodDatabase();
  const { user } = useAuth();

  // Convert Firestore foods to legacy format for compatibility
  const foodDatabase = useMemo(() => {
    if (!firestoreFoods.length) return {};
    return convertToLegacyFoodFormat(firestoreFoods);
  }, [firestoreFoods]);

  const [timeslotData, setTimeslotData] = useLocalStorageWithExpiry<Record<string, TimeslotData>>(
    'mealPlanner_timeslotData', // ✅ Use the correct key name
    {
      '6pm': {
        selectedFoods: [],
        externalNutrition: { protein: 0, fats: 0, carbs: 0, calories: 0 },
      },
      '9:30pm': {
        selectedFoods: [],
        externalNutrition: { protein: 0, fats: 0, carbs: 0, calories: 0 },
      },
    },
    { expiresOnNewDay: true } // ✅ Fresh start each day
  );

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      setTargetCategory(foodDatabase[food.name]?.metadata?.category || 'Fruits & Treats');
      
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
      setTargetCategory(foodDatabase[food.name]?.metadata?.category || 'Fruits & Treats');
      
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
    
    // Clear preview state
    setPreviewFood(null);
    setSelectedFoodName('');
    setAmount(100);
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  // Aggressive cleanup - run immediately on every render
  useEffect(() => {
    // Aggressive cleanup - run immediately on every render
    const cleanupDuplicates = () => {
      const duplicateKeys = ['timeslotData'];
      duplicateKeys.forEach(key => {
        if (localStorage.getItem(key)) {
          console.log(`🧹 Removing duplicate localStorage key: ${key}`);
          localStorage.removeItem(key);
        }
      });
    };

    // Clean up immediately
    cleanupDuplicates();

    // Also clean up after a short delay to catch async race conditions
    const timeout = setTimeout(cleanupDuplicates, 100);

    return () => {
      clearTimeout(timeout);
      // Clean up on unmount too
      cleanupDuplicates();
    };
  }, []); // Run on every mount

  // Additional periodic cleanup
  useEffect(() => {
    const interval = setInterval(() => {
      if (localStorage.getItem('timeslotData')) {
        console.log('🧹 Periodic cleanup: removing duplicate timeslotData');
        localStorage.removeItem('timeslotData');
      }
    }, 2000); // Check every 2 seconds

    return () => clearInterval(interval);
  }, []);

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
    <PageCard title="Meal Plan">
      <Box 
        sx={{ 
          display: 'flex', 
          gap: 3, 
          height: '100%', 
          flexDirection: { xs: 'column', md: 'row' },
          minHeight: 'calc(100vh - 200px)',
        }}
      >
        {/* ========== LEFT COLUMN: Food Selection & Settings ========== */}
      <Box 
        sx={{ 
          flexBasis: { xs: '100%', md: '50%' },
          minWidth: 0
        }}
      >
        {/* Timeslot picker - Wrapped in Paper card like other sections */}
        <Paper sx={{ 
          mb: 3,
          p: 2,
          backgroundColor: 'var(--card-bg)',
          borderRadius: 2,
          border: '1px solid var(--border-color)',
          boxShadow: 'var(--elevation-1)'
        }}>
          <Typography variant="h6" sx={{ 
            mb: 1.5, 
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
        </Paper>

        {/* Food selector - your existing component */}
        <Box sx={{ mb: 1.5 }}>
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
            externalNutrition={currentData.externalNutrition}
            onUpdateExternalNutrition={handleUpdateExternal}
          />
        </Box>

        {/* External nutrition input - your existing component */}
        <Box sx={{ mb: 1 }}>
          <ExternalNutritionInput
            nutrition={currentData.externalNutrition}
            onUpdateNutrition={handleUpdateExternal}
          />
        </Box>
      </Box>

      {/* ========== RIGHT COLUMN: Progress & Costs (Sticky) ========== */}
      <Box 
        sx={{ 
          flexBasis: { xs: '100%', md: '50%' },
          position: { md: 'sticky' },
          top: { md: 16 },
          alignSelf: { md: 'flex-start' },
          height: { md: 'fit-content' }
        }}
      >
        {/* Macro progress - your existing component */}
        <Box sx={{ mb: 1.5 }}>
          {nutritionGoals ? (
            <MacroProgress
              current={getTotalMacros}
              preview={getPreviewMacros}
              showPreview={!!previewFood}
              foodMacros={getCombinedFoodMacros}
              externalMacros={getCombinedExternal}
              goals={nutritionGoals}
            />
          ) : (
            <Typography>Loading nutrition goals...</Typography>
          )}
        </Box>

        {/* Meal cost display - expandable */}
        <Box sx={{ mb: 1.5 }}>
          <MealCostDisplay 
            timeslotData={timeslotData} 
            previewFood={previewFood}
            currentTimeslot={getCurrentTimeslotId()}
          />
        </Box>

        {/* Save/Load/Clear Actions */}
        <Box sx={{ mb: 1 }}>
          <SaveLoadPlan
            timeslotData={timeslotData}
            onLoad={(loaded) => setTimeslotData(loaded)}
            favoriteFoods={getAvailableFavoriteFoods}
            onSelectFavorite={(payload) => {
              // e.g., "FoodName|150"
              const [name, amtStr] = payload.split('|');
              const amount = Number(amtStr) || 100;
              setSelectedFoodName(name);
              setAmount(amount);
              setPreviewFood({ name, amount });
            }}
            onClear={handleClearPlan}
            size="compact"
          />
        </Box>
      </Box>
      </Box>
    </PageCard>
  );
};export default TimeslotMealPlanner;
