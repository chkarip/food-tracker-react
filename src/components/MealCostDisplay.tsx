import React from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Divider,
  Chip
} from '@mui/material';
import {
  Euro as EuroIcon
} from '@mui/icons-material';
import { SelectedFood } from '../types/nutrition';
import { calculateTotalMealCost, formatCost } from '../data/costDatabase';

interface MealCostDisplayProps {
  timeslotData: Record<string, {
    selectedFoods: SelectedFood[];
    externalNutrition: {
      protein: number;
      fats: number;
      carbs: number;
      calories: number;
    };
  }>;
}

const MealCostDisplay: React.FC<MealCostDisplayProps> = ({ timeslotData }) => {
  // Calculate costs for each timeslot
  const timeslotCosts = Object.entries(timeslotData).reduce((acc, [timeslotId, data]) => {
    const costData = calculateTotalMealCost(data.selectedFoods);
    acc[timeslotId] = costData;
    return acc;
  }, {} as Record<string, { individualCosts: Record<string, number>; totalCost: number }>);

  // Calculate total daily cost
  const totalDailyCost = Object.values(timeslotCosts).reduce((sum, costData) => sum + costData.totalCost, 0);

  return (
    <Card sx={{ borderRadius: 3 }}>
      <CardContent>
        <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <EuroIcon />
          Meal Costs
        </Typography>

        {/* Total Daily Cost */}
        <Box 
          sx={{ 
            textAlign: 'center', 
            p: 2, 
            bgcolor: (theme) => theme.palette.mode === 'dark' 
              ? 'primary.800' 
              : 'primary.50',
            borderRadius: 2,
            mb: 2
          }}
        >
          <Typography variant="h4" color="primary.main" sx={{ fontWeight: 600 }}>
            {formatCost(totalDailyCost)}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Total Daily Cost
          </Typography>
        </Box>

        {/* Timeslot Breakdown */}
        {Object.entries(timeslotCosts).map(([timeslotId, costData]) => {
          const timeslotLabel = timeslotId === '6pm' ? '6:00 PM (Afternoon)' : '9:30 PM (Evening)';
          const timeslotFoods = timeslotData[timeslotId].selectedFoods;
          
          if (timeslotFoods.length === 0) return null;
          
          return (
            <Box key={timeslotId} sx={{ mb: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                  {timeslotLabel}
                </Typography>
                <Chip 
                  label={formatCost(costData.totalCost)}
                  size="small"
                  color="primary"
                  variant="outlined"
                />
              </Box>
              
              {/* Individual food costs for this timeslot */}
              <Box sx={{ pl: 2 }}>
                {timeslotFoods.map((food, index) => {
                  const cost = costData.individualCosts[food.name] || 0;
                  return (
                    <Box 
                      key={`${food.name}-${index}`}
                      sx={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center',
                        py: 0.5,
                        fontSize: '0.875rem'
                      }}
                    >
                      <Typography variant="body2" color="text.secondary">
                        {food.name} ({food.amount}{food.name === 'Eggs' ? ' eggs' : food.name === 'Tortilla wrap' ? ' wraps' : food.name === 'Canned tuna' ? ' cans' : 'g'})
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {formatCost(cost, 2)}
                      </Typography>
                    </Box>
                  );
                })}
              </Box>
            </Box>
          );
        })}

        {/* No foods selected message */}
        {totalDailyCost === 0 && (
          <Box sx={{ textAlign: 'center', py: 3 }}>
            <EuroIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
            <Typography variant="body2" color="text.secondary">
              Add foods to see cost breakdown
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default MealCostDisplay;
