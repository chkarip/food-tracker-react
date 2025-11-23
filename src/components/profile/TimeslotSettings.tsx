import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  TextField,
  IconButton,
  Button,
  Stack,
  Chip,
  Alert
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  WbSunny,
  Nightlight,
  LunchDining,
  LocalCafe,
  DinnerDining
} from '@mui/icons-material';
import { TimeslotConfig } from '../../types/nutrition';
import { getUserTimeslots, saveUserTimeslots, DEFAULT_TIMESLOTS } from '../../services/firebase/nutrition/timeslotService';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import AccentButton from '../shared/AccentButton';

// Available icons for timeslots
const TIMESLOT_ICONS = [
  { value: '🌅', label: 'Sunrise', component: <WbSunny /> },
  { value: '☀️', label: 'Sun', component: <WbSunny /> },
  { value: '🌙', label: 'Moon', component: <Nightlight /> },
  { value: '🍳', label: 'Breakfast', component: <LocalCafe /> },
  { value: '🥗', label: 'Lunch', component: <LunchDining /> },
  { value: '🍽️', label: 'Dinner', component: <DinnerDining /> },
  { value: '☕', label: 'Coffee', component: <LocalCafe /> },
  { value: '🌃', label: 'Night', component: <Nightlight /> }
];

interface TimeslotSettingsProps {
  onSave?: () => void;
}

