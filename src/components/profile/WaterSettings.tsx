import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  TextField,
  InputAdornment,
  Alert
} from '@mui/material';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { useWaterSettings } from '../../hooks/useWaterSettings';
import AccentButton from '../shared/AccentButton';

export const WaterSettings: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const { waterGoal, loading, error, saveWaterGoal, updateWaterGoal } = useWaterSettings();
  const [localWaterGoal, setLocalWaterGoal] = useState(waterGoal);
  const [saving, setSaving] = useState(false);
  const [renderKey, setRenderKey] = useState(0);

  useEffect(() => {
    setLocalWaterGoal(waterGoal);
    // Force parent CollapsiblePanel to recalculate height
    setTimeout(() => {
      setRenderKey(prev => prev + 1);
      window.dispatchEvent(new Event('resize'));
    }, 100);
  }, [waterGoal]);

  const handleSave = async () => {
    if (!user) {
      showToast('Please sign in to save water goal', 'error');
      return;
    }

    setSaving(true);
    try {
      await saveWaterGoal(localWaterGoal);
      showToast('Water goal saved successfully', 'success');
    } catch (error) {
      console.error('Error saving water goal:', error);
      showToast('Failed to save water goal', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (value: number) => {
    setLocalWaterGoal(value);
    updateWaterGoal(value);
  };

  if (loading) {
    return (
      <Box sx={{ p: 2 }}>
        <Typography>Loading water settings...</Typography>
      </Box>
    );
  }

  return (
    <Box data-render-key={renderKey}>
      <Box sx={{ mb: 3, pb: 2, borderBottom: '1px solid var(--border-color)' }}>
        <Typography variant="h6" sx={{ fontWeight: 600, color: 'var(--text-primary)' }}>
          Daily Water Intake Goal
        </Typography>
        <Typography variant="body2" sx={{ color: 'var(--text-secondary)', mt: 1 }}>
          Set your daily water intake target. Recommended: 2500-3500ml per day.
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Box sx={{ maxWidth: 400 }}>
        <TextField
          label="Daily Water Intake Goal"
          type="number"
          fullWidth
          value={localWaterGoal}
          onChange={(e) => handleChange(Number(e.target.value))}
          inputProps={{ min: 500, max: 5000, step: 100 }}
          helperText="Recommended: 2500-3500ml per day"
          InputProps={{
            endAdornment: <InputAdornment position="end">ml</InputAdornment>
          }}
          sx={{
            backgroundColor: 'var(--surface-bg)',
            '& .MuiOutlinedInput-root': {
              '&:hover fieldset': {
                borderColor: 'var(--accent-blue)'
              }
            }
          }}
        />
      </Box>

      {/* Save Button */}
      <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
        <AccentButton
          onClick={handleSave}
          variant="primary"
          disabled={saving || !user}
        >
          {saving ? 'Saving...' : 'Save Water Goal'}
        </AccentButton>
      </Box>
    </Box>
  );
};
