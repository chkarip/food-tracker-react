/**
 * FoodTrack.tsx – Comprehensive Food-Tracking & Meal-Planning Interface
 * (header comments truncated for brevity)
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Alert,
  CircularProgress
} from '@mui/material';

import { useAuth } from '../../contexts/AuthContext';
import { getRecentDailyPlans } from '../../services/firebase';
import { DailyPlanDocument } from '../../types/firebase';
import { useFoodDatabase } from '../../contexts/FoodContext';
import foodHistoryService, {  MealProgramFood } from '../../services/firebase/nutrition/foodConsumptionService';
import { NutritionGoalFormData } from '../../types/food';
import { getNutritionGoal } from '../../services/firebase/nutrition/nutritionGoalService';

/* ------------------------------------------------------------------ */
/*  LOCAL TYPES                                                        */
/* ------------------------------------------------------------------ */

interface TrackedFood {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  protein: number;
  fats: number;
  carbs: number;
  calories: number;
}

interface DayProgram {
  date: string;
  foods: TrackedFood[];
  externalNutrition: {
    protein: number;
    fats: number;
    carbs: number;
    calories: number;
  };
  totalNutrition: {
    protein: number;
    fats: number;
    carbs: number;
    calories: number;
  };
  completed: boolean;
  completionStatus?: {
    '6pm': boolean;
    '9:30pm': boolean;
    gym: boolean;
  };
}

/* ------------------------------------------------------------------ */
/*  COMPONENT                                                          */
/* ------------------------------------------------------------------ */

const DEFAULT_GOALS = {
  protein: 127,
  fats: 65,
  carbs: 300,
  calories: 2300
};

const FoodTrack: React.FC = () => {
  const { user } = useAuth();
  const { foodDatabase } = useFoodDatabase();

  /* ---------- state ---------- */
  const [history, setHistory] = useState<DayProgram[]>([]);
  const [expandedDays, setExpandedDays] = useState<Set<string>>(new Set());
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; date: string }>({
    open: false,
    date: ''
  });
  const [goals, setGoals] = useState(DEFAULT_GOALS);
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /* ------------------------------------------------------------------ */
  /* LOAD HISTORY + GOALS                                              */
  /* ------------------------------------------------------------------ */

  useEffect(() => {
    const loadHistory = async () => {
      if (!user) {
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        setError(null);
        const recentPlans = await getRecentDailyPlans(user.uid, 30);

        /* Convert Firebase → DayProgram */
        const conv: DayProgram[] = recentPlans.map(plan => {
          const foods: TrackedFood[] = [];
          const ext = { protein: 0, fats: 0, carbs: 0, calories: 0 };

          Object.entries(plan.timeslots).forEach(([slotId, slot]) => {
            slot.selectedFoods.forEach((sel, idx) => {
              const info = foodDatabase[sel.name];
              const mult = info
                ? info.isUnitFood
                  ? sel.amount
                  : sel.amount / 100
                : 0;

              foods.push({
                id: `${slotId}_${idx}`,
                name: sel.name,
                quantity: sel.amount,
                unit: info?.isUnitFood ? 'units' : 'g',
                protein: (info?.nutrition.protein ?? 0) * mult,
                fats: (info?.nutrition.fats ?? 0) * mult,
                carbs: (info?.nutrition.carbs ?? 0) * mult,
                calories: (info?.nutrition.calories ?? 0) * mult
              });
            });

            ext.protein += slot.externalNutrition.protein;
            ext.fats += slot.externalNutrition.fats;
            ext.carbs += slot.externalNutrition.carbs;
            ext.calories += slot.externalNutrition.calories;
          });

          const completed =
            plan.completionStatus &&
            (plan.completionStatus['6pm'] ||
              plan.completionStatus['9:30pm'] ||
              plan.completionStatus.gym);

          return {
            date: plan.date,
            foods,
            externalNutrition: ext,
            totalNutrition: plan.totalMacros,
            completed: !!completed,
            completionStatus: plan.completionStatus
          };
        });

        conv.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        setHistory(conv);

        /* sync to analytics */
        await importMealDataToHistory(recentPlans);
      } catch (err) {
        console.error(err);
        setError('Failed to load food tracking history');
      } finally {
        setLoading(false);
      }
    };

    /* Restore: localStorage usage for goals */
    const saved = localStorage.getItem('nutritionGoals');
    if (saved) setGoals(JSON.parse(saved));
    loadHistory();
  }, [user?.uid, foodDatabase]);

  /* ------------------------------------------------------------------ */
  /* SYNC TO FOOD HISTORY ANALYTICS                                    */
  /* ------------------------------------------------------------------ */

  const importMealDataToHistory = async (plans: DailyPlanDocument[]) => {
    try {
      for (const plan of plans) {
        const foods: MealProgramFood[] = [];          // ← Typed array

        Object.values(plan.timeslots).forEach(slot => {
          slot.selectedFoods.forEach(sel => {
            const info = foodDatabase[sel.name];

            if (info) {
              const mult = info.isUnitFood ? sel.amount : sel.amount / 100;
              foods.push({
                name: sel.name,
                quantity: sel.amount,
                protein: (info.nutrition.protein ?? 0) * mult,
                fats: (info.nutrition.fats ?? 0) * mult,
                carbs: (info.nutrition.carbs ?? 0) * mult,
                calories: (info.nutrition.calories ?? 0) * mult,
                isUnitFood: info.isUnitFood            // ← required field
              });
            } else {
              foods.push({
                name: sel.name,
                quantity: sel.amount,
                protein: 0,
                fats: 0,
                carbs: 0,
                calories: 0,
                isUnitFood: false                       // ← fallback
              });
            }
          });
        });

        if (foods.length) {
          await foodHistoryService.importDailyMealProgram(
            { date: plan.date, foods },
            user?.uid
          );
        }
      }
    } catch (err) {
      console.warn('Meal-data import failed:', err);
    }
  };

  /* ------------------------------------------------------------------ */
  /* UI HELPERS (unchanged)                                            */
  /* ------------------------------------------------------------------ */

  const toggleDayExpansion = (date: string) => {
    setExpandedDays(prev => {
      const ns = new Set(prev);
      ns.has(date) ? ns.delete(date) : ns.add(date);
      return ns;
    });
  };

  /* ------------------------------------------------------------------ */
  /* RENDER                                                            */
  /* ------------------------------------------------------------------ */

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ m: 4 }}>
        {error}
      </Alert>
    );
  }

  if (!user) {
    return (
      <Alert severity="info" sx={{ m: 4 }}>
        Please sign in to view your food tracking history.
      </Alert>
    );
  }

  /* ---------- render your full UI below ---------- */
  return (
    <Box sx={{ p: 3 }}>
      {/* Tab navigation, history timeline, analytics tab, dialogs, etc. */}
      <Typography variant="h6">Food-Tracking interface (content omitted)</Typography>
    </Box>
  );
};

export default FoodTrack;
