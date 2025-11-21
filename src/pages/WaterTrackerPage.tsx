/**
 * WaterTrackerPage.tsx - Water Intake Tracking Interface
 *
 * BUSINESS PURPOSE:
 * Provides an intuitive water intake tracking experience with:
 * - Visual bottle representation showing progress
 * - Quick-add buttons for common water amounts
 * - Real-time progress tracking toward daily goals
 * - Historical view of water consumption patterns
 * - Streak tracking for motivation
 *
 * KEY FEATURES:
 * 1. VISUAL TRACKING:
 *    - Animated water bottle showing fill level
 *    - Progress bar with percentage completion
 *    - Color transitions (blue → green) when goal achieved
 *
 * 2. QUICK LOGGING:
 *    - Preset buttons: 300ml, 700ml, 1L
 *    - Manual entry option for custom amounts
 *    - Instant feedback with smooth animations
 *
 * 3. PROGRESS MONITORING:
 *    - Daily goal tracking (default: 2500ml)
 *    - Current streak display
 *    - Monthly completion statistics
 *
 * 4. HISTORICAL INSIGHTS:
 *    - Calendar view of past water intake
 *    - Trend analysis and patterns
 *    - Achievement tracking and milestones
 *
 * BUSINESS VALUE:
 * - Promotes healthy hydration habits through engaging UI
 * - Provides clear visual feedback on progress
 * - Supports streak-based motivation for consistency
 * - Enables data-driven hydration optimization
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  LinearProgress,
  Card,
  CardContent,
  TextField,
  useTheme,
  alpha,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import {
  LocalDrink as WaterIcon,
  Add as AddIcon,
  History as HistoryIcon,
  TrendingUp as TrendingIcon,
  EmojiEvents as TrophyIcon,
  Clear as ClearIcon
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import {
  addWaterIntake,
  useTodayWaterIntake,
  getWaterActivityData,
  clearTodayWaterIntake
} from '../services/firebase/water/waterService';
import { WaterActivityData, WATER_PRESETS } from '../types/water';
import ActivityGrid from '../components/activity/ActivityGrid';
import { useQueryClient } from '@tanstack/react-query';

const WaterTrackerPage: React.FC = () => {
  const { user } = useAuth();
  const theme = useTheme();
  const queryClient = useQueryClient();
  const [activityData, setActivityData] = useState<WaterActivityData[]>([]);
  const [loading, setLoading] = useState(false);
  const [manualAmount, setManualAmount] = useState('');
  const [showManualDialog, setShowManualDialog] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState<number | null>(null);

  // Use React Query hook for water data
  const { data: waterData, isLoading, error } = useTodayWaterIntake(user?.uid || '');

  // Load activity data on mount
  useEffect(() => {
    if (!user) return;

    const loadActivityData = async () => {
      try {
        const historyData = await getWaterActivityData(user.uid, 30);
        setActivityData(historyData);
      } catch (error) {
        console.error('Error loading water activity data:', error);
      }
    };

    loadActivityData();
  }, [user]);

  const handleAddWater = async (amount: number, source: string) => {
    if (!user) return;

    setLoading(true);
    try {
      await addWaterIntake(user.uid, amount, source as any);
      setSelectedPreset(amount);
      
      // Immediately invalidate and refetch the water data
      await queryClient.invalidateQueries({
        queryKey: ['waterIntake', user.uid, 'today']
      });
      
      // Clear selection after animation
      setTimeout(() => setSelectedPreset(null), 500);
    } catch (error) {
      console.error('Error adding water intake:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleManualAdd = async () => {
    const amount = parseInt(manualAmount);
    if (amount > 0) {
      await handleAddWater(amount, 'manual');
      setManualAmount('');
      setShowManualDialog(false);
    }
  };

  const handleClearWater = async () => {
    if (!user) return;

    setLoading(true);
    try {
      await clearTodayWaterIntake(user.uid);
      
      // Immediately invalidate and refetch the water data
      await queryClient.invalidateQueries({
        queryKey: ['waterIntake', user.uid, 'today']
      });
    } catch (error) {
      console.error('Error clearing water intake:', error);
    } finally {
      setLoading(false);
    }
  };

  const getProgressColor = (progress: number) => {
    if (progress >= 100) return '#4CAF50'; // Green when goal achieved
    if (progress >= 75) return '#2196F3'; // Blue for good progress
    if (progress >= 50) return '#FF9800'; // Orange for moderate
    return '#FF5722'; // Red for low progress
  };

  const getBottleFillHeight = (progress: number) => {
    // Convert progress to bottle fill height (0-100%)
    return Math.min(progress, 100);
  };

  if (isLoading || !waterData) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
        <Typography>Loading water tracker...</Typography>
      </Box>
    );
  }

  const progress = (waterData.totalAmount / waterData.targetAmount) * 100;
  const progressColor = getProgressColor(progress);
  const bottleFillHeight = getBottleFillHeight(progress);

  return (
    <Box sx={{ minHeight: '100vh', p: 2 }}>
      <Paper
        sx={{
          borderRadius: 4,
          overflow: 'hidden',
          backgroundColor: 'var(--card-bg)',
          border: '1px solid var(--border-color)',
          boxShadow: 'var(--elevation-1)',
          width: { xs: '100%', lg: '80%' },
          maxWidth: 1200,
          mx: 'auto'
        }}
      >
        {/* Main Content */}
        <Box sx={{
          p: 3,
          backgroundColor: 'var(--surface-bg)',
          minHeight: 'calc(100vh - 200px)'
        }}>
          <Box sx={{ 
            display: 'grid', 
            gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, 
            gap: 4
          }}>
            {/* Left Column - Water Bottle & Controls */}
            <Box>
              <Card sx={{
                borderRadius: 3,
                background: `linear-gradient(135deg, ${alpha(progressColor, 0.05)} 0%, ${alpha(progressColor, 0.02)} 100%)`,
                border: `1px solid ${alpha(progressColor, 0.2)}`
              }}>
                <CardContent sx={{ p: 3 }}>
                  <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                    Today's Progress
                  </Typography>

                  {/* Progress Bar */}
                  <Box sx={{ mb: 3 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2" sx={{ color: 'var(--text-secondary)' }}>
                        {Math.round(waterData.totalAmount)}ml / {waterData.targetAmount}ml
                      </Typography>
                      <Typography variant="body2" sx={{ color: progressColor, fontWeight: 600 }}>
                        {Math.round(progress)}%
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={Math.min(progress, 100)}
                      sx={{
                        height: 8,
                        borderRadius: 4,
                        backgroundColor: alpha(progressColor, 0.1),
                        '& .MuiLinearProgress-bar': {
                          backgroundColor: progressColor,
                          borderRadius: 4
                        }
                      }}
                    />
                  </Box>

                  {/* Water Bottle Visual */}
                  <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
                    <Box sx={{
                      position: 'relative',
                      width: 120,
                      height: 200,
                      background: `linear-gradient(135deg, ${alpha('#E3F2FD', 0.8)} 0%, ${alpha('#BBDEFB', 0.6)} 100%)`,
                      borderRadius: '60px 60px 20px 20px',
                      border: `3px solid ${alpha(progressColor, 0.3)}`,
                      overflow: 'hidden',
                      boxShadow: `0 8px 24px ${alpha(progressColor, 0.2)}`
                    }}>
                      {/* Bottle Fill */}
                      <Box sx={{
                        position: 'absolute',
                        bottom: 0,
                        left: 0,
                        right: 0,
                        height: `${bottleFillHeight}%`,
                        background: `linear-gradient(180deg, ${alpha(progressColor, 0.8)} 0%, ${alpha(progressColor, 0.6)} 100%)`,
                        transition: 'height 0.5s ease-in-out',
                        borderRadius: bottleFillHeight >= 100 ? '57px 57px 17px 17px' : '0'
                      }} />

                      {/* Bottle Neck */}
                      <Box sx={{
                        position: 'absolute',
                        top: -15,
                        left: '50%',
                        transform: 'translateX(-50%)',
                        width: 20,
                        height: 30,
                        background: `linear-gradient(135deg, ${alpha('#E3F2FD', 0.8)} 0%, ${alpha('#BBDEFB', 0.6)} 100%)`,
                        border: `2px solid ${alpha(progressColor, 0.3)}`,
                        borderRadius: '10px 10px 0 0'
                      }} />
                    </Box>
                  </Box>

                  {/* Quick Add Buttons */}
                  <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                    Quick Add
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                    <Button
                      variant={selectedPreset === WATER_PRESETS.SMALL ? "contained" : "outlined"}
                      onClick={() => handleAddWater(WATER_PRESETS.SMALL, 'preset-300ml')}
                      disabled={loading}
                      sx={{
                        flex: 1,
                        py: 1.5,
                        borderRadius: 2,
                        fontWeight: 600,
                        transition: 'all 0.3s ease',
                        backgroundColor: selectedPreset === WATER_PRESETS.SMALL ? progressColor : 'transparent',
                        borderColor: alpha(progressColor, 0.5),
                        color: selectedPreset === WATER_PRESETS.SMALL ? 'white' : progressColor,
                        '&:hover': {
                          backgroundColor: selectedPreset === WATER_PRESETS.SMALL ? progressColor : alpha(progressColor, 0.1),
                          transform: 'translateY(-2px)',
                          boxShadow: `0 4px 12px ${alpha(progressColor, 0.3)}`
                        }
                      }}
                    >
                      300ml
                    </Button>
                    <Button
                      variant={selectedPreset === WATER_PRESETS.MEDIUM ? "contained" : "outlined"}
                      onClick={() => handleAddWater(WATER_PRESETS.MEDIUM, 'preset-700ml')}
                      disabled={loading}
                      sx={{
                        flex: 1,
                        py: 1.5,
                        borderRadius: 2,
                        fontWeight: 600,
                        transition: 'all 0.3s ease',
                        backgroundColor: selectedPreset === WATER_PRESETS.MEDIUM ? progressColor : 'transparent',
                        borderColor: alpha(progressColor, 0.5),
                        color: selectedPreset === WATER_PRESETS.MEDIUM ? 'white' : progressColor,
                        '&:hover': {
                          backgroundColor: selectedPreset === WATER_PRESETS.MEDIUM ? progressColor : alpha(progressColor, 0.1),
                          transform: 'translateY(-2px)',
                          boxShadow: `0 4px 12px ${alpha(progressColor, 0.3)}`
                        }
                      }}
                    >
                      700ml
                    </Button>
                    <Button
                      variant={selectedPreset === WATER_PRESETS.LARGE ? "contained" : "outlined"}
                      onClick={() => handleAddWater(WATER_PRESETS.LARGE, 'preset-1L')}
                      disabled={loading}
                      sx={{
                        flex: 1,
                        py: 1.5,
                        borderRadius: 2,
                        fontWeight: 600,
                        transition: 'all 0.3s ease',
                        backgroundColor: selectedPreset === WATER_PRESETS.LARGE ? progressColor : 'transparent',
                        borderColor: alpha(progressColor, 0.5),
                        color: selectedPreset === WATER_PRESETS.LARGE ? 'white' : progressColor,
                        '&:hover': {
                          backgroundColor: selectedPreset === WATER_PRESETS.LARGE ? progressColor : alpha(progressColor, 0.1),
                          transform: 'translateY(-2px)',
                          boxShadow: `0 4px 12px ${alpha(progressColor, 0.3)}`
                        }
                      }}
                    >
                      1L
                    </Button>
                  </Box>

                  {/* Clear Button */}
                  <Box sx={{ mb: 2 }}>
                    <Button
                      variant="outlined"
                      startIcon={<ClearIcon />}
                      onClick={handleClearWater}
                      disabled={loading || waterData.totalAmount === 0}
                      sx={{
                        borderColor: '#FF5722',
                        color: '#FF5722',
                        fontWeight: 600,
                        borderRadius: 2,
                        '&:hover': {
                          backgroundColor: alpha('#FF5722', 0.1),
                          borderColor: '#FF5722',
                          transform: 'translateY(-1px)',
                          boxShadow: `0 4px 12px ${alpha('#FF5722', 0.3)}`
                        },
                        '&:disabled': {
                          borderColor: alpha('#FF5722', 0.3),
                          color: alpha('#FF5722', 0.3)
                        }
                      }}
                    >
                      Clear Today's Water
                    </Button>
                  </Box>

                  {/* Manual Add Button */}
                  <Button
                    variant="text"
                    startIcon={<AddIcon />}
                    onClick={() => setShowManualDialog(true)}
                    sx={{
                      color: progressColor,
                      fontWeight: 600,
                      '&:hover': {
                        backgroundColor: alpha(progressColor, 0.1)
                      }
                    }}
                  >
                    Add Custom Amount
                  </Button>
                </CardContent>
              </Card>
            </Box>

            {/* Right Column - Stats & History */}
            <Box>
              {/* Stats Cards */}
              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mb: 3 }}>
                <Box>
                  <Card sx={{
                    borderRadius: 2,
                    background: `linear-gradient(135deg, ${alpha('#4CAF50', 0.1)} 0%, ${alpha('#4CAF50', 0.05)} 100%)`,
                    border: `1px solid ${alpha('#4CAF50', 0.2)}`
                  }}>
                    <CardContent sx={{ p: 2, textAlign: 'center' }}>
                      <TrophyIcon sx={{ fontSize: 32, color: '#4CAF50', mb: 1 }} />
                      <Typography variant="h6" sx={{ fontWeight: 700, color: '#4CAF50' }}>
                        {waterData.streakCount}
                      </Typography>
                      <Typography variant="caption" sx={{ color: 'var(--text-secondary)' }}>
                        Day Streak
                      </Typography>
                    </CardContent>
                  </Card>
                </Box>
                <Box>
                  <Card sx={{
                    borderRadius: 2,
                    background: `linear-gradient(135deg, ${alpha('#2196F3', 0.1)} 0%, ${alpha('#2196F3', 0.05)} 100%)`,
                    border: `1px solid ${alpha('#2196F3', 0.2)}`
                  }}>
                    <CardContent sx={{ p: 2, textAlign: 'center' }}>
                      <TrendingIcon sx={{ fontSize: 32, color: '#2196F3', mb: 1 }} />
                      <Typography variant="h6" sx={{ fontWeight: 700, color: '#2196F3' }}>
                        {waterData.entries.length}
                      </Typography>
                      <Typography variant="caption" sx={{ color: 'var(--text-secondary)' }}>
                        Today's Logs
                      </Typography>
                    </CardContent>
                  </Card>
                </Box>
              </Box>

              {/* Activity Grid */}
              <Card sx={{
                borderRadius: 3,
                background: 'var(--card-bg)',
                border: '1px solid var(--border-color)'
              }}>
                <CardContent sx={{ p: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                    <HistoryIcon sx={{ color: 'var(--text-secondary)' }} />
                    <Typography variant="h6" sx={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                      Last 30 Days
                    </Typography>
                  </Box>

                  <ActivityGrid
                    activityData={activityData.map(data => ({
                      date: data.date,
                      dateObj: new Date(data.date),
                      completed: data.completed,
                      value: data.amount,
                      maxValue: data.target,
                      isToday: data.date === new Date().toISOString().split('T')[0],
                      isWeekend: new Date(data.date).getDay() === 0 || new Date(data.date).getDay() === 6
                    }))}
                    size="small"
                    primaryColor={progressColor}
                  />
                </CardContent>
              </Card>
            </Box>
          </Box>
        </Box>
      </Paper>

      {/* Manual Amount Dialog */}
      <Dialog open={showManualDialog} onClose={() => setShowManualDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add Custom Water Amount</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Amount (ml)"
            type="number"
            fullWidth
            variant="outlined"
            value={manualAmount}
            onChange={(e) => setManualAmount(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                handleManualAdd();
              }
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowManualDialog(false)}>Cancel</Button>
          <Button
            onClick={handleManualAdd}
            variant="contained"
            disabled={!manualAmount || parseInt(manualAmount) <= 0}
            sx={{ backgroundColor: progressColor }}
          >
            Add Water
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default WaterTrackerPage;