export const TimeslotSettings: React.FC<TimeslotSettingsProps> = ({ onSave }) => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [timeslots, setTimeslots] = useState<TimeslotConfig[]>(DEFAULT_TIMESLOTS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [renderKey, setRenderKey] = useState(0);

  // Load user's timeslots on mount
  useEffect(() => {
    const loadTimeslots = async () => {
      if (!user) return;
      
      try {
        const userTimeslots = await getUserTimeslots(user.uid);
        setTimeslots(userTimeslots);
      } catch (error) {
        console.error('Error loading timeslots:', error);
        showToast('Failed to load timeslots', 'error');
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

    loadTimeslots();
  }, [user, showToast]);

  const handleAddTimeslot = () => {
    if (timeslots.length >= 5) {
      showToast('Maximum 5 timeslots allowed', 'warning');
      return;
    }

    const newId = `timeslot-${Date.now()}`;
    const newTimeslot: TimeslotConfig = {
      id: newId,
      time: '12:00 PM',
      icon: '🍽️',
      name: 'Meal'
    };

    setTimeslots([...timeslots, newTimeslot]);
  };

  const handleRemoveTimeslot = (index: number) => {
    if (timeslots.length <= 1) {
      showToast('At least one timeslot required', 'warning');
      return;
    }

    const updatedTimeslots = timeslots.filter((_, i) => i !== index);
    setTimeslots(updatedTimeslots);
  };

  const handleUpdateTimeslot = (index: number, field: keyof TimeslotConfig, value: string) => {
    const updatedTimeslots = [...timeslots];
    updatedTimeslots[index] = {
      ...updatedTimeslots[index],
      [field]: value
    };
    setTimeslots(updatedTimeslots);
  };

  const handleSave = async () => {
    if (!user) {
      showToast('Please sign in to save timeslots', 'error');
      return;
    }

    // Validate
    const hasEmptyFields = timeslots.some(slot => 
      !slot.time.trim() || !slot.icon.trim() || !slot.name.trim()
    );

    if (hasEmptyFields) {
      showToast('All timeslot fields are required', 'warning');
      return;
    }

    setSaving(true);
    try {
      await saveUserTimeslots(user.uid, timeslots);
      showToast('Timeslots saved successfully', 'success');
      if (onSave) onSave();
    } catch (error) {
      console.error('Error saving timeslots:', error);
      showToast('Failed to save timeslots', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ p: 2 }}>
        <Typography>Loading timeslots...</Typography>
      </Box>
    );
  }

  return (
    <Box data-render-key={renderKey}>
      <Box sx={{ mb: 3, pb: 2, borderBottom: '1px solid var(--border-color)' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6" sx={{ fontWeight: 600, color: 'var(--text-primary)' }}>
            Meal Timeslots
          </Typography>
          <Chip 
            label={`${timeslots.length}/5 slots`} 
            size="small" 
            sx={{ 
              backgroundColor: timeslots.length >= 5 ? 'var(--accent-red)' : 'var(--accent-green)',
              color: 'white'
            }}
          />
        </Box>
        <Typography variant="body2" sx={{ color: 'var(--text-secondary)', mt: 1 }}>
          Configure your meal timeslots. You can add up to 5 different meal times.
        </Typography>
      </Box>

      <Alert severity="info" sx={{ mb: 3 }}>
        Changes will be reflected in the Food Tracker page after saving.
      </Alert>

      <Stack spacing={2}>
        {timeslots.map((slot, index) => (
          <Box
            key={slot.id}
            sx={{
              p: 2,
              border: '1px solid var(--border-color)',
              borderRadius: '8px',
              backgroundColor: 'var(--card-bg)',
              '&:hover': {
                borderColor: 'var(--accent-blue)',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
              }
            }}
          >
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
              {/* Icon Selector */}
              <Box sx={{ minWidth: 120 }}>
                <Typography variant="caption" sx={{ color: 'var(--text-secondary)', mb: 1, display: 'block' }}>
                  Icon
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  {TIMESLOT_ICONS.map((icon) => (
                    <Box
                      key={icon.value}
                      onClick={() => handleUpdateTimeslot(index, 'icon', icon.value)}
                      sx={{
                        width: 32,
                        height: 32,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        border: slot.icon === icon.value ? '2px solid var(--accent-blue)' : '1px solid var(--border-color)',
                        borderRadius: '6px',
                        backgroundColor: slot.icon === icon.value ? 'rgba(33, 150, 243, 0.1)' : 'transparent',
                        fontSize: '18px',
                        '&:hover': {
                          backgroundColor: 'rgba(33, 150, 243, 0.1)',
                          transform: 'scale(1.05)'
                        }
                      }}
                    >
                      {icon.value}
                    </Box>
                  ))}
                </Box>
              </Box>

              {/* Time Input */}
              <Box sx={{ flex: 1 }}>
                <Typography variant="caption" sx={{ color: 'var(--text-secondary)', mb: 1, display: 'block' }}>
                  Time
                </Typography>
                <TextField
                  value={slot.time}
                  onChange={(e) => handleUpdateTimeslot(index, 'time', e.target.value)}
                  placeholder="e.g., 6:00 PM"
                  size="small"
                  fullWidth
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      backgroundColor: 'var(--input-bg)',
                      '&:hover fieldset': {
                        borderColor: 'var(--accent-blue)'
                      }
                    }
                  }}
                />
              </Box>

              {/* Name Input */}
              <Box sx={{ flex: 1 }}>
                <Typography variant="caption" sx={{ color: 'var(--text-secondary)', mb: 1, display: 'block' }}>
                  Name
                </Typography>
                <TextField
                  value={slot.name}
                  onChange={(e) => handleUpdateTimeslot(index, 'name', e.target.value)}
                  placeholder="e.g., Afternoon"
                  size="small"
                  fullWidth
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      backgroundColor: 'var(--input-bg)',
                      '&:hover fieldset': {
                        borderColor: 'var(--accent-blue)'
                      }
                    }
                  }}
                />
              </Box>

              {/* Delete Button */}
              <Box sx={{ pt: 3 }}>
                <IconButton
                  onClick={() => handleRemoveTimeslot(index)}
                  size="small"
                  disabled={timeslots.length <= 1}
                  sx={{
                    color: 'var(--accent-red)',
                    '&:hover': {
                      backgroundColor: 'rgba(244, 67, 54, 0.1)'
                    },
                    '&:disabled': {
                      color: 'var(--text-disabled)'
                    }
                  }}
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Box>
            </Box>
          </Box>
        ))}
      </Stack>

      {/* Add Timeslot Button */}
      {timeslots.length < 5 && (
        <Button
          startIcon={<AddIcon />}
          onClick={handleAddTimeslot}
          sx={{
            mt: 2,
            color: 'var(--accent-green)',
            borderColor: 'var(--accent-green)',
            '&:hover': {
              backgroundColor: 'rgba(59, 186, 117, 0.1)',
              borderColor: 'var(--accent-green)'
            }
          }}
          variant="outlined"
          fullWidth
        >
          Add Timeslot
        </Button>
      )}

      {/* Save Button */}
      <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
        <AccentButton
          onClick={handleSave}
          variant="primary"
          disabled={saving}
        >
          {saving ? 'Saving...' : 'Save Timeslots'}
        </AccentButton>
      </Box>
    </Box>
  );
};
