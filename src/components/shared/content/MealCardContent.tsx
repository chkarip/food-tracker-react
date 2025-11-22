import React from 'react';
import {
  Box,
  Typography,
  Button
} from '@mui/material';
import { Restaurant as MealIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { MealPlanDocument } from '../../../types/firebase';

interface MealCardContentProps {
  mealPlan: MealPlanDocument | null;
  scheduledTasks: string[];
  loading?: boolean;
}

export const MealCardContent: React.FC<MealCardContentProps> = ({
  mealPlan,
  scheduledTasks,
  loading = false
}) => {
  const navigate = useNavigate();

  if (loading) {
    return (
      <Box sx={{ p: 2, bgcolor: 'var(--surface-bg)', borderRadius: 1, border: '1px solid var(--border-color)' }}>
        <Typography variant="subtitle1" sx={{ color: 'var(--text-primary)', fontWeight: 600 }}>
          Loading meal plan...
        </Typography>
      </Box>
    );
  }

  // Check if there's no meal data scheduled
  const hasMealTasks = scheduledTasks.some(task => task.startsWith('meal-'));
  if (!hasMealTasks || (!mealPlan?.timeslots?.['6pm'] && !mealPlan?.timeslots?.['9:30pm'])) {
    return (
      <>
        <Typography variant="h6" gutterBottom sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          fontWeight: 600,
          color: 'var(--accent-green)',
          mb: 2
        }}>
          🍽️ Food Program
        </Typography>
        <Box sx={{
          p: 4,
          bgcolor: 'var(--surface-bg)',
          borderRadius: 2,
          border: '1px solid var(--border-color)',
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 2
        }}>
          <MealIcon sx={{ fontSize: 48, color: 'var(--text-secondary)', opacity: 0.5 }} />
          <Typography variant="h6" sx={{ color: 'var(--text-primary)', fontWeight: 500 }}>
            Nothing has been scheduled yet
          </Typography>
          <Typography variant="body2" sx={{ color: 'var(--text-secondary)', mb: 1 }}>
            Plan your meals to stay on track with your nutrition goals
          </Typography>
          <Button
            variant="contained"
            startIcon={<MealIcon />}
            onClick={() => navigate('/food/plan')}
            sx={{
              bgcolor: 'var(--accent-green)',
              '&:hover': {
                bgcolor: 'var(--accent-green-dark)'
              }
            }}
          >
            Create Meal Plan
          </Button>
        </Box>
      </>
    );
  }

  return (
    <>
      <Typography variant="h6" gutterBottom sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1,
        fontWeight: 600,
        color: 'var(--accent-green)',
        mb: 2
      }}>
        🍽️ Food Program
      </Typography>

      {/* Vertical layout for meals */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {/* 6PM Meal */}
        {scheduledTasks.includes('meal-6pm') && mealPlan?.timeslots?.['6pm'] && (
          <Box sx={{ p: 2, bgcolor: 'var(--surface-bg)', borderRadius: 1, border: '1px solid var(--border-color)' }}>
            <Typography variant="subtitle1" gutterBottom sx={{ color: 'var(--text-primary)', fontWeight: 600 }}>
              6:00 PM Meal
            </Typography>
            {mealPlan.timeslots['6pm'].selectedFoods.map((food: any, idx: number) => (
              <Box key={idx} display="flex" justifyContent="space-between" mb={0.5}>
                <Typography variant="body2" sx={{ color: 'var(--text-primary)' }}>{food.name}</Typography>
                <Typography variant="body2" sx={{ color: 'var(--text-secondary)' }}>{food.amount}g</Typography>
              </Box>
            ))}

            {mealPlan.timeslots['6pm'].externalNutrition.calories > 0 && (
              <Typography variant="caption" sx={{ color: 'var(--text-secondary)', mt: 1, display: 'block' }}>
                + External: {mealPlan.timeslots['6pm'].externalNutrition.calories} cal
              </Typography>
            )}
          </Box>
        )}

        {/* 9:30PM Meal */}
        {scheduledTasks.includes('meal-9:30pm') && mealPlan?.timeslots?.['9:30pm'] && (
          <Box sx={{ p: 2, bgcolor: 'var(--surface-bg)', borderRadius: 1, border: '1px solid var(--border-color)' }}>
            <Typography variant="subtitle1" gutterBottom sx={{ color: 'var(--text-primary)', fontWeight: 600 }}>
              9:30 PM Meal
            </Typography>
            {mealPlan.timeslots['9:30pm'].selectedFoods.map((food: any, idx: number) => (
              <Box key={idx} display="flex" justifyContent="space-between" mb={0.5}>
                <Typography variant="body2" sx={{ color: 'var(--text-primary)' }}>{food.name}</Typography>
                <Typography variant="body2" sx={{ color: 'var(--text-secondary)' }}>{food.amount}g</Typography>
              </Box>
            ))}

            {mealPlan.timeslots['9:30pm'].externalNutrition.calories > 0 && (
              <Typography variant="caption" sx={{ color: 'var(--text-secondary)', mt: 1, display: 'block' }}>
                + External: {mealPlan.timeslots['9:30pm'].externalNutrition.calories} cal
              </Typography>
            )}
          </Box>
        )}

        {/* Show loading state if meals are scheduled but data not loaded */}
        {scheduledTasks.some(task => task.startsWith('meal-')) && !mealPlan && (
          <Box sx={{ p: 2, bgcolor: 'var(--surface-bg)', borderRadius: 1, border: '1px solid var(--border-color)' }}>
            <Typography variant="subtitle1" sx={{ color: 'var(--text-primary)', fontWeight: 600 }}>
              Loading meal plan...
            </Typography>
          </Box>
        )}
      </Box>

      {/* Total Macros */}
      {mealPlan?.totalMacros && (
        <Box sx={{ mt: 2, p: 2, bgcolor: 'var(--accent-blue)', color: 'white', borderRadius: 1 }}>
          <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 600 }}>
            Total Macros
          </Typography>
          <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
            <Typography variant="body2">
              Protein: {Math.round(mealPlan.totalMacros.protein)}g
            </Typography>
            <Typography variant="body2">
              Fats: {Math.round(mealPlan.totalMacros.fats)}g
            </Typography>
            <Typography variant="body2">
              Carbs: {Math.round(mealPlan.totalMacros.carbs)}g
            </Typography>
            <Typography variant="body2">
              Calories: {Math.round(mealPlan.totalMacros.calories)}
            </Typography>
          </Box>
        </Box>
      )}
    </>
  );
};