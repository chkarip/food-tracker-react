import React from 'react';
import {
  Box,
  Typography,
} from '@mui/material';

interface ActivityStatsProps {
  currentStreak: number;
  longestStreak: number;
  completedDays: number;
  completionRate: number;
  primaryColor: string;
  showStreaks?: boolean;
  showCompletionRate?: boolean;
  showTotalDays?: boolean;
  customStats?: Array<{
    label: string;
    value: number | string;
    color?: string;
  }>;
}

const ActivityStats: React.FC<ActivityStatsProps> = ({
  currentStreak,
  longestStreak,
  completedDays,
  completionRate,
  primaryColor,
  showStreaks = true,
  showCompletionRate = true,
  showTotalDays = true,
  customStats = []
}) => {
  const defaultStats = [
    ...(showStreaks ? [
      {
        label: 'Current Streak',
        value: `${currentStreak} days`,
        color: primaryColor
      },
      {
        label: 'Best Streak',
        value: `${longestStreak} days`,
        color: primaryColor
      }
    ] : []),
    ...(showTotalDays ? [{
      label: 'Days Completed',
      value: completedDays,
      color: primaryColor
    }] : []),
    ...customStats
  ];

  return (
    <Box sx={{ mb: 1 }}>
      {/* Completion Rate */}
      {showCompletionRate && (
        <Box sx={{ mb: 1, textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.65rem' }}>
            Last 100 days • {completionRate}% completion
          </Typography>
        </Box>
      )}

      {/* Stats Grid */}
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-around',
        flexWrap: 'wrap',
        gap: 0.5,
        px: 0.5
      }}>
        {defaultStats.map((stat, index) => (
          <Box key={index} sx={{ textAlign: 'center', flex: 1, minWidth: 50 }}>
            <Typography 
              variant="h6" 
              sx={{ 
                fontWeight: 700, 
                color: stat.color || primaryColor,
                fontSize: '0.85rem',
                lineHeight: 1.1
              }}
            >
              {stat.value}
            </Typography>
            <Typography 
              variant="caption" 
              color="text.secondary"
              sx={{ 
                fontSize: '0.55rem',
                lineHeight: 1,
                display: 'block'
              }}
            >
              {stat.label}
            </Typography>
          </Box>
        ))}
      </Box>
    </Box>
  );
};

export default ActivityStats;
