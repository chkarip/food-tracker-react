/**
 * DayCard.tsx - Calendar Day Display Component
 * 
 * BUSINESS PURPOSE:
 * Individual calendar day representation that provides:
 * - Visual day number display with current day highlighting
 * - Scheduled activity pills showing planned tasks for the day
 * - Color-coded task indicators (blue for meals, orange for gym)
 * - Click interaction for detailed day management
 * 
 * KEY BUSINESS LOGIC:
 * 1. TASK VISUALIZATION: Displays scheduled activities as small colored pills
 * 2. TASK CATEGORIZATION: Different colors for meal tasks vs gym workouts
 * 3. USER-FRIENDLY LABELS: Converts technical task names (meal-6pm) to readable format (MEAL 6PM)
 * 4. INTERACTIVE DESIGN: Hover effects and click handling for day selection
 * 
 * VISUAL DESIGN PATTERNS:
 * - Current day gets special highlighting with primary color background
 * - Non-current month days are dimmed (40% opacity)
 * - Task pills use theme colors: primary (meals), secondary (gym), grey (others)
 * - Compact design fits multiple tasks in small calendar grid cells
 * 
 * BUSINESS VALUE:
 * - Provides immediate visual feedback on daily program adherence
 * - Enables quick scanning of weekly/monthly activity patterns
 * - Supports program consistency by making scheduled activities visible
 * - Encourages engagement through clear visual progress indicators
 */
import React from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  alpha,
  useTheme,
  Chip
} from '@mui/material';
import { CalendarDay } from '../modules/shared/types';

// Extend CalendarDay to ensure scheduledTasks is available
interface ExtendedCalendarDay extends CalendarDay {
  scheduledTasks?: string[];
}

interface DayCardProps {
  day: ExtendedCalendarDay;
  onDayClick: (day: ExtendedCalendarDay) => void;
}

const DayCard: React.FC<DayCardProps> = ({ day, onDayClick }) => {
  const theme = useTheme();

  return (
    <Card
      sx={{
        minHeight: 80,
        cursor: day.isCurrentMonth ? 'pointer' : 'default',
        opacity: day.isCurrentMonth ? 1 : 0.4,
        bgcolor: day.isToday ? alpha(theme.palette.primary.main, 0.1) : 'background.paper',
        borderColor: day.isToday ? 'primary.main' : 'divider',
        '&:hover': day.isCurrentMonth ? {
          bgcolor: alpha(theme.palette.primary.main, 0.05),
        } : {}
      }}
      onClick={() => onDayClick(day)}
    >
      <CardContent sx={{ p: 1 }}>
        <Typography
          variant="body2"
          sx={{
            fontWeight: day.isToday ? 600 : 400,
            color: day.isToday ? 'primary.main' : 'text.primary',
            mb: 0.5
          }}
        >
          {day.date.getDate()}
        </Typography>
        
        {/* Show scheduled tasks as pills */}
        {day.scheduledTasks && day.scheduledTasks.length > 0 && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, mt: 1 }}>
            {day.scheduledTasks.map((task: string, index: number) => (
              <Chip
                key={index}
                label={task.replace(/-/g, ' ').toUpperCase()}
                size="small"
                sx={{
                  height: 16,
                  fontSize: '0.65rem',
                  '& .MuiChip-label': {
                    px: 0.5
                  },
                  bgcolor: task.startsWith('meal-') 
                    ? alpha(theme.palette.primary.main, 0.1)
                    : task === 'gym-workout'
                    ? alpha(theme.palette.secondary.main, 0.1)
                    : alpha(theme.palette.grey[500], 0.1),
                  color: task.startsWith('meal-')
                    ? 'primary.main'
                    : task === 'gym-workout'
                    ? 'secondary.main'
                    : 'text.secondary'
                }}
              />
            ))}
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default DayCard;