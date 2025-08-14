import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
import { Add as AddIcon, Restaurant as RestaurantIcon, SwapHoriz as SwapIcon, Delete as DeleteIcon, Euro as EuroIcon } from '@mui/icons-material';
import { getAllFoods, DatabaseFood, convertToLegacyFoodFormat, subscribeToFoods } from '../../services/foodService';
import { calculateMacros, formatMacroValue } from '../../utils/nutritionCalculations';
import { calculatePortionCost, getCostPerGram, formatCost } from '../../data/costDatabase';
import { SelectedFood } from '../../types/nutrition';

interface FoodSelectorWithFirebaseProps {
  selectedFoods: SelectedFood[];
  onAddFood: (food: SelectedFood) => void;
  onUpdateAmount: (index: number, amount: number) => void;
  onRemoveFood: (index: number) => void;
  onSwapFood?: (index: number) => void;
} // ✅ Added missing closing brace

const FoodSelectorWithFirebase: React.FC<FoodSelectorWithFirebaseProps> = ({
  selectedFoods,
  onAddFood,
  onUpdateAmount,
  onRemoveFood,
  onSwapFood
}) => { // ✅ Fixed arrow function
  const [selectedFoodName, setSelectedFoodName] = useState('');
  const [amount, setAmount] = useState(100);
  const [foods, setFoods] = useState<DatabaseFood[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load foods from Firebase on component mount with real-time updates
  useEffect(() => {
    setLoading(true);
    
    // Subscribe to real-time updates
    const unsubscribe = subscribeToFoods((updatedFoods) => {
      console.log('📊 Foods loaded from Firebase:', updatedFoods.length);
      setFoods(updatedFoods);
      setError(null);
      setLoading(false);
      
      // Clear selection if the currently selected food was deleted
      if (selectedFoodName) {
        const foodStillExists = updatedFoods.some(food => food.name === selectedFoodName);
        if (!foodStillExists) {
          setSelectedFoodName('');
          setAmount(100);
        }
      }
    });

    // Cleanup subscription on unmount
    return () => {
      unsubscribe();
    };
  }, [selectedFoodName]);

  // Convert foods to legacy format for compatibility (memoized and optimized)
  const foodDatabase = useMemo(() => {
    const converted = convertToLegacyFoodFormat(foods);
    console.log('🔄 Converted foods for legacy format:', Object.keys(converted));
    return converted;
  }, [foods]);

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

  // Loading state
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', p: 4 }}>
        <CircularProgress />
        <Typography sx={{ ml: 2 }}>Loading foods from database...</Typography>
      </Box>
    );
  }

  // Error state
  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        {error}
        <Button onClick={() => window.location.reload()} sx={{ ml: 2 }}>
          Retry Loading Foods
        </Button>
      </Alert>
    );
  }

  // No foods state
  if (foods.length === 0) {
    return (
      <Alert severity="warning" sx={{ mb: 2 }}>
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
        <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
          <RestaurantIcon />
          Food Selector
        </Typography>

        {/* Food Selection */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" sx={{ mb: 2 }}>
            Available Foods ({availableFoods.length})
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {availableFoods.map((foodName) => {
              const foodItem = foodDatabase[foodName];
              const hasFixedAmount = foodItem?.useFixedAmount;
              const isSelected = selectedFoods.some(food => food.name === foodName);

              return (
                <Chip
                  key={foodName}
                  label={`${getFoodEmoji(foodName)} ${foodName}`}
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
        </Box>

        {/* Amount Input & Add Button */}
        {selectedFoodName && (
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: 3 }}>
            <TextField
              type="number"
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              label={getFoodUnit(selectedFoodName)}
              sx={{ flex: 1, minWidth: 120 }}
              size="small"
            />
            <Button
              variant="contained"
              startIcon={<AddIcon />}
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
            <Divider sx={{ my: 2 }} />
            <Typography variant="subtitle2" sx={{ mb: 2 }}>
              Selected Foods ({selectedFoods.length})
            </Typography>
            {selectedFoods.map((food, index) => {
              const macros = calculateFoodMacros(food.name, food.amount);
              const portionCost = calculatePortionCost(food.name, food.amount);

              return (
                <Box
                  key={index}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    p: 2,
                    mb: 1,
                    backgroundColor: (theme) => theme.palette.mode === 'dark' ? 'grey.800' : 'grey.50',
                    borderRadius: 2,
                    gap: 2,
                    border: (theme) => theme.palette.mode === 'dark'
                      ? '1px solid rgba(255, 255, 255, 0.12)'
                      : '1px solid rgba(0, 0, 0, 0.12)'
                  }}
                >
                  <Typography
                    variant="subtitle2"
                    sx={{
                      color: (theme) => theme.palette.mode === 'dark' ? 'grey.100' : 'grey.800'
                    }}
                  >
                    {getFoodEmoji(food.name)} {food.name}
                  </Typography>
                  
                  <TextField
                    type="number"
                    value={food.amount}
                    onChange={(e) => onUpdateAmount(index, Number(e.target.value))}
                    label={getFoodUnit(food.name)}
                    size="small"
                    sx={{ width: 120 }}
                  />
                  
                  <Typography
                    variant="caption"
                    sx={{
                      color: (theme) => theme.palette.mode === 'dark' ? 'grey.300' : 'grey.600',
                      fontWeight: 500
                    }}
                  >
                    💪 {formatMacroValue(macros.protein)}g | 
                    🥑 {formatMacroValue(macros.fats)}g | 
                    🍞 {formatMacroValue(macros.carbs)}g | 
                    🔥 {formatMacroValue(macros.calories, 0)} kcal
                  </Typography>

                  {portionCost !== null && (
                    <Typography variant="caption" color="success.main">
                      💰 {formatCost(portionCost)}
                    </Typography>
                  )}

                  <Box sx={{ display: 'flex', gap: 1 }}>
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
