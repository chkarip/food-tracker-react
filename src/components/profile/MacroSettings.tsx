import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Alert,
  Paper,
  Chip,
  Checkbox,
  FormControlLabel,
  TextField,
  InputAdornment
} from '@mui/material';
import MacroCalculator from '../food-management/MacroCalculator';
import { MacroTargets } from '../../types/nutrition';
import { CalculatedMacros } from '../../types/food';
import { 
  getUserMacroTargets, 
  saveUserMacroTargets, 
  DEFAULT_MACRO_TARGETS,
  calculateCaloriesFromMacros,
  validateCalorieInput
} from '../../services/firebase/nutrition/macroTargetService';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import AccentButton from '../shared/AccentButton';
import { NumberStepper } from '../shared/inputs';
import { CustomSelect } from '../shared/inputs';
import { getUserProfile, saveUserProfile } from '../../services/firebase/nutrition/userProfileService';
import { UserProfileFormData, GoalType } from '../../types/food';

interface MacroSettingsProps {
  onSave?: () => void;
}

export const MacroSettings: React.FC<MacroSettingsProps> = ({ onSave }) => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [macros, setMacros] = useState<MacroTargets>(DEFAULT_MACRO_TARGETS);
  const [initialMacros, setInitialMacros] = useState<MacroTargets>(DEFAULT_MACRO_TARGETS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [renderKey, setRenderKey] = useState(0);
  const [showCalculator, setShowCalculator] = useState(false);
  const [calculatorProfile, setCalculatorProfile] = useState<Partial<UserProfileFormData>>({
    activityLevel: 'moderate',
    goal: 'maintain',
    bodyFatPercentage: undefined
  });
  const [includeBodyFat, setIncludeBodyFat] = useState(false);

  // Goal options for the dropdown
  const goalOptions = [
    { value: 'lose_20_25' as GoalType, label: 'Lose 20-25%' },
    { value: 'lose_15_20' as GoalType, label: 'Lose 15-20%' },
    { value: 'lose_10_15' as GoalType, label: 'Lose 10-15%' },
    { value: 'lose_5_10' as GoalType, label: 'Lose 5-10%' },
    { value: 'lose_3_5' as GoalType, label: 'Lose 3-5%' },
    { value: 'lose_2_3' as GoalType, label: 'Lose 2-3%' },
    { value: 'maintain' as GoalType, label: 'Maintain Weight' },
    { value: 'gain_2_3' as GoalType, label: 'Gain 2-3%' },
    { value: 'gain_3_5' as GoalType, label: 'Gain 3-5%' },
    { value: 'gain_5_10' as GoalType, label: 'Gain 5-10%' },
    { value: 'gain_10_15' as GoalType, label: 'Gain 10-15%' },
    { value: 'gain_15_20' as GoalType, label: 'Gain 15-20%' },
    { value: 'gain_20_25' as GoalType, label: 'Gain 20-25%' }
  ];

  // Handle calculated macros from calculator
  const handleCalculatedMacros = (calculatedMacros: any) => {
    setMacros({
      protein: calculatedMacros.protein,
      fats: calculatedMacros.fats,
      carbs: calculatedMacros.carbs,
      calories: calculatedMacros.calories
    });
    // Calculator has produced new values, keep it visible
  };

  // Trigger resize when calculator visibility changes
  useEffect(() => {
    // Update renderKey to force re-render
    setRenderKey(prev => prev + 1);
    
    // Give React time to render the new content
    setTimeout(() => {
      // Dispatch custom event that CollapsiblePanel can listen to
      window.dispatchEvent(new CustomEvent('collapsibleContentChanged'));
      window.dispatchEvent(new Event('resize'));
    }, 10);
    
    // Additional remeasurements for content that loads asynchronously
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('collapsibleContentChanged'));
      window.dispatchEvent(new Event('resize'));
    }, 100);
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('collapsibleContentChanged'));
      window.dispatchEvent(new Event('resize'));
    }, 250);
  }, [showCalculator]);

  // Load user's macro targets on mount
  useEffect(() => {
    const loadMacros = async () => {
      if (!user) return;
      
      try {
        const userMacros = await getUserMacroTargets(user.uid);
        setMacros(userMacros);
        setInitialMacros(userMacros);
      } catch (error) {
        console.error('Error loading macro targets:', error);
        showToast('Failed to load macro targets', 'error');
      } finally {
        setLoading(false);
        // Force parent CollapsiblePanel to recalculate height
        setTimeout(() => {
          setRenderKey(prev => prev + 1);
          // Trigger resize event to force CollapsiblePanel to remeasure
          window.dispatchEvent(new Event('resize'));
        }, 100);
      }
    };

    loadMacros();
  }, [user, showToast]);

  // Load calculator profile on mount
  useEffect(() => {
    const loadCalculatorProfile = async () => {
      if (!user) return;
      
      try {
        const userProfile = await getUserProfile(user.uid);
        if (userProfile) {
          setCalculatorProfile({
            activityLevel: userProfile.activityLevel,
            goal: userProfile.goal,
            bodyFatPercentage: userProfile.bodyFatPercentage
          });
          setIncludeBodyFat(!!userProfile.bodyFatPercentage);
        }
      } catch (error) {
        console.error('Error loading calculator profile:', error);
      }
    };

    loadCalculatorProfile();
  }, [user]);

  const handleCalculatorProfileChange = async (field: keyof UserProfileFormData, value: any) => {
    const updatedProfile = { ...calculatorProfile, [field]: value };
    setCalculatorProfile(updatedProfile);
    
    // Auto-save to profile
    if (user) {
      try {
        const fullProfile = await getUserProfile(user.uid);
        if (fullProfile) {
          await saveUserProfile(user.uid, { ...fullProfile, ...updatedProfile });
        }
      } catch (error) {
        console.error('Error saving calculator profile:', error);
      }
    }
  };

  const handleMacroChange = (field: keyof MacroTargets, value: number) => {
    setMacros(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = async () => {
    if (!user) {
      showToast('Please sign in to save macro targets', 'error');
      return;
    }

    setSaving(true);
    try {
      await saveUserMacroTargets(user.uid, macros);
      showToast('Macro targets saved successfully', 'success');
      setInitialMacros(macros);
      if (onSave) onSave();
    } catch (error) {
      console.error('Error saving macro targets:', error);
      showToast('Failed to save macro targets', 'error');
    } finally {
      setSaving(false);
    }
  };

  const calculatedCalories = calculateCaloriesFromMacros(macros.protein, macros.fats, macros.carbs);
  const calorieValidation = validateCalorieInput(macros.calories, macros.protein, macros.fats, macros.carbs);

  if (loading) {
    return (
      <Box sx={{ p: 2 }}>
        <Typography>Loading macro targets...</Typography>
      </Box>
    );
  }

  return (
    <Box data-render-key={renderKey}>
      <Box sx={{ mb: 3, pb: 2, borderBottom: '1px solid var(--border-color)' }}>
        <Typography variant="h6" sx={{ fontWeight: 600, color: 'var(--text-primary)' }}>
          Macro Targets
        </Typography>
        <Typography variant="body2" sx={{ color: 'var(--text-secondary)', mt: 1 }}>
          Set your daily macro and calorie targets. These will be used in the Food Tracker.
        </Typography>
      </Box>

      <Alert severity="info" sx={{ mb: 3 }}>
        Changes will be reflected in the Food Tracker page after saving.
      </Alert>

      {/* Macro Targets Grid - Moved to Top */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' }, gap: 3, mb: 4 }}>
        {/* Protein */}
        <Box>
          <Paper
            sx={{
              p: 3,
              border: '1px solid var(--border-color)',
              borderRadius: '12px',
              backgroundColor: 'var(--card-bg)',
              '&:hover': {
                borderColor: 'var(--accent-blue)',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
              }
            }}
          >
            <Box sx={{ mb: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                  Protein
                </Typography>
                <Chip 
                  label={`${macros.protein}g`} 
                  size="small" 
                  sx={{ 
                    backgroundColor: 'var(--accent-blue)',
                    color: 'white',
                    fontWeight: 600
                  }}
                />
              </Box>
              <Typography variant="caption" sx={{ color: 'var(--text-secondary)' }}>
                4 cal/g • Muscle building & repair
              </Typography>
            </Box>
            <NumberStepper
              value={macros.protein}
              onChange={(value) => handleMacroChange('protein', value)}
              min={0}
              max={500}
              step={5}
              unit="g"
            />
          </Paper>
        </Box>

        {/* Fats */}
        <Box>
          <Paper
            sx={{
              p: 3,
              border: '1px solid var(--border-color)',
              borderRadius: '12px',
              backgroundColor: 'var(--card-bg)',
              '&:hover': {
                borderColor: 'var(--accent-blue)',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
              }
            }}
          >
            <Box sx={{ mb: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                  Fats
                </Typography>
                <Chip 
                  label={`${macros.fats}g`} 
                  size="small" 
                  sx={{ 
                    backgroundColor: 'var(--accent-orange)',
                    color: 'white',
                    fontWeight: 600
                  }}
                />
              </Box>
              <Typography variant="caption" sx={{ color: 'var(--text-secondary)' }}>
                9 cal/g • Hormone production & energy
              </Typography>
            </Box>
            <NumberStepper
              value={macros.fats}
              onChange={(value) => handleMacroChange('fats', value)}
              min={0}
              max={300}
              step={5}
              unit="g"
            />
          </Paper>
        </Box>

        {/* Carbs */}
        <Box>
          <Paper
            sx={{
              p: 3,
              border: '1px solid var(--border-color)',
              borderRadius: '12px',
              backgroundColor: 'var(--card-bg)',
              '&:hover': {
                borderColor: 'var(--accent-blue)',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
              }
            }}
          >
            <Box sx={{ mb: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                  Carbohydrates
                </Typography>
                <Chip 
                  label={`${macros.carbs}g`} 
                  size="small" 
                  sx={{ 
                    backgroundColor: 'var(--accent-green)',
                    color: 'white',
                    fontWeight: 600
                  }}
                />
              </Box>
              <Typography variant="caption" sx={{ color: 'var(--text-secondary)' }}>
                4 cal/g • Primary energy source
              </Typography>
            </Box>
            <NumberStepper
              value={macros.carbs}
              onChange={(value) => handleMacroChange('carbs', value)}
              min={0}
              max={600}
              step={5}
              unit="g"
            />
          </Paper>
        </Box>

        {/* Calories */}
        <Box>
          <Paper
            sx={{
              p: 3,
              border: '1px solid var(--border-color)',
              borderRadius: '12px',
              backgroundColor: 'var(--card-bg)',
              '&:hover': {
                borderColor: 'var(--accent-blue)',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
              }
            }}
          >
            <Box sx={{ mb: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                  Calories
                </Typography>
                <Chip 
                  label={`${macros.calories} kcal`} 
                  size="small" 
                  sx={{ 
                    backgroundColor: calorieValidation.valid ? 'var(--accent-purple)' : 'var(--accent-red)',
                    color: 'white',
                    fontWeight: 600
                  }}
                />
              </Box>
              <Typography variant="caption" sx={{ color: 'var(--text-secondary)' }}>
                Total daily energy target
              </Typography>
            </Box>
            <NumberStepper
              value={macros.calories}
              onChange={(value) => handleMacroChange('calories', value)}
              min={1000}
              max={5000}
              step={50}
              unit="kcal"
            />
          </Paper>
        </Box>
      </Box>

      {/* Calorie Calculation Info */}
      <Paper
        sx={{
          mt: 3,
          p: 2,
          border: '1px solid var(--border-color)',
          borderRadius: '12px',
          backgroundColor: calorieValidation.valid 
            ? 'rgba(59, 186, 117, 0.05)' 
            : 'rgba(255, 152, 0, 0.05)'
        }}
      >
        <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
          Calorie Calculation
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
          <Typography variant="body2" sx={{ color: 'var(--text-secondary)' }}>
            From macros: <strong>{calculatedCalories} kcal</strong>
          </Typography>
          <Typography variant="body2" sx={{ color: 'var(--text-secondary)' }}>
            Your target: <strong>{macros.calories} kcal</strong>
          </Typography>
          {!calorieValidation.valid && (
            <Chip
              label={`Difference: ${calorieValidation.difference} kcal (>${10}%)`}
              size="small"
              sx={{ backgroundColor: 'var(--accent-orange)', color: 'white' }}
            />
          )}
        </Box>
        <Box sx={{ mt: 2 }}>
          <Typography variant="caption" sx={{ color: 'var(--text-secondary)' }}>
            Breakdown: {macros.protein}g × 4 + {macros.fats}g × 9 + {macros.carbs}g × 4 = {calculatedCalories} kcal
          </Typography>
        </Box>
      </Paper>

      {/* Calculator Toggle */}
      <Box sx={{ mt: 3 }}>
        <FormControlLabel
          control={
            <Checkbox
              checked={showCalculator}
              onChange={(e) => setShowCalculator(e.target.checked)}
              sx={{
                color: 'var(--accent-blue)',
                '&.Mui-checked': {
                  color: 'var(--accent-blue)',
                }
              }}
            />
          }
          label={
            <Typography variant="body2" sx={{ color: 'var(--text-primary)' }}>
              Macro Calculator
            </Typography>
          }
        />
      </Box>

      {/* Calculator Section with Profile Settings */}
      {showCalculator && (
        <Box sx={{ mt: 3, pt: 3, borderTop: '2px solid var(--border-color)' }}>
          {/* Calculator Profile Settings */}
          <Box sx={{ mb: 3, p: 3, backgroundColor: 'var(--meal-row-bg)', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2, color: 'var(--text-primary)' }}>
              Profile Settings for Calculator
            </Typography>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {/* Activity Level */}
              <CustomSelect
                value={calculatorProfile.activityLevel || 'moderate'}
                options={[
                  { value: 'sedentary', label: 'Sedentary (Little/no exercise)' },
                  { value: 'light', label: 'Light (1-3 days/week)' },
                  { value: 'moderate', label: 'Moderate (3-5 days/week)' },
                  { value: 'active', label: 'Active (6-7 days/week)' },
                  { value: 'very_active', label: 'Very Active (2x/day, intense)' }
                ]}
                onChange={(value) => handleCalculatorProfileChange('activityLevel', value)}
                placeholder="Select activity level"
                label="Activity Level"
                size="small"
              />

              {/* Goal Selection */}
              <CustomSelect
                value={calculatorProfile.goal || 'maintain'}
                options={goalOptions}
                onChange={(value) => handleCalculatorProfileChange('goal', value)}
                placeholder="Select your goal"
                label="Goal"
                size="small"
              />

              {/* Body Fat Toggle */}
              <Box sx={{
                backgroundColor: 'var(--surface-bg)',
                borderRadius: 2,
                border: '1px solid var(--border-color)',
                p: 2
              }}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={includeBodyFat}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        setIncludeBodyFat(checked);
                        if (!checked) {
                          handleCalculatorProfileChange('bodyFatPercentage', undefined);
                        }
                      }}
                      sx={{
                        color: 'var(--accent-green)',
                        '&.Mui-checked': {
                          color: 'var(--accent-green)'
                        }
                      }}
                    />
                  }
                  label="Include Body Fat Percentage for More Accurate Calculation"
                />

                {includeBodyFat && (
                  <TextField
                    label="Body Fat %"
                    type="number"
                    size="small"
                    fullWidth
                    value={calculatorProfile.bodyFatPercentage ?? ''}
                    onChange={(e) => {
                      const value = e.target.value;
                      handleCalculatorProfileChange('bodyFatPercentage', value === '' ? undefined : Number(value));
                    }}
                    inputProps={{ min: 0, max: 100, step: 0.1 }}
                    InputProps={{
                      endAdornment: <InputAdornment position="end">%</InputAdornment>
                    }}
                    helperText="Enter if known (0-100%)"
                    sx={{
                      mt: 2,
                      backgroundColor: 'var(--input-bg)',
                      '& .MuiOutlinedInput-root': {
                        '&:hover fieldset': {
                          borderColor: 'var(--accent-blue)'
                        }
                      }
                    }}
                  />
                )}
              </Box>
            </Box>
          </Box>

          {/* Macro Calculator */}
          <MacroCalculator onCalculatedMacros={handleCalculatedMacros} />
          
          {/* Save Button - Only shown when calculator is active */}
          <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
            <AccentButton
              onClick={handleSave}
              variant="primary"
              disabled={saving}
            >
              {saving ? 'Saving...' : 'Save Macro Targets'}
            </AccentButton>
          </Box>
        </Box>
      )}
    </Box>
  );
};
