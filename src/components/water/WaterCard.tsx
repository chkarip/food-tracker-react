/**
 * WaterCard.tsx - Compact Water Tracking Card for Dashboard
 *
 * BUSINESS PURPOSE:
 * Provides a compact water intake tracking interface directly in the dashboard with:
 * - Visual bottle representation showing progress
 * - Quick-add buttons for common water amounts
 * - Real-time progress tracking toward daily goals
 * - Seamless integration with dashboard layout
 *
 * KEY FEATURES:
 * 1. COMPACT DESIGN:
 *    - Fits within dashboard card grid
 *    - Essential water tracking functionality
 *    - Clean, focused interface
 *
 * 2. VISUAL TRACKING:
 *    - Animated water bottle showing fill level
 *    - Progress bar with percentage completion
 *    - Color transitions based on progress
 *
 * 3. QUICK LOGGING:
 *    - Preset buttons: 300ml, 700ml, 1L
 *    - Instant feedback with smooth animations
 *    - Real-time progress updates
 *
 * BUSINESS VALUE:
 * - Enables quick water logging without leaving dashboard
 * - Maintains hydration tracking visibility
 * - Provides immediate feedback and motivation
 * - Integrates seamlessly with existing dashboard workflow
 */

import React, { useState } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Button,
  LinearProgress,
  Box,
  alpha,
  useTheme
} from '@mui/material';
import { LocalDrink as WaterIcon } from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import {
  addWaterIntake,
  useTodayWaterIntake
} from '../../services/firebase/water/waterService';
import { WaterIntakeDocument, WATER_PRESETS } from '../../types/water';
import { db } from '../../config/firebase';
import { COLLECTIONS, createTimestamp } from '../../services/firebase/shared/utils';
import { doc, setDoc } from 'firebase/firestore';
import { useQueryClient } from '@tanstack/react-query';

interface WaterCardProps {
  size?: 'small' | 'medium' | 'large';
}

