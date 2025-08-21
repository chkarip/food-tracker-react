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
 *   – pick a food (chip UI),
 *   – adjust amount,
 *   – preview macros + € cost,
 *   – swap foods between timeslots,
 *   – remove foods.
 * • Emit pure callback events so the parent (TimeslotMealPlanner) owns
 *   all state; the selector itself stays stateless/presentational.
 *
 * BUSINESS RULE HIGHLIGHTS
 * • Fixed-amount & unit foods are respected when defaulting the amount.
 * • All nutrition/cost maths are delegated to utility helpers; this file
 *   owns zero arithmetic logic, only UI + orchestration.
 */

import React, { useState, useCallback, useMemo } from 'react';
import {
  Box,
  Typography,
  TextField,
  Chip,
  Divider,
  Alert,
  CircularProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Stack,
  IconButton,
} from '@mui/material';

import  AccentButton  from '../shared/AccentButton';
import { NumberStepper } from '../shared/inputs';
import {
  SwapHoriz as SwapIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

import { useFoodDatabase } from '../../contexts/FoodContext';
import groupFoodsByCategory from '../../utils/groupFoodsByCategory';
import { calculateMacros, formatMacroValue } from '../../utils/nutritionCalculations';
import { calculatePortionCost, formatCost } from '../../services/firebase/nutrition/foodService';
import { SelectedFood } from '../../types/nutrition';

/* ---------- props ---------- */
interface FoodSelectorWithFirebaseProps {
  selectedFoods: SelectedFood[];
  onAddFood: (food: SelectedFood) => void;
  onUpdateAmount: (index: number, amount: number) => void;
  onRemoveFood: (index: number) => void;
  onSwapFood?: (index: number) => void;
}

/* ================================================================== */
/* COMPONENT                                                          */
/* ================================================================== */
const FoodSelectorWithFirebase: React.FC<FoodSelectorWithFirebaseProps> = ({
  selectedFoods,
  onAddFood,
  onUpdateAmount,
  onRemoveFood,
  onSwapFood,
}) => {
  /* ---------- data ---------- */
  const { foodDatabase, loading, error } = useFoodDatabase();
  const [selectedFoodName, setSelectedFoodName] = useState('');
  const [amount, setAmount] = useState(100);

  /* ---------- helpers ---------- */
  const getFoodUnit = useCallback(
    (n: string) => (foodDatabase[n]?.isUnitFood ? 'units' : 'g'),
    [foodDatabase],
  );

  const getDefaultAmount = useCallback(
    (n: string) => {
      const f = foodDatabase[n];
      if (!f) return 100;
      if (f.useFixedAmount && f.fixedAmount) return f.fixedAmount;
      if (f.isUnitFood) return n === 'Eggs' ? 2 : 1;
      return 100;
    },
    [foodDatabase],
  );

  const handleFoodSelect = useCallback(
    (n: string) => {
      setSelectedFoodName(n);
      setAmount(getDefaultAmount(n));
    },
    [getDefaultAmount],
  );

  const handleAdd = useCallback(() => {
    if (!selectedFoodName) return;
    onAddFood({ name: selectedFoodName, amount });
    setSelectedFoodName('');
    setAmount(100);
  }, [selectedFoodName, amount, onAddFood]);

  /* ---------- group catalogue by category ---------- */
  const groupedAvailable = useMemo(() => {
    // Filter out hidden foods from the available selection
    const visibleFoodNames = Object.keys(foodDatabase).filter(
      name => !foodDatabase[name]?.metadata?.hidden
    );
    const dummy = visibleFoodNames.map((name) => ({ name, amount: 0 }));
    return groupFoodsByCategory(dummy, foodDatabase);
  }, [foodDatabase]);

  /* ---------- guards ---------- */
  if (loading)
    return (
      <Alert icon={<CircularProgress size={18} />} severity="info">
        Loading foods…
      </Alert>
    );

  if (error)
    return (
      <Alert severity="error" sx={{ whiteSpace: 'pre-wrap' }}>
        {error}
      </Alert>
    );

  if (Object.keys(foodDatabase).length === 0)
    return <Alert severity="warning">No foods found in the database.</Alert>;

  /* ---------------------------------------------------------------- */
  /* RENDER                                                           */
  /* ---------------------------------------------------------------- */
  return (
    <Box>
      <Typography variant="subtitle1" sx={{ mb: 1 }}>
        Available Foods ({Object.keys(foodDatabase).length})
      </Typography>

      {/* ---------- grouped chip picker ---------- */}
      {Object.entries(groupedAvailable).map(([cat, foods]) => (
        <Accordion key={cat} defaultExpanded sx={{ mb: 1 }}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="subtitle2">{cat}</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Stack direction="row" flexWrap="wrap" gap={1}>
              {foods.map(({ name }) => {
                const isSel = selectedFoods.some((f) => f.name === name);
                const hasFixed = foodDatabase[name]?.useFixedAmount;
                return (
                  <Chip
                    key={name}
                    label={name}
                    onClick={() => handleFoodSelect(name)}
                    variant={
                      selectedFoodName === name || isSel ? 'filled' : 'outlined'
                    }
                    color={
                      selectedFoodName === name
                        ? 'primary'
                        : isSel
                        ? 'secondary'
                        : hasFixed
                        ? 'success'
                        : 'default'
                    }
                  />
                );
              })}
            </Stack>
          </AccordionDetails>
        </Accordion>
      ))}

      {/* ---------- amount input & add button ---------- */}
      {selectedFoodName && (
        <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
          <Box sx={{ width: 120 }}>
            <Typography variant="body2" sx={{ mb: 1, fontWeight: 500 }}>
              Amount
            </Typography>
            <NumberStepper
              value={amount}
              onChange={setAmount}
              min={0}
              max={1000}
              step={getFoodUnit(selectedFoodName) === 'units' ? 1 : 5}
              unit={getFoodUnit(selectedFoodName)}
              size="small"
            />
          </Box>
          <AccentButton
            onClick={handleAdd}
            variant="primary"
            size='small'
          >
            ➕ Add {selectedFoodName}
          </AccentButton>
        </Stack>
      )}

      {/* ---------- selected foods list ---------- */}
      {selectedFoods.length > 0 && (
        <>
          <Divider sx={{ my: 2 }} />
          <Typography variant="subtitle1" sx={{ mb: 1 }}>
            Selected Foods ({selectedFoods.length})
          </Typography>

          {selectedFoods.map((food, idx) => {
            const macros = calculateMacros(food.name, food.amount, foodDatabase);
            const cost = calculatePortionCost(
              food.name,
              food.amount,
              foodDatabase,
            );

            return (
              <Box
                key={`${food.name}_${idx}`}
                sx={(theme) => ({
                  p: 1,
                  mb: 1,
                  borderRadius: 1,
                  bgcolor:
                    theme.palette.mode === 'dark' ? 'grey.900' : 'grey.50',
                })}
              >
                <Stack
                  direction="row"
                  alignItems="center"
                  justifyContent="space-between"
                  spacing={1}
                >
                  <Typography sx={{ flex: 1 }}>{food.name}</Typography>

                  <NumberStepper
                    value={food.amount}
                    onChange={(value) => onUpdateAmount(idx, value)}
                    min={0}
                    max={1000}
                    step={getFoodUnit(food.name) === 'units' ? 1 : 5}
                    unit={getFoodUnit(food.name)}
                    size="small"
                  />

                  <Typography variant="caption" sx={{ width: 110 }}>
                    {formatMacroValue(macros.protein)}g P ·{' '}
                    {formatMacroValue(macros.fats)}g F ·{' '}
                    {formatMacroValue(macros.carbs)}g C
                  </Typography>

                  {cost !== null && (
                    <Typography variant="caption" sx={{ width: 60 }}>
                      {formatCost(cost)}
                    </Typography>
                  )}

                  {onSwapFood && (
                    <IconButton
                      onClick={() => onSwapFood(idx)}
                      size="small"
                      sx={{ minWidth: 0 }}
                    >
                      <SwapIcon fontSize="inherit" />
                    </IconButton>
                  )}

                  <IconButton
                    onClick={() => onRemoveFood(idx)}
                    size="small"
                    sx={{ minWidth: 0 }}
                  >
                    <DeleteIcon fontSize="inherit" />
                  </IconButton>
                </Stack>
              </Box>
            );
          })}
        </>
      )}
    </Box>
  );
};

export default FoodSelectorWithFirebase;
