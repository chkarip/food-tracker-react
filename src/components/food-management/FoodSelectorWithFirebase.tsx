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

import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import {
  Box,
  Typography,
  TextField,
  Chip,
  Divider,
  Alert,
  CircularProgress,
  Stack,
} from '@mui/material';

import  AccentButton  from '../shared/AccentButton';
import { NumberStepper } from '../shared/inputs';
import CollapsiblePanel from '../shared/CollapsiblePanel';
import { GenericCard } from '../shared/cards/GenericCard';
import { ViewList as ViewListIcon, Restaurant as RestaurantIcon } from '@mui/icons-material';
import { KeyboardArrowRight as ArrowRightIcon, KeyboardArrowLeft as ArrowLeftIcon } from '@mui/icons-material';

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
  onFoodPreview?: (foodName: string, amount: number) => void;
  onClearPreview?: () => void;
  onFoodSelect?: (foodName: string) => void;
  timeslotData?: Record<string, { selectedFoods: SelectedFood[]; externalNutrition: any }>;

  currentTimeslot?: string;
  isSwapping?: boolean;
  targetCategory?: string;
  onUpdateAmountForTimeslot?: (timeslotId: string, index: number, amount: number) => void;
  onRemoveFoodForTimeslot?: (timeslotId: string, index: number) => void;
  onSwapFoodForTimeslot?: (timeslotId: string, index: number) => void;
  selectedFromFavorite?: string | null;
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
  onFoodPreview,
  onClearPreview,
  onFoodSelect,
  timeslotData,
  currentTimeslot,
  isSwapping = false,
  targetCategory,
  onUpdateAmountForTimeslot,
  onRemoveFoodForTimeslot,
  onSwapFoodForTimeslot,
  selectedFromFavorite,
}) => {
  /* ---------- data ---------- */
  const { foodDatabase, loading, error } = useFoodDatabase();
  const [selectedFoodName, setSelectedFoodName] = useState('');
  const [amount, setAmount] = useState(100);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null); // Track expanded category
  const [justAddedName, setJustAddedName] = useState<string>('');
  const [viewMode, setViewMode] = useState<'available' | 'selected'>('available'); // Toggle between available and selected foods

  // Refs for smooth scrolling after cancel - one per category
  const categoryRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // Ref for smooth scrolling after cancel
  const headerRef = useRef<HTMLDivElement>(null);

  /* ---------- group catalogue by category ---------- */
  const groupedAvailable = useMemo(() => {
    // Filter out hidden foods from the available selection
    const visibleFoodNames = Object.keys(foodDatabase).filter(
      name => !foodDatabase[name]?.metadata?.hidden
    );
    const dummy = visibleFoodNames.map((name) => ({ name, amount: 0 }));
    return groupFoodsByCategory(dummy, foodDatabase);
  }, [foodDatabase]);

  // Auto-expand category when selectedFoodName changes (for favorite food selection)
  useEffect(() => {
    if (selectedFoodName && groupedAvailable) {
      const category = Object.entries(groupedAvailable).find(([cat, foods]) => 
        foods.some(f => f.name === selectedFoodName)
      )?.[0];
      
      if (category && expandedCategory !== category) {
        setExpandedCategory(category);
      }
    }
  }, [selectedFoodName, groupedAvailable, expandedCategory]);

  // Handle selection from favorite foods
  useEffect(() => {
    if (selectedFromFavorite && selectedFromFavorite !== selectedFoodName) {
      handleFoodSelect(selectedFromFavorite);
    }
  }, [selectedFromFavorite]);

  // Auto-collapse on mobile when food is selected
  useEffect(() => {
    if (selectedFoodName && window.innerWidth < 768) { // Mobile breakpoint
      // Find which category contains the selected food
      const categoryWithSelection = Object.entries(groupedAvailable).find(([cat, foods]) => 
        foods.some(f => f.name === selectedFoodName)
      )?.[0];
      
      if (categoryWithSelection && expandedCategory !== categoryWithSelection) {
        setExpandedCategory(categoryWithSelection);
      }
    }
  }, [selectedFoodName, groupedAvailable, expandedCategory]);

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

  // Group selected foods by timeslot
  const groupedSelectedFoods = useMemo(() => {
    if (!timeslotData) return { [currentTimeslot || 'current']: selectedFoods };
    
    const grouped: Record<string, SelectedFood[]> = {};
    Object.entries(timeslotData).forEach(([timeslotId, data]) => {
      grouped[timeslotId] = data.selectedFoods;
    });
    return grouped;
  }, [timeslotData, selectedFoods, currentTimeslot]);

  // Get time-based tag for current timeslot
  const getTimeslotTag = useCallback((timeslotId: string) => {
    if (timeslotId === '6pm') return 'Afternoon';
    if (timeslotId === '9:30pm') return 'Evening';
    return '';
  }, []);

  // Get total selected foods count across all timeslots
  const totalSelectedFoods = useMemo(() => {
    if (!timeslotData) return selectedFoods.length;
    return Object.values(timeslotData).reduce((total, data) => total + data.selectedFoods.length, 0);
  }, [timeslotData, selectedFoods]);

  const handleFoodSelect = useCallback(
    (n: string) => {
      setSelectedFoodName(n);
      const amt = getDefaultAmount(n);
      setAmount(amt);
      if (onFoodPreview) onFoodPreview(n, amt);
      if (onFoodSelect) onFoodSelect(n);
      
      // Find the category of the selected food and expand it
      const category = Object.entries(groupedAvailable).find(([cat, foods]) => 
        foods.some(f => f.name === n)
      )?.[0];
      
      if (category) {
        setExpandedCategory(category);
      }
      
      // Auto-collapse on mobile when selection is made
      if (window.innerWidth < 768) {
        setExpandedCategory('');
      }
    },
    [getDefaultAmount, onFoodPreview, onFoodSelect, groupedAvailable],
  );
  // Update amount and trigger preview
  const handleAmountChange = useCallback((newAmount: number) => {
    setAmount(newAmount);
    if (selectedFoodName && onFoodPreview) {
      onFoodPreview(selectedFoodName, newAmount);
    }
  }, [selectedFoodName, onFoodPreview]);

  // Clear preview when deselecting
  const handleClearSelection = useCallback(() => {
    setSelectedFoodName('');
    setAmount(100);
    if (onClearPreview) onClearPreview();
    
    // Smooth scroll to current category header after cancel to avoid jump sensation
    setTimeout(() => {
      if (expandedCategory && categoryRefs.current[expandedCategory]) {
        categoryRefs.current[expandedCategory]?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    }, 100);
  }, [onClearPreview, expandedCategory]);

  const handleAdd = useCallback(() => {
  if (!selectedFoodName) return;
  onAddFood({ name: selectedFoodName, amount });
  setJustAddedName(selectedFoodName);
  setSelectedFoodName('');
  setAmount(100);
  if (onClearPreview) onClearPreview();
  
  // Clear the badge after 1200ms (extended for better visibility)
  setTimeout(() => setJustAddedName(''), 1200);
  }, [selectedFoodName, amount, onAddFood]);

  const handleCategoryToggle = (category: string) => {
    setExpandedCategory(prev => {
      // If clicking the currently expanded category, close it
      if (prev === category) {
        // Clear selection when closing the category
        if (selectedFoodName) {
          setSelectedFoodName('');
          setAmount(100);
          if (onClearPreview) onClearPreview();
        }
        return null;
      }
      
      // If switching to a different category, clear the current selection first
      if (selectedFoodName) {
        setSelectedFoodName('');
        setAmount(100);
        if (onClearPreview) onClearPreview();
      }
      
      // Open the new category (accordion behavior - only one open at a time)
      return category;
    });
  };

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
    <Box sx={{ position: 'relative' }}>
      {/* Toggle Button - Positioned beside the title */}
      <Box
        sx={{
          position: 'absolute',
          top: 16,
          right: 16,
          zIndex: 20,
          backgroundColor: 'var(--card-bg)',
          borderRadius: '8px',
          border: '1px solid var(--border-color)',
          boxShadow: 'var(--elevation-2)',
          '&:hover': {
            boxShadow: 'var(--elevation-3)',
            transform: 'translateY(-1px)',
          },
          transition: 'all 0.2s ease',
        }}
      >
        <AccentButton
          onClick={() => setViewMode(viewMode === 'available' ? 'selected' : 'available')}
          variant="secondary"
          size="small"
          startIcon={viewMode === 'available' ? <ArrowRightIcon /> : <ArrowLeftIcon />}
          style={{
            minWidth: 'auto',
            padding: '6px 12px',
            fontSize: '0.75rem',
            backgroundColor: 'transparent',
            border: 'none',
            boxShadow: 'none',
          }}
        >
          {viewMode === 'available' ? 'Selected' : 'Available'}
        </AccentButton>
      </Box>

      <GenericCard
        variant="default"
        title={viewMode === 'available' ? `Available Foods (${Object.keys(foodDatabase).length})` : `Selected Foods (${totalSelectedFoods})`}
        content={
          <Box sx={{ position: 'relative' }}>
            {/* Main Content */}
            {viewMode === 'available' ? (
              <>
                {/* ---------- grouped chip picker ---------- */}
                {Object.entries(groupedAvailable).map(([cat, foods]) => {
                  const isTargetCategory = isSwapping && targetCategory === cat;
                  
                  return (
                    <CollapsiblePanel
                      ref={(el) => { categoryRefs.current[cat] = el; }}
                      key={cat} // Static key based only on category
                      title={`${cat} Foods`}
                      variant="primary"
                      size="compact"
                      expanded={expandedCategory === cat || (isTargetCategory && !expandedCategory)}
                      onToggle={() => handleCategoryToggle(cat)}
                      className={`${isTargetCategory ? 'swap-highlight' : ''} ${selectedFoodName && foods.some(f => f.name === selectedFoodName) ? '' : 'only-chips'}`}
                      sx={isTargetCategory ? {
                        borderColor: 'var(--accent-orange)',
                        boxShadow: '0 0 0 2px rgba(255, 152, 0, 0.3), var(--elevation-2)',
                        animation: 'pulse 1.5s ease-in-out infinite'
                      } : {}}
                    >
                      <Box
                        sx={{
                          // Removed transition to avoid conflicts with CollapsiblePanel height calculation
                        }}
                      >
                        <Stack direction="row" flexWrap="wrap" gap={1.5}>
                          {foods.map(({ name }) => {
                            const isSel = selectedFoods.some((f) => f.name === name);
                            const hasFixed = foodDatabase[name]?.useFixedAmount;
                            const isJustAdded = justAddedName === name;
                            
                            return (
                              <Box key={name} sx={{ position: 'relative' }}>
                                <Chip
                                  label={name}
                                  onClick={() => handleFoodSelect(name)}
                                  variant={
                                    selectedFoodName === name || isSel ? 'filled' : 'outlined'
                                  }
                                  sx={{
                                    backgroundColor: selectedFoodName === name 
                                      ? 'var(--accent-green)' 
                                      : isSel 
                                        ? 'var(--meal-chip-bg)' 
                                        : 'var(--surface-bg)',
                                    color: selectedFoodName === name 
                                      ? 'white' 
                                      : isSel 
                                        ? 'var(--accent-green)' 
                                        : 'var(--text-primary)',
                                    border: `1px solid ${selectedFoodName === name ? 'var(--accent-green)' : 'var(--border-color)'}`,
                                    fontWeight: selectedFoodName === name || isSel ? 600 : 500,
                                    fontSize: '0.85rem',
                                    padding: '8px 12px',
                                    transition: 'all 0.3s ease',
                                    cursor: 'pointer',
                                    '&:hover': {
                                      transform: 'translateY(-2px)',
                                      boxShadow: 'var(--elevation-1)',
                                      backgroundColor: selectedFoodName === name 
                                        ? 'var(--accent-green)' 
                                        : 'var(--meal-chip-bg)',
                                      borderColor: 'var(--accent-green)'
                                    }
                                  }}
                                />
                                {/* +1 Badge */}
                                {isJustAdded && (
                                  <Box
                                    sx={{
                                      position: 'absolute',
                                      top: -8,
                                      right: -8,
                                      backgroundColor: 'var(--accent-green)',
                                      color: 'white',
                                      borderRadius: '50%',
                                      width: 20,
                                      height: 20,
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      fontSize: '0.7rem',
                                      fontWeight: 'bold',
                                      boxShadow: 'var(--elevation-2)',
                                      animation: 'fadeInOut 1.2s ease-in-out',
                                      zIndex: 10,
                                      '@keyframes fadeInOut': {
                                        '0%': { opacity: 0, transform: 'scale(0.5)' },
                                        '20%': { opacity: 1, transform: 'scale(1.1)' },
                                        '80%': { opacity: 1, transform: 'scale(1)' },
                                        '100%': { opacity: 0, transform: 'scale(0.8)' }
                                      }
                                    }}
                                  >
                                    +1
                                  </Box>
                                )}
                              </Box>
                            );
                          })}
                        </Stack>
                        
                        {/* Inline Amount Controls */}
                        {selectedFoodName && foods.some(f => f.name === selectedFoodName) && (
                          <Box 
                            key={`controls-${selectedFoodName}`}
                            sx={{ 
                              mt: 2, 
                              p: 2, 
                              backgroundColor: 'var(--meal-row-bg)', 
                              borderRadius: '8px', 
                              border: '1px solid var(--border-color)',
                              animation: 'slideIn 0.3s ease-out',
                              opacity: 1,
                              transform: 'translateY(0)',
                              transition: 'all 0.3s ease-out'
                            }}
                          >
                            <style>
                              {`
                                @keyframes slideIn {
                                  from {
                                    opacity: 0;
                                    transform: translateY(-10px);
                                  }
                                  to {
                                    opacity: 1;
                                    transform: translateY(0);
                                  }
                                }
                                @keyframes slideOut {
                                  from {
                                    opacity: 1;
                                    transform: translateY(0);
                                  }
                                  to {
                                    opacity: 0;
                                    transform: translateY(-10px);
                                  }
                                }
                              `}
                            </style>
                            <Typography variant="subtitle2" sx={{ mb: 1, color: 'var(--text-primary)', fontWeight: 600 }}>
                              Configure {selectedFoodName}
                            </Typography>
                            
                            <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 2 }}>
                              <Typography variant="body2" sx={{ color: 'var(--text-secondary)' }}>
                                Amount:
                              </Typography>
                              <NumberStepper
                                value={amount}
                                onChange={handleAmountChange}
                                min={0}
                                max={10000}
                                step={getFoodUnit(selectedFoodName) === 'units' ? 1 : 5}
                                unit={getFoodUnit(selectedFoodName)}
                                size="small"
                              />
                            </Stack>
                            
                            {/* Preview Macros */}
                            {(() => {
                              const macros = calculateMacros(selectedFoodName, amount, foodDatabase);
                              const cost = calculatePortionCost(selectedFoodName, amount, foodDatabase);
                              
                              return (
                                <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
                                  <Typography 
                                    variant="body2" 
                                    sx={{ 
                                      background: 'var(--meal-chip-bg)',
                                      padding: '6px 12px',
                                      borderRadius: 'var(--radius-sm)',
                                      color: 'var(--text-primary)',
                                      fontWeight: 600,
                                      fontSize: '0.8rem',
                                      border: '1px solid var(--meal-chip-outline)'
                                    }}
                                  >
                                    {formatMacroValue(macros.protein)}g P · {formatMacroValue(macros.fats)}g F · {formatMacroValue(macros.carbs)}g C · {formatMacroValue(macros.calories)} kcal
                                  </Typography>
                                  
                                  {cost !== null && (
                                    <Typography 
                                      variant="body2" 
                                      sx={{ 
                                        background: 'var(--meal-chip-bg)',
                                        padding: '6px 10px',
                                        borderRadius: 'var(--radius-sm)',
                                        color: 'var(--text-primary)',
                                        fontWeight: 600,
                                        fontSize: '0.85rem',
                                        border: '1px solid var(--meal-chip-outline)'
                                      }}
                                    >
                                      {formatCost(cost)}
                                    </Typography>
                                  )}
                                </Stack>
                              );
                            })()}
                            
                            <Stack direction="row" spacing={1}>
                              <AccentButton 
                                onClick={handleAdd}
                                size="small"
                                style={{ minWidth: '80px' }}
                              >
                                Add
                              </AccentButton>
                              <AccentButton 
                                onClick={handleClearSelection}
                                variant="secondary"
                                size="small"
                                style={{ minWidth: '80px' }}
                              >
                                Cancel
                              </AccentButton>
                            </Stack>
                          </Box>
                        )}
                      </Box>
                    </CollapsiblePanel>
                  );
                })}
              </>
            ) : (
              <>
                {/* ---------- selected foods list ---------- */}
                {totalSelectedFoods > 0 ? (
                  <Box sx={{
                    position: 'relative',
                    background: 'var(--card-bg)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '12px',
                    boxShadow: 'var(--elevation-1)',
                    overflow: 'hidden',
                    // hover overlay that does NOT affect children
                    '&::before': {
                      content: '""',
                      position: 'absolute',
                      inset: 0,
                      pointerEvents: 'none',
                      background: 'linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0.02))',
                      opacity: 0,
                      transition: 'opacity 160ms ease',
                    },
                    '&:hover::before': { opacity: 1 },
                    '&:hover': { boxShadow: 'var(--elevation-2)' }, // subtle lift only
                  }}>
                    {Object.entries(groupedSelectedFoods).map(([timeslotId, foods]) => {
                      if (foods.length === 0) return null;
                      
                      return (
                        <Box key={timeslotId} sx={{ mb: 2, p: 2 }}>
                          {/* Timeslot header */}
                          <Typography
                            variant="subtitle1"
                            sx={{
                              mb: 1,
                              color: 'var(--text-secondary)',
                              fontWeight: 600,
                              fontSize: '0.9rem',
                              textAlign: 'center',
                              position: 'relative',
                              '&::before': {
                                content: '""',
                                position: 'absolute',
                                left: '50%',
                                transform: 'translateX(-50%)',
                                bottom: -2,
                                width: '30px',
                                height: '1px',
                                backgroundColor: timeslotId === '6pm' ? 'var(--timeslot-afternoon)' : 'var(--timeslot-evening)',
                                borderRadius: '0.5px'
                              },
                              paddingBottom: '4px'
                            }}
                          >
                            {timeslotId === '6pm' ? '6:00 PM' : '9:30 PM'} 
                            <Box
                              component="span"
                              sx={{
                                display: 'inline-block',
                                ml: 1,
                                px: 0.75,
                                py: 0.2,
                                backgroundColor: timeslotId === '6pm' ? 'var(--timeslot-afternoon)' : 'var(--timeslot-evening)',
                                color: 'white',
                                borderRadius: '3px',
                                fontSize: '0.6rem',
                                fontWeight: 600,
                                textTransform: 'uppercase',
                                letterSpacing: '0.3px'
                              }}
                            >
                              {getTimeslotTag(timeslotId)}
                            </Box>
                          </Typography>

                          {/* Foods for this timeslot */}
                          {foods.map((food, idx) => {
                            const macros = calculateMacros(food.name, food.amount, foodDatabase);
                            const cost = calculatePortionCost(
                              food.name,
                              food.amount,
                              foodDatabase,
                            );

                            // Calculate the global index for this food in the current timeslot
                            const globalIdx = timeslotData ? timeslotData[timeslotId].selectedFoods.findIndex(f => f === food) : idx;

                            return (
                              <Box
                                key={`${food.name}_${idx}`}
                                sx={{
                                  position: 'relative',
                                  isolation: 'isolate',                // prevents parent overlay blending
                                  background: 'var(--meal-row-bg)',    // token, not transparent white
                                  border: '1px solid var(--border-color)',
                                  borderRadius: '12px',
                                  boxShadow: 'var(--elevation-1)',
                                  transition: 'transform 120ms ease, box-shadow 120ms ease',
                                  p: 2,
                                  mb: 1,
                                  zIndex: 2,
                                  '&:hover': {
                                    transform: 'translateY(-1px)',
                                    boxShadow: 'var(--elevation-2)',
                                    // do NOT lighten background here
                                    borderColor: 'var(--border-color)',
                                  }
                                }}
                              >
                                <Stack
                                  direction="row"
                                  alignItems="center"
                                  justifyContent="space-between"
                                  spacing={2}
                                >
                                  <Typography 
                                    sx={{ 
                                      flex: 1,
                                      fontWeight: 600,
                                      color: 'var(--text-primary)',
                                      fontSize: '1rem'
                                    }}
                                  >
                                    {food.name}
                                  </Typography>

                                  <NumberStepper
                                    value={food.amount}
                                    onChange={(value) => {
                                      if (onUpdateAmountForTimeslot && timeslotId) {
                                        onUpdateAmountForTimeslot(timeslotId, idx, value);
                                      } else {
                                        onUpdateAmount(idx, value);
                                      }
                                    }}
                                    min={0}
                                    max={10000}
                                    step={getFoodUnit(food.name) === 'units' ? 1 : 5}
                                    unit={getFoodUnit(food.name)}
                                    size="small"
                                  />

                                  <Typography 
                                    variant="body2" 
                                    sx={{ 
                                      width: 120, 
                                      textAlign: 'center',
                                      background: 'var(--meal-chip-bg)',
                                      padding: '6px 12px',
                                      borderRadius: 'var(--radius-sm)',
                                      color: 'var(--text-primary)',
                                      fontWeight: 600,
                                      fontSize: '0.8rem',
                                      border: '1px solid var(--meal-chip-outline)',
                                      position: 'relative',
                                      zIndex: 1
                                    }}
                                  >
                                    {formatMacroValue(macros.protein)}g P ·{' '}
                                    {formatMacroValue(macros.fats)}g F ·{' '}
                                    {formatMacroValue(macros.carbs)}g C
                                  </Typography>

                                  {cost !== null && (
                                    <Typography 
                                      variant="body2" 
                                      sx={{ 
                                        width: 70, 
                                        textAlign: 'center',
                                        background: 'var(--meal-chip-bg)',
                                        padding: '6px 10px',
                                        borderRadius: 'var(--radius-sm)',
                                        color: 'var(--text-primary)',
                                        fontWeight: 600,
                                        fontSize: '0.85rem',
                                        border: '1px solid var(--meal-chip-outline)',
                                        position: 'relative',
                                        zIndex: 1
                                      }}
                                    >
                                      {formatCost(cost)}
                                    </Typography>
                                  )}

                                  {onSwapFood && (
                                    <AccentButton
                                      onClick={() => {
                                        if (onSwapFoodForTimeslot && timeslotId) {
                                          onSwapFoodForTimeslot(timeslotId, idx);
                                        } else {
                                          onSwapFood(idx);
                                        }
                                      }}
                                      size="small"
                                      variant="secondary"
                                      style={{ minWidth: '60px', fontSize: '0.75rem' }}
                                    >
                                      Swap
                                    </AccentButton>
                                  )}

                                  <AccentButton
                                    onClick={() => {
                                      if (onRemoveFoodForTimeslot && timeslotId) {
                                        onRemoveFoodForTimeslot(timeslotId, idx);
                                      } else {
                                        onRemoveFood(idx);
                                      }
                                    }}
                                    size="small"
                                    variant="danger"
                                    style={{ minWidth: '60px', fontSize: '0.75rem' }}
                                  >
                                    Remove
                                  </AccentButton>
                                </Stack>
                              </Box>
                            );
                          })}
                        </Box>
                      );
                    })}
                  </Box>
                ) : (
                  <Box sx={{ 
                    textAlign: 'center', 
                    py: 4,
                    color: 'var(--text-secondary)'
                  }}>
                    <Typography variant="body1" sx={{ mb: 1 }}>
                      No foods selected yet
                    </Typography>
                    <Typography variant="body2">
                      Switch to "Available Foods" view to add foods to your meal plan
                    </Typography>
                  </Box>
                )}
              </>
            )}
          </Box>
        }
      />
    </Box>
  );
};

export default FoodSelectorWithFirebase;
