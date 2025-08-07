import React, { useMemo } from 'react';
import {
  Box,
  Tooltip,
  Typography,
  alpha,
  useTheme
} from '@mui/material';
import { getActivityGridConfig } from '../config/activityGridConfig';

export interface ActivityGridDay {
  date: string;
  dateObj: Date;
  completed: boolean;
  value: number;
  maxValue: number;
  isToday: boolean;
  isWeekend: boolean;
}

export interface ActivityGridProps {
  /** Activity data for the last N days */
  activityData?: ActivityGridDay[];
  /** Size preset (small/medium/large) */
  size?: 'small' | 'medium' | 'large';
  /** Configuration preset to use */
  preset?: 'default' | 'compact' | 'enhanced' | 'minimal';
  /** Number of days to display (default: from config) */
  dayCount?: number;
  /** Size of each cube in pixels (overrides config) */
  cubeSize?: number;
  /** Gap between cubes in pixels (overrides config) */
  gap?: number;
  /** Number of columns in the grid (default: from config) */
  columns?: number;
  /** Primary color/gradient for completed activities */
  primaryColor?: string;
  /** Show hover effects (default: true) */
  showHover?: boolean;
  /** Show tooltips (default: true) */
  showTooltips?: boolean;
  /** Custom tooltip content renderer */
  renderTooltip?: (day: ActivityGridDay) => React.ReactNode;
  /** Cube border radius (overrides config) */
  borderRadius?: number;
  /** Today border width (overrides config) */
  todayBorderWidth?: number;
}

const ActivityGrid: React.FC<ActivityGridProps> = ({
  activityData = [],
  size = 'medium',
  preset = 'default',
  dayCount,
  cubeSize,
  gap,
  columns,
  primaryColor = '#4CAF50',
  showHover = true,
  showTooltips = true,
  renderTooltip,
  borderRadius,
  todayBorderWidth,
}) => {
  const theme = useTheme();
  
  // Get configuration from preset and size
  const config = getActivityGridConfig(size, preset);
  
  // Use provided props or fall back to config
  const finalConfig = {
    dayCount: dayCount ?? config.dayCount,
    cubeSize: cubeSize ?? config.cubeSize,
    gap: gap ?? config.gap,
    columns: columns ?? config.columns,
    borderRadius: borderRadius ?? config.borderRadius,
    todayBorderWidth: todayBorderWidth ?? config.todayBorderWidth,
    hoverScale: config.hoverScale,
    transitionDuration: config.transitionDuration
  };

  // Generate last N days of activity data
  const gridData = useMemo(() => {
    const days = [];
    const today = new Date();
    
    for (let i = finalConfig.dayCount - 1; i >= 0; i--) {
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
  }, [activityData, finalConfig.dayCount]);

  // Calculate completion intensity (0-1 scale)
  const getIntensity = (completed: boolean, value: number, maxValue: number) => {
    if (!completed && value === 0) return 0;
    if (completed) return 1;
    return Math.min(value / maxValue, 0.8); // Cap at 80% for partial completion
  };

  // Get color based on intensity
  const getActivityColor = (intensity: number, isToday: boolean) => {
    if (isToday) {
      return theme.palette.primary.main;
    }
    if (intensity === 0) {
      return alpha(theme.palette.action.disabled, 0.1);
    }
    return alpha(primaryColor, 0.2 + (intensity * 0.8));
  };

  // Default tooltip renderer
  const defaultTooltipRenderer = (day: ActivityGridDay) => (
    <Box>
      <Typography variant="body2" sx={{ fontWeight: 600 }}>
        {day.dateObj.toLocaleDateString('en-US', { 
          weekday: 'short', 
          month: 'short', 
          day: 'numeric' 
        })}
      </Typography>
      <Typography variant="caption">
        {day.completed ? 'Completed' : day.value > 0 ? `Partial (${day.value}/${day.maxValue})` : 'No activity'}
      </Typography>
      {day.isToday && (
        <Typography variant="caption" color="primary.main" display="block">
          Today
        </Typography>
      )}
    </Box>
  );

  const tooltipRenderer = renderTooltip || defaultTooltipRenderer;

  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: `repeat(${finalConfig.columns}, 1fr)`,
        gap: `${finalConfig.gap}px`,
        maxWidth: `${(finalConfig.cubeSize + finalConfig.gap) * finalConfig.columns}px`,
        mx: 'auto'
      }}
    >
      {gridData.map((day, index) => {
        const intensity = getIntensity(day.completed, day.value, day.maxValue);
        const color = getActivityColor(intensity, day.isToday);
        
        const CubeComponent = (
          <Box
            sx={{
              width: finalConfig.cubeSize,
              height: finalConfig.cubeSize,
              backgroundColor: color,
              borderRadius: finalConfig.borderRadius,
              border: day.isToday ? `${finalConfig.todayBorderWidth}px solid ${theme.palette.primary.main}` : 'none',
              cursor: 'pointer',
              transition: `all ${finalConfig.transitionDuration} ease`,
              ...(showHover && {
                '&:hover': {
                  transform: `scale(${finalConfig.hoverScale})`,
                  zIndex: 1,
                }
              })
            }}
          />
        );

        if (showTooltips) {
          return (
            <Tooltip
              key={day.date}
              title={tooltipRenderer(day)}
              placement="top"
            >
              {CubeComponent}
            </Tooltip>
          );
        }

        return <Box key={day.date}>{CubeComponent}</Box>;
      })}
    </Box>
  );
};

export default ActivityGrid;
