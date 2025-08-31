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
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        p: 4,
        background: 'linear-gradient(135deg, var(--meal-bg-card) 0%, rgba(255,255,255,0.5) 100%)',
        borderRadius: 3,
        minHeight: '200px',
        alignItems: 'center'
      }}>
        <CircularProgress sx={{ color: 'var(--accent-green)' }} />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ 
        p: 3,
        background: 'linear-gradient(135deg, var(--meal-bg-card) 0%, rgba(255,255,255,0.5) 100%)',
        borderRadius: 3,
        minHeight: '200px'
      }}>
        <Alert severity="error" sx={{ m: 2 }}>
          {error}
        </Alert>
      </Box>
    );
  }

  if (!user) {
    return (
      <Box sx={{ 
        p: 3,
        background: 'linear-gradient(135deg, var(--meal-bg-card) 0%, rgba(255,255,255,0.5) 100%)',
        borderRadius: 3,
        minHeight: '200px'
      }}>
        <Alert severity="info" sx={{ m: 2 }}>
          Please sign in to view your food tracking history.
        </Alert>
      </Box>
    );
  }

  /* ---------- render your full UI below ---------- */
  return (
    <Box 
      sx={{ 
        display: 'flex', 
        gap: 3, 
        height: '100%', 
        p: 1.5,
        flexDirection: { xs: 'column', md: 'row' },
        background: 'linear-gradient(135deg, var(--meal-bg-card) 0%, rgba(255,255,255,0.5) 100%)',
        borderRadius: 3,
        minHeight: 'calc(100vh - 200px)'
      }}
    >
      {/* ========== LEFT COLUMN: History & Analytics ========== */}
      <Box 
        sx={{ 
          flexBasis: { xs: '100%', md: '70%' },
          minWidth: 0
        }}
      >
        {/* Header */}
        <Box sx={{ mb: 3 }}>
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
            Food Tracking History
          </Typography>
          <Typography variant="body2" sx={{ 
            color: 'var(--text-secondary)',
            pl: '12px'
          }}>
            View your daily meal plans and nutrition tracking over time
          </Typography>
        </Box>

        {/* History Timeline */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle1" sx={{ 
            mb: 2, 
            color: 'var(--text-primary)', 
            fontWeight: 600,
            position: 'relative',
            '&::before': {
              content: '""',
              position: 'absolute',
              left: 0,
              top: 0,
              bottom: 0,
              width: '2px',
              backgroundColor: 'var(--accent-blue)',
              borderRadius: '1px'
            },
            paddingLeft: '10px'
          }}>
            Recent Days
          </Typography>
          
          {history.length === 0 ? (
            <Box sx={{ 
              textAlign: 'center', 
              py: 6,
              backgroundColor: 'var(--surface-bg)',
              borderRadius: 2,
              border: '1px solid var(--border-color)'
            }}>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No tracking history yet
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Start planning meals to see your nutrition history here
              </Typography>
            </Box>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {history.map((dayProgram) => (
                <Box
                  key={dayProgram.date}
                  sx={{
                    backgroundColor: 'var(--surface-bg)',
                    borderRadius: 2,
                    border: '1px solid var(--border-color)',
                    p: 2,
                    transition: 'all 200ms ease',
                    '&:hover': {
                      boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                      transform: 'translateY(-1px)'
                    }
                  }}
                >
                  {/* Day Header */}
                  <Box sx={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    mb: 2
                  }}>
                    <Typography variant="h6" sx={{ 
                      color: 'var(--text-primary)',
                      fontWeight: 600
                    }}>
                      {new Date(dayProgram.date).toLocaleDateString('en-US', { 
                        weekday: 'long', 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      {dayProgram.completed && (
                        <Typography variant="caption" sx={{ 
                          backgroundColor: 'var(--accent-green)',
                          color: 'white',
                          px: 1.5,
                          py: 0.5,
                          borderRadius: 1,
                          fontWeight: 600
                        }}>
                          Completed
                        </Typography>
                      )}
                    </Box>
                  </Box>

                  {/* Nutrition Summary */}
                  <Box sx={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', 
                    gap: 2,
                    mb: 2
                  }}>
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="h6" sx={{ color: 'var(--protein-color)', fontWeight: 700 }}>
                        {dayProgram.totalNutrition.protein.toFixed(1)}g
                      </Typography>
                      <Typography variant="caption" color="text.secondary">Protein</Typography>
                    </Box>
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="h6" sx={{ color: 'var(--fats-color)', fontWeight: 700 }}>
                        {dayProgram.totalNutrition.fats.toFixed(1)}g
                      </Typography>
                      <Typography variant="caption" color="text.secondary">Fats</Typography>
                    </Box>
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="h6" sx={{ color: 'var(--carbs-color)', fontWeight: 700 }}>
                        {dayProgram.totalNutrition.carbs.toFixed(1)}g
                      </Typography>
                      <Typography variant="caption" color="text.secondary">Carbs</Typography>
                    </Box>
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="h6" sx={{ color: 'var(--calories-color)', fontWeight: 700 }}>
                        {dayProgram.totalNutrition.calories.toFixed(0)}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">Calories</Typography>
                    </Box>
                  </Box>

                  {/* Foods List */}
                  <Box>
                    <Typography variant="subtitle2" sx={{ mb: 1, color: 'var(--text-primary)' }}>
                      Foods Consumed ({dayProgram.foods.length} items)
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                      {dayProgram.foods.slice(0, 6).map((food) => (
                        <Typography 
                          key={food.id}
                          variant="caption" 
                          sx={{ 
                            backgroundColor: 'var(--meal-bg-card)',
                            color: 'var(--text-primary)',
                            px: 1.5,
                            py: 0.5,
                            borderRadius: 1,
                            fontWeight: 500
                          }}
                        >
                          {food.name} ({food.quantity}{food.unit})
                        </Typography>
                      ))}
                      {dayProgram.foods.length > 6 && (
                        <Typography 
                          variant="caption" 
                          sx={{ 
                            backgroundColor: 'var(--border-color)',
                            color: 'var(--text-secondary)',
                            px: 1.5,
                            py: 0.5,
                            borderRadius: 1,
                            fontWeight: 500
                          }}
                        >
                          +{dayProgram.foods.length - 6} more
                        </Typography>
                      )}
                    </Box>
                  </Box>
                </Box>
              ))}
            </Box>
          )}
        </Box>
      </Box>

      {/* ========== RIGHT COLUMN: Analytics & Goals ========== */}
      <Box 
        sx={{ 
          flexBasis: { xs: '100%', md: '30%' },
          position: { md: 'sticky' },
          top: { md: 16 },
          alignSelf: { md: 'flex-start' },
          height: { md: 'fit-content' }
        }}
      >
        {/* Current Goals */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle1" sx={{ 
            mb: 2, 
            color: 'var(--text-primary)', 
            fontWeight: 600,
            position: 'relative',
            '&::before': {
              content: '""',
              position: 'absolute',
              left: 0,
              top: 0,
              bottom: 0,
              width: '2px',
              backgroundColor: 'var(--accent-purple)',
              borderRadius: '1px'
            },
            paddingLeft: '10px'
          }}>
            Nutrition Goals
          </Typography>
          
          <Box sx={{ 
            backgroundColor: 'var(--surface-bg)',
            borderRadius: 2,
            border: '1px solid var(--border-color)',
            p: 2
          }}>
            <Box sx={{ 
              display: 'grid', 
              gridTemplateColumns: '1fr 1fr', 
              gap: 1.5,
              mb: 2
            }}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h6" sx={{ color: 'var(--protein-color)', fontWeight: 700 }}>
                  {goals.protein}g
                </Typography>
                <Typography variant="caption" color="text.secondary">Protein</Typography>
              </Box>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h6" sx={{ color: 'var(--fats-color)', fontWeight: 700 }}>
                  {goals.fats}g
                </Typography>
                <Typography variant="caption" color="text.secondary">Fats</Typography>
              </Box>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h6" sx={{ color: 'var(--carbs-color)', fontWeight: 700 }}>
                  {goals.carbs}g
                </Typography>
                <Typography variant="caption" color="text.secondary">Carbs</Typography>
              </Box>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h6" sx={{ color: 'var(--calories-color)', fontWeight: 700 }}>
                  {goals.calories}
                </Typography>
                <Typography variant="caption" color="text.secondary">Calories</Typography>
              </Box>
            </Box>
          </Box>
        </Box>

        {/* Quick Stats */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle1" sx={{ 
            mb: 2, 
            color: 'var(--text-primary)', 
            fontWeight: 600,
            position: 'relative',
            '&::before': {
              content: '""',
              position: 'absolute',
              left: 0,
              top: 0,
              bottom: 0,
              width: '2px',
              backgroundColor: 'var(--accent-orange)',
              borderRadius: '1px'
            },
            paddingLeft: '10px'
          }}>
            Quick Stats
          </Typography>
          
          <Box sx={{ 
            backgroundColor: 'var(--surface-bg)',
            borderRadius: 2,
            border: '1px solid var(--border-color)',
            p: 2
          }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2" color="text.secondary">Total Days Tracked</Typography>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>{history.length}</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2" color="text.secondary">Completed Days</Typography>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {history.filter(day => day.completed).length}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2" color="text.secondary">Avg Daily Protein</Typography>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {history.length > 0 
                    ? (history.reduce((acc, day) => acc + day.totalNutrition.protein, 0) / history.length).toFixed(1)
                    : 0}g
                </Typography>
              </Box>
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default FoodTrack;
