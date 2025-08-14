import React, { useMemo } from 'react';
import {
  Card,
  CardContent,
  Box,
  alpha
} from '@mui/material';
import { ModuleStats, ActivityData } from '../../modules/shared/types';
import { ActivityGridDay } from './ActivityGrid';
import ActivityHeader from './ActivityHeader';
import ActivityGridSection from './ActivityGridSection';
import ActivityStats from './ActivityStats';
import ActivityAction from './ActivityAction';

interface ActivityCardProps {
  // Core data
  stats: ModuleStats;
  activityData?: ActivityData[];
  
  // Card configuration
  size?: 'small' | 'medium' | 'large';
  preset?: 'default' | 'enhanced' | 'compact' | 'minimal';
  
  // Loading and error states
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  
  // Customization options
  showHeader?: boolean;
  showGrid?: boolean;
  showStats?: boolean;
  showAction?: boolean;
  
  // Grid configuration
  dayCount?: number;
  gridTitle?: string;
  
  // Stats configuration
  showStreaks?: boolean;
  showCompletionRate?: boolean;
  showTotalDays?: boolean;
  customStats?: Array<{
    label: string;
    value: number | string;
    color?: string;
  }>;
  
  // Action configuration
  actionLabel?: string;
  actionRoute?: string;
  onActionClick?: () => void;
  actionDisabled?: boolean;
  actionVariant?: 'contained' | 'outlined' | 'text';
  
  // Custom styling
  gradient?: string;
  borderRadius?: number;
  elevation?: number;
}

const ActivityCard: React.FC<ActivityCardProps> = ({
  stats,
  activityData = [],
  size = 'medium',
  preset = 'enhanced',
  loading = false,
  error = null,
  onRetry,
  showHeader = true,
  showGrid = true,
  showStats = true,
  showAction = true,
  dayCount = 100,
  gridTitle,
  showStreaks = true,
  showCompletionRate = true,
  showTotalDays = true,
  customStats = [],
  actionLabel,
  actionRoute,
  onActionClick,
  actionDisabled = false,
  actionVariant = 'contained',
  gradient,
  borderRadius = 4,
  elevation = 1
}) => {
  // Convert ActivityData to ActivityGridDay format for the grid
  const gridActivityData: ActivityGridDay[] = useMemo(() => {
    const days = [];
    const today = new Date();
    
    for (let i = dayCount - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateKey = date.toISOString().split('T')[0];
      
      // Find activity for this day
      const dayActivity = activityData.find(activity => 
        activity.date === dateKey
      );
      
      days.push({
        date: dateKey,
        dateObj: date,
        completed: dayActivity?.completed || false,
        value: dayActivity?.value || 0,
        maxValue: dayActivity?.maxValue || 1,
        isToday: dateKey === today.toISOString().split('T')[0],
        isWeekend: date.getDay() === 0 || date.getDay() === 6
      });
    }
    
    return days;
  }, [activityData, dayCount]);

  // Calculate statistics
  const currentStreak = useMemo(() => {
    let streak = 0;
    for (let i = gridActivityData.length - 1; i >= 0; i--) {
      if (gridActivityData[i].completed) {
        streak++;
      } else {
        break;
      }
    }
    return streak;
  }, [gridActivityData]);

  const longestStreak = useMemo(() => {
    let maxStreak = 0;
    let currentStreak = 0;
    
    gridActivityData.forEach((day: ActivityGridDay) => {
      if (day.completed) {
        currentStreak++;
        maxStreak = Math.max(maxStreak, currentStreak);
      } else {
        currentStreak = 0;
      }
    });
    
    return maxStreak;
  }, [gridActivityData]);

  const completionRate = useMemo(() => {
    const completed = gridActivityData.filter((day: ActivityGridDay) => day.completed).length;
    return Math.round((completed / gridActivityData.length) * 100);
  }, [gridActivityData]);

  const completedDays = useMemo(() => {
    return gridActivityData.filter((day: ActivityGridDay) => day.completed).length;
  }, [gridActivityData]);

  const getCardHeight = () => {
    switch (size) {
      case 'small': return 200;
      case 'large': return 280;
      default: return 240; // Reduced for 5-row grid layout
    }
  };

  const primaryColor = gradient || stats.gradient;

  return (
    <Card 
      sx={{ 
        height: getCardHeight(),
        borderRadius: borderRadius,
        background: `linear-gradient(135deg, ${alpha(primaryColor, 0.05)}, ${alpha(primaryColor, 0.02)})`,
        border: `1px solid ${alpha(primaryColor, 0.15)}`,
        transition: 'all 0.3s ease',
        boxShadow: elevation,
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: `0 8px 24px ${alpha(primaryColor, 0.15)}`,
        }
      }}
    >
      <CardContent sx={{ 
        p: size === 'small' ? 1.5 : 2.5, 
        height: '100%', 
        display: 'flex', 
        flexDirection: 'column',
        '& > *:last-child': { mb: 0 }
      }}>
        {/* Header */}
        {showHeader && (
          <ActivityHeader
            title={stats.title}
            description={stats.description}
            icon={stats.icon}
            primaryColor={primaryColor}
            size={size}
          />
        )}

        {/* Activity Grid */}
        {showGrid && (
          <ActivityGridSection
            activityData={gridActivityData}
            size={size}
            preset={preset}
            primaryColor={primaryColor}
            loading={loading}
            error={error}
            onRetry={onRetry}
            title={gridTitle || `Last ${dayCount} Days`}
            dayCount={dayCount}
          />
        )}

        {/* Statistics */}
        {showStats && !loading && !error && (
          <ActivityStats
            currentStreak={currentStreak}
            longestStreak={longestStreak}
            completedDays={completedDays}
            completionRate={completionRate}
            primaryColor={primaryColor}
            showStreaks={showStreaks}
            showCompletionRate={showCompletionRate}
            showTotalDays={showTotalDays}
            customStats={customStats}
          />
        )}

        {/* Action Button */}
        {showAction && (
          <Box sx={{ mt: 0.5 }}>
            <ActivityAction
              label={actionLabel || stats.actionButton.label}
              route={actionRoute || stats.actionButton.route}
              onClick={onActionClick}
              primaryColor={primaryColor}
              disabled={actionDisabled}
              variant={actionVariant}
              size={size === 'small' ? 'small' : 'medium'}
            />
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default ActivityCard;
