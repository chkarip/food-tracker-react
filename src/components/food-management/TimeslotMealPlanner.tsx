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

import React, { useState, useCallback, useMemo } from 'react';
import { Box, Tabs, Tab, Typography, Paper, Divider } from '@mui/material';
import {
  WbSunny as AfternoonIcon,
  Nightlight as EveningIcon,
} from '@mui/icons-material';

import MacroProgress from './MacroProgress';
import FoodSelectorWithFirebase from './FoodSelectorWithFirebase';
import { calculateMacros } from '../../utils/nutritionCalculations';
import ExternalNutritionInput from './ExternalNutritionInput';
import SaveLoadPlan from './SaveLoadPlan';
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

/* ================================================================== */
interface PreviewFood {
  name: string;
  amount: number;
}

const TimeslotMealPlanner: React.FC = () => {
  /* ---------- state ---------- */
  const [currentTimeslot, setCurrentTimeslot] = useState(0);
  const { foodDatabase } = useFoodDatabase();

  const [timeslotData, setTimeslotData] = useState<Record<string, TimeslotData>>(
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
  );

  // Live preview state
  const [previewFood, setPreviewFood] = useState<PreviewFood | null>(null);

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
    },
    [getCurrentTimeslotId, getCurrentData, updateTimeslotData, timeslotData],
  );

  const handleUpdateExternal = useCallback(
    (n: ExternalNutrition) =>
      updateTimeslotData(getCurrentTimeslotId(), { externalNutrition: n }),
    [getCurrentTimeslotId, updateTimeslotData],
  );

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

  /* ---------- render ---------- */
  const currentData = getCurrentData();

  return (
    <Box 
      sx={{ 
        display: 'flex', 
        gap: 3, 
        height: '100%', 
        p: 2,
        flexDirection: { xs: 'column', md: 'row' }
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
        {/* Timeslot picker */}
        <Tabs
          value={currentTimeslot}
          onChange={(_, v) => setCurrentTimeslot(v)}
          variant="fullWidth"
          sx={{ mb: 3 }}
        >
          {TIMESLOTS.map((t) => (
            <Tab
              key={t.id}
              label={t.label}
              icon={t.icon}
              iconPosition="start"
            />
          ))}
        </Tabs>

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
          <MacroProgress
            current={getTotalMacros}
            preview={getPreviewMacros}
            showPreview={!!previewFood}
            foodMacros={getCombinedFoodMacros}
            externalMacros={getCombinedExternal}
          />
        </Box>

        {/* Meal cost display - your existing component */}
        <Box sx={{ mb: 3 }}>
          <MealCostDisplay
            timeslotData={timeslotData}
          />
        </Box>

        <Divider sx={{ my: 2 }} />

        {/* Save/load plan - your existing component */}
        <SaveLoadPlan
          timeslotData={timeslotData}
          onLoad={setTimeslotData}
        />
      </Box>
    </Box>
  );
};

export default TimeslotMealPlanner;
