import React from 'react';
import { 
  Box, 
  Card, 
  CardContent, 
  Typography, 
  TextField, 
  Button, 
  Chip,
  Divider
} from '@mui/material';
import { Add as AddIcon, Restaurant as RestaurantIcon, Euro as EuroIcon } from '@mui/icons-material';
import { FOOD_DATABASE } from '../data/foodDatabase';
import { getFoodUnit, calculateMacros, formatMacroValue } from '../utils/nutritionCalculations';
import { calculatePortionCost, getCostPerGram, formatCost } from '../data/costDatabase';
import { SelectedFood } from '../types/nutrition';

interface FoodSelectorProps {
  selectedFoods: SelectedFood[];
  onAddFood: (food: SelectedFood) => void;
  onUpdateAmount: (index: number, amount: number) => void;
  onRemoveFood: (index: number) => void;
}

const FoodSelector: React.FC<FoodSelectorProps> = ({
  selectedFoods,
  onAddFood,
  onUpdateAmount,
  onRemoveFood
}) => {
  const [selectedFoodName, setSelectedFoodName] = React.useState<string>('');
  const [amount, setAmount] = React.useState<number>(100);

  const availableFoods = Object.keys(FOOD_DATABASE);

  const handleAddFood = () => {
    if (!selectedFoodName) return;
    
    onAddFood({
      name: selectedFoodName,
      amount: amount
    });
    
    // Reset form
    setSelectedFoodName('');
    setAmount(100);
  };

  const getFoodEmoji = (foodName: string): string => {
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
  };

  const getDefaultAmount = (foodName: string): number => {
    const foodItem = FOOD_DATABASE[foodName];
    if (!foodItem) return 100;
    
    if (foodItem.isUnitFood) {
      switch (foodName) {
        case 'Eggs': return 2;
        case 'Tortilla wrap': return 1;
        case 'Canned tuna': return 1;
        default: return 1;
      }
    }
    return 100; // default grams for weight foods
  };

  const handleFoodSelect = (foodName: string) => {
    setSelectedFoodName(foodName);
    setAmount(getDefaultAmount(foodName));
  };

  return (
    <Card sx={{ mb: 3, borderRadius: 4 }}>
      <CardContent sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <RestaurantIcon />
          Food Selector
        </Typography>

        {/* Food Selection */}
        <Box sx={{ mb: 3 }}>
          <Typography 
            variant="subtitle2" 
            gutterBottom
            sx={{
              fontWeight: 600,
              color: (theme) => theme.palette.mode === 'dark' 
                ? 'grey.200' 
                : 'grey.700'
            }}
          >
            Available Foods ({availableFoods.length})
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
            {availableFoods.map((foodName) => (
              <Chip
                key={foodName}
                label={`${getFoodEmoji(foodName)} ${foodName}`}
                onClick={() => handleFoodSelect(foodName)}
                variant={selectedFoodName === foodName ? 'filled' : 'outlined'}
                color={selectedFoodName === foodName ? 'primary' : 'default'}
                sx={{ cursor: 'pointer' }}
              />
            ))}
          </Box>
        </Box>

        {/* Amount Input & Add Button */}
        {selectedFoodName && (
          <Box sx={{ mb: 3 }}>
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: 2 }}>
              <TextField
                label={`Amount (${getFoodUnit(selectedFoodName)})`}
                type="number"
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                sx={{ minWidth: 120 }}
                size="small"
              />
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={handleAddFood}
                disabled={!selectedFoodName || amount <= 0}
              >
                Add {selectedFoodName}
              </Button>
            </Box>
            
            {/* Cost Information */}
            {(() => {
              const foodItem = FOOD_DATABASE[selectedFoodName];
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
            <Typography 
              variant="subtitle2" 
              gutterBottom
              sx={{
                fontWeight: 600,
                color: (theme) => theme.palette.mode === 'dark' 
                  ? 'grey.200' 
                  : 'grey.700'
              }}
            >
              Selected Foods ({selectedFoods.length})
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {selectedFoods.map((food, index) => {
                const macros = calculateMacros(food.name, food.amount);
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
                      sx={{ width: 100 }}
                    />
                    
                    <Box sx={{ minWidth: 140, textAlign: 'center' }}>
                      <Typography 
                        variant="caption" 
                        display="block"
                        sx={{
                          color: (theme) => theme.palette.mode === 'dark' 
                            ? 'grey.300' 
                            : 'grey.600',
                          fontWeight: 500
                        }}
                      >
                        {formatMacroValue(macros.protein)}g protein
                      </Typography>
                      <Typography 
                        variant="caption" 
                        display="block"
                        sx={{
                          color: (theme) => theme.palette.mode === 'dark' 
                            ? 'grey.300' 
                            : 'grey.600',
                          fontWeight: 500
                        }}
                      >
                        {formatMacroValue(macros.calories, 0)} kcal
                      </Typography>
                      {portionCost !== null && (
                        <Typography 
                          variant="caption" 
                          display="block"
                          sx={{
                            color: 'primary.main',
                            fontWeight: 600
                          }}
                        >
                          {formatCost(portionCost)}
                        </Typography>
                      )}
                    </Box>
                    
                    <Button
                      variant="outlined"
                      color="error"
                      size="small"
                      onClick={() => onRemoveFood(index)}
                    >
                      Remove
                    </Button>
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

export default FoodSelector;
