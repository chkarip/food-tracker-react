/**
 * FILE: FoodSelectorWithFirebase.tsx
 * ------------------------------------------------------------------
 * PURPOSE
 * • Present a searchable / clickable catalogue of foods stored in
 *   Firestore and let the user build a meal program.
 *
 * CORE RESPONSIBILITIES
 * • Use cached food data from FoodContext (no direct Firestore calls).
 * • Convert the cached data → legacy in-memory shape expected by
 *   the macro-calculation engine.
 * • Allow the user to:
 *     – pick a food (chip UI),
 *     – adjust amount,
 *     – preview macros + € cost,
 *     – swap foods between timeslots,
 *     – remove foods.
 * • Emit pure callback events so the parent (TimeslotMealPlanner) owns
 *   all state; the selector itself stays stateless/presentational.
 *
 * BUSINESS RULE HIGHLIGHTS
 * • Fixed-amount & unit foods are respected when defaulting the "amount".
 * • All nutrition/cost maths are delegated to utility helpers; this file
 *   owns zero arithmetic logic, only UI + orchestration.
 */

import React, { useState, useCallback, useMemo } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Chip,
  Divider,
  Alert,
  CircularProgress
} from '@mui/material';
import { 
  Add as AddIcon, 
  SwapHoriz as SwapIcon, 
  Delete as DeleteIcon 
} from '@mui/icons-material';

import { useFoodDatabase } from '../../contexts/FoodContext';
import { calculateMacros, formatMacroValue } from '../../utils/nutritionCalculations';
import { calculatePortionCost, formatCost } from '../../services/firebase/nutrition/foodService';
import { SelectedFood } from '../../types/nutrition';

interface FoodSelectorWithFirebaseProps {
  selectedFoods: SelectedFood[];
  onAddFood: (food: SelectedFood) => void;
  onUpdateAmount: (index: number, amount: number) => void;
  onRemoveFood: (index: number) => void;
  onSwapFood?: (index: number) => void;
}

