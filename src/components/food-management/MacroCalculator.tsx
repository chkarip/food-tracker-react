import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Alert,
  Divider,
  InputAdornment,
  Checkbox,
  FormControlLabel
} from '@mui/material';
import { Calculate as CalculateIcon } from '@mui/icons-material';
import { UserProfileFormData, CalculatedMacros, GoalType } from '../../types/food';
import { saveUserProfile, getUserProfile } from '../../services/firebase/nutrition/userProfileService';
import { useAuth } from '../../contexts/AuthContext';
import { CustomSelect, SelectOption } from '../shared/inputs';
import { GenericCard } from '../shared/cards/GenericCard';
import AccentButton from '../shared/AccentButton';

interface MacroCalculatorProps {
  onCalculatedMacros: (macros: CalculatedMacros) => void;
}

const MacroCalculator: React.FC<MacroCalculatorProps> = ({ onCalculatedMacros }) => {
  const { user } = useAuth();

  const [profile, setProfile] = useState<UserProfileFormData | null>(null);
  const [loading, setLoading] = useState(true);

  // ✅ Goal options for the dropdown
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

  // ✅ Single goalAdjustments declaration using Partial<Record>
  const goalAdjustments: Partial<Record<GoalType, number>> = {
    // Range-based goals (new format)
    lose_20_25: 0.775,
    lose_15_20: 0.825,
    lose_10_15: 0.875,
    lose_5_10: 0.925,
    lose_3_5: 0.96,
    lose_2_3: 0.975,
    maintain: 1.0,
    gain_2_3: 1.025,
    gain_3_5: 1.04,
    gain_5_10: 1.075,
    gain_10_15: 1.125,
    gain_15_20: 1.175,
    gain_20_25: 1.225,
    
    // Legacy support
    lose_weight: 0.85,
    gain_muscle: 1.15,
    lose_aggressive: 0.75,
    lose_moderate: 0.80,
    lose_gradual: 0.85,
    lose_conservative: 0.90,
    lose_mild: 0.95,
    gain_mild: 1.05,
    gain_conservative: 1.10,
    gain_gradual: 1.15,
    gain_moderate: 1.20,
    gain_aggressive: 1.25
  };

  // Load user profile on mount
  useEffect(() => {
    const loadProfile = async () => {
      if (!user?.uid) {
        setLoading(false);
        return;
      }

      try {
        const userProfile = await getUserProfile(user.uid);
        if (userProfile) {
          setProfile(userProfile);
        }
      } catch (error) {
        // Failed to load user profile
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [user?.uid]);

  // ✅ Single calculation function (no duplicates)
  const calculateMacros = (userProfile: UserProfileFormData): CalculatedMacros => {
    const { gender, age, height, weight, activityLevel, goal, bodyFatPercentage } = userProfile;

    // BMR calculation
    let bmr: number;

    if (bodyFatPercentage && bodyFatPercentage > 0) {
      // Katch-McArdle formula for known body fat
      const leanBodyMass = weight * (1 - bodyFatPercentage / 100);
      bmr = 370 + 21.6 * leanBodyMass;
    } else {
      // Fallback to Mifflin-St Jeor
      bmr = gender === 'male'
        ? (10 * weight) + (6.25 * height) - (5 * age) + 5
        : (10 * weight) + (6.25 * height) - (5 * age) - 161;
    }

    // Activity multipliers
    const activityMultipliers: Record<string, number> = {
      sedentary: 1.2,
      light: 1.375,
      moderate: 1.55,
      active: 1.725,
      very_active: 1.9
    };

    const tdee = bmr * activityMultipliers[activityLevel];
    
    // ✅ Safe access with fallback
    const adjustedCalories = Math.round(tdee * (goalAdjustments[goal] ?? 1.0));

    // Smart macro distribution based on goal
    let proteinPercent: number, carbPercent: number, fatPercent: number;

    if (goal.startsWith('lose_') || goal === 'lose_weight') {
      // Weight loss goals - higher protein to preserve muscle
      const isAggressive = goal.includes('15_20') || goal.includes('20_25') || goal === 'lose_aggressive';
      const isModerate = goal.includes('10_15') || goal === 'lose_moderate';
      
      if (isAggressive) {
        proteinPercent = 0.35; carbPercent = 0.35; fatPercent = 0.30;
      } else if (isModerate) {
        proteinPercent = 0.30; carbPercent = 0.40; fatPercent = 0.30;
      } else {
        proteinPercent = 0.25; carbPercent = 0.45; fatPercent = 0.30;
      }
    } else if (goal.startsWith('gain_') || goal === 'gain_muscle') {
      // Weight gain goals - higher carbs for energy
      proteinPercent = 0.25; carbPercent = 0.50; fatPercent = 0.25;
    } else {
      // Maintenance - balanced
      proteinPercent = 0.25; carbPercent = 0.45; fatPercent = 0.30;
    }

    const protein = Math.round((adjustedCalories * proteinPercent) / 4);
    const carbs = Math.round((adjustedCalories * carbPercent) / 4);
    const fats = Math.round((adjustedCalories * fatPercent) / 9);

    return {
      bmr: Math.round(bmr),
      tdee: Math.round(tdee),
      adjustedCalories,
      protein,
      carbs,
      fats,
      calories: adjustedCalories
    };
  };

  // Calculate macros whenever profile changes
  const calculatedMacros = useMemo(() => {
    if (profile && profile.age > 0 && profile.height > 0 && profile.weight > 0) {
      return calculateMacros(profile);
    }
    return null;
  }, [profile]);

  // Update parent component when macros change
  useEffect(() => {
    if (calculatedMacros) {
      onCalculatedMacros(calculatedMacros);
    }
  }, [calculatedMacros, onCalculatedMacros]);

  const handleInputChange = (field: keyof UserProfileFormData, value: string | number | undefined) => {
    if (!profile) return;
    setProfile(prev => ({
      ...prev!,
      [field]: value === undefined ? undefined : (typeof value === 'string' ? value : Number(value))
    }));
  };

  const handleSaveProfile = async () => {
    if (!user?.uid || !profile) return;

    try {
      const profileToSave = {
        ...profile,
        bodyFatPercentage: profile.bodyFatPercentage
      };
      await saveUserProfile(user.uid, profileToSave);
    } catch (error) {
      // Failed to save user profile
    }
  };

  // Helper to get goal range description
  const getGoalRangeDescription = (goalValue: GoalType): string => {
    const adjustment = goalAdjustments[goalValue] ?? 1.0;
    const percentage = Math.abs(Math.round((adjustment - 1) * 100));
    
    if (goalValue === 'maintain') {
      return 'Maintaining current weight';
    } else if (goalValue.startsWith('lose_')) {
      const range = goalValue.replace('lose_', '').replace('_', '-');
      return `${range}% deficit (using ${percentage}% mid-point)`;
    } else {
      const range = goalValue.replace('gain_', '').replace('_', '-');
      return `${range}% surplus (using ${percentage}% mid-point)`;
    }
  };

  if (loading) {
    return <Typography>Loading calculator...</Typography>;
  }

  if (!profile) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="h6" sx={{ color: 'var(--text-secondary)', mb: 2 }}>
          No Profile Data Available
        </Typography>
        <Typography variant="body2" sx={{ color: 'var(--text-secondary)' }}>
          Please set up your profile information first to calculate personalized macro targets.
        </Typography>
      </Box>
    );
  }

  return (
    <Box 
      sx={{ 
        display: 'flex', 
        gap: 3, 
        height: '100%', 
        p: 1.5,
        background: 'linear-gradient(135deg, var(--meal-bg-card) 0%, rgba(255,255,255,0.5) 100%)',
        borderRadius: 3,
        minHeight: 'calc(100vh - 200px)'
      }}
    >
      {/* ========== LEFT COLUMN: Calculator Info ========== */}
      <Box 
        sx={{ 
          flexBasis: { xs: '100%', md: '60%' },
          minWidth: 0
        }}
      >
        {/* Header */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" sx={{ 
            mb: 1.5, 
            color: 'var(--text-primary)', 
            fontWeight: 600,
            opacity: 0.94,
            position: 'relative',
            '&::before': {
              content: '""',
              position: 'absolute',
              left: 0,
              top: 0,
              bottom: 0,
              width: '3px',
              backgroundColor: 'var(--accent-blue)',
              borderRadius: '2px'
            },
            paddingLeft: '12px'
          }}>
            Macro Calculator
          </Typography>
          <Typography variant="body2" sx={{ 
            color: 'var(--text-secondary)',
            pl: '12px'
          }}>
            Your personalized macro targets based on your profile information
          </Typography>
        </Box>

        {/* Profile Summary */}
        <GenericCard
          variant="default"
          title="Profile Summary"
          content={
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' }, gap: 2 }}>
                <Box sx={{ 
                  backgroundColor: 'var(--meal-row-bg)',
                  borderRadius: 2,
                  p: 2,
                  border: '1px solid var(--border-color)'
                }}>
                  <Typography variant="body2" sx={{ color: 'var(--text-secondary)' }}>Gender</Typography>
                  <Typography variant="body1" sx={{ color: 'var(--text-primary)', fontWeight: 600 }}>
                    {profile.gender.charAt(0).toUpperCase() + profile.gender.slice(1)}
                  </Typography>
                </Box>
                
                <Box sx={{ 
                  backgroundColor: 'var(--meal-row-bg)',
                  borderRadius: 2,
                  p: 2,
                  border: '1px solid var(--border-color)'
                }}>
                  <Typography variant="body2" sx={{ color: 'var(--text-secondary)' }}>Age</Typography>
                  <Typography variant="body1" sx={{ color: 'var(--text-primary)', fontWeight: 600 }}>
                    {profile.age} years
                  </Typography>
                </Box>
              </Box>

              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' }, gap: 2 }}>
                <Box sx={{ 
                  backgroundColor: 'var(--meal-row-bg)',
                  borderRadius: 2,
                  p: 2,
                  border: '1px solid var(--border-color)'
                }}>
                  <Typography variant="body2" sx={{ color: 'var(--text-secondary)' }}>Height</Typography>
                  <Typography variant="body1" sx={{ color: 'var(--text-primary)', fontWeight: 600 }}>
                    {profile.height} cm
                  </Typography>
                </Box>
                
                <Box sx={{ 
                  backgroundColor: 'var(--meal-row-bg)',
                  borderRadius: 2,
                  p: 2,
                  border: '1px solid var(--border-color)'
                }}>
                  <Typography variant="body2" sx={{ color: 'var(--text-secondary)' }}>Weight</Typography>
                  <Typography variant="body1" sx={{ color: 'var(--text-primary)', fontWeight: 600 }}>
                    {profile.weight} kg
                  </Typography>
                </Box>
              </Box>

              <Box sx={{ 
                backgroundColor: 'var(--meal-row-bg)',
                borderRadius: 2,
                p: 2,
                border: '1px solid var(--border-color)'
              }}>
                <Typography variant="body2" sx={{ color: 'var(--text-secondary)' }}>Activity Level</Typography>
                <Typography variant="body1" sx={{ color: 'var(--text-primary)', fontWeight: 600 }}>
                  {profile.activityLevel.charAt(0).toUpperCase() + profile.activityLevel.slice(1).replace('_', ' ')}
                </Typography>
              </Box>

              <Box sx={{ 
                backgroundColor: 'var(--meal-row-bg)',
                borderRadius: 2,
                p: 2,
                border: '1px solid var(--border-color)'
              }}>
                <Typography variant="body2" sx={{ color: 'var(--text-secondary)' }}>Goal</Typography>
                <Typography variant="body1" sx={{ color: 'var(--text-primary)', fontWeight: 600 }}>
                  {goalOptions.find(option => option.value === profile.goal)?.label || profile.goal}
                </Typography>
              </Box>

              {profile.bodyFatPercentage && (
                <Box sx={{ 
                  backgroundColor: 'var(--meal-row-bg)',
                  borderRadius: 2,
                  p: 2,
                  border: '1px solid var(--border-color)'
                }}>
                  <Typography variant="body2" sx={{ color: 'var(--text-secondary)' }}>Body Fat</Typography>
                  <Typography variant="body1" sx={{ color: 'var(--text-primary)', fontWeight: 600 }}>
                    {profile.bodyFatPercentage}%
                  </Typography>
                </Box>
              )}
            </Box>
          }
        />
      </Box>

      {/* ========== RIGHT COLUMN: Results & Tips ========== */}
      <Box 
        sx={{ 
          flexBasis: { xs: '100%', md: '40%' },
          position: { md: 'sticky' },
          top: { md: 16 },
          alignSelf: { md: 'flex-start' },
          height: { md: 'fit-content' }
        }}
      >
        {/* Calculated Results */}
        {calculatedMacros && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle1" sx={{ 
              mb: 2, 
              color: 'var(--text-primary)', 
              fontWeight: 600,
              position: 'relative',
              '&::before': {
                content: '""',
                position: 'absolute',
                left: 0,
                top: 0,
                bottom: 0,
                width: '2px',
                backgroundColor: 'var(--accent-green)',
                borderRadius: '1px'
              },
              paddingLeft: '10px'
            }}>
              Your Macro Targets
            </Typography>
            
            <Box sx={{ 
              backgroundColor: 'var(--surface-bg)',
              borderRadius: 2,
              border: '1px solid var(--border-color)',
              p: 2
            }}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {/* Main Targets */}
                <Box sx={{ 
                  backgroundColor: 'var(--meal-row-bg)',
                  borderRadius: 2,
                  p: 2,
                  border: '1px solid var(--border-color)'
                }}>
                  <Typography variant="h6" sx={{ color: 'var(--accent-green)', fontWeight: 700, mb: 1 }}>
                    Daily Calories: {calculatedMacros.calories} kcal
                  </Typography>
                  
                  <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1 }}>
                    <Typography variant="body2" sx={{ color: 'var(--text-secondary)' }}>
                      Protein: <strong style={{ color: 'var(--text-primary)' }}>{calculatedMacros.protein}g</strong>
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'var(--text-secondary)' }}>
                      Carbs: <strong style={{ color: 'var(--text-primary)' }}>{calculatedMacros.carbs}g</strong>
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'var(--text-secondary)' }}>
                      Fats: <strong style={{ color: 'var(--text-primary)' }}>{calculatedMacros.fats}g</strong>
                    </Typography>
                  </Box>
                </Box>

                {/* BMR & TDEE */}
                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1 }}>
                  <Box sx={{ 
                    backgroundColor: 'var(--meal-row-bg)',
                    borderRadius: 2,
                    p: 2,
                    border: '1px solid var(--border-color)',
                    textAlign: 'center'
                  }}>
                    <Typography variant="h6" sx={{ color: 'var(--text-primary)', fontWeight: 700 }}>
                      {calculatedMacros.bmr}
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'var(--text-secondary)' }}>
                      BMR (kcal)
                    </Typography>
                  </Box>
                  
                  <Box sx={{ 
                    backgroundColor: 'var(--meal-row-bg)',
                    borderRadius: 2,
                    p: 2,
                    border: '1px solid var(--border-color)',
                    textAlign: 'center'
                  }}>
                    <Typography variant="h6" sx={{ color: 'var(--text-primary)', fontWeight: 700 }}>
                      {calculatedMacros.tdee}
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'var(--text-secondary)' }}>
                      TDEE (kcal)
                    </Typography>
                  </Box>
                </Box>

                {/* Goal Description */}
                <Typography variant="body2" sx={{ 
                  color: 'var(--text-secondary)', 
                  fontStyle: 'italic',
                  textAlign: 'center',
                  backgroundColor: 'var(--meal-row-bg)',
                  borderRadius: 2,
                  p: 1.5,
                  border: '1px solid var(--border-color)'
                }}>
                  {getGoalRangeDescription(profile.goal)}
                </Typography>
              </Box>
            </Box>
          </Box>
        )}

        {/* Calculator Tips */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle1" sx={{ 
            mb: 2, 
            color: 'var(--text-primary)', 
            fontWeight: 600,
            position: 'relative',
            '&::before': {
              content: '""',
              position: 'absolute',
              left: 0,
              top: 0,
              bottom: 0,
              width: '2px',
              backgroundColor: 'var(--accent-purple)',
              borderRadius: '1px'
            },
            paddingLeft: '10px'
          }}>
            Calculator Tips
          </Typography>
          
          <Box sx={{ 
            backgroundColor: 'var(--surface-bg)',
            borderRadius: 2,
            border: '1px solid var(--border-color)',
            p: 2
          }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                <Typography variant="body2" sx={{ color: 'var(--accent-green)', fontWeight: 600, minWidth: '20px' }}>
                  💡
                </Typography>
                <Typography variant="body2" sx={{ color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                  For best accuracy, include your body fat percentage if known
                </Typography>
              </Box>
              
              <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                <Typography variant="body2" sx={{ color: 'var(--accent-blue)', fontWeight: 600, minWidth: '20px' }}>
                  📊
                </Typography>
                <Typography variant="body2" sx={{ color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                  Activity level affects your Total Daily Energy Expenditure (TDEE)
                </Typography>
              </Box>
              
              <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                <Typography variant="body2" sx={{ color: 'var(--warning-color)', fontWeight: 600, minWidth: '20px' }}>
                  ⚖️
                </Typography>
                <Typography variant="body2" sx={{ color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                  Weight loss goals use calorie deficits, gain goals use surpluses
                </Typography>
              </Box>
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default MacroCalculator;
