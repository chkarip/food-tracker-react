/**
 * DayCard.tsx - Calendar Day Display Component
 *
 * LOGIC SUMMARY:
 * - Renders a single day in the calendar grid.
 * - Shows the day number, highlights today, dims non-current month days.
 * - Displays scheduled tasks as color-coded pills (meals, gym, others).
 * - Converts technical task names to readable labels.
 * - Handles click for day selection and management.
 *
 * BUSINESS VALUE:
 * - Quick visual feedback on daily adherence and engagement.
 * - Supports fast scanning of activity patterns and program consistency.
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
        
  {/* Scheduled tasks: color-coded pills for quick review */}
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