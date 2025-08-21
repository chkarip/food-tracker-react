/**
 * FILE: CategoryAccordion.tsx
 * ------------------------------------------------------------------
 * PURPOSE
 * • Render one expandable / collapsible block per food-category inside
 *   the Meal-Plan UI.
 *
 * KEY FEATURES
 * • Shows all foods that belong to a given category for the *current*
 *   timeslot.
 * • Displays a kcal-total badge in the accordion header (auto-updates).
 * • Lets the user edit amount, swap between timeslots, or remove items
 *   via callbacks supplied by the parent.
 *
 * PROPS
 *   category       { id:string; name:string }
 *   foods          SelectedFood[]         ← current timeslot only
 *   onUpdateAmount (idx:number, amount:number) → void
 *   onRemove       (idx:number) → void
 *   onSwap?        (idx:number) → void    (optional)
 *
 * INTERNAL DATA
 * • Pulls the global `foodDatabase` from FoodContext to calculate
 *   macros and determine “unit” vs “g”.
 *
 * EXTENSIBILITY
 * • If categories later gain icon / colour / order fields, you can show
 *   them in <AccordionSummary>.
 * • To switch the badge from kcal to protein/cost, change the reducer
 *   in `kcalTotal`.
 */

import React, { useMemo, useState } from 'react';
import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Typography,
  Stack,
  Chip,
  IconButton,
  TextField,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import SwapIcon from '@mui/icons-material/SwapHoriz';
import DeleteIcon from '@mui/icons-material/Delete';

import { SelectedFood } from '../../types/nutrition';
import { calculateTotalMacros } from '../../utils/nutritionCalculations';
import { useFoodDatabase } from '../../contexts/FoodContext';

/* ---------- local types ---------- */
interface Category {
  id: string;
  name: string;
}

interface Props {
  category: Category;
  foods: SelectedFood[];
  onUpdateAmount: (foodIdx: number, amount: number) => void;
  onRemove: (foodIdx: number) => void;
  onSwap?: (foodIdx: number) => void;
}

const CategoryAccordion: React.FC<Props> = ({
  category,
  foods,
  onUpdateAmount,
  onRemove,
  onSwap,
}) => {
  const { foodDatabase } = useFoodDatabase();

  /* default-expand if it contains foods */
  const [open, setOpen] = useState<boolean>(foods.length > 0);

  /* kcal badge */
  const kcalTotal = useMemo(() => {
    return foods.reduce((sum, f) => {
      const m = calculateTotalMacros([f], foodDatabase);
      return sum + m.calories;
    }, 0);
  }, [foods, foodDatabase]);

  /* helper */
  const getFoodUnit = (name: string) =>
    foodDatabase[name]?.isUnitFood ? 'units' : 'g';

  /* ---------- render ---------- */
  return (
    <Accordion expanded={open} onChange={() => setOpen(!open)}>
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
        <Typography variant="subtitle1">{category.name}</Typography>
        <Chip
          label={`${Math.round(kcalTotal)} kcal`}
          size="small"
          color="primary"
          sx={{ ml: 2 }}
        />
      </AccordionSummary>

      <AccordionDetails>
        {foods.length === 0 ? (
          <Typography color="text.secondary" sx={{ ml: 1 }}>
            No foods yet.
          </Typography>
        ) : (
          <Stack spacing={1}>
            {foods.map((food, idx) => {
              const macros = calculateTotalMacros([food], foodDatabase);

              return (
                <Stack
                  key={idx}
                  direction="row"
                  spacing={1}
                  alignItems="center"
                  sx={(theme) => ({
                    p: 1,
                    bgcolor:
                      theme.palette.mode === 'dark' ? 'grey.900' : 'grey.50',
                    borderRadius: 1,
                  })}
                >
                  {/* food name + amount */}
                  <Typography sx={{ flex: 1 }}>
                    {food.name}{' '}
                    <Typography component="span" color="text.secondary">
                      ({food.amount}
                      {getFoodUnit(food.name)})
                    </Typography>
                  </Typography>

                  {/* amount editor */}
                  <TextField
                    type="number"
                    value={food.amount}
                    onChange={(e) =>
                      onUpdateAmount(idx, Number(e.target.value))
                    }
                    size="small"
                    sx={{ width: 90 }}
                    inputProps={{ min: 0 }}
                  />

                  {/* kcal mini-display */}
                  <Typography
                    variant="caption"
                    sx={{ width: 70, textAlign: 'right' }}
                  >
                    {macros.calories.toFixed(0)} kcal
                  </Typography>

                  {/* optional swap button */}
                  {onSwap && (
                    <IconButton
                      size="small"
                      onClick={() => onSwap(idx)}
                      title="Swap timeslot"
                    >
                      <SwapIcon fontSize="inherit" />
                    </IconButton>
                  )}

                  {/* remove button */}
                  <IconButton
                    size="small"
                    onClick={() => onRemove(idx)}
                    title="Remove"
                  >
                    <DeleteIcon fontSize="inherit" />
                  </IconButton>
                </Stack>
              );
            })}
          </Stack>
        )}
      </AccordionDetails>
    </Accordion>
  );
};

export default CategoryAccordion;
