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
import { getAllFoods, DatabaseFood, convertToLegacyFoodFormat, subscribeToFoods } from '../services/foodService';
import { calculateMacros, formatMacroValue } from '../utils/nutritionCalculations';
import { calculatePortionCost, getCostPerGram, formatCost } from '../data/costDatabase';
import { SelectedFood } from '../types/nutrition';

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
  const [selectedFoodName, setSelectedFoodName] = React.useState<string>('');
  const [amount, setAmount] = React.useState<number>(100);
  const [foods, setFoods] = useState<DatabaseFood[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load foods from Firebase on component mount with real-time updates
  useEffect(() => {
    setLoading(true);
    
    // Subscribe to real-time updates
    const unsubscribe = subscribeToFoods((updatedFoods) => {
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
  }, []); // Remove selectedFoodName dependency to prevent re-renders

  const loadFoods = async () => {
    try {
      setLoading(true);
      setError(null);
      const allFoods = await getAllFoods();
      setFoods(allFoods);
    } catch (err) {
      setError('Failed to load foods from database. Please try again or add foods using the "Manage Foods" tab.');
      console.error('Error loading foods:', err);
    } finally {
      setLoading(false);
    }
  };

  // Convert foods to legacy format for compatibility (memoized and optimized)
  const foodDatabase = useMemo(() => convertToLegacyFoodFormat(foods), [foods]);
  const availableFoods = useMemo(() => Object.keys(foodDatabase), [foodDatabase]);

  // Get food unit helper function (memoized)
  const getFoodUnit = useCallback((foodName: string): string => {
    const foodItem = foodDatabase[foodName];
    if (!foodItem) return 'g';
    return foodItem.isUnitFood ? 'units' : 'g';
  }, [foodDatabase]);

  // Calculate macros helper function (memoized)
  const calculateFoodMacros = useCallback((foodName: string, amount: number) => {
    const foodItem = foodDatabase[foodName];
    if (!foodItem) return { protein: 0, fats: 0, carbs: 0, calories: 0 };
    
    const multiplier = foodItem.isUnitFood ? amount : amount / 100;
    
    return {
      protein: foodItem.nutrition.protein * multiplier,
      fats: foodItem.nutrition.fats * multiplier,
      carbs: foodItem.nutrition.carbs * multiplier,
      calories: foodItem.nutrition.calories * multiplier
    };
  }, [foodDatabase]);

  const handleAddFood = useCallback(() => {
    if (!selectedFoodName) return;
    
    onAddFood({
      name: selectedFoodName,
      amount: amount
    });
    
    // Reset form
    setSelectedFoodName('');
    setAmount(100);
  }, [selectedFoodName, amount, onAddFood]);

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
      'Oatmeal': '🥣'
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
      <Card sx={{ mb: 3, borderRadius: 4 }}>
        <CardContent sx={{ p: 3, textAlign: 'center' }}>
          <CircularProgress />
          <Typography variant="body1" sx={{ mt: 2 }}>
            Loading foods from database...
          </Typography>
        </CardContent>
      </Card>
    );
  }

  // Error state
  if (error) {
    return (
      <Card sx={{ mb: 3, borderRadius: 4 }}>
        <CardContent sx={{ p: 3 }}>
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
          <Button variant="contained" onClick={loadFoods}>
            Retry Loading Foods
          </Button>
        </CardContent>
      </Card>
    );
  }

  // No foods state
  if (foods.length === 0) {
    return (
      <Card sx={{ mb: 3, borderRadius: 4 }}>
        <CardContent sx={{ p: 3 }}>
          <Alert severity="info" sx={{ mb: 2 }}>
            No foods found in database. Please add some foods using the "Manage Foods" tab.
          </Alert>
          <Button variant="contained" onClick={loadFoods}>
            Refresh
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card sx={{ mb: 3, borderRadius: 4, width: '100%' }}>
      <CardContent sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <RestaurantIcon />
          Food Selector
        </Typography>

        {/* Food Selection */}
        <Box sx={{ mb: 3, width: '100%' }}>
          <Typography variant="subtitle2" gutterBottom>
            Available Foods ({availableFoods.length})
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2, width: '100%' }}>
            {availableFoods.map((foodName) => {
              const foodItem = foodDatabase[foodName];
              const hasFixedAmount = foodItem?.useFixedAmount;
              const isSelected = selectedFoods.some(food => food.name === foodName);
              
              return (
                <Chip
                  key={foodName}
                  label={`${getFoodEmoji(foodName)} ${foodName}${hasFixedAmount ? ` (${foodItem.fixedAmount}${foodItem.isUnitFood ? 'u' : 'g'})` : ''}${isSelected ? ' ✓' : ''}`}
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
          <Box sx={{ mb: 3, width: '100%' }}>
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: 2, width: '100%' }}>
              <TextField
                label={`Amount (${getFoodUnit(selectedFoodName)})`}
                type="number"
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
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
            
            {/* Cost Information */}
            {(() => {
              const foodItem = foodDatabase[selectedFoodName];
              const costPerGram = getCostPerGram(selectedFoodName, foodItem?.isUnitFood || false);
              const portionCost = calculatePortionCost(selectedFoodName, amount);
              
              if (costPerGram !== null && portionCost !== null) {
                return (
                  <Box 
                    sx={{ 
                      p: 2, 
                      bgcolor: (theme) => theme.palette.mode === 'dark' 
                        ? 'grey.800' 
                        : 'grey.50',
                      borderRadius: 2,
                      border: (theme) => theme.palette.mode === 'dark' 
                        ? '1px solid rgba(255, 255, 255, 0.12)' 
                        : '1px solid rgba(0, 0, 0, 0.12)'
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <EuroIcon fontSize="small" color="primary" />
                      <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                        Cost Information
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                      <Box>
                        <Typography variant="caption" color="text.secondary" display="block">
                          {foodItem?.isUnitFood ? 'Cost per unit' : 'Cost per gram'}
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          {foodItem?.isUnitFood 
                            ? formatCost(costPerGram, 2)
                            : formatCost(costPerGram, 4)
                          }
                        </Typography>
                      </Box>
                      <Box>
                        <Typography variant="caption" color="text.secondary" display="block">
                          Total cost for {amount}{getFoodUnit(selectedFoodName)}
                        </Typography>
                        <Typography variant="body1" sx={{ fontWeight: 600, color: 'primary.main' }}>
                          {formatCost(portionCost)}
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                );
              }
              return null;
            })()}
          </Box>
        )}

        {/* Selected Foods List */}
        {selectedFoods.length > 0 && (
          <>
            <Divider sx={{ my: 2 }} />
            <Typography variant="subtitle2" gutterBottom>
              Selected Foods ({selectedFoods.length})
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, width: '100%' }}>
              {selectedFoods.map((food, index) => {
                const macros = calculateFoodMacros(food.name, food.amount);
                const portionCost = calculatePortionCost(food.name, food.amount);
                return (
                  <Box
                    key={`${food.name}-${index}`}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      p: 2,
                      bgcolor: (theme) => theme.palette.mode === 'dark' 
                        ? 'grey.800' 
                        : 'grey.50',
                      borderRadius: 2,
                      gap: 2,
                      border: (theme) => theme.palette.mode === 'dark' 
                        ? '1px solid rgba(255, 255, 255, 0.12)' 
                        : '1px solid rgba(0, 0, 0, 0.12)'
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: 1 }}>
                      <Typography 
                        variant="body1"
                        sx={{
                          fontWeight: 500,
                          color: (theme) => theme.palette.mode === 'dark' 
                            ? 'grey.100' 
                            : 'grey.800'
                        }}
                      >
                        {getFoodEmoji(food.name)} {food.name}
                      </Typography>
                    </Box>
                    
                    <TextField
                      type="number"
                      value={food.amount}
                      onChange={(e) => onUpdateAmount(index, Number(e.target.value))}
                      label={getFoodUnit(food.name)}
                      size="small"
                      sx={{ width: 120 }}
                    />
                    
                    <Box sx={{ minWidth: 200, textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                      <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
                        <Typography 
                          variant="caption" 
                          sx={{
                            color: (theme) => theme.palette.mode === 'dark' 
                              ? 'grey.300' 
                              : 'grey.600',
                            fontWeight: 500
                          }}
                        >
                          💪 {formatMacroValue(macros.protein)}g
                        </Typography>
                        <Typography 
                          variant="caption" 
                          sx={{
                            color: (theme) => theme.palette.mode === 'dark' 
                              ? 'grey.300' 
                              : 'grey.600',
                            fontWeight: 500
                          }}
                        >
                          🥑 {formatMacroValue(macros.fats)}g
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
                        <Typography 
                          variant="caption" 
                          sx={{
                            color: (theme) => theme.palette.mode === 'dark' 
                              ? 'grey.300' 
                              : 'grey.600',
                            fontWeight: 500
                          }}
                        >
                          🍞 {formatMacroValue(macros.carbs)}g
                        </Typography>
                        <Typography 
                          variant="caption" 
                          sx={{
                            color: (theme) => theme.palette.mode === 'dark' 
                              ? 'grey.300' 
                              : 'grey.600',
                            fontWeight: 500
                          }}
                        >
                          🔥 {formatMacroValue(macros.calories, 0)} kcal
                        </Typography>
                      </Box>
                      {portionCost !== null && (
                        <Typography 
                          variant="caption" 
                          sx={{
                            color: 'primary.main',
                            fontWeight: 600,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 0.5
                          }}
                        >
                          💰 {formatCost(portionCost)}
                        </Typography>
                      )}
                    </Box>
                    
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      {onSwapFood && (
                        <Button
                          variant="outlined"
                          color="primary"
                          size="small"
                          onClick={() => onSwapFood(index)}
                          sx={{ minWidth: 40, p: 1 }}
                          title="Swap to other timeslot"
                        >
                          <SwapIcon fontSize="small" />
                        </Button>
                      )}
                      <Button
                        variant="outlined"
                        color="error"
                        size="small"
                        onClick={() => onRemoveFood(index)}
                        sx={{ minWidth: 40, p: 1 }}
                        title="Remove food"
                      >
                        <DeleteIcon fontSize="small" />
                      </Button>
                    </Box>
                  </Box>
                );
              })}
            </Box>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default FoodSelectorWithFirebase;
