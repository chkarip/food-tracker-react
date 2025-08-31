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
import { useFoodDatabase } from '../../contexts/FoodContext';
import groupFoodsByCategory from '../../utils/groupFoodsByCategory';
import { calculateMacros, formatMacroValue } from '../../utils/nutritionCalculations';
import { calculatePortionCost, formatCost } from '../../services/firebase/nutrition/foodService';
import { SelectedFood } from '../../types/nutrition';
import ExternalNutritionInput from './ExternalNutritionInput';
import { ViewToggle } from '../shared';
import { scrollIntoViewSafe } from '../../utils/scrollIntoViewSafe';

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
  // External nutrition props
  externalNutrition?: { protein: number; fats: number; carbs: number; calories: number };
  onUpdateExternalNutrition?: (nutrition: { protein: number; fats: number; carbs: number; calories: number }) => void;
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
  // External nutrition props
  externalNutrition,
  onUpdateExternalNutrition,
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
  const pendingScrollRef = useRef<string | null>(null);

  // Ref for smooth scrolling after cancel
  const headerRef = useRef<HTMLDivElement>(null);

  // Ref for the scrollable container
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);

  // Ref for the true scrolling list container (diagnostic)
  const listContainerRef = useRef<HTMLDivElement | null>(null);



  // Dynamic ref to find the actual scrollable element (simplified for window-only scrolling)
  const findScrollableContainer = useCallback((): HTMLElement | null => {
    // Always return null since we use window scrolling on this page
    return null;
  }, []);

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
    if (!selectedFoodName || !groupedAvailable) return;
    const isFavorite = !!foodDatabase[selectedFoodName]?.metadata?.favorite;
    if (isFavorite) return; // do not jump when selection came from Favorites

    const category = Object.entries(groupedAvailable).find(([cat, foods]) =>
      foods.some(f => f.name === selectedFoodName)
    )?.[0];
    if (category && expandedCategory !== category) {
      setExpandedCategory(category);
    }
  }, [selectedFoodName, groupedAvailable, expandedCategory, foodDatabase]);

  // Handle selection from favorite foods
  useEffect(() => {
    if (selectedFromFavorite && selectedFromFavorite !== selectedFoodName) {
      handleFoodSelect(selectedFromFavorite);
    }
  }, [selectedFromFavorite]);

  // Handle scrolling after category expansion
  useEffect(() => {
    if (!expandedCategory || !pendingScrollRef.current) return;
    if (pendingScrollRef.current !== expandedCategory) return;

    console.log('[FSWF] expandedCategory', expandedCategory, 'pending', pendingScrollRef.current);

    // Use double requestAnimationFrame to ensure layout is committed
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const el = categoryRefs.current[expandedCategory];
        console.log('[FSWF] headerEl', el?.tagName, el?.className);
        if (el) {
          console.log('[FSWF] invoked SIV', expandedCategory);
          scrollIntoViewSafe(el, {
            behavior: 'smooth',
            topOffset: 72,
            forceWindow: true // Always use window scrolling on this page
          });
        }

        // Improved nudge delay with minimum smooth timing
        setTimeout(() => {
          const el2 = categoryRefs.current[expandedCategory];
          if (el2) {
            console.log('[FSWF] nudge scroll for category expansion');
            scrollIntoViewSafe(el2, {
              behavior: 'auto', // Use auto for nudge to avoid double animation
              topOffset: 72,
              forceWindow: true // Always use window scrolling on this page
            });
          }
          pendingScrollRef.current = null;
        }, 350); // Slightly longer delay for smooth feel
      });
    });
  }, [expandedCategory]);

  // Handle scrolling to inline controls when food is selected
  useEffect(() => {
    if (!selectedFoodName) return;

    console.log('[FSWF] selectedFoodName changed to', selectedFoodName);

    // Use double requestAnimationFrame to ensure controls are rendered
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const controlsEl = document.querySelector(`[data-food-controls="${selectedFoodName}"]`) as HTMLElement;
        console.log('[FSWF] controlsEl for', selectedFoodName, controlsEl?.tagName, controlsEl?.className);
        if (controlsEl) {
          // Check if controls are already visible before scrolling
          const rect = controlsEl.getBoundingClientRect();
          const isVisible = rect.top >= 72 && rect.bottom <= window.innerHeight - 20; // 72px top offset + 20px bottom margin

          console.log('[FSWF] controls visibility check:', {
            top: rect.top,
            bottom: rect.bottom,
            windowHeight: window.innerHeight,
            isVisible,
            willScroll: !isVisible
          });

          if (!isVisible) {
            console.log('[FSWF] scrolling to inline controls for', selectedFoodName);
            scrollIntoViewSafe(controlsEl, {
              behavior: 'smooth',
              topOffset: 72,
              forceWindow: true // Always use window scrolling on this page
            });
          } else {
            console.log('[FSWF] controls already visible, skipping scroll');
          }
        }
      });
    });
  }, [selectedFoodName]);

  // One-time keyboard tracer to identify the real scroller
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'K') return;
      const pt = document.elementFromPoint(window.innerWidth * 0.25, window.innerHeight * 0.7) as HTMLElement;
      let node: HTMLElement | null = pt;
      console.log('[TRACE] start from', pt?.tagName, pt?.className);
      while (node) {
        const cs = getComputedStyle(node);
        const info = {
          tag: node.tagName,
          class: node.className,
          oy: cs.overflowY,
          scrollTop: node.scrollTop,
          clientHeight: node.clientHeight,
          scrollHeight: node.scrollHeight,
        };
        console.log('[TRACE] node', info);
        node = node.parentElement;
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

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

  // Handle scrolling when switching to selected foods view
  useEffect(() => {
    if (viewMode !== 'selected' || totalSelectedFoods === 0) return;

    console.log('[FSWF] viewMode changed to selected, totalSelectedFoods:', totalSelectedFoods);

    // Use double requestAnimationFrame to ensure the view is rendered
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const selectedContainer = document.querySelector('[data-selected-foods-container]') as HTMLElement;
        console.log('[FSWF] selectedContainer found:', selectedContainer?.tagName, selectedContainer?.className);
        if (selectedContainer) {
          // Check if container is already visible before scrolling
          const rect = selectedContainer.getBoundingClientRect();
          const isVisible = rect.top >= 72 && rect.bottom <= window.innerHeight - 20;

          console.log('[FSWF] selected container visibility check:', {
            top: rect.top,
            bottom: rect.bottom,
            windowHeight: window.innerHeight,
            isVisible,
            willScroll: !isVisible
          });

          if (!isVisible) {
            console.log('[FSWF] scrolling to selected foods container');
            scrollIntoViewSafe(selectedContainer, {
              behavior: 'smooth',
              topOffset: 72,
              forceWindow: true // Always use window scrolling on this page
            });
          } else {
            console.log('[FSWF] selected container already visible, skipping scroll');
          }
        }
      });
    });
  }, [viewMode, totalSelectedFoods]);

  const handleFoodSelect = useCallback(
    (n: string, source: 'favorites' | 'category' = 'category') => {
      setSelectedFoodName(n);
      const amt = getDefaultAmount(n);
      setAmount(amt);
      onFoodPreview?.(n, amt);
      onFoodSelect?.(n);

      if (source === 'favorites') {
        setExpandedCategory('favorites'); // stay in Favorites
        // Scroll will be handled by the useEffect above
      } else {
        const category = Object.entries(groupedAvailable).find(([cat, foods]) =>
          foods.some(f => f.name === n)
        )?.[0];
        if (category) setExpandedCategory(category);
      }

      // Mobile: do not auto-collapse favorites
      if (window.innerWidth < 768 && source !== 'favorites') {
        // keep current behavior or no-op; do not force switch away from favorites
        // Example no-op: setExpandedCategory(prev => prev);
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
    if (expandedCategory) {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          const el = categoryRefs.current[expandedCategory];
          if (el) {
            const scrollableContainer = findScrollableContainer();
            console.log('[FSWF] cancel scroll to', expandedCategory, 'container:', {
              tag: scrollableContainer?.tagName,
              class: scrollableContainer?.className,
              canScroll: scrollableContainer ? scrollableContainer.scrollHeight > scrollableContainer.clientHeight : false
            });
            scrollIntoViewSafe(el, {
              behavior: 'smooth',
              topOffset: 72,
              forceWindow: true // Always use window scrolling on this page
            });
          }
        });
      });
    }
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
    console.log('[FSWF] request scroll for category', category);
    setExpandedCategory(prev => {
      const next = prev === category ? null : category;

      // Set pending scroll for the category being expanded
      if (next) {
        pendingScrollRef.current = category;
      }

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
    <Box 
      sx={{ position: 'relative' }}
      data-component="food-selector"
    >
      {/* View Toggle - Custom Component */}
      <Box
        sx={{
          position: 'absolute',
          top: 16,
          right: 16,
          zIndex: 20,
        }}
      >
        <ViewToggle
          activeView={viewMode}
          onViewChange={setViewMode}
          size="medium"
        />
      </Box>

      <GenericCard
        variant="default"
        title={viewMode === 'available' ? `Browse & Add Foods` : `Manage Selected Foods (${totalSelectedFoods})`}
        content={
          <Box ref={scrollContainerRef} sx={{ position: 'relative' }}>
            {/* Main Content */}
            {viewMode === 'available' ? (
              <Box
                ref={listContainerRef}
                sx={{
                  overscrollBehavior: 'contain',
                  WebkitOverflowScrolling: 'touch',
                }}
              >
                {/* Favorites Category - Always show at the top */}
                {(() => {
                  const favoriteFoods = Object.keys(foodDatabase).filter(
                    name => foodDatabase[name]?.metadata?.favorite === true
                  );
                  
                  return (
                    <CollapsiblePanel
                      key="favorites"
                      title="Favorite Foods"
                      variant="primary"
                      size="compact"
                      expanded={expandedCategory === 'favorites'}
                      onToggle={() => handleCategoryToggle('favorites')}
                      headerRef={(el) => { if (el) categoryRefs.current['favorites'] = el; }}
                      sx={{
                        mb: 2,
                        borderColor: 'var(--accent-green)',
                        '& .CollapsiblePanel-header': {
                          backgroundColor: 'var(--meal-bg-primary)',
                        }
                      }}
                    >
                      <Box sx={{ mt: 1 }}>
                        {favoriteFoods.length > 0 ? (
                          <Stack direction="row" flexWrap="wrap" gap={1.5}>
                            {favoriteFoods.map((foodName) => {
                              const isSel = selectedFoods.some((f) => f.name === foodName);
                              
                              return (
                                <Box key={foodName} sx={{ position: 'relative' }}>
                                  <Chip
                                    label={foodName}
                                    onClick={() => handleFoodSelect(foodName, 'favorites')}
                                    variant={
                                      selectedFoodName === foodName || isSel ? 'filled' : 'outlined'
                                    }
                                    sx={{
                                      backgroundColor: selectedFoodName === foodName 
                                        ? 'var(--accent-green)' 
                                        : isSel 
                                          ? 'var(--meal-chip-bg)' 
                                          : 'var(--surface-bg)',
                                      color: selectedFoodName === foodName 
                                        ? 'white' 
                                        : isSel 
                                          ? 'var(--accent-green)' 
                                          : 'var(--text-primary)',
                                      border: `1px solid ${selectedFoodName === foodName ? 'var(--accent-green)' : 'var(--border-color)'}`,
                                      fontWeight: selectedFoodName === foodName || isSel ? 600 : 500,
                                      fontSize: '0.85rem',
                                      padding: '8px 12px',
                                      transition: 'all 0.3s ease',
                                      cursor: 'pointer',
                                      '&:hover': {
                                        transform: 'translateY(-2px)',
                                        boxShadow: 'var(--elevation-1)',
                                        backgroundColor: selectedFoodName === foodName 
                                          ? 'var(--accent-green)' 
                                          : 'var(--meal-chip-bg)',
                                        borderColor: 'var(--accent-green)'
                                      }
                                    }}
                                  />
                                </Box>
                              );
                            })}
                          </Stack>
                        ) : (
                          <Box sx={{ 
                            textAlign: 'center', 
                            py: 3,
                            color: 'var(--text-secondary)',
                            backgroundColor: 'var(--meal-row-bg)',
                            borderRadius: '8px',
                            border: '1px solid var(--border-color)'
                          }}>
                            <Typography variant="body2" sx={{ mb: 1 }}>
                              No favorite foods yet
                            </Typography>
                            <Typography variant="caption" sx={{ fontSize: '0.75rem' }}>
                              Mark foods as favorites in the food management section
                            </Typography>
                          </Box>
                        )}
                        
                        {/* Inline Amount Controls for Favorites */}
                        {selectedFoodName && favoriteFoods.includes(selectedFoodName) && (
                          <Box 
                            key={`controls-${selectedFoodName}`}
                            data-food-controls={selectedFoodName}
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
                })()}

                {/* ---------- grouped chip picker ---------- */}
                {Object.entries(groupedAvailable).map(([cat, foods]) => {
                  const isTargetCategory = isSwapping && targetCategory === cat;
                  
                  return (
                    <CollapsiblePanel
                      key={cat} // Static key based only on category
                      title={`${cat} Foods`}
                      variant="primary"
                      size="compact"
                      expanded={expandedCategory === cat || (isTargetCategory && !expandedCategory)}
                      onToggle={() => handleCategoryToggle(cat)}
                      headerRef={(el) => { if (el) categoryRefs.current[cat] = el; }}
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
                                  onClick={() => handleFoodSelect(name, 'category')}
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
                            data-food-controls={selectedFoodName}
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

                {/* External Nutrition Input - REMOVED: This is now handled separately in the main layout */}
              </Box>
            ) : (
              <>
                {/* ---------- selected foods list ---------- */}
                {totalSelectedFoods > 0 ? (
                  <Box 
                    data-selected-foods-container
                    sx={{
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
                      // Removed hover boxShadow to prevent flash
                    }}
                  >
                    {Object.entries(groupedSelectedFoods).map(([timeslotId, foods]) => {
                      if (foods.length === 0) return null;
                      
                      return (
                        <Box key={timeslotId} sx={{ mb: 1, p: 1.5 }}>
                          {/* Timeslot header */}
                          <Typography
                            variant="subtitle1"
                            sx={{
                              mb: 0.5,
                              color: 'var(--text-secondary)',
                              fontWeight: 600,
                              fontSize: '0.85rem',
                              textAlign: 'center',
                              position: 'relative',
                              '&::before': {
                                content: '""',
                                position: 'absolute',
                                left: '50%',
                                transform: 'translateX(-50%)',
                                bottom: -1,
                                width: '25px',
                                height: '1px',
                                backgroundColor: timeslotId === '6pm' ? 'var(--timeslot-afternoon)' : 'var(--timeslot-evening)',
                                borderRadius: '0.5px'
                              },
                              paddingBottom: '2px'
                            }}
                          >
                            {timeslotId === '6pm' ? '6:00 PM' : '9:30 PM'} 
                            <Box
                              component="span"
                              sx={{
                                display: 'inline-block',
                                ml: 0.5,
                                px: 0.5,
                                py: 0.1,
                                backgroundColor: timeslotId === '6pm' ? 'var(--timeslot-afternoon)' : 'var(--timeslot-evening)',
                                color: 'white',
                                borderRadius: '2px',
                                fontSize: '0.55rem',
                                fontWeight: 600,
                                textTransform: 'uppercase',
                                letterSpacing: '0.2px'
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
                                  isolation: 'isolate',
                                  background: 'var(--meal-row-bg)',
                                  border: '1px solid var(--border-color)',
                                  borderRadius: '8px',
                                  boxShadow: 'var(--elevation-1)',
                                  p: 1.5,
                                  mb: 0.5,
                                  zIndex: 2,
                                  // Removed hover effects to prevent flash
                                }}
                              >
                                <Stack
                                  direction="row"
                                  alignItems="center"
                                  justifyContent="space-between"
                                  spacing={1.5}
                                >
                                  <Typography 
                                    sx={{ 
                                      flex: 1,
                                      fontWeight: 600,
                                      color: 'var(--text-primary)',
                                      fontSize: '0.9rem',
                                      overflow: 'hidden',
                                      textOverflow: 'ellipsis',
                                      whiteSpace: 'nowrap',
                                      minWidth: 0, // Allows flex shrinking
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
                                      width: 110, 
                                      textAlign: 'center',
                                      background: 'var(--meal-chip-bg)',
                                      padding: '4px 8px',
                                      borderRadius: 'var(--radius-sm)',
                                      color: 'var(--text-primary)',
                                      fontWeight: 600,
                                      fontSize: '0.75rem',
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
                                        width: 60, 
                                        textAlign: 'center',
                                        background: 'var(--meal-chip-bg)',
                                        padding: '4px 6px',
                                        borderRadius: 'var(--radius-sm)',
                                        color: 'var(--text-primary)',
                                        fontWeight: 600,
                                        fontSize: '0.8rem',
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
                                      style={{ minWidth: '50px', fontSize: '0.7rem', padding: '4px 8px' }}
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
                                    style={{ minWidth: '50px', fontSize: '0.7rem', padding: '4px 8px' }}
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
                    py: 2,
                    color: 'var(--text-secondary)'
                  }}>
                    <Typography variant="body1" sx={{ mb: 0.5, fontSize: '0.9rem' }}>
                      No foods selected yet
                    </Typography>
                    <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>
                      Switch to "Available" to browse and add foods to your meal plan
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
