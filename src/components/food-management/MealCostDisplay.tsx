/**
 * FILE: MealCostDisplay.tsx
 * ------------------------------------------------------------------
 * PURPOSE
 * • Provide a clear € breakdown of the user’s planned meals, showing:
 *     – cost per timeslot (6 pm, 9 : 30 pm, …)
 *     – individual food costs inside each slot
 *     – total daily food cost chip
 *
 * DATA FLOW
 * • Receives `timeslotData` (foods already chosen) from its parent.
 * • Delegates price maths to `calculateTotalMealCost`, keeping this file
 *   presentation-only.
 *
 * UX RULES
 * • Timeslots with no foods are hidden to minimise clutter.
 * • Grand total is always visible; if zero, helper text encourages the
 *   user to add items.
 * • Colour/theme aware: uses MUI tokens so it works in both light & dark
 *   modes out of the box.
 */
import React from 'react';
import {
  Box,
  Typography,
} from '@mui/material';
import { GenericCard } from '../shared/cards/GenericCard';
import { SelectedFood } from '../../types/nutrition';
import { calculateTotalMealCost, formatCost } from '../../services/firebase/nutrition/foodService';
import { useFoodDatabase } from '../../contexts/FoodContext';

interface MealCostDisplayProps {
  timeslotData: Record<string, { selectedFoods: SelectedFood[] }>;
}

const MealCostDisplay: React.FC<MealCostDisplayProps> = ({ timeslotData }) => {
  const { foodDatabase } = useFoodDatabase();

  const timeslotCosts = Object.entries(timeslotData).reduce((acc, [timeslotId, data]) => {
    // ✅ Pass cached foodDatabase
    const costData = calculateTotalMealCost(data.selectedFoods, foodDatabase);
    acc[timeslotId] = costData;
    return acc;
  }, {} as Record<string, { totalCost: number; individualCosts: Record<string, number> }>);

  const totalDailyCost = Object.values(timeslotCosts).reduce((sum, costData) => sum + costData.totalCost, 0);

  return (
    <GenericCard
      variant="summary"
      title="Meal Costs"
      content={
        <Box>
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
        </Box>
      }
    />
  );
};

export default MealCostDisplay;
