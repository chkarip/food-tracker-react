/**
 * components/food-management/UserProfileManager.tsx
 * User profile management component for personal information
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  TextField,
  Alert,
  InputAdornment,
  Checkbox,
  FormControlLabel
} from '@mui/material';
import { UserProfileFormData, GoalType } from '../../types/food';
import { saveUserProfile, getUserProfile } from '../../services/firebase/nutrition/userProfileService';
import { useAuth } from '../../contexts/AuthContext';
import { useWaterSettings } from '../../hooks/useWaterSettings';
import { CustomSelect } from '../shared/inputs';
import { GenericCard } from '../shared/cards/GenericCard';
import AccentButton from '../shared/AccentButton';

const UserProfileManager: React.FC = () => {
  const { user } = useAuth();
  const { waterGoal, loading: waterLoading, error: waterError, saveWaterGoal, updateWaterGoal } = useWaterSettings();

  const [profile, setProfile] = useState<UserProfileFormData>({
    gender: 'male',
    age: 30,
    height: 175,
    weight: 70,
    activityLevel: 'moderate',
    goal: 'maintain',
    bodyFatPercentage: undefined,
    waterIntakeGoal: waterGoal
  });
  const [includeBodyFat, setIncludeBodyFat] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);

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
          setIncludeBodyFat(!!userProfile.bodyFatPercentage);
        }
      } catch (error) {
        console.error('Failed to load user profile:', error);
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [user?.uid]);

  // Sync water goal with profile
  useEffect(() => {
    setProfile(prev => ({
      ...prev,
      waterIntakeGoal: waterGoal
    }));
  }, [waterGoal]);

  const handleInputChange = (field: keyof UserProfileFormData, value: string | number | undefined) => {
    setProfile(prev => ({
      ...prev,
      [field]: value === undefined ? undefined : (typeof value === 'string' ? value : Number(value))
    }));
  };

  const handleSaveProfile = async () => {
    console.log('🔄 Save Profile button clicked');
    console.log('👤 User:', user);
    console.log('📊 Profile data:', profile);

    if (!user?.uid) {
      console.error('❌ No user UID found - user not authenticated');
      return;
    }

    try {
      console.log('📝 Preparing profile data for save...');
      const profileToSave = {
        ...profile,
        bodyFatPercentage: includeBodyFat ? profile.bodyFatPercentage : undefined
      };
      console.log('📋 Profile to save:', profileToSave);

      console.log('💾 Calling saveUserProfile...');
      await saveUserProfile(user.uid, profileToSave);
      console.log('✅ saveUserProfile completed');

      // Also save water goal separately
      if (profile.waterIntakeGoal !== undefined) {
        console.log('💧 Saving water goal:', profile.waterIntakeGoal);
        await saveWaterGoal(profile.waterIntakeGoal);
        console.log('✅ Water goal saved');
      }

      console.log('🎉 Profile save completed successfully');
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (error) {
      console.error('❌ Failed to save user profile:', error);
      console.error('❌ Error details:', error);
    }
  };

  if (loading || waterLoading) {
    return <Typography>Loading profile...</Typography>;
  }

  return (
    <Box>
      {!user && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          You must be logged in to save your profile.
        </Alert>
      )}

      {waterError && (
        <Alert severity="error" sx={{ mb: 3 }}>
          Water settings error: {waterError}
        </Alert>
      )}

      <GenericCard
        variant="default"
        title="Personal Information"
        content={
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {/* Basic Info Row */}
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' }, gap: 2 }}>
              <CustomSelect
                value={profile.gender}
                options={[
                  { value: 'male', label: 'Male' },
                  { value: 'female', label: 'Female' }
                ]}
                onChange={(value) => handleInputChange('gender', value)}
                placeholder="Select gender"
                label="Gender"
                size="small"
              />

              <TextField
                label="Age (years)"
                type="number"
                size="small"
                value={profile.age}
                onChange={(e) => handleInputChange('age', e.target.value)}
                inputProps={{ min: 10, max: 100 }}
                sx={{
                  backgroundColor: 'var(--surface-bg)',
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: 'var(--border-color)'
                  }
                }}
              />
            </Box>

            {/* Physical Stats Row */}
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' }, gap: 2 }}>
              <TextField
                label="Height (cm)"
                type="number"
                size="small"
                value={profile.height}
                onChange={(e) => handleInputChange('height', e.target.value)}
                inputProps={{ min: 100, max: 250 }}
                sx={{
                  backgroundColor: 'var(--surface-bg)',
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: 'var(--border-color)'
                  }
                }}
              />

              <TextField
                label="Weight (kg)"
                type="number"
                size="small"
                value={profile.weight}
                onChange={(e) => handleInputChange('weight', e.target.value)}
                inputProps={{ min: 30, max: 200 }}
                sx={{
                  backgroundColor: 'var(--surface-bg)',
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: 'var(--border-color)'
                  }
                }}
              />
            </Box>

            {/* Body Fat Toggle */}
            <Box sx={{
              backgroundColor: 'var(--meal-row-bg)',
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
                        setProfile(prev => ({ ...prev, bodyFatPercentage: undefined }));
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
                  value={profile.bodyFatPercentage ?? ''}
                  onChange={(e) => {
                    const value = e.target.value;
                    handleInputChange('bodyFatPercentage', value === '' ? undefined : Number(value));
                  }}
                  inputProps={{ min: 0, max: 100, step: 0.1 }}
                  InputProps={{
                    endAdornment: <InputAdornment position="end">%</InputAdornment>
                  }}
                  helperText="Enter if known (0-100%)"
                  sx={{
                    mt: 2,
                    backgroundColor: 'var(--surface-bg)',
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'var(--border-color)'
                    }
                  }}
                />
              )}
            </Box>

            {/* Activity Level */}
            <CustomSelect
              value={profile.activityLevel}
              options={[
                { value: 'sedentary', label: 'Sedentary (Little/no exercise)' },
                { value: 'light', label: 'Light (1-3 days/week)' },
                { value: 'moderate', label: 'Moderate (3-5 days/week)' },
                { value: 'active', label: 'Active (6-7 days/week)' },
                { value: 'very_active', label: 'Very Active (2x/day, intense)' }
              ]}
              onChange={(value) => handleInputChange('activityLevel', value)}
              placeholder="Select activity level"
              label="Activity Level"
              size="small"
            />

            {/* Goal Selection */}
            <CustomSelect
              value={profile.goal}
              options={goalOptions}
              onChange={(value) => handleInputChange('goal', value)}
              placeholder="Select your goal"
              label="Goal"
              size="small"
            />

            {/* Water Intake Goal */}
            <TextField
              label="Daily Water Intake Goal (ml)"
              type="number"
              size="small"
              value={profile.waterIntakeGoal ?? waterGoal}
              onChange={(e) => {
                const value = Number(e.target.value);
                updateWaterGoal(value);
                handleInputChange('waterIntakeGoal', value);
              }}
              inputProps={{ min: 500, max: 5000, step: 100 }}
              helperText={waterError || "Recommended: 2500-3500ml per day"}
              error={!!waterError}
              InputProps={{
                endAdornment: <InputAdornment position="end">ml</InputAdornment>
              }}
              sx={{
                backgroundColor: 'var(--surface-bg)',
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: waterError ? 'red' : 'var(--border-color)'
                }
              }}
            />

            {/* Save Profile Button */}
            <Box sx={{ mt: 2 }}>
              <AccentButton
                onClick={handleSaveProfile}
                disabled={!user?.uid}
                variant="primary"
                style={{
                  backgroundColor: !user?.uid ? '#ccc' : 'var(--accent-green)',
                  borderRadius: '8px',
                  fontWeight: 600,
                  cursor: !user?.uid ? 'not-allowed' : 'pointer'
                }}
              >
                {!user?.uid ? 'Login Required to Save' : 'Save Profile'}
              </AccentButton>
            </Box>

            {/* Success Message */}
            {saved && (
              <Alert
                severity="success"
                sx={{
                  borderRadius: 2,
                  backgroundColor: 'var(--surface-bg)',
                  border: '1px solid var(--accent-green)',
                  color: 'var(--text-primary)'
                }}
              >
                Profile saved successfully!
              </Alert>
            )}
          </Box>
        }
      />
    </Box>
  );
};

export default UserProfileManager;
