import React from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Divider,
  Chip
} from '@mui/material';
import { Euro as EuroIcon } from '@mui/icons-material';
import { SelectedFood } from '../types/nutrition';
import { calculateTotalMealCost, formatCost } from '../data/costDatabase';

interface MealCostDisplayProps {
  timeslotData: Record<string, { selectedFoods: SelectedFood[] }>; // ✅ Fixed type
} // ✅ Added missing closing brace

const MealCostDisplay: React.FC<MealCostDisplayProps> = ({ timeslotData }) => { // ✅ Fixed arrow function
  const timeslotCosts = Object.entries(timeslotData).reduce((acc, [timeslotId, data]) => { // ✅ Fixed arrow function
    const costData = calculateTotalMealCost(data.selectedFoods);
    acc[timeslotId] = costData;
    return acc;
  }, {} as Record<string, { individualCosts: Record<string, number>; totalCost: number }>); // ✅ Fixed type

  const totalDailyCost = Object.values(timeslotCosts).reduce((sum, costData) => sum + costData.totalCost, 0);

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" sx={{ mb: 2 }}>
          💰 Meal Costs
        </Typography>
        
        <Box sx={{
          backgroundColor: (theme) => theme.palette.mode === 'dark'
            ? 'primary.800'
            : 'primary.50',
          borderRadius: 2,
          mb: 2,
          p: 2
        }}>
          <Typography variant="h5">
            {formatCost(totalDailyCost)}
          </Typography>
          <Typography variant="caption">
            Total Daily Cost
          </Typography>
        </Box>

        {Object.entries(timeslotCosts).map(([timeslotId, costData]) => { // ✅ Fixed arrow function
          const timeslotLabel = timeslotId === '6pm' ? '6:00 PM (Afternoon)' : '9:30 PM (Evening)';
          const timeslotFoods = timeslotData[timeslotId].selectedFoods;

          if (timeslotFoods.length === 0) return null;

          return (
            <Box key={timeslotId} sx={{ mb: 2 }}>
              <Typography variant="subtitle2">{timeslotLabel}</Typography>
              {timeslotFoods.map((food, index) => { // ✅ Fixed arrow function
                const cost = costData.individualCosts[food.name] || 0;
                return (
                  <Box key={index} sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2">
                      {food.name} ({food.amount}g)
                    </Typography>
                    <Typography variant="body2">
                      {formatCost(cost, 2)}
                    </Typography>
                  </Box>
                );
              })}
            </Box>
          );
        })}

        {totalDailyCost === 0 && ( // ✅ Fixed comparison
          <Typography variant="body2" color="text.secondary">
            Add foods to see cost breakdown
          </Typography>
        )}
      </CardContent>
    </Card>
  );
};

export default MealCostDisplay;
