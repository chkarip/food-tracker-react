// Main Activity Component - Unified activity tracking system
import React, { useState, useEffect, useMemo } from 'react';
import { 
  Box, 
  Typography, 
  Tooltip, 
  Card, 
  CardContent, 
  Stack, 
  Chip, 
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControlLabel,
  Checkbox,
  alpha,
  useTheme 
} from '@mui/material';
import { ActivityDay, ActivityMonth } from '../../types/activity';

interface ActivityData {
  date: string;
  completed: boolean;
  value: number;
  maxValue: number;
  activities: string[];
}

interface ActivityProps {
  title?: string;
  description?: string;
  activityType?: string;
  currentMonth?: Date;
  onActivityClick?: (activityId: string) => void;
  onDayClick?: (date: string) => void;
  primaryColor?: string;
  dayCount?: number;
}

const Activity: React.FC<ActivityProps> = ({ 
  title = "Activity Tracker",
  description = "Track your daily activities",
  activityType = "general",
  currentMonth = new Date(),
  onActivityClick,
  onDayClick,
  primaryColor = '#4CAF50',
  dayCount = 100
}) => {
  const theme = useTheme();
  const [activityData, setActivityData] = useState<ActivityData[]>([]);
  const [selectedDay, setSelectedDay] = useState<ActivityData | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  // Storage key for persistence
  const storageKey = `activity_${activityType}`;

  // Load activity data from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      try {
        setActivityData(JSON.parse(saved));
      } catch (error) {
        console.error('Error loading activity data:', error);
      }
    }
  }, [storageKey]);

  // Save activity data to localStorage
  const saveActivityData = (data: ActivityData[]) => {
    localStorage.setItem(storageKey, JSON.stringify(data));
    setActivityData(data);
  };

  // Generate grid data for the last N days
  const gridData = useMemo(() => {
    const days = [];
    const today = new Date();
    
    for (let i = dayCount - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateKey = date.toISOString().split('T')[0];
      
      // Find existing activity data for this day
      const dayActivity = activityData.find(activity => activity.date === dateKey);
      
      days.push({
        date: dateKey,
        dateObj: date,
        completed: dayActivity?.completed || false,
        value: dayActivity?.value || 0,
        maxValue: dayActivity?.maxValue || 1,
        activities: dayActivity?.activities || [],
        isToday: dateKey === today.toISOString().split('T')[0],
        isWeekend: date.getDay() === 0 || date.getDay() === 6
      });
    }
    
    return days;
  }, [activityData, dayCount]);

  // Calculate stats
  const stats = useMemo(() => {
    const completed = gridData.filter(day => day.completed).length;
    const partial = gridData.filter(day => !day.completed && day.value > 0).length;
    const streak = calculateStreak(gridData);
    const completionRate = Math.round((completed / gridData.length) * 100);
    
    return { completed, partial, streak, completionRate, total: gridData.length };
  }, [gridData]);

  // Calculate current streak
  const calculateStreak = (data: typeof gridData) => {
    let streak = 0;
    for (let i = data.length - 1; i >= 0; i--) {
      if (data[i].completed) {
        streak++;
      } else {
        break;
      }
    }
    return streak;
  };

  // Get activity intensity (0-1 scale)
  const getIntensity = (completed: boolean, value: number, maxValue: number) => {
    if (!completed && value === 0) return 0;
    if (completed) return 1;
    return Math.min(value / maxValue, 0.8);
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

  // Handle day click
  const handleDayClick = (day: typeof gridData[0]) => {
    setSelectedDay({
      date: day.date,
      completed: day.completed,
      value: day.value,
      maxValue: day.maxValue,
      activities: day.activities
    });
    setDialogOpen(true);
    onDayClick?.(day.date);
  };

  // Toggle completion for a day
  const toggleCompletion = (date: string) => {
    const updatedData = [...activityData];
    const existingIndex = updatedData.findIndex(item => item.date === date);
    
    if (existingIndex >= 0) {
      updatedData[existingIndex].completed = !updatedData[existingIndex].completed;
      if (updatedData[existingIndex].completed) {
        updatedData[existingIndex].value = updatedData[existingIndex].maxValue;
      }
    } else {
      updatedData.push({
        date,
        completed: true,
        value: 1,
        maxValue: 1,
        activities: []
      });
    }
    
    saveActivityData(updatedData);
    
    // Update selected day if it's open
    if (selectedDay && selectedDay.date === date) {
      const updated = updatedData.find(item => item.date === date);
      if (updated) {
        setSelectedDay(updated);
      }
    }
  };

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          🏃‍♂️ {title}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {description}
        </Typography>
      </Box>

      {/* Stats Cards */}
      <Stack direction="row" spacing={2} sx={{ mb: 3 }}>
        <Card variant="outlined" sx={{ flex: 1 }}>
          <CardContent sx={{ textAlign: 'center', py: 2 }}>
            <Typography variant="h4" color="success.main">
              {stats.completed}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Completed
            </Typography>
          </CardContent>
        </Card>
        
        <Card variant="outlined" sx={{ flex: 1 }}>
          <CardContent sx={{ textAlign: 'center', py: 2 }}>
            <Typography variant="h4" color="warning.main">
              {stats.partial}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Partial
            </Typography>
          </CardContent>
        </Card>
        
        <Card variant="outlined" sx={{ flex: 1 }}>
          <CardContent sx={{ textAlign: 'center', py: 2 }}>
            <Typography variant="h4" color="primary.main">
              {stats.streak}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Streak
            </Typography>
          </CardContent>
        </Card>
        
        <Card variant="outlined" sx={{ flex: 1 }}>
          <CardContent sx={{ textAlign: 'center', py: 2 }}>
            <Typography variant="h4" color="info.main">
              {stats.completionRate}%
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Rate
            </Typography>
          </CardContent>
        </Card>
      </Stack>
      
      {/* Activity Grid */}
      <Card variant="outlined" sx={{ mb: 2 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Activity Grid (Last {dayCount} days)
          </Typography>
          
          <Box sx={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(20, 1fr)',
            gridTemplateRows: 'repeat(5, 1fr)',
            gap: 1,
            p: 2,
            aspectRatio: '4/1'
          }}>
            {gridData.map((day, index) => {
              const intensity = getIntensity(day.completed, day.value, day.maxValue);
              const color = getActivityColor(intensity, day.isToday);
              
              return (
                <Tooltip
                  key={day.date}
                  title={
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {day.dateObj.toLocaleDateString('en-US', { 
                          weekday: 'short', 
                          month: 'short', 
                          day: 'numeric' 
                        })}
                      </Typography>
                      <Typography variant="caption">
                        {day.completed ? 'Completed' : 
                         day.value > 0 ? `Partial (${day.value}/${day.maxValue})` : 
                         'No activity'}
                      </Typography>
                      {day.isToday && (
                        <Typography variant="caption" color="primary.main" display="block">
                          Today
                        </Typography>
                      )}
                    </Box>
                  }
                  placement="top"
                >
                  <Box
                    onClick={() => handleDayClick(day)}
                    sx={{
                      width: '100%',
                      height: '100%',
                      minHeight: 16,
                      backgroundColor: color,
                      borderRadius: 1,
                      border: day.isToday ? `2px solid ${theme.palette.primary.main}` : 'none',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        transform: 'scale(1.1)',
                        zIndex: 1,
                      }
                    }}
                  />
                </Tooltip>
              );
            })}
          </Box>
        </CardContent>
      </Card>

      {/* Day Detail Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        {selectedDay && (
          <>
            <DialogTitle>
              Activity Details - {new Date(selectedDay.date).toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </DialogTitle>
            <DialogContent>
              <Stack spacing={2}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={selectedDay.completed}
                      onChange={() => toggleCompletion(selectedDay.date)}
                      color="success"
                    />
                  }
                  label="Mark as completed"
                />
                
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Status: {selectedDay.completed ? 
                      <Chip label="Completed" color="success" size="small" /> : 
                      selectedDay.value > 0 ? 
                      <Chip label={`Partial (${selectedDay.value}/${selectedDay.maxValue})`} color="warning" size="small" /> :
                      <Chip label="No activity" color="default" size="small" />
                    }
                  </Typography>
                </Box>

                {selectedDay.activities.length > 0 && (
                  <Box>
                    <Typography variant="subtitle2" gutterBottom>
                      Activities:
                    </Typography>
                    <Stack direction="row" spacing={1} flexWrap="wrap">
                      {selectedDay.activities.map((activity, index) => (
                        <Chip key={index} label={activity} size="small" variant="outlined" />
                      ))}
                    </Stack>
                  </Box>
                )}
              </Stack>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setDialogOpen(false)}>Close</Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
};

export default Activity;

// Export ActivityCard for DashboardPage compatibility
export { default as ActivityCard } from './ActivityCard';

// Export the correct types
export type { ActivityDay, ActivityMonth } from '../../types/activity';
