/**
 * ShoppingList
 * ------------------------------------------------------------
 * PURPOSE
 * Simple shopping list that stores food name and quantity in Firestore,
 * then calculates macros, costs, and stats on the UI when displaying.
 *
 * RESPONSIBILITIES
 * • CRUD on shopping list items stored in 'shoppingList' collection
 * • Real-time calculation of macros and costs from food database
 * • Simple UI for adding/removing items and adjusting quantities
 * • Display nutrition summary and cost breakdown
 *
 * STATE SNAPSHOT
 * • shoppingList     – ShoppingListItem[] from Firestore
 * • loading          – Loading state for data fetching
 * • error            – Error state for failed operations
 *
 * BUSINESS RULES
 * • Stores minimal data: foodName, quantity (kg/units), unit, userId
 * • Calculates macros/costs on-the-fly using foodDatabase
 * • Real-time updates via Firestore subscription
 * • Supports both weight foods (kg) and unit foods (units)
 */
import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Typography,
  Alert,
  Chip,
  Stack,
  Button,
  Card,
  CardContent,
  Divider,
  Snackbar,
  CircularProgress,
  Paper
} from '@mui/material';
import PageCard from '../shared/PageCard';
import { useFoodDatabase } from '../../contexts/FoodContext';
import { GenericCard } from '../shared/cards/GenericCard';
import { NumberStepper } from '../shared/inputs';
import { MACRO_TARGETS } from '../../config/nutritionTargets';
import { FirestoreFood } from '../../types/food';
import { useAuth } from '../../contexts/AuthContext';
import shoppingListService from '../../services/firebase/nutrition/shoppingListService';

interface LocalShoppingListItem {
  foodId: string;
  food: FirestoreFood;
  quantity: number; // in grams or units
  servingSize: number; // serving size in grams or units
  totalCost: number;
  totalMacros: {
    protein: number;
    fats: number;
    carbs: number;
    calories: number;
  };
  inputUnit: 'g' | 'kg' | 'units'; // Track the input unit for display
}