const FoodSelectorWithFirebase: React.FC<FoodSelectorWithFirebaseProps> = ({
  selectedFoods,
  onAddFood,
  onUpdateAmount,
  onRemoveFood,
  onSwapFood
}) => {
  // ✅ Use cached food data from FoodContext instead of direct Firebase calls
  const { foodDatabase, loading, error } = useFoodDatabase();

  const [selectedFoodName, setSelectedFoodName] = useState('');
  const [amount, setAmount] = useState(100);

  // ✅ Food database is already in legacy format from context
  const availableFoods = useMemo(() => Object.keys(foodDatabase), [foodDatabase]);

  // Get food unit helper function (memoized)
  const getFoodUnit = useCallback((foodName: string): string => {
    const foodItem = foodDatabase[foodName];
    if (!foodItem) {
      console.warn(`⚠️ Food not found in database: ${foodName}`);
      return 'g';
    }
    return foodItem.isUnitFood ? 'units' : 'g';
  }, [foodDatabase]);

  // Calculate macros helper function (memoized)
  const calculateFoodMacros = useCallback((foodName: string, amount: number) => {
    const foodItem = foodDatabase[foodName];
    if (!foodItem) {
      console.warn(`⚠️ Cannot calculate macros for missing food: ${foodName}`);
      return { protein: 0, fats: 0, carbs: 0, calories: 0 };
    }

    const multiplier = foodItem.isUnitFood ? amount : amount / 100;
    return {
      protein: (foodItem.nutrition?.protein || 0) * multiplier,
      fats: (foodItem.nutrition?.fats || 0) * multiplier,
      carbs: (foodItem.nutrition?.carbs || 0) * multiplier,
      calories: (foodItem.nutrition?.calories || 0) * multiplier
    };
  }, [foodDatabase]);

  const handleAddFood = useCallback(() => {
    if (!selectedFoodName) return;
    const foodItem = foodDatabase[selectedFoodName];
    if (!foodItem) {
      console.error(`❌ Cannot add missing food: ${selectedFoodName}`);
      return;
    }

    onAddFood({
      name: selectedFoodName,
      amount: amount
    });

    // Reset form
    setSelectedFoodName('');
    setAmount(100);
  }, [selectedFoodName, amount, onAddFood, foodDatabase]);

  const getFoodEmoji = useCallback((foodName: string): string => {
    const emojiMap: Record<string, string> = {
      'Greek yogurt': '🥛',
      'Peanut-butter': '🥜',
      'Dry rice': '🍚',
      'Dry lentils': '🌾',
      'Bulk oats': '🌾',
      'Chicken-breast': '🍗',
      'Edamame': '🫛',
      'Canned tuna': '🐟',
      'Whey isolate': '💪',
      'Eggs': '🥚',
      'Tortilla wrap': '🌯',
      'Almonds/Walnuts': '🥜',
      'Dark-chocolate 74%': '🍫',
      'Oatmeal': '🥣',
      'rice-cake': '🍚'
    };
    return emojiMap[foodName] || '🍽️';
  }, []);

  const getDefaultAmount = useCallback((foodName: string): number => {
    const foodItem = foodDatabase[foodName];
    if (!foodItem) return 100;

    // Use fixed amount if enabled
    if (foodItem.useFixedAmount && (foodItem.fixedAmount ?? 0) > 0) {
      return foodItem.fixedAmount ?? 0;
    }

    // Fallback to default amounts
    if (foodItem.isUnitFood) {
      switch (foodName) {
        case 'Eggs': return 2;
        case 'Tortilla wrap': return 1;
        case 'Canned tuna': return 1;
        default: return 1;
      }
    }
    return 100; // default grams for weight foods
  }, [foodDatabase]);

  const handleFoodSelect = useCallback((foodName: string) => {
    setSelectedFoodName(foodName);
    setAmount(getDefaultAmount(foodName));
  }, [getDefaultAmount]);

  // ✅ Loading state from context
  if (loading) {
    return (
      <Alert severity="info" icon={<CircularProgress size={18} />}>
        Loading foods from database...
      </Alert>
    );
  }

  // ✅ Error state from context
  if (error) {
    return (
      <Alert severity="error">
        {error}
        <Button onClick={() => window.location.reload()} sx={{ ml: 2 }}>
          Retry Loading Foods
        </Button>
      </Alert>
    );
  }

  // ✅ No foods state
  if (availableFoods.length === 0) {
    return (
      <Alert severity="warning">
        No foods found in database. Please add some foods using the "Manage Foods" tab.
        <Button onClick={() => window.location.reload()} sx={{ ml: 2 }}>
          Refresh
        </Button>
      </Alert>
    );
  }

  return (
    <Card>
      <CardContent>
        {/* Header */}
        <Typography variant="h6" gutterBottom>
          Food Selector
        </Typography>

        {/* Food Selection */}
        <Typography variant="body2" gutterBottom>
          Available Foods ({availableFoods.length})
        </Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 2 }}>
          {availableFoods.map((foodName) => {
            const foodItem = foodDatabase[foodName];
            const hasFixedAmount = foodItem?.useFixedAmount;
            const isSelected = selectedFoods.some(food => food.name === foodName);

            return (
              <Chip
                key={foodName}
                label={foodName}
                onClick={() => handleFoodSelect(foodName)}
                variant={selectedFoodName === foodName ? 'filled' : (isSelected ? 'filled' : 'outlined')}
                color={selectedFoodName === foodName ? 'primary' : (isSelected ? 'secondary' : (hasFixedAmount ? 'success' : 'default'))}
                sx={{
                  cursor: 'pointer',
                  ...(isSelected && {
                    backgroundColor: 'secondary.light',
                    color: 'secondary.contrastText'
                  })
                }}
              />
            );
          })}
        </Box>

        {/* Amount Input & Add Button */}
        {selectedFoodName && (
          <Box sx={{ display: 'flex', gap: 1, mb: 3 }}>
            <TextField
              type="number"
              value={amount}
              onChange={e => setAmount(Number(e.target.value))}
              label={getFoodUnit(selectedFoodName)}
              sx={{ flex: 1, minWidth: 120 }}
              size="small"
            />
            <Button
              startIcon={<AddIcon />}
              variant="contained"
              onClick={handleAddFood}
              disabled={!selectedFoodName || amount <= 0}
              sx={{ whiteSpace: 'nowrap' }}
            >
              Add {selectedFoodName}
            </Button>
          </Box>
        )}

        {/* Selected Foods List */}
        {selectedFoods.length > 0 && (
          <>
            <Divider sx={{ mb: 2 }} />
            <Typography variant="subtitle1" gutterBottom>
              Selected Foods ({selectedFoods.length})
            </Typography>

            {selectedFoods.map((food, index) => {
              const macros = calculateFoodMacros(food.name, food.amount);
              // ✅ Pass foodDatabase to calculatePortionCost
              const portionCost = calculatePortionCost(food.name, food.amount, foodDatabase);

              return (
                <Box
                  key={`${food.name}-${index}`}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    p: 1,
                    mb: 1,
                    borderRadius: 2,
                    bgcolor: theme => theme.palette.mode === 'dark' ? 'grey.800' : 'grey.50',
                    border: theme => theme.palette.mode === 'dark'
                      ? '1px solid rgba(255, 255, 255, 0.12)'
                      : '1px solid rgba(0, 0, 0, 0.12)'
                  }}
                >
                  <Typography sx={{ flex: 2, color: theme => theme.palette.mode === 'dark' ? 'grey.100' : 'grey.800' }}>
                    {getFoodEmoji(food.name)} {food.name}
                  </Typography>

                  <TextField
                    type="number"
                    size="small"
                    value={food.amount}
                    onChange={e => onUpdateAmount(index, Number(e.target.value))}
                    label={getFoodUnit(food.name)}
                    sx={{ width: 120 }}
                  />

                  <Typography
                    variant="body2"
                    sx={{
                      flex: 3,
                      ml: 1,
                      color: theme => theme.palette.mode === 'dark' ? 'grey.300' : 'grey.600',
                      fontWeight: 500
                    }}
                  >
                    💪 {formatMacroValue(macros.protein)}g |{' '}
                    🥑 {formatMacroValue(macros.fats)}g |{' '}
                    🍞 {formatMacroValue(macros.carbs)}g |{' '}
                    🔥 {formatMacroValue(macros.calories, 0)} kcal
                  </Typography>

                  {/* ✅ Show cost if available */}
                  {portionCost !== null && (
                    <Typography variant="body2" sx={{ flex: 1, ml: 1 }}>
                      💰 {formatCost(portionCost)}
                    </Typography>
                  )}

                  {/* Swap button (if provided) */}
                  {onSwapFood && (
                    <Button
                      size="small"
                      onClick={() => onSwapFood(index)}
                      sx={{ minWidth: 40, p: 1 }}
                      title="Swap to other timeslot"
                    >
                      <SwapIcon />
                    </Button>
                  )}

                  {/* Remove button */}
                  <Button
                    size="small"
                    color="error"
                    onClick={() => onRemoveFood(index)}
                    sx={{ minWidth: 40, p: 1 }}
                    title="Remove food"
                  >
                    <DeleteIcon />
                  </Button>
                </Box>
              );
            })}
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default FoodSelectorWithFirebase;
