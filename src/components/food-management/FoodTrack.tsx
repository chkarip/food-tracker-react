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
  IconButton,
  Menu,
  MenuItem,
  Checkbox,
  FormControlLabel
} from '@mui/material';
import { MoreVert as MoreVertIcon } from '@mui/icons-material';

import { useAuth } from '../../contexts/AuthContext';
import { useFoodDatabase } from '../../contexts/FoodContext';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { PageCard } from '../shared/PageCard';

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

const FoodTrack: React.FC = () => {
  const { user } = useAuth();
  const { foodDatabase } = useFoodDatabase();

  /* ---------- state ---------- */
  const [history, setHistory] = useState<DayProgram[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [visibleColumns, setVisibleColumns] = useState({
    quantity: true,
    totalKg: true,
    costPerKg: true,
    costPerQuantity: true,
    totalCost: true
  });

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
        
        // Query mealPlans collection directly
        const q = query(
          collection(db, 'mealPlans'),
          where('userId', '==', user.uid),
          orderBy('date', 'desc')
        );
        
        const querySnapshot = await getDocs(q);

        /* Convert Firebase → DayProgram */
        const conv: DayProgram[] = querySnapshot.docs.map(docSnapshot => {
          const plan = docSnapshot.data();
          const foods: TrackedFood[] = [];
          const ext = { protein: 0, fats: 0, carbs: 0, calories: 0 };

          // Process timeslots (6pm and 9:30pm)
          Object.entries(plan.timeslots || {}).forEach(([slotId, slot]: [string, any]) => {
            (slot.selectedFoods || []).forEach((sel: any, idx: number) => {
              const info = foodDatabase?.[sel.name];
              
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
    // Filter to show only last month's data
    const now = new Date();
    const oneMonthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
    
    return history.filter(day => {
      const dayDate = new Date(day.date);
      return dayDate >= oneMonthAgo;
    });
  };

  const aggregateFoodData = () => {
    const filteredHistory = getFilteredHistory();
    
    const foodMap = new Map<string, {
      name: string;
      totalQuantity: number;
      unit: string;
      totalCost: number;
      costPerKg: number;
      costPerQuantity: number;
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
        const foodInfo = foodDatabase?.[food.name];
        const costPerKgOrUnit = foodInfo?.cost?.costPerKg ?? 0;
        const costUnit = foodInfo?.cost?.unit ?? (foodInfo?.isUnitFood ? 'unit' : 'kg');
        
        // Debug log for first food item
        if (!existing && Object.keys(foodMap).length === 0) {
          console.log('FoodTrack Debug:', {
            foodName: food.name,
            foodInfo: foodInfo,
            cost: foodInfo?.cost,
            costPerKgOrUnit,
            costUnit,
            quantity: food.quantity
          });
        }
        
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
            costPerKg: costUnit === 'kg' ? costPerKgOrUnit : 0,
            costPerQuantity: costUnit === 'unit' ? costPerKgOrUnit : 0,
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

  /* ------------------------------------------------------------------ */
  /* RENDER                                                            */
  /* ------------------------------------------------------------------ */

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

  const handleToggleColumn = (column: keyof typeof visibleColumns) => {
    setVisibleColumns(prev => ({
      ...prev,
      [column]: !prev[column]
    }));
  };

  /* ---------- render your full UI below ---------- */
  return (
    <PageCard title="Food Track" loading={loading}>
      {/* Header Section */}
      <Paper sx={{
        p: 2,
        mb: 3,
        backgroundColor: 'var(--meal-bg-card)',
        borderRadius: '12px',
        border: '1px solid var(--meal-border-primary)',
        boxShadow: 'var(--meal-shadow-primary)'
      }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography 
            variant="h6" 
            sx={{ 
              fontWeight: 700,
              color: 'var(--text-primary)',
              position: 'relative',
              '&::before': {
                content: '""',
                position: 'absolute',
                left: -12,
                top: 0,
                bottom: 0,
                width: '3px',
                backgroundColor: 'var(--accent-green)',
                borderRadius: '2px'
              },
              paddingLeft: '12px'
            }}
          >
            Food Consumption This Month
          </Typography>
          
          {/* Column visibility menu */}
          <IconButton
            onClick={(e) => setMenuAnchor(e.currentTarget)}
            sx={{ 
              color: 'var(--text-secondary)',
              '&:hover': { 
                color: 'var(--accent-blue)',
                backgroundColor: 'rgba(33, 150, 243, 0.1)'
              }
            }}
          >
            <MoreVertIcon />
          </IconButton>
        </Box>
      </Paper>

      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={() => setMenuAnchor(null)}
        sx={{
          '& .MuiPaper-root': {
            backgroundColor: 'rgba(20, 24, 28, 0.98)', // nearly black, almost fully opaque
            border: '1px solid var(--meal-border-primary)',
            borderRadius: '8px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.7)',
            color: 'var(--text-primary)',
            backdropFilter: 'none',
          }
        }}
      >
        <MenuItem disableRipple sx={{ cursor: 'default', '&:hover': { backgroundColor: 'transparent' }, py: 1.5, borderBottom: '1px solid var(--meal-border-primary)' }}>
          <Typography variant="caption" sx={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.85rem', letterSpacing: '0.5px' }}>
            Show/Hide Columns
          </Typography>
        </MenuItem>
        <MenuItem 
          onClick={() => handleToggleColumn('quantity')}
          sx={{ 
            '&:hover': { backgroundColor: 'var(--meal-bg-hover)' },
            borderRadius: '4px',
            mx: 0.5
          }}
        >
          <FormControlLabel
            control={
              <Checkbox 
                checked={visibleColumns.quantity}
                sx={{
                  color: 'var(--text-secondary)',
                  '&.Mui-checked': { color: 'var(--accent-green)' }
                }}
              />
            }
            label="Quantity"
            sx={{ pointerEvents: 'none', color: 'var(--text-primary)' }}
          />
        </MenuItem>
        <MenuItem 
          onClick={() => handleToggleColumn('totalKg')}
          sx={{ 
            '&:hover': { backgroundColor: 'var(--meal-bg-hover)' },
            borderRadius: '4px',
            mx: 0.5
          }}
        >
          <FormControlLabel
            control={
              <Checkbox 
                checked={visibleColumns.totalKg}
                sx={{
                  color: 'var(--text-secondary)',
                  '&.Mui-checked': { color: 'var(--accent-green)' }
                }}
              />
            }
            label="Total (kg)"
            sx={{ pointerEvents: 'none', color: 'var(--text-primary)' }}
          />
        </MenuItem>
        <MenuItem 
          onClick={() => handleToggleColumn('costPerKg')}
          sx={{ 
            '&:hover': { backgroundColor: 'var(--meal-bg-hover)' },
            borderRadius: '4px',
            mx: 0.5
          }}
        >
          <FormControlLabel
            control={
              <Checkbox 
                checked={visibleColumns.costPerKg}
                sx={{
                  color: 'var(--text-secondary)',
                  '&.Mui-checked': { color: 'var(--accent-green)' }
                }}
              />
            }
            label="Cost/kg"
            sx={{ pointerEvents: 'none', color: 'var(--text-primary)' }}
          />
        </MenuItem>
        <MenuItem 
          onClick={() => handleToggleColumn('costPerQuantity')}
          sx={{ 
            '&:hover': { backgroundColor: 'var(--meal-bg-hover)' },
            borderRadius: '4px',
            mx: 0.5
          }}
        >
          <FormControlLabel
            control={
              <Checkbox 
                checked={visibleColumns.costPerQuantity}
                sx={{
                  color: 'var(--text-secondary)',
                  '&.Mui-checked': { color: 'var(--accent-green)' }
                }}
              />
            }
            label="Cost/Unit"
            sx={{ pointerEvents: 'none', color: 'var(--text-primary)' }}
          />
        </MenuItem>
        <MenuItem 
          onClick={() => handleToggleColumn('totalCost')}
          sx={{ 
            '&:hover': { backgroundColor: 'var(--meal-bg-hover)' },
            borderRadius: '4px',
            mx: 0.5
          }}
        >
          <FormControlLabel
            control={
              <Checkbox 
                checked={visibleColumns.totalCost}
                sx={{
                  color: 'var(--text-secondary)',
                  '&.Mui-checked': { color: 'var(--accent-green)' }
                }}
              />
            }
            label="Total Cost"
            sx={{ pointerEvents: 'none', color: 'var(--text-primary)' }}
          />
        </MenuItem>
      </Menu>

      {!aggregatedFoods || aggregatedFoods.length === 0 ? (
        <Paper sx={{
          p: 4,
          textAlign: 'center',
          backgroundColor: 'var(--meal-bg-card)',
          borderRadius: '12px',
          border: '1px solid var(--meal-border-primary)'
        }}>
          <Typography sx={{ color: 'var(--text-secondary)' }}>No foods tracked this month</Typography>
        </Paper>
      ) : (
        <TableContainer 
          component={Paper}
          sx={{
            backgroundColor: 'var(--meal-bg-card)',
            borderRadius: '12px',
            border: '1px solid var(--meal-border-primary)',
            boxShadow: 'var(--meal-shadow-primary)',
            overflow: 'hidden'
          }}
        >
          <Table>
            <TableHead>
              <TableRow sx={{
                backgroundColor: 'var(--meal-bg-primary)',
                '& th': {
                  color: 'var(--text-primary)',
                  fontWeight: 700,
                  fontSize: '0.9rem',
                  borderBottom: '2px solid var(--meal-border-primary)',
                  py: 2
                }
              }}>
                <TableCell>Food Name</TableCell>
                {visibleColumns.quantity && (
                  <TableCell align="center">Quantity</TableCell>
                )}
                {visibleColumns.totalKg && (
                  <TableCell align="center">Total (kg)</TableCell>
                )}
                {visibleColumns.costPerKg && (
                  <TableCell align="center">Cost/kg (€)</TableCell>
                )}
                {visibleColumns.costPerQuantity && (
                  <TableCell align="center">Cost/Unit (€)</TableCell>
                )}
                {visibleColumns.totalCost && (
                  <TableCell align="center">Total Cost (€)</TableCell>
                )}
              </TableRow>
            </TableHead>
            <TableBody>
              {aggregatedFoods.map((food, index) => {
                const totalGrams = Number(food.totalQuantity || 0);
                const kgDisplay = food.unit === 'g' ? (totalGrams / 1000).toFixed(2) : '-';
                
                return (
                  <TableRow 
                    key={food.name}
                    sx={{
                      backgroundColor: index % 2 === 0 ? 'var(--meal-bg-card)' : 'var(--surface-bg)',
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        backgroundColor: 'var(--meal-bg-hover)',
                        transform: 'translateX(4px)',
                        boxShadow: 'inset 3px 0 0 var(--accent-green)'
                      },
                      '& td': {
                        borderBottom: '1px solid var(--meal-border-primary)',
                        py: 1.5,
                        color: 'var(--text-primary)'
                      }
                    }}
                  >
                    <TableCell sx={{ fontWeight: 600 }}>{food.name}</TableCell>
                    {visibleColumns.quantity && (
                      <TableCell align="center">
                        <Box 
                          component="span" 
                          sx={{ 
                            fontFamily: 'monospace', 
                            fontWeight: 600,
                            color: 'var(--accent-blue)',
                            backgroundColor: 'rgba(33, 150, 243, 0.1)',
                            px: 1.5,
                            py: 0.5,
                            borderRadius: '6px',
                            display: 'inline-block'
                          }}
                        >
                          {food.unit === 'units' ? Math.round(food.totalQuantity) : food.count}
                        </Box>
                      </TableCell>
                    )}
                    {visibleColumns.totalKg && (
                      <TableCell align="center">
                        <Box 
                          component="span" 
                          sx={{ 
                            fontFamily: 'monospace', 
                            fontWeight: 600,
                            color: 'var(--accent-green)'
                          }}
                        >
                          {kgDisplay} kg
                        </Box>
                      </TableCell>
                    )}
                    {visibleColumns.costPerKg && (
                      <TableCell align="center">
                        <Box 
                          component="span" 
                          sx={{ 
                            fontFamily: 'monospace', 
                            fontWeight: 600,
                            color: 'var(--text-secondary)'
                          }}
                        >
                          {food.costPerKg > 0 ? `€${food.costPerKg.toFixed(2)}` : '-'}
                        </Box>
                      </TableCell>
                    )}
                    {visibleColumns.costPerQuantity && (
                      <TableCell align="center">
                        <Box 
                          component="span" 
                          sx={{ 
                            fontFamily: 'monospace', 
                            fontWeight: 600,
                            color: 'var(--text-secondary)'
                          }}
                        >
                          {food.costPerQuantity > 0 ? `€${food.costPerQuantity.toFixed(2)}` : '-'}
                        </Box>
                      </TableCell>
                    )}
                    {visibleColumns.totalCost && (
                      <TableCell align="center">
                        <Box 
                          component="span" 
                          sx={{ 
                            fontFamily: 'monospace', 
                            fontWeight: 700,
                            color: 'var(--accent-orange)',
                            fontSize: '0.95rem'
                          }}
                        >
                          €{Number(food.totalCost || 0).toFixed(2)}
                        </Box>
                      </TableCell>
                    )}
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </PageCard>
  );
};

export default FoodTrack;