const ShoppingList: React.FC = () => {
  const { foodDatabase } = useFoodDatabase();
  const { user } = useAuth();
  const [shoppingList, setShoppingList] = useState<LocalShoppingListItem[]>([]);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Load from localStorage on mount
  useEffect(() => {
    const savedList = localStorage.getItem('shoppingList');
    if (savedList) {
      try {
        const parsedList = JSON.parse(savedList);
        setShoppingList(parsedList);
      } catch (error) {
        console.error('Error loading shopping list from localStorage:', error);
      }
    }
  }, []);

  // Save to localStorage whenever shoppingList changes
  useEffect(() => {
    localStorage.setItem('shoppingList', JSON.stringify(shoppingList));
  }, [shoppingList]);

  // Period multipliers
  const periodMultipliers = { week: 7, month: 31, year: 365 } as const;

  // Convert food database to array
  const availableFoods = useMemo(() => {
    return Object.values(foodDatabase).map(
      food =>
        ({
          ...food,
          metadata: {
            category: 'Fruits & Treats',
            isUnitFood: false,
            useFixedAmount: false,
            fixedAmount: 0,
            hidden: false,
            favorite: false,
            ...food.metadata
          },
          firestoreId: food.name.toLowerCase().replace(/[^a-z0-9]/g, '-')
        } as FirestoreFood)
    );
  }, [foodDatabase]);

  // Group foods by category
  const foodsByCategory = useMemo(() => {
    const grouped: Record<string, FirestoreFood[]> = {};
    availableFoods.forEach(food => {
      const category = food.metadata?.category || 'Other';
      if (!grouped[category]) {
        grouped[category] = [];
      }
      grouped[category].push(food);
    });
    return grouped;
  }, [availableFoods]);

  // Calculate totals
  const totals = useMemo(() => {
    return shoppingList.reduce(
      (acc, item) => ({
        cost: acc.cost + item.totalCost,
        protein: acc.protein + item.totalMacros.protein,
        fats: acc.fats + item.totalMacros.fats,
        carbs: acc.carbs + item.totalMacros.carbs,
        calories: acc.calories + item.totalMacros.calories
      }),
      { cost: 0, protein: 0, fats: 0, carbs: 0, calories: 0 }
    );
  }, [shoppingList]);

  // Base macros from current shopping list (unscaled)
  const baseMacros = totals;

  // Local calculation functions that work with FirestoreFood type
  const calculateMacrosForFood = (food: FirestoreFood, quantity: number) => {
    const multiplier = food.metadata?.isUnitFood ? quantity : quantity / 100;
    return {
      protein: (food.nutrition.protein || 0) * multiplier,
      fats: (food.nutrition.fats || 0) * multiplier,
      carbs: (food.nutrition.carbs || 0) * multiplier,
      calories: (food.nutrition.calories || 0) * multiplier
    };
  };

  const calculateCostForFood = (food: FirestoreFood, quantity: number): number => {
    if (!food.cost || food.cost.costPerKg == null) return 0;

    const { costPerKg, unit } = food.cost;

    if ((unit ?? (food.metadata?.isUnitFood ? 'unit' : 'kg')) === 'unit') {
      return costPerKg * quantity; // unit-based (eggs, tuna cans…)
    }

    return (costPerKg / 1000) * quantity; // €/kg → €/g
  };

  const addFoodToList = (food: FirestoreFood) => {
    const existingItem = shoppingList.find(item => item.foodId === food.firestoreId);

    if (existingItem) {
      updateFoodQuantity(food.firestoreId, existingItem.quantity + (food.metadata?.isUnitFood ? 1 : 100));
    } else {
      const defaultQuantity = food.metadata?.isUnitFood ? 1 : 100;
      const quantity = food.metadata?.useFixedAmount ? (food.metadata.fixedAmount || defaultQuantity) : defaultQuantity;

      const totalMacros = calculateMacrosForFood(food, quantity);
      const totalCost = calculateCostForFood(food, quantity);

      // Default to kg input for quantities >= 1000g (1kg) for better UX
      const inputUnit = food.metadata?.isUnitFood ? 'units' : (quantity >= 1000 ? 'kg' : 'g');

      const newItem: LocalShoppingListItem = {
        foodId: food.firestoreId,
        food,
        quantity,
        servingSize: food.metadata?.isUnitFood ? 1 : 100, // Default serving size
        totalCost,
        totalMacros,
        inputUnit
      };

      setShoppingList(prev => [...prev, newItem]);
    }
  };

  const updateFoodQuantity = (foodId: string, newQuantity: number) => {
    setShoppingList(prev =>
      prev.map(item => {
        if (item.foodId === foodId) {
          const totalMacros = calculateMacrosForFood(item.food, newQuantity);
          const totalCost = calculateCostForFood(item.food, newQuantity);
          return {
            ...item,
            quantity: newQuantity,
            totalCost,
            totalMacros
          };
        }
        return item;
      })
    );
  };

  const toggleInputUnit = (foodId: string) => {
    setShoppingList(prev =>
      prev.map(item => {
        if (item.foodId === foodId && !item.food.metadata?.isUnitFood) {
          const newInputUnit = item.inputUnit === 'g' ? 'kg' : 'g';
          const newQuantity = newInputUnit === 'kg' ? item.quantity / 1000 : item.quantity * 1000;

          const totalMacros = calculateMacrosForFood(item.food, newQuantity);
          const totalCost = calculateCostForFood(item.food, newQuantity);

          return {
            ...item,
            quantity: newQuantity,
            totalCost,
            totalMacros,
            inputUnit: newInputUnit
          };
        }
        return item;
      })
    );
  };

  const removeFoodFromList = (foodId: string) => {
    setShoppingList(prev => prev.filter(item => item.foodId !== foodId));
  };

  const updateServingSize = (foodId: string, newServingSize: number) => {
    setShoppingList(prev =>
      prev.map(item => {
        if (item.foodId === foodId) {
          return {
            ...item,
            servingSize: Math.max(1, newServingSize) // Ensure minimum serving size of 1
          };
        }
        return item;
      })
    );
  };

  const formatNumber = (value: number | undefined | null, decimals: number = 1): string => {
    if (typeof value !== 'number' || isNaN(value)) {
      return '0.0';
    }
    return value.toFixed(decimals);
  };

  const calculateMeals = (quantity: number, servingSize: number): number => {
    if (servingSize <= 0) return 0;
    return Math.floor(quantity / servingSize);
  };

  // Calculate nutrition goals for all periods
  const periodGoals = useMemo(() => ({
    week: {
      protein: MACRO_TARGETS.protein * periodMultipliers.week,
      fats: MACRO_TARGETS.fats * periodMultipliers.week,
      carbs: MACRO_TARGETS.carbs * periodMultipliers.week,
      calories: MACRO_TARGETS.caloriesMax * periodMultipliers.week,
    },
    month: {
      protein: MACRO_TARGETS.protein * periodMultipliers.month,
      fats: MACRO_TARGETS.fats * periodMultipliers.month,
      carbs: MACRO_TARGETS.carbs * periodMultipliers.month,
      calories: MACRO_TARGETS.caloriesMax * periodMultipliers.month,
    },
    year: {
      protein: MACRO_TARGETS.protein * periodMultipliers.year,
      fats: MACRO_TARGETS.fats * periodMultipliers.year,
      carbs: MACRO_TARGETS.carbs * periodMultipliers.year,
      calories: MACRO_TARGETS.caloriesMax * periodMultipliers.year,
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }), []);

  // Helper functions for progress calculations
  type Period = 'week' | 'month' | 'year';

  const getPercent = (value: number, target: number) =>
    target > 0 ? Math.min(100, (value / target) * 100) : 0;

  const periodOrder: Period[] = ['week', 'month', 'year'];

  // Convenience accessors
  const getGoal = (p: Period) => periodGoals[p];

  // Finalize shopping list to Firebase
  const finalizeShoppingList = async () => {
    if (!user || shoppingList.length === 0) {
      setSaveError('No items to save or user not authenticated');
      return;
    }

    setSaving(true);
    setSaveError(null);

    try {
      // Convert local shopping list items to Firebase format
      const firebaseItems = shoppingList.map(item => ({
        userId: user.uid,
        foodName: item.food.name,
        quantity: item.inputUnit === 'kg' ? item.quantity / 1000 : item.quantity, // Convert to kg for weight foods
        unit: (item.food.metadata?.isUnitFood ? 'units' : 'kg') as 'kg' | 'units',
        notes: `Serving size: ${item.servingSize}${item.food.metadata?.isUnitFood ? ' units' : 'g'}`
      }));

      // Clear existing shopping list first
      await shoppingListService.clearUserShoppingList(user.uid);

      // Add all items in batch
      const batch = firebaseItems.map(item => shoppingListService.addShoppingListItem(item));
      await Promise.all(batch);

      setSaveSuccess(true);
      console.log('✅ Shopping list finalized successfully');
    } catch (error) {
      console.error('Error finalizing shopping list:', error);
      setSaveError('Failed to save shopping list. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <PageCard 
      headerSlot={
        <Box sx={{ width: '100%' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h5" sx={{ fontWeight: 600, color: 'var(--text-primary)' }}>
              Shopping List
            </Typography>
            <Button
              variant="contained"
              onClick={finalizeShoppingList}
              disabled={saving || shoppingList.length === 0 || !user}
              startIcon={saving ? <CircularProgress size={16} /> : null}
              sx={{
                backgroundColor: 'var(--accent-green)',
                color: 'white',
                '&:hover': {
                  backgroundColor: 'var(--accent-green-dark)',
                },
                '&:disabled': {
                  backgroundColor: 'var(--text-secondary)',
                  color: 'var(--text-primary)',
                }
              }}
              title={!user ? 'Sign in to save your shopping list' : shoppingList.length === 0 ? 'Add items to your shopping list first' : 'Save shopping list to Firebase'}
            >
              {saving ? 'Saving...' : !user ? 'Sign In to Save' : 'Finalize List'}
            </Button>
          </Box>
          <Typography variant="body2" sx={{ color: 'var(--text-secondary)' }}>
            Plan your food purchases and track nutrition costs for different time periods. Use "Finalize List" to save your shopping list to the cloud for access across devices.
          </Typography>
        </Box>
      }
    >

      {/* Time Period Selector */}
      <GenericCard
        title="Macro Targets Overview"
        content={
          <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2 }}>
            <Box sx={{ textAlign: 'center', flex: 1 }}>
              <Typography variant="h6" sx={{ color: 'var(--text-primary)', mb: 1 }}>
                Week
              </Typography>
              <Typography variant="body2" sx={{ color: 'var(--text-secondary)' }}>
                {formatNumber(MACRO_TARGETS.protein)}g P • {formatNumber(MACRO_TARGETS.fats)}g F
              </Typography>
              <Typography variant="body2" sx={{ color: 'var(--text-secondary)' }}>
                {formatNumber(MACRO_TARGETS.carbs)}g C • {formatNumber(MACRO_TARGETS.caloriesMax)} Cal
              </Typography>
            </Box>
            <Box sx={{ textAlign: 'center', flex: 1 }}>
              <Typography variant="h6" sx={{ color: 'var(--text-primary)', mb: 1 }}>
                Month
              </Typography>
              <Typography variant="body2" sx={{ color: 'var(--text-secondary)' }}>
                {formatNumber(MACRO_TARGETS.protein * 4.33)}g P • {formatNumber(MACRO_TARGETS.fats * 4.33)}g F
              </Typography>
              <Typography variant="body2" sx={{ color: 'var(--text-secondary)' }}>
                {formatNumber(MACRO_TARGETS.carbs * 4.33)}g C • {formatNumber(MACRO_TARGETS.caloriesMax * 4.33)} Cal
              </Typography>
            </Box>
            <Box sx={{ textAlign: 'center', flex: 1 }}>
              <Typography variant="h6" sx={{ color: 'var(--text-primary)', mb: 1 }}>
                Year
              </Typography>
              <Typography variant="body2" sx={{ color: 'var(--text-secondary)' }}>
                {formatNumber(MACRO_TARGETS.protein * 52)}g P • {formatNumber(MACRO_TARGETS.fats * 52)}g F
              </Typography>
              <Typography variant="body2" sx={{ color: 'var(--text-secondary)' }}>
                {formatNumber(MACRO_TARGETS.carbs * 52)}g C • {formatNumber(MACRO_TARGETS.caloriesMax * 52)} Cal
              </Typography>
            </Box>
          </Box>
        }
        sx={{ mb: 3 }}
      />

      <Box sx={{ 
        display: 'flex', 
        flexDirection: { xs: 'column', md: 'row' }, 
        gap: 3
      }}>
        {/* Food Selection */}
        <Box sx={{ flex: { xs: 1, md: '2 1 0%' } }}>
          <GenericCard
            title="Add Foods"
            content={
              Object.entries(foodsByCategory).map(([category, foods]) => (
                <Box key={category} sx={{ mb: 3 }}>
                  <Typography
                    variant="h6"
                    sx={{
                      color: 'var(--text-primary)',
                      mb: 2,
                      fontWeight: 600,
                      borderBottom: '2px solid var(--accent-green)',
                      pb: 1
                    }}
                  >
                    {category}
                  </Typography>
                  <Box sx={{
                    display: 'grid',
                    gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' },
                    gap: 2
                  }}>
                    {foods.map((food) => (
                      <Card
                        key={food.firestoreId}
                        sx={{
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                          border: '1px solid var(--border-color)',
                          backgroundColor: 'var(--card-bg)',
                          '&:hover': {
                            transform: 'translateY(-2px)',
                            boxShadow: 'var(--elevation-2)',
                            borderColor: 'var(--accent-green)'
                          }
                        }}
                        onClick={() => addFoodToList(food)}
                      >
                        <CardContent sx={{ p: 2 }}>
                          <Typography
                            variant="subtitle2"
                            sx={{
                              color: 'var(--text-primary)',
                              fontWeight: 600,
                              mb: 1,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap'
                            }}
                          >
                            {food.name}
                          </Typography>
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 1 }}>
                            <Chip
                              size="small"
                              label={`P: ${formatNumber(food.nutrition.protein)}g`}
                              sx={{
                                backgroundColor: 'var(--macro-protein)',
                                color: 'white',
                                fontSize: '0.7rem'
                              }}
                            />
                            <Chip
                              size="small"
                              label={`F: ${formatNumber(food.nutrition.fats)}g`}
                              sx={{
                                backgroundColor: 'var(--macro-fats)',
                                color: 'white',
                                fontSize: '0.7rem'
                              }}
                            />
                            <Chip
                              size="small"
                              label={`C: ${formatNumber(food.nutrition.carbs)}g`}
                              sx={{
                                backgroundColor: 'var(--macro-carbs)',
                                color: 'white',
                                fontSize: '0.7rem'
                              }}
                            />
                          </Box>
                          <Typography
                            variant="caption"
                            sx={{ color: 'var(--text-secondary)' }}
                          >
                            €{formatNumber(food.cost.costPerKg)}/{food.metadata?.isUnitFood ? 'unit' : 'kg'}
                          </Typography>
                        </CardContent>
                      </Card>
                    ))}
                  </Box>
                  {Object.keys(foodsByCategory).indexOf(category) < Object.keys(foodsByCategory).length - 1 && (
                    <Divider sx={{ mt: 3, borderColor: 'var(--border-color)' }} />
                  )}
                </Box>
              ))
            }
          />
        </Box>

        {/* Shopping List & Stats */}
        <Box sx={{ flex: { xs: 1, md: '1 1 0%' } }}>
          <Stack spacing={3}>
            {/* Current Shopping List */}
            <GenericCard
              title="Shopping List"
              content={
                shoppingList.length === 0 ? (
                  <Alert severity="info" sx={{ mt: 2 }}>
                    No foods added yet. Click on foods to add them to your shopping list.
                  </Alert>
                ) : (
                  <Box>
                    {shoppingList.map((item) => (
                      <Box
                        key={item.foodId}
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          p: 2,
                          mb: 1,
                          borderRadius: 2,
                          backgroundColor: 'var(--meal-row-bg)',
                          border: '1px solid var(--border-color)'
                        }}
                      >
                        <Box sx={{ flex: 1, mr: 2 }}>
                          <Typography
                            variant="body2"
                            sx={{
                              color: 'var(--text-primary)',
                              fontWeight: 600,
                              mb: 0.5
                            }}
                          >
                            {item.food.name}
                          </Typography>
                          <Typography
                            variant="caption"
                            sx={{ color: 'var(--text-secondary)', mb: 0.5 }}
                          >
                            {item.inputUnit === 'kg'
                              ? `${formatNumber(item.quantity / 1000, 2)} kg`
                              : item.food.metadata?.isUnitFood
                                ? `${formatNumber(item.quantity)} units`
                                : `${formatNumber(item.quantity)}g`
                            } • €{formatNumber(item.totalCost)}
                          </Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="caption" sx={{ color: 'var(--text-secondary)' }}>
                              Serving:
                            </Typography>
                            <NumberStepper
                              value={item.servingSize}
                              onChange={(value) => updateServingSize(item.foodId, value)}
                              min={1}
                              max={item.food.metadata?.isUnitFood ? undefined : 500}
                              step={item.food.metadata?.isUnitFood ? 1 : 25}
                              size="small"
                            />
                            <Typography variant="caption" sx={{ color: 'var(--text-secondary)' }}>
                              {item.food.metadata?.isUnitFood ? 'units' : 'g'} = {calculateMeals(item.quantity, item.servingSize)} meals
                            </Typography>
                          </Box>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="caption" sx={{ color: 'var(--text-secondary)' }}>
                              Unit:
                            </Typography>
                            <Box sx={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 0.5,
                              px: 1,
                              py: 0.5,
                              borderRadius: 1,
                              backgroundColor: 'var(--card-bg)',
                              border: '1px solid var(--border-color)'
                            }}>
                              <Typography
                                variant="caption"
                                sx={{
                                  fontWeight: 600,
                                  color: item.inputUnit === 'g' ? 'var(--accent-green)' : 'var(--text-secondary)'
                                }}
                              >
                                g
                              </Typography>
                              <Typography variant="caption" sx={{ color: 'var(--text-secondary)' }}>/</Typography>
                              <Typography
                                variant="caption"
                                sx={{
                                  fontWeight: 600,
                                  color: item.inputUnit === 'kg' ? 'var(--accent-green)' : 'var(--text-secondary)'
                                }}
                              >
                                kg
                              </Typography>
                            </Box>
                            <Button
                              size="small"
                              variant="outlined"
                              onClick={() => toggleInputUnit(item.foodId)}
                              sx={{
                                minWidth: 'auto',
                                px: 1,
                                py: 0.5,
                                fontSize: '0.7rem',
                                borderColor: 'var(--accent-green)',
                                color: 'var(--accent-green)',
                                '&:hover': {
                                  borderColor: 'var(--accent-green)',
                                  backgroundColor: 'rgba(59, 186, 117, 0.1)'
                                }
                              }}
                              title={`Switch to ${item.inputUnit === 'g' ? 'kg' : 'g'}`}
                            >
                              {item.inputUnit === 'g' ? 'kg' : 'g'}
                            </Button>
                          </Box>
                          <NumberStepper
                            value={item.inputUnit === 'kg' ? item.quantity / 1000 : item.quantity}
                            onChange={(value) => {
                              const actualValue = item.inputUnit === 'kg' ? value * 1000 : value;
                              updateFoodQuantity(item.foodId, actualValue);
                            }}
                            min={item.food.metadata?.isUnitFood ? 1 : item.inputUnit === 'kg' ? 0.1 : 10}
                            max={item.food.metadata?.isUnitFood ? undefined : item.inputUnit === 'kg' ? 100 : 5000}
                            step={item.food.metadata?.isUnitFood ? 1 : item.inputUnit === 'kg' ? 0.1 : 50}
                            size="small"
                          />
                          <Button
                            size="small"
                            variant="outlined"
                            onClick={() => removeFoodFromList(item.foodId)}
                            sx={{
                              minWidth: 'auto',
                              px: 1,
                              py: 0.5,
                              fontSize: '0.7rem',
                              borderColor: 'var(--status-error)',
                              color: 'var(--status-error)',
                              '&:hover': {
                                borderColor: 'var(--status-error)',
                                backgroundColor: 'rgba(239, 83, 80, 0.1)'
                              }
                            }}
                          >
                            Remove
                          </Button>
                        </Box>
                      </Box>
                    ))}
                  </Box>
                )
              }
            />

            {/* Statistics */}
            <GenericCard
              title="Nutrition & Cost Summary"
              content={
                <Box>
                  <Typography variant="h6" sx={{ color: 'var(--text-primary)', mb: 2 }}>
                    Current Selection
                  </Typography>
                  <Box sx={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(2, 1fr)',
                    gap: 2,
                    mb: 2
                  }}>
                    <Paper sx={{
                      p: 2,
                      textAlign: 'center',
                      backgroundColor: 'var(--macro-protein)',
                      color: 'white'
                    }}>
                      <Typography variant="h6">{formatNumber(totals.protein)}g</Typography>
                      <Typography variant="caption">Protein</Typography>
                      <Typography variant="caption" sx={{ display: 'block', mt: 0.5, opacity: 0.8 }}>
                        Goal: {formatNumber(MACRO_TARGETS.protein)}g/day
                      </Typography>
                    </Paper>
                    <Paper sx={{
                      p: 2,
                      textAlign: 'center',
                      backgroundColor: 'var(--macro-fats)',
                      color: 'white'
                    }}>
                      <Typography variant="h6">{formatNumber(totals.fats)}g</Typography>
                      <Typography variant="caption">Fats</Typography>
                      <Typography variant="caption" sx={{ display: 'block', mt: 0.5, opacity: 0.8 }}>
                        Goal: {formatNumber(MACRO_TARGETS.fats)}g/day
                      </Typography>
                    </Paper>
                    <Paper sx={{
                      p: 2,
                      textAlign: 'center',
                      backgroundColor: 'var(--macro-carbs)',
                      color: 'white'
                    }}>
                      <Typography variant="h6">{formatNumber(totals.carbs)}g</Typography>
                      <Typography variant="caption">Carbs</Typography>
                      <Typography variant="caption" sx={{ display: 'block', mt: 0.5, opacity: 0.8 }}>
                        Goal: {formatNumber(MACRO_TARGETS.carbs)}g/day
                      </Typography>
                    </Paper>
                    <Paper sx={{
                      p: 2,
                      textAlign: 'center',
                      backgroundColor: 'var(--macro-calories)',
                      color: 'white'
                    }}>
                      <Typography variant="h6">{formatNumber(totals.calories)}</Typography>
                      <Typography variant="caption">Calories</Typography>
                      <Typography variant="caption" sx={{ display: 'block', mt: 0.5, opacity: 0.8 }}>
                        Goal: {formatNumber(MACRO_TARGETS.caloriesMax)}/day
                      </Typography>
                    </Paper>
                  </Box>
                  <Box sx={{ mt: 2, p: 2, backgroundColor: 'var(--meal-row-bg)', borderRadius: 2 }}>
                    <Typography variant="body2" sx={{ color: 'var(--text-primary)', fontWeight: 600 }}>
                      Total Cost: €{formatNumber(totals.cost)}
                    </Typography>
                  </Box>

                  <Divider sx={{ my: 2, borderColor: 'var(--border-color)' }} />

                  <GenericCard
                    title="Progress Towards Goals"
                    content={
                      <Stack spacing={3}>
                        {periodOrder.map((p) => {
                          const goal = getGoal(p);

                          const pct = {
                            protein: getPercent(baseMacros.protein, goal.protein),
                            fats:    getPercent(baseMacros.fats,    goal.fats),
                            carbs:   getPercent(baseMacros.carbs,   goal.carbs),
                            calories:getPercent(baseMacros.calories,goal.calories),
                          };

                          return (
                            <Box key={p} sx={{ p: 1.5, borderRadius: 'var(--radius-sm)', background: 'var(--meal-row-bg)' }}>
                              <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>
                                {p === 'week' ? 'This Week' : p === 'month' ? 'This Month' : 'This Year'}
                              </Typography>

                              {/* Protein */}
                              <Stack spacing={0.5} sx={{ mb: 1.25 }}>
                                <Typography variant="caption">Protein</Typography>
                                <Typography variant="body2">
                                  {baseMacros.protein.toFixed(1)}g • Goal {goal.protein.toFixed(1)}g • {pct.protein.toFixed(0)}%
                                </Typography>
                                <Box sx={{ height: 8, borderRadius: 999, background: 'var(--track-bg)' }}>
                                  <Box sx={{ height: '100%', width: `${pct.protein}%`, borderRadius: 999, background: 'var(--accent-green)' }} />
                                </Box>
                              </Stack>

                              {/* Fats */}
                              <Stack spacing={0.5} sx={{ mb: 1.25 }}>
                                <Typography variant="caption">Fats</Typography>
                                <Typography variant="body2">
                                  {baseMacros.fats.toFixed(1)}g • Goal {goal.fats.toFixed(1)}g • {pct.fats.toFixed(0)}%
                                </Typography>
                                <Box sx={{ height: 8, borderRadius: 999, background: 'var(--track-bg)' }}>
                                  <Box sx={{ height: '100%', width: `${pct.fats}%`, borderRadius: 999, background: 'var(--accent-orange)' }} />
                                </Box>
                              </Stack>

                              {/* Carbs */}
                              <Stack spacing={0.5} sx={{ mb: 1.25 }}>
                                <Typography variant="caption">Carbs</Typography>
                                <Typography variant="body2">
                                  {baseMacros.carbs.toFixed(1)}g • Goal {goal.carbs.toFixed(1)}g • {pct.carbs.toFixed(0)}%
                                </Typography>
                                <Box sx={{ height: 8, borderRadius: 999, background: 'var(--track-bg)' }}>
                                  <Box sx={{ height: '100%', width: `${pct.carbs}%`, borderRadius: 999, background: 'var(--accent-blue)' }} />
                                </Box>
                              </Stack>

                              {/* Calories */}
                              <Stack spacing={0.5}>
                                <Typography variant="caption">Calories</Typography>
                                <Typography variant="body2">
                                  {baseMacros.calories.toFixed(0)} • Goal {goal.calories.toFixed(0)} • {pct.calories.toFixed(0)}%
                                </Typography>
                                <Box sx={{ height: 8, borderRadius: 999, background: 'var(--track-bg)' }}>
                                  <Box sx={{ height: '100%', width: `${pct.calories}%`, borderRadius: 999, background: 'var(--accent-purple)' }} />
                                </Box>
                              </Stack>
                            </Box>
                          );
                        })}
                      </Stack>
                    }
                  />
                </Box>
              }
            />
          </Stack>
        </Box>
      </Box>

      {/* Success/Error Feedback */}
      <Snackbar
        open={saveSuccess}
        autoHideDuration={4000}
        onClose={() => setSaveSuccess(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSaveSuccess(false)}
          severity="success"
          sx={{ width: '100%' }}
        >
          Shopping list finalized successfully! 🎉
        </Alert>
      </Snackbar>

      <Snackbar
        open={!!saveError}
        autoHideDuration={6000}
        onClose={() => setSaveError(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSaveError(null)}
          severity="error"
          sx={{ width: '100%' }}
        >
          {saveError}
        </Alert>
      </Snackbar>
    </PageCard>
  );
};

export default ShoppingList;