const WaterCard: React.FC<WaterCardProps> = ({ size = 'medium' }) => {
  const { user } = useAuth();
  const theme = useTheme();
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState<number | null>(null);

  // Use React Query hook for water data
  const { data: waterData, isLoading, error } = useTodayWaterIntake(user?.uid || '');

  const handleAddWater = async (amount: number, source: string) => {
    if (!user || !waterData) return;

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

  const handleClearWater = async () => {
    if (!user || !waterData) return;

    // If no water to clear, just return without doing anything
    if (waterData.totalAmount === 0) return;

    setLoading(true);
    try {
      // Create a new document with zero amount but keep the same structure
      const clearedDoc: WaterIntakeDocument = {
        ...waterData,
        totalAmount: 0,
        entries: [],
        goalAchieved: false,
        updatedAt: createTimestamp()
      };

      const docRef = doc(db, COLLECTIONS.WATER_INTAKE, `${user.uid}_${waterData.date}`);
      await setDoc(docRef, clearedDoc);

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
    return Math.min(progress, 100);
  };

  if (isLoading || !waterData) {
    return (
      <Card sx={{
        height: size === 'small' ? 200 : size === 'large' ? 280 : 300,
        borderRadius: 3,
        background: 'var(--card-bg)',
        border: '1px solid var(--border-color)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <Typography variant="body2" sx={{ color: 'var(--text-secondary)' }}>
          Loading water tracker...
        </Typography>
      </Card>
    );
  }

  const progress = (waterData.totalAmount / waterData.targetAmount) * 100;
  const progressColor = getProgressColor(progress);
  const bottleFillHeight = getBottleFillHeight(progress);

  return (
    <Card sx={{
      height: size === 'small' ? 200 : size === 'large' ? 280 : 300,
      borderRadius: 3,
      background: `linear-gradient(135deg, ${alpha(progressColor, 0.05)}, ${alpha(progressColor, 0.02)})`,
      border: `1px solid ${alpha(progressColor, 0.15)}`,
      transition: 'all 0.3s ease',
      '&:hover': {
        transform: 'translateY(-2px)',
        boxShadow: `0 8px 24px ${alpha(progressColor, 0.15)}`,
      }
    }}>
      <CardContent sx={{
        p: size === 'small' ? 1.5 : 2,
        height: '100%',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
          <WaterIcon sx={{ color: progressColor, fontSize: size === 'small' ? 20 : 24 }} />
          <Typography
            variant={size === 'small' ? 'subtitle2' : 'h6'}
            sx={{ fontWeight: 600, color: 'var(--text-primary)' }}
          >
            Water Tracker
          </Typography>
        </Box>

        {/* Progress Text */}
        <Typography
          variant="body2"
          sx={{ color: 'var(--text-secondary)', mb: 1, fontSize: size === 'small' ? '0.75rem' : '0.875rem' }}
        >
          {Math.round(waterData.totalAmount)}ml / {waterData.targetAmount}ml ({Math.round(progress)}%)
        </Typography>

        {/* Progress Bar */}
        <LinearProgress
          variant="determinate"
          value={Math.min(progress, 100)}
          sx={{
            height: size === 'small' ? 6 : 8,
            borderRadius: 3,
            backgroundColor: alpha(progressColor, 0.1),
            mb: 2,
            '& .MuiLinearProgress-bar': {
              backgroundColor: progressColor,
              borderRadius: 3
            }
          }}
        />

        {/* Mini Water Bottle */}
        <Box sx={{
          display: 'flex',
          justifyContent: 'center',
          mb: 1,
          flex: 0.7
        }}>
          <Box sx={{
            position: 'relative',
            width: size === 'small' ? 60 : 80,
            height: size === 'small' ? 100 : 110,
            background: `linear-gradient(135deg, ${alpha('#E3F2FD', 0.8)} 0%, ${alpha('#BBDEFB', 0.6)} 100%)`,
            borderRadius: '30px 30px 10px 10px',
            border: `2px solid ${alpha(progressColor, 0.3)}`,
            overflow: 'hidden',
            boxShadow: `0 4px 12px ${alpha(progressColor, 0.2)}`
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
              borderRadius: bottleFillHeight >= 100 ? '28px 28px 8px 8px' : '0'
            }} />

            {/* Bottle Neck */}
            <Box sx={{
              position: 'absolute',
              top: -8,
              left: '50%',
              transform: 'translateX(-50%)',
              width: size === 'small' ? 10 : 12,
              height: size === 'small' ? 15 : 18,
              background: `linear-gradient(135deg, ${alpha('#E3F2FD', 0.8)} 0%, ${alpha('#BBDEFB', 0.6)} 100%)`,
              border: `1px solid ${alpha(progressColor, 0.3)}`,
              borderRadius: '5px 5px 0 0'
            }} />
          </Box>
        </Box>

        {/* Quick Add Buttons */}
        <Box sx={{ 
          position: 'absolute', 
          bottom: size === 'small' ? 16 : 20, 
          left: '50%', 
          transform: 'translateX(-50%)',
          width: '90%'
        }}>
          {/* Preset Buttons Row */}
          <Box sx={{
            display: 'flex',
            gap: 0.5,
            mb: 1,
            flexWrap: 'wrap',
            '& .MuiButton-root': {
              fontSize: size === 'small' ? '0.7rem' : '0.75rem',
              py: size === 'small' ? 0.5 : 0.75,
              px: size === 'small' ? 0.5 : 1,
              minWidth: 'auto'
            }
          }}>
            <Button
              variant={selectedPreset === WATER_PRESETS.SMALL ? "contained" : "outlined"}
              size="small"
              onClick={() => handleAddWater(WATER_PRESETS.SMALL, 'preset-300ml')}
              disabled={loading}
              sx={{
                flex: 1,
                borderRadius: 1.5,
                fontWeight: 600,
                transition: 'all 0.3s ease',
                backgroundColor: selectedPreset === WATER_PRESETS.SMALL ? progressColor : 'transparent',
                borderColor: alpha(progressColor, 0.5),
                color: selectedPreset === WATER_PRESETS.SMALL ? 'white' : progressColor,
                '&:hover': {
                  backgroundColor: selectedPreset === WATER_PRESETS.SMALL ? progressColor : alpha(progressColor, 0.1),
                  transform: 'translateY(-1px)',
                  boxShadow: `0 2px 6px ${alpha(progressColor, 0.3)}`
                }
              }}
            >
              3010ml
            </Button>
            <Button
              variant={selectedPreset === WATER_PRESETS.MEDIUM ? "contained" : "outlined"}
              size="small"
              onClick={() => handleAddWater(WATER_PRESETS.MEDIUM, 'preset-700ml')}
              disabled={loading}
              sx={{
                flex: 1,
                borderRadius: 1.5,
                fontWeight: 600,
                transition: 'all 0.3s ease',
                backgroundColor: selectedPreset === WATER_PRESETS.MEDIUM ? progressColor : 'transparent',
                borderColor: alpha(progressColor, 0.5),
                color: selectedPreset === WATER_PRESETS.MEDIUM ? 'white' : progressColor,
                '&:hover': {
                  backgroundColor: selectedPreset === WATER_PRESETS.MEDIUM ? progressColor : alpha(progressColor, 0.1),
                  transform: 'translateY(-1px)',
                  boxShadow: `0 2px 6px ${alpha(progressColor, 0.3)}`
                }
              }}
            >
              700ml
            </Button>
            <Button
              variant={selectedPreset === WATER_PRESETS.LARGE ? "contained" : "outlined"}
              size="small"
              onClick={() => handleAddWater(WATER_PRESETS.LARGE, 'preset-1L')}
              disabled={loading}
              sx={{
                flex: 1,
                borderRadius: 1.5,
                fontWeight: 600,
                transition: 'all 0.3s ease',
                backgroundColor: selectedPreset === WATER_PRESETS.LARGE ? progressColor : 'transparent',
                borderColor: alpha(progressColor, 0.5),
                color: selectedPreset === WATER_PRESETS.LARGE ? 'white' : progressColor,
                '&:hover': {
                  backgroundColor: selectedPreset === WATER_PRESETS.LARGE ? progressColor : alpha(progressColor, 0.1),
                  transform: 'translateY(-1px)',
                  boxShadow: `0 2px 6px ${alpha(progressColor, 0.3)}`
                }
              }}
            >
              1L
            </Button>
            {/* Clear Button - Inline */}
            <Button
              variant="outlined"
              size="small"
              onClick={handleClearWater}
              disabled={loading}
              sx={{
                minWidth: size === 'small' ? 50 : 60,
                borderRadius: 1.5,
                fontWeight: 600,
                fontSize: size === 'small' ? '0.65rem' : '0.7rem',
                py: size === 'small' ? 0.5 : 0.75,
                px: size === 'small' ? 0.5 : 1,
                borderColor: waterData.totalAmount === 0 
                  ? alpha('#FF5722', 0.3) 
                  : alpha('#FF5722', 0.5),
                color: waterData.totalAmount === 0 
                  ? alpha('#FF5722', 0.5) 
                  : '#FF5722',
                transition: 'all 0.3s ease',
                '&:hover': {
                  backgroundColor: waterData.totalAmount === 0 
                    ? 'transparent' 
                    : alpha('#FF5722', 0.1),
                  borderColor: waterData.totalAmount === 0 
                    ? alpha('#FF5722', 0.3) 
                    : '#FF5722',
                  transform: waterData.totalAmount === 0 
                    ? 'none' 
                    : 'translateY(-1px)',
                  boxShadow: waterData.totalAmount === 0 
                    ? 'none' 
                    : `0 2px 6px ${alpha('#FF5722', 0.3)}`
                },
                '&:disabled': {
                  borderColor: alpha('#FF5722', 0.3),
                  color: alpha('#FF5722', 0.3),
                  cursor: 'not-allowed'
                }
              }}
            >
              {waterData.totalAmount > 0 ? 'Clear' : 'None'}
            </Button>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

export default WaterCard;