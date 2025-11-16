/**
 * FoodTrack.tsx – Comprehensive Food-Tracking & Meal-Planning Interface
 * (header comments truncated for brevity)
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Alert,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  ToggleButtonGroup,
  ToggleButton,
  Chip
} from '@mui/material';

import { useAuth } from '../../contexts/AuthContext';
import { useFoodDatabase } from '../../contexts/FoodContext';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../../config/firebase';

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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeFilter, setTimeFilter] = useState<'week' | 'month'>('month');

  /* ------------------------------------------------------------------ */
  /* LOAD HISTORY + GOALS                                              */
  /* ------------------------------------------------------------------ */

  useEffect(() => {
    const loadHistory = async () => {
      if (!user) {
        setLoading(false);
        return;
      }
      
      // Wait for foodDatabase to be loaded
      if (!foodDatabase || Object.keys(foodDatabase).length === 0) {
        console.log('FoodTrack: Waiting for foodDatabase to load...');
        return;
      }

      try {
        setLoading(true);
        setError(null);
        console.log('FoodTrack: Loading meal plans for user:', user.uid);
        
        // Query mealPlans collection directly
        const q = query(
          collection(db, 'mealPlans'),
          where('userId', '==', user.uid),
          orderBy('date', 'desc')
        );
        
        const querySnapshot = await getDocs(q);
        console.log('FoodTrack: Loaded', querySnapshot.docs.length, 'meal plans');

        /* Convert Firebase → DayProgram */
        const conv: DayProgram[] = querySnapshot.docs.map(docSnapshot => {
          const plan = docSnapshot.data();
          const foods: TrackedFood[] = [];
          const ext = { protein: 0, fats: 0, carbs: 0, calories: 0 };

          // Process timeslots (6pm and 9:30pm)
          Object.entries(plan.timeslots || {}).forEach(([slotId, slot]: [string, any]) => {
            (slot.selectedFoods || []).forEach((sel: any, idx: number) => {
              const info = foodDatabase[sel.name];
              
              const mult = info
                ? info.isUnitFood
                  ? sel.amount
                  : sel.amount / 100
                : 0;

              foods.push({
                id: `${slotId}_${idx}`,
                name: sel.name,
                quantity: Number(sel.amount), // Convert to number to avoid string concatenation
                unit: info?.isUnitFood ? 'units' : 'g',
                protein: (info?.nutrition.protein ?? 0) * mult,
                fats: (info?.nutrition.fats ?? 0) * mult,
                carbs: (info?.nutrition.carbs ?? 0) * mult,
                calories: (info?.nutrition.calories ?? 0) * mult
              });
            });

            // Add external nutrition if present
            if (slot.externalNutrition) {
              ext.protein += slot.externalNutrition.protein || 0;
              ext.fats += slot.externalNutrition.fats || 0;
              ext.carbs += slot.externalNutrition.carbs || 0;
              ext.calories += slot.externalNutrition.calories || 0;
            }
          });

          return {
            date: plan.date,
            foods,
            externalNutrition: ext,
            totalNutrition: plan.totalMacros || { protein: 0, fats: 0, carbs: 0, calories: 0 },
            completed: false,
            completionStatus: undefined
          };
        });

        console.log('FoodTrack: Converted to', conv.length, 'day programs with', conv.reduce((sum, day) => sum + day.foods.length, 0), 'total foods');
        setHistory(conv);
      } catch (err) {
        console.error('FoodTrack: Error loading history:', err);
        setError(err instanceof Error ? err.message : 'Failed to load food tracking history');
      } finally {
        setLoading(false);
      }
    };

    loadHistory();
  }, [user?.uid, foodDatabase]);

  /* ------------------------------------------------------------------ */
  /* FOOD AGGREGATION FOR TABLE VIEW                                   */
  /* ------------------------------------------------------------------ */

  const getFilteredHistory = () => {
    const now = new Date();
    const cutoffDate = new Date();
    
    if (timeFilter === 'week') {
      cutoffDate.setDate(now.getDate() - 7);
    } else {
      cutoffDate.setDate(1); // Start of current month
    }

    return history.filter(day => {
      const dayDate = new Date(day.date);
      return dayDate >= cutoffDate;
    });
  };

  const aggregateFoodData = () => {
    const filteredHistory = getFilteredHistory();
    
    const foodMap = new Map<string, {
      name: string;
      totalQuantity: number;
      unit: string;
      totalCost: number;
      protein: number;
      fats: number;
      carbs: number;
      calories: number;
      count: number;
    }>();

    filteredHistory.forEach(day => {
      day.foods.forEach(food => {
        const existing = foodMap.get(food.name);
        
        // Get cost from foodDatabase
        const foodInfo = foodDatabase[food.name];
        const costPerKgOrUnit = foodInfo?.cost?.costPerKg || 0;
        const costUnit = foodInfo?.cost?.unit || (foodInfo?.isUnitFood ? 'unit' : 'kg');
        
        // Calculate cost based on food type
        let foodCost = 0;
        if (costPerKgOrUnit > 0) {
          if (costUnit === 'unit') {
            // Unit food: cost is per unit, quantity is in units
            foodCost = food.quantity * costPerKgOrUnit;
          } else {
            // Weight food: cost is per kg, quantity is in grams
            foodCost = (food.quantity / 1000) * costPerKgOrUnit;
          }
        }

        if (existing) {
          existing.totalQuantity += food.quantity;
          existing.totalCost += foodCost;
          existing.protein += food.protein;
          existing.fats += food.fats;
          existing.carbs += food.carbs;
          existing.calories += food.calories;
          existing.count += 1;
        } else {
          foodMap.set(food.name, {
            name: food.name,
            totalQuantity: food.quantity,
            unit: food.unit,
            totalCost: foodCost,
            protein: food.protein,
            fats: food.fats,
            carbs: food.carbs,
            calories: food.calories,
            count: 1
          });
        }
      });
    });

    return Array.from(foodMap.values()).sort((a, b) => b.totalQuantity - a.totalQuantity);
  };

  const aggregatedFoods = aggregateFoodData();
  const totalCost = aggregatedFoods.reduce((sum, food) => sum + food.totalCost, 0);

  /* ------------------------------------------------------------------ */
  /* RENDER                                                            */
  /* ------------------------------------------------------------------ */

  if (loading) {
    return (
      <Box sx={{ 
        display: 'flex', 
        flexDirection: 'column',
        justifyContent: 'center', 
        alignItems: 'center',
        p: 4,
        background: 'linear-gradient(135deg, var(--meal-bg-card) 0%, rgba(255,255,255,0.5) 100%)',
        borderRadius: 3,
        minHeight: '200px',
        gap: 2
      }}>
        <CircularProgress sx={{ color: 'var(--accent-green)' }} />
        <Typography variant="body2" color="text.secondary">
          Loading food tracking history...
        </Typography>
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
        p: 2,
        background: 'linear-gradient(135deg, var(--meal-bg-card) 0%, rgba(255,255,255,0.5) 100%)',
        borderRadius: 3,
        minHeight: 'calc(100vh - 200px)'
      }}
    >
      <Typography variant="h5" sx={{ mb: 3, fontWeight: 700 }}>Food Consumption This Week</Typography>

      {!aggregatedFoods || aggregatedFoods.length === 0 ? (
        <Typography>No foods tracked this week</Typography>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 700, width: '40%' }}>Food Name</TableCell>
                <TableCell align="center" sx={{ fontWeight: 700, width: '20%' }}>Quantity</TableCell>
                <TableCell align="center" sx={{ fontWeight: 700, width: '20%' }}>Total (kg)</TableCell>
                <TableCell align="center" sx={{ fontWeight: 700, width: '20%' }}>Cost (€)</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {aggregatedFoods.map((food) => {
                const totalGrams = Number(food.totalQuantity || 0);
                const kgDisplay = food.unit === 'g' ? (totalGrams / 1000).toFixed(2) : '-';
                
                return (
                  <TableRow key={food.name}>
                    <TableCell>{food.name}</TableCell>
                    <TableCell align="center">
                      <Box component="span" sx={{ fontFamily: 'monospace', fontWeight: 600 }}>
                        {food.count}
                      </Box>
                    </TableCell>
                    <TableCell align="center">
                      <Box component="span" sx={{ fontFamily: 'monospace', fontWeight: 600 }}>
                        {kgDisplay} kg
                      </Box>
                    </TableCell>
                    <TableCell align="center">
                      <Box component="span" sx={{ fontFamily: 'monospace', fontWeight: 600 }}>
                        €{Number(food.totalCost || 0).toFixed(2)}
                      </Box>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
};

export default FoodTrack;
