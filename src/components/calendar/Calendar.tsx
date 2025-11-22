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
  // Button removed
  IconButton,
  alpha,
  useTheme
} from '@mui/material';
import  AccentButton  from '../shared/AccentButton';
import {
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  Today as TodayIcon,
  KeyboardArrowLeft as BackIcon
} from '@mui/icons-material';
import { CalendarDay } from '../../modules/shared/types';
import DayCard from './DayCard';

interface CalendarProps {
  currentDate: Date;
  calendarDays: CalendarDay[];
  onNavigateMonth: (direction: 'prev' | 'next') => void;
  onGoToToday: () => void;
  onDayClick: (day: CalendarDay) => void;
  onBackToToday?: () => void;
}

const Calendar: React.FC<CalendarProps> = ({
  currentDate,
  calendarDays,
  onNavigateMonth,
  onGoToToday,
  onDayClick,
  onBackToToday
}) => {
  const theme = useTheme();
  
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const monthYear = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  // ...existing code...

  return (
    <Card sx={{ 
      background: 'linear-gradient(135deg, var(--card-bg) 0%, rgba(33, 150, 243, 0.05) 100%)',
      border: '1px solid var(--border-color)',
      borderLeft: '4px solid var(--accent-blue)',
      boxShadow: 'var(--elevation-1)',
      borderRadius: '12px',
      position: 'relative',
      '&::before': {
        content: '""',
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'linear-gradient(135deg, rgba(33, 150, 243, 0.03) 0%, rgba(33, 150, 243, 0.02) 50%, rgba(33, 150, 243, 0.01) 100%)',
        borderRadius: '12px',
        pointerEvents: 'none',
      },
    }}>
      <CardContent sx={{ p: 3 }}>
  {/* Calendar Header: Month, navigation, today button */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            {onBackToToday && (
              <Box
                onClick={onBackToToday}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 32,
                  height: 32,
                  borderRadius: '8px',
                  backgroundColor: 'var(--accent-green)',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    backgroundColor: 'var(--accent-green-hover)',
                    transform: 'scale(1.05)',
                  }
                }}
              >
                <BackIcon sx={{ color: 'white', fontSize: 20 }} />
              </Box>
            )}
            <Typography variant="h5" sx={{ fontWeight: 600 }}>
              {monthYear}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
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