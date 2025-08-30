import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
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

interface MacroCalculatorProps {
  onCalculatedMacros: (macros: CalculatedMacros) => void;
}

const MacroCalculator: React.FC<MacroCalculatorProps> = ({ onCalculatedMacros }) => {
  const { user } = useAuth();
  
  const [profile, setProfile] = useState<UserProfileFormData>({
    gender: 'male',
    age: 30,
    height: 175,
    weight: 70,
    activityLevel: 'moderate',
    goal: 'maintain',
    bodyFatPercentage: undefined
  });
  const [includeBodyFat, setIncludeBodyFat] = useState(false); // Toggle for showing body fat input
  
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);

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
          setIncludeBodyFat(!!userProfile.bodyFatPercentage); // Set toggle based on saved value
        }
      } catch (error) {
        console.error('Failed to load user profile:', error);
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

    if (includeBodyFat && bodyFatPercentage && bodyFatPercentage > 0) {
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
    if (profile.age > 0 && profile.height > 0 && profile.weight > 0) {
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
    setProfile(prev => ({
      ...prev,
      [field]: value === undefined ? undefined : (typeof value === 'string' ? value : Number(value))
    }));
  };

  const handleSaveProfile = async () => {
    if (!user?.uid) return;

    try {
      // If toggle is off, clear body fat value
      const profileToSave = {
        ...profile,
        bodyFatPercentage: includeBodyFat ? profile.bodyFatPercentage : undefined
      };
      await saveUserProfile(user.uid, profileToSave);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (error) {
      console.error('Failed to save user profile:', error);
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

  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <CalculateIcon sx={{ mr: 1 }} />
          <Typography variant="h6">Macro Calculator</Typography>
        </Box>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {/* Gender Selection */}
          <FormControl size="small">
            <InputLabel>Gender</InputLabel>
            <Select
              value={profile.gender}
              label="Gender"
              onChange={(e) => handleInputChange('gender', e.target.value)}
            >
              <MenuItem value="male">Male</MenuItem>
              <MenuItem value="female">Female</MenuItem>
            </Select>
          </FormControl>

          {/* Age Input */}
          <TextField
            label="Age (years)"
            type="number"
            size="small"
            value={profile.age}
            onChange={(e) => handleInputChange('age', e.target.value)}
            inputProps={{ min: 10, max: 100 }}
          />

          {/* Height Input */}
          <TextField
            label="Height (cm)"
            type="number"
            size="small"
            value={profile.height}
            onChange={(e) => handleInputChange('height', e.target.value)}
            inputProps={{ min: 100, max: 250 }}
          />

          {/* Weight Input */}
          <TextField
            label="Weight (kg)"
            type="number"
            size="small"
            value={profile.weight}
            onChange={(e) => handleInputChange('weight', e.target.value)}
            inputProps={{ min: 30, max: 200 }}
          />

          {/* Toggle to add body fat percentage */}
          <FormControlLabel
            control={
              <Checkbox
                checked={includeBodyFat}
                onChange={(e) => {
                  const checked = e.target.checked;
                  setIncludeBodyFat(checked);
                  // Clear body fat value when unchecked
                  if (!checked) {
                    setProfile(prev => ({ ...prev, bodyFatPercentage: undefined }));
                  }
                }}
              />
            }
            label="Add Body Fat Percentage for Accurate Calculation"
          />

          {/* Conditional body fat input */}
          {includeBodyFat && (
            <TextField
              label="Body Fat %"
              type="number"
              size="small"
              value={profile.bodyFatPercentage ?? ''}
              onChange={(e) => {
                const value = e.target.value;
                handleInputChange('bodyFatPercentage', value === '' ? undefined : Number(value));
              }}
              inputProps={{ min: 0, max: 100, step: 0.1 }}
              InputProps={{
                endAdornment: <InputAdornment position="end">%</InputAdornment>
              }}
              helperText="Enter if known (0-100)"
            />
          )}

          {/* Activity Level Selection */}
          <FormControl size="small">
            <InputLabel>Activity Level</InputLabel>
            <Select
              value={profile.activityLevel}
              label="Activity Level"
              onChange={(e) => handleInputChange('activityLevel', e.target.value)}
            >
              <MenuItem value="sedentary">Sedentary (Little/no exercise)</MenuItem>
              <MenuItem value="light">Light (1-3 days/week)</MenuItem>
              <MenuItem value="moderate">Moderate (3-5 days/week)</MenuItem>
              <MenuItem value="active">Active (6-7 days/week)</MenuItem>
              <MenuItem value="very_active">Very Active (2x/day, intense)</MenuItem>
            </Select>
          </FormControl>

          {/* Goal Selection */}
          <FormControl size="small">
            <InputLabel>Goal</InputLabel>
            <Select
              value={profile.goal}
              label="Goal"
              onChange={(e) => handleInputChange('goal', e.target.value)}
            >
              {goalOptions.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <Divider />

          {/* Calculated Results Display */}
          {calculatedMacros && (
            <Box>
              <Typography variant="subtitle2" gutterBottom>
                📊 Calculated Targets
              </Typography>
              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, fontSize: '0.875rem' }}>
                <Typography>BMR: {calculatedMacros.bmr} kcal</Typography>
                <Typography>TDEE: {calculatedMacros.tdee} kcal</Typography>
                <Typography sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                  Target: {calculatedMacros.calories} kcal
                </Typography>
                <Typography>Protein: {calculatedMacros.protein}g</Typography>
                <Typography>Carbs: {calculatedMacros.carbs}g</Typography>
                <Typography>Fats: {calculatedMacros.fats}g</Typography>
              </Box>
              
              {/* Range explanation */}
              <Typography variant="caption" sx={{ mt: 1, display: 'block', fontStyle: 'italic' }}>
                {getGoalRangeDescription(profile.goal)}
              </Typography>
            </Box>
          )}

          {/* Save Profile Button */}
          <Button 
            variant="contained" 
            onClick={handleSaveProfile}
            disabled={!user?.uid}
            size="small"
          >
            Save Profile
          </Button>

          {/* Success Message */}
          {saved && (
            <Alert severity="success" sx={{ mt: 1 }}>
              Profile saved successfully!
            </Alert>
          )}
        </Box>
      </CardContent>
    </Card>
  );
};

export default MacroCalculator;
