/**
 * Calendar.tsx - Main Calendar Grid Component
 *
 * APP LOGIC OVERVIEW:
 * - Hosts the calendar grid for the life tracker app.
 * - Displays each day as a DayCard, showing scheduled tasks for quick review.
 * - Provides navigation (month switching, go to today).
 * - Weekday headers and compact grid layout for easy scanning.
 * - Integrates with DayCard for visual feedback on daily program adherence.
 *
 * BUSINESS VALUE:
 * - Central hub for tracking and scheduling all activities.
 * - Enables fast navigation and overview of daily/weekly/monthly patterns.
 * - Supports engagement and consistency by making all scheduled tasks visible.
 */
import React from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  IconButton,
  alpha,
  useTheme
} from '@mui/material';
import {
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  Today as TodayIcon
} from '@mui/icons-material';
import { CalendarDay } from '../modules/shared/types';
import DayCard from './DayCard';

interface CalendarProps {
  currentDate: Date;
  calendarDays: CalendarDay[];
  onNavigateMonth: (direction: 'prev' | 'next') => void;
  onGoToToday: () => void;
  onDayClick: (day: CalendarDay) => void;
}

const Calendar: React.FC<CalendarProps> = ({
  currentDate,
  calendarDays,
  onNavigateMonth,
  onGoToToday,
  onDayClick
}) => {
  const theme = useTheme();
  
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const monthYear = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  // ...existing code...

  return (
    <Card sx={{ borderRadius: 4 }}>
      <CardContent sx={{ p: 3 }}>
  {/* Calendar Header: Month, navigation, today button */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
          <Typography variant="h5" sx={{ fontWeight: 600 }}>
            {monthYear}
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="outlined"
              size="small"
              startIcon={<TodayIcon />}
              onClick={onGoToToday}
            >
              Today
            </Button>
            <IconButton onClick={() => onNavigateMonth('prev')}>
              <ChevronLeftIcon />
            </IconButton>
            <IconButton onClick={() => onNavigateMonth('next')}>
              <ChevronRightIcon />
            </IconButton>
          </Box>
        </Box>

  {/* Calendar Grid: Weekday headers and DayCards */}
        <Box sx={{ mb: 2 }}>
          {/* Week days header */}
          <Box sx={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(7, 1fr)',
            gap: 1, 
            mb: 1 
          }}>
            {weekDays.map((day) => (
              <Typography
                key={day}
                variant="body2"
                sx={{
                  textAlign: 'center',
                  fontWeight: 600,
                  color: 'text.secondary',
                  py: 1
                }}
              >
                {day}
              </Typography>
            ))}
          </Box>

          {/* Calendar days: Each day rendered as DayCard */}
          <Box sx={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(7, 1fr)',
            gap: 1 
          }}>
            {calendarDays.map((day: CalendarDay, index: number) => (
              <DayCard
                key={index}
                day={day}
                onDayClick={onDayClick}
              />
            ))}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

export default Calendar;