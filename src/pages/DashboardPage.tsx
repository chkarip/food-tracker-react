/**
 * DashboardPage.tsx - Central Task Management Dashboard & Calendar System
 * 
 * BUSINESS PURPOSE:
 * This is the central command center for comprehensive task scheduling and tracking:
 * - A monthly calendar view showing ALL scheduled activities across all life areas
 * - Real-time task completion tracking and streak analytics
 * - Unified scheduling interface for any type of recurring activity or goal
 * - Multi-module integration for food, gym, finance, and custom task categories
 * 
 * KEY BUSINESS LOGIC:
 * 1. UNIFIED TASK ARCHITECTURE: Centralizes ALL user activities regardless of category
 *    (meals, workouts, financial goals, habits, projects, etc.) in one calendar view
 * 2. VISUAL TASK MANAGEMENT: Shows scheduled activities as colored pills on calendar days
 * 3. COMPLETION TRACKING: Monitors task completion rates and maintains streak information
 * 4. MODULE STATISTICS: Displays progress across all activity categories (food, gym, finance, custom)
 * 5. FLEXIBLE SCHEDULING: Supports any recurring pattern or one-time scheduled activities
 * 
 * DATA FLOW:
 * - Aggregates scheduled activities from ALL modules (food, gym, finance, custom tasks)
 * - Generates calendar view with task pills from unified scheduledActivities collection
 * - Handles task scheduling/unscheduling across any activity type
 * - Opens detailed day modal showing activities from ALL categories
 * 
 * BUSINESS VALUE:
 * - Centralizes entire life management in one intuitive calendar interface
 * - Provides visual feedback on goal achievement and activity consistency across all areas
 * - Enables easy scheduling and tracking of ANY type of activity or goal
 * - Supports data-driven life optimization through comprehensive analytics
 * - Scales to accommodate unlimited task categories and custom activities
 */
import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Container,
  Typography,
  alpha,
  useTheme,
  Button,
  Paper,
  IconButton,
  CircularProgress,
  Chip
} from '@mui/material';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { ActivityCard } from '../components/activity/Activity';
import Calendar from '../components/calendar/Calendar';
import DayModal from '../components/calendar/DayModal';
import { useModuleStats } from '../modules/shared/hooks/useModuleStats';
import { CalendarDay, CalendarEvent, ActivityData } from '../modules/shared/types';
import { 
  getDailyPlansForMonth,
  getActivityHistoryForMonth,
  getScheduledActivitiesForMonth,
  loadTimeslots,
  getScheduledWorkoutsForMonth
} from '../services/firebase';
import { DailyPlanDocument, ActivityHistoryDocument, ScheduledActivitiesDocument, ScheduledWorkoutDocument, TimeslotsDocument } from '../types/firebase';
import { ExpandMore as ExpandIcon, CalendarToday as CalendarIcon } from '@mui/icons-material';
import { GenericCard } from '../components/shared/cards';
import { loadMealPlan, loadScheduledWorkout } from '../services/firebase';
import { MealPlanDocument } from '../types/firebase';

const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<CalendarDay | null>(null);
  const [clickedDay, setClickedDay] = useState<CalendarDay | null>(null); // Track clicked days separately
  const [mealPlans, setMealPlans] = useState<DailyPlanDocument[]>([]);
  const [scheduledActivities, setScheduledActivities] = useState<ScheduledActivitiesDocument[]>([]);
  const [scheduledWorkouts, setScheduledWorkouts] = useState<ScheduledWorkoutDocument[]>([]);
  const [activityHistory, setActivityHistory] = useState<ActivityHistoryDocument[]>([]);
  const [loading, setLoading] = useState(false);
  const [calendarRefresh, setCalendarRefresh] = useState(0); // Force calendar updates
  const [isExpandedView, setIsExpandedView] = useState(false); // Control view mode
  const [selectedDayTimeslots, setSelectedDayTimeslots] = useState<TimeslotsDocument | null>(null);
  const [todayMealPlan, setTodayMealPlan] = useState<MealPlanDocument | null>(null);
  const [todayWorkout, setTodayWorkout] = useState<ScheduledWorkoutDocument | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // Module stats hooks
  const { stats: foodStats } = useModuleStats('food', user?.uid);
  const { stats: gymStats } = useModuleStats('gym', user?.uid);
  const { stats: financeStats } = useModuleStats('finance', user?.uid);

  // Generate sample activity data for the last 100 days
  const generateActivityData = (moduleType: 'food' | 'gym' | 'finance'): ActivityData[] => {
    const activities: ActivityData[] = [];
    const today = new Date();
    
    for (let i = 99; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateKey = date.toISOString().split('T')[0];
      
      // Check different data sources based on module type
      let completed = false;
      let value = 0;
      let maxValue = 1;
      
      if (moduleType === 'food') {
        // Check meal plans
        const dayPlan = mealPlans.find(plan => plan.date === dateKey);
        if (dayPlan) {
          const completedMeals = [
            dayPlan.completionStatus?.['6pm'],
            dayPlan.completionStatus?.['9:30pm']
          ].filter(Boolean).length;
          completed = completedMeals >= 2;
          value = completedMeals;
          maxValue = 2;
        }
      } else if (moduleType === 'gym') {
        // Check gym workouts from localStorage
        const gymWorkouts = JSON.parse(localStorage.getItem(`gym-workouts-${dateKey}`) || '[]');
        completed = gymWorkouts.some((w: any) => w.completed);
        value = gymWorkouts.filter((w: any) => w.completed).length;
        maxValue = Math.max(1, gymWorkouts.length || 1);
      } else if (moduleType === 'finance') {
        // Check finance transactions from localStorage
        const monthKey = dateKey.slice(0, 7);
        const transactions = JSON.parse(localStorage.getItem(`finance-transactions-${monthKey}`) || '[]')
          .filter((t: any) => t.date === dateKey);
        completed = transactions.length > 0;
        value = transactions.length;
        maxValue = Math.max(1, value);
      }
      
      if (completed || value > 0) {
        activities.push({
          date: dateKey,
          completed,
          value,
          maxValue
        });
      }
    }
    
    return activities;
  };

  const foodActivityData = generateActivityData('food');
  const gymActivityData = generateActivityData('gym');
  const financeActivityData = generateActivityData('finance');

  // Load meal plans for current month and additional data
  const loadMealPlans = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth(); // 0-based month
      console.log('DashboardPage: Loading data for:', { 
        year, 
        month, 
        monthName: currentDate.toLocaleDateString('en-US', { month: 'long' }),
        userId: user.uid 
      });
      
      // Load meal plans (legacy - for backward compatibility)
      const plans = await getDailyPlansForMonth(
        user.uid,
        currentDate.getFullYear(),
        currentDate.getMonth()
      );
      
      // Load scheduled activities (new structure)
      const activities = await getScheduledActivitiesForMonth(
        user.uid,
        currentDate.getFullYear(),
        currentDate.getMonth()
      );
      
      // Load scheduled workouts
      const workouts = await getScheduledWorkoutsForMonth(
        user.uid,
        currentDate.getFullYear(),
        currentDate.getMonth()
      );
      
      // Load activity history for the same month
      const history = await getActivityHistoryForMonth(
        user.uid,
        currentDate.getFullYear(),
        currentDate.getMonth() + 1 // API expects 1-based month
      );
      
      console.log('DashboardPage: Loaded plans:', plans.length, 'plans');
      console.log('DashboardPage: Loaded scheduled activities:', activities.length, 'activities');
      console.log('DashboardPage: Loaded scheduled workouts:', workouts.length, 'workouts');
      console.log('DashboardPage: Loaded activity history:', history.length, 'records');
      
      setMealPlans(plans);
      setScheduledActivities(activities);
      setScheduledWorkouts(workouts);
      setActivityHistory(history);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Load additional data for calendar display
  const loadAdditionalCalendarData = () => {
    // Force re-render to load localStorage data for gym and finance
    // This ensures the calendar updates when we navigate between months
    const today = new Date();
    const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const lastDay = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
    
    // Pre-load localStorage data for the current month view
    const currentIteration = new Date(firstDay);
    while (currentIteration <= lastDay) {
      const dateKey = currentIteration.toISOString().split('T')[0];
      
      // Touch localStorage items to ensure they're accessible
      localStorage.getItem(`gym-workouts-${dateKey}`);
      localStorage.getItem(`finance-transactions-${dateKey.slice(0, 7)}`);
      
      currentIteration.setDate(currentIteration.getDate() + 1);
    }
    
    // Force calendar refresh
    setCalendarRefresh(prev => prev + 1);
  };

  useEffect(() => {
    loadMealPlans();
    loadAdditionalCalendarData();
    
    // Add storage event listener for localStorage changes
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key?.includes('gym-workouts-') || e.key?.includes('finance-transactions-')) {
        setCalendarRefresh(prev => prev + 1);
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [currentDate, user]);

  // Generate calendar days with comprehensive task tracking
  const generateCalendarDays = (date: Date): CalendarDay[] => {
    const year = date.getFullYear();
    const month = date.getMonth();
    
    // Get first day of month and how many days to show from previous month
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    // Generate 42 days (6 weeks)
    const days: CalendarDay[] = [];
    const currentIteration = new Date(startDate);
    
    for (let i = 0; i < 42; i++) {
      const dayDate = new Date(currentIteration);
      const isCurrentMonth = dayDate.getMonth() === month;
      const isToday = dayDate.toDateString() === new Date().toDateString();
      const isPastDay = dayDate < new Date();
      const isWeekday = dayDate.getDay() !== 0; // Not Sunday
      
      // Find meal plan and scheduled activities for this day
      // Use local date to avoid timezone issues
      const year = dayDate.getFullYear();
      const month_num = (dayDate.getMonth() + 1).toString().padStart(2, '0');
      const day_num = dayDate.getDate().toString().padStart(2, '0');
      const dayKey = `${year}-${month_num}-${day_num}`;
      
      const mealPlan = mealPlans.find(plan => plan.date === dayKey);
      const scheduledActivity = scheduledActivities.find(activity => activity.date === dayKey);
      
      // Get activity history for this specific day
      const dayActivities = activityHistory.filter(activity => activity.date === dayKey);
      const activityMap = new Map<string, boolean>();
      dayActivities.forEach(activity => {
        activityMap.set(activity.activityType, activity.completed);
      });
      
      // Generate events based on scheduled activities and meal plans
      const events: CalendarEvent[] = [];
      
      // Food events - check scheduled activities first, then fallback to meal plans
      const scheduledTasks = scheduledActivity?.tasks || [];
      //console.log('📅 Generating day:', dayKey, { scheduledTasks });
      const has6pmScheduled = scheduledTasks.includes('meal-6pm');
      const has930pmScheduled = scheduledTasks.includes('meal-9:30pm');
      const hasGymScheduled = scheduledTasks.includes('gym');
      
      // Fallback to meal plans for backward compatibility
      const has6pmPlan = mealPlan?.timeslots?.['6pm']?.selectedFoods && mealPlan.timeslots['6pm'].selectedFoods.length > 0;
      const has930pmPlan = mealPlan?.timeslots?.['9:30pm']?.selectedFoods && mealPlan.timeslots['9:30pm'].selectedFoods.length > 0;
      
      // Show 6pm meal if scheduled or has plan data
      if (has6pmScheduled || has6pmPlan || activityMap.has('6pm')) {
        events.push({ 
          type: 'food', 
          title: '6pm Meal', 
          completed: activityMap.get('6pm') || false 
        });
      }
      
      // Show 9:30pm meal if scheduled or has plan data
      if (has930pmScheduled || has930pmPlan || activityMap.has('9:30pm')) {
        events.push({ 
          type: 'food', 
          title: '9:30pm Meal', 
          completed: activityMap.get('9:30pm') || false 
        });
      }
      
      // Check for scheduled workouts for this day
      const dayWorkouts = scheduledWorkouts.filter(workout => workout.scheduledDate === dayKey);
      
      // Show gym session if scheduled or has activity history
      if (dayWorkouts.length > 0) {
        dayWorkouts.forEach(workout => {
          events.push({ 
            type: 'gym', 
            title: `${workout.workoutType} (${workout.exercises.length} exercises)`, 
            completed: workout.status === 'completed',
            workoutId: workout.id
          });
        });
      } else if (hasGymScheduled || activityMap.has('gym') || (isCurrentMonth && isWeekday && !isPastDay)) {
        events.push({ 
          type: 'gym', 
          title: 'Gym Session', 
          completed: activityMap.get('gym') || false
        });
      }
      
      // Finance transactions (keep existing localStorage logic for now)
      const monthKey = dayKey.slice(0, 7);
      const financeTransactions = JSON.parse(localStorage.getItem(`finance-transactions-${monthKey}`) || '[]')
        .filter((t: any) => t.date === dayKey);
      if (financeTransactions.length > 0) {
        events.push({ 
          type: 'finance', 
          title: `${financeTransactions.length} transactions`, 
          completed: true 
        });
      }
      
      days.push({
        date: dayDate,
        isCurrentMonth,
        isToday,
        hasEvents: events.length > 0,
        events,
        scheduledTasks: scheduledTasks, // Add scheduled tasks from scheduledActivities collection
        moduleData: {
          food: (has6pmScheduled || has930pmScheduled || has6pmPlan || has930pmPlan || activityMap.has('6pm') || activityMap.has('9:30pm')) ? {
            hasMealPlan: Boolean(has6pmScheduled || has930pmScheduled || has6pmPlan || has930pmPlan),
            completedMeals: [activityMap.get('6pm'), activityMap.get('9:30pm')].filter(Boolean).length,
            totalMeals: 2
          } : {
            hasMealPlan: false,
            completedMeals: 0,
            totalMeals: 2
          },
          gym: (hasGymScheduled || activityMap.has('gym') || (isCurrentMonth && isWeekday)) ? {
            hasWorkout: true,
            completed: activityMap.get('gym') || false
          } : {
            hasWorkout: false,
            completed: false
          },
          finance: financeTransactions.length > 0 ? {
            hasTransactions: true,
            count: financeTransactions.length
          } : undefined
        }
      });
      
      currentIteration.setDate(currentIteration.getDate() + 1);
    }
    
    return days;
  };

  const calendarDays = useMemo(() => {
    return generateCalendarDays(currentDate);
  }, [currentDate, mealPlans, scheduledActivities, scheduledWorkouts, activityHistory, calendarRefresh]); // Include all data sources

  // Set today's date as default selected day when data is loaded (for compact view)
  useEffect(() => {
    if (calendarDays.length > 0 && !selectedDay && !isExpandedView) {
      const today = new Date();
      const todayDay = calendarDays.find(day => 
        day.date.toDateString() === today.toDateString()
      );
      if (todayDay) {
        setSelectedDay(todayDay);
      }
    }
  }, [calendarDays, selectedDay, isExpandedView]);

  // Load detailed data for today's selected day
  const loadTodayDetails = async () => {
    if (!selectedDay || !user || isExpandedView) return;
    
    setDetailLoading(true);
    try {
      // Use local date format to match calendar
      const year = selectedDay.date.getFullYear();
      const month = (selectedDay.date.getMonth() + 1).toString().padStart(2, '0');
      const day = selectedDay.date.getDate().toString().padStart(2, '0');
      const localDayKey = `${year}-${month}-${day}`;

      const scheduledActivity = scheduledActivities.find(activity => activity.date === localDayKey);
      const scheduledTasks = scheduledActivity?.tasks || [];

      // Load meal plan if meals are scheduled
      if (scheduledTasks.some(task => task.startsWith('meal-'))) {
        const meal = await loadMealPlan(user.uid, selectedDay.date);
        setTodayMealPlan(meal);
      } else {
        setTodayMealPlan(null);
      }

      // Load workout if gym is scheduled
      if (scheduledTasks.includes('gym-workout')) {
        const workout = await loadScheduledWorkout(user.uid, localDayKey);
        setTodayWorkout(workout);
      } else {
        setTodayWorkout(null);
      }
    } catch (error) {
      console.error('Error loading today details:', error);
    } finally {
      setDetailLoading(false);
    }
  };

  useEffect(() => {
    loadTodayDetails();
  }, [selectedDay, scheduledActivities, user, isExpandedView]);

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 1 : -1));
    setCurrentDate(newDate);
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const handleDayClick = async (day: CalendarDay) => {
    if (!day.isCurrentMonth || !user) return;
    
    setClickedDay(day);
    
    // Load detailed timeslots for the selected day
    console.log('🔍 Loading timeslots for selected day:', day.date.toISOString().split('T')[0]);
    try {
      const dayDateString = day.date.toISOString().split('T')[0];
      const timeslots = await loadTimeslots(user.uid, dayDateString);
      setSelectedDayTimeslots(timeslots);
      console.log('Timeslots loaded:', !!timeslots);
    } catch (error) {
      console.error('❌ Error loading timeslots:', error);
      setSelectedDayTimeslots(null);
    }
  };

  const formatDate = (date: Date): string => {
    return date.toISOString().split('T')[0];
  };

  const handleCreateMealPlan = () => {
    const dayToUse = clickedDay || selectedDay;
    if (dayToUse) {
      navigate(`/food?date=${formatDate(dayToUse.date)}`);
    }
    setClickedDay(null);
  };

  const handleCreateWorkout = () => {
    const dayToUse = clickedDay || selectedDay;
    if (dayToUse) {
      navigate(`/gym?date=${formatDate(dayToUse.date)}`);
    }
    setClickedDay(null);
  };

  // Helper function to get task metadata for pills
  const getTaskMeta = (task: string) => {
    switch (task) {
      case 'meal-6pm': 
        return { 
          icon: '', 
          title: '6:00 PM Meal', 
          color: '#3BBA75',
          subtitle: todayMealPlan?.timeslots?.['6pm'] ? `${todayMealPlan.timeslots['6pm'].selectedFoods?.length || 0} foods` : undefined,
          completed: false 
        };
      case 'meal-9:30pm': 
        return { 
          icon: '', 
          title: '9:30 PM Meal', 
          color: '#3BBA75',
          subtitle: todayMealPlan?.timeslots?.['9:30pm'] ? `${todayMealPlan.timeslots['9:30pm'].selectedFoods?.length || 0} foods` : undefined,
          completed: false 
        };
      case 'gym-workout': 
        return { 
          icon: '', 
          title: 'Gym Workout', 
          color: '#FF9800',
          subtitle: todayWorkout ? `${todayWorkout.exercises?.length || 0} exercises` : undefined,
          completed: todayWorkout?.status === 'completed' 
        };
      default: 
        return { 
          icon: '', 
          title: task, 
          color: '#90CAF9', 
          completed: false 
        };
    }
  };

  // Handle pill click to scroll to task section
  const handlePillClick = (task: string) => {
    // For now, just log - could be enhanced to scroll to section or open modal
    console.log('Pill clicked:', task);
  };

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h3" sx={{ fontWeight: 700, mb: 1 }}>
          Dashboard
        </Typography>
        <Typography variant="h6" color="text.secondary">
          Track your daily progress across all activities
        </Typography>
      </Box>

      {/* Module Activity Cube Cards */}
      <Box sx={{ 
        display: 'grid', 
        gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' },
        gap: 3, 
        mb: 4 
      }}>
        {foodStats && (
          <ActivityCard 
            stats={foodStats} 
            activityData={foodActivityData}
            preset="enhanced"
            size="medium"
          />
        )}
        {gymStats && (
          <ActivityCard 
            stats={gymStats} 
            activityData={gymActivityData}
            preset="enhanced"
            size="medium"
          />
        )}
        {financeStats && (
          <ActivityCard 
            stats={financeStats} 
            activityData={financeActivityData}
            preset="enhanced"
            size="medium"
          />
        )}
      </Box>

      {/* View Toggle */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'center' }}>
        <Button
          variant={isExpandedView ? "outlined" : "contained"}
          onClick={() => {
            setIsExpandedView(!isExpandedView);
            if (!isExpandedView) {
              // Switching to expanded view, clear any selected day from compact view
              setSelectedDay(null);
            } else {
              // Switching to compact view, set today's date
              const today = new Date();
              const todayDay = calendarDays.find(day => 
                day.date.toDateString() === today.toDateString()
              );
              if (todayDay) {
                setSelectedDay(todayDay);
              }
            }
          }}
          startIcon={isExpandedView ? <CalendarIcon /> : <ExpandIcon />}
          sx={{ 
            borderRadius: 2,
            px: 3,
            py: 1,
            fontSize: '1rem',
            fontWeight: 600
          }}
        >
          {isExpandedView ? 'Show Today\'s Details' : 'Expand to Full Calendar'}
        </Button>
      </Box>

      {/* Conditional Content */}
      {isExpandedView ? (
        /* Full Calendar View */
        <Calendar
          currentDate={currentDate}
          calendarDays={calendarDays}
          onNavigateMonth={navigateMonth}
          onGoToToday={goToToday}
          onDayClick={handleDayClick}
        />
      ) : (
        /* Compact Today's Details View */
        <Box sx={{ maxWidth: 1400, mx: 'auto' }}>
          <GenericCard
            variant="summary"
            size="lg"
            headerSlot={
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                <Typography variant="h5" sx={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                  Today's Schedule
                </Typography>
                <Typography variant="body2" sx={{ color: 'var(--text-secondary)' }}>
                  {new Date().toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </Typography>
              </Box>
            }
            bodySlot={
              <>
                {/* Today's Day Modal Content */}
                {selectedDay && (
                  <Box>
                    {detailLoading ? (
                      <Box display="flex" justifyContent="center" py={4}>
                        <CircularProgress size={24} />
                      </Box>
                    ) : (
                      <>
                        {/* Two-column layout */}
                        <Box sx={{
                          display: 'grid',
                          gridTemplateColumns: { xs: '1fr', md: '1.6fr 1fr' }, // ~60/40
                          gap: { xs: 2.5, md: 4 },
                          alignItems: 'start',
                          mt: 1
                        }}>
                          {/* Left: Food Program */}
                          <Box sx={{ minWidth: 0 }}>
                            {(() => {
                              const scheduledActivity = scheduledActivities.find(activity => 
                                activity.date === `${selectedDay.date.getFullYear()}-${(selectedDay.date.getMonth() + 1).toString().padStart(2, '0')}-${selectedDay.date.getDate().toString().padStart(2, '0')}`
                              );
                              const scheduledTasks = scheduledActivity?.tasks || [];
                              const hasMeals = scheduledTasks.some(task => task.startsWith('meal-'));

                              if (hasMeals && todayMealPlan) {
                                return (
                                  <>
                                    <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1.5, fontWeight: 600, color: 'var(--accent-green)' }}>
                                      Food Program
                                    </Typography>

                                    {/* Vertical layout for meals within food section */}
                                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                      {/* 6PM Meal */}
                                      {scheduledTasks.includes('meal-6pm') && todayMealPlan.timeslots['6pm'] && (
                                        <Box sx={{ p: 2, bgcolor: 'var(--surface-bg)', borderRadius: 1, border: '1px solid var(--border-color)' }}>
                                          <Typography variant="subtitle1" gutterBottom sx={{ color: 'var(--text-primary)' }}>
                                            6:00 PM Meal
                                          </Typography>
                                          {todayMealPlan.timeslots['6pm'].selectedFoods.map((food, idx) => (
                                            <Box key={idx} display="flex" justifyContent="space-between" mb={0.5}>
                                              <Typography variant="body2" sx={{ color: 'var(--text-primary)' }}>{food.name}</Typography>
                                              <Typography variant="body2" sx={{ color: 'var(--text-secondary)' }}>{food.amount}g</Typography>
                                            </Box>
                                          ))}
                                          
                                          {todayMealPlan.timeslots['6pm'].externalNutrition.calories > 0 && (
                                            <Typography variant="caption" sx={{ color: 'var(--text-secondary)' }}>
                                              + External: {todayMealPlan.timeslots['6pm'].externalNutrition.calories} cal
                                            </Typography>
                                          )}
                                        </Box>
                                      )}

                                      {/* 9:30PM Meal */}
                                      {scheduledTasks.includes('meal-9:30pm') && todayMealPlan.timeslots['9:30pm'] && (
                                        <Box sx={{ p: 2, bgcolor: 'var(--surface-bg)', borderRadius: 1, border: '1px solid var(--border-color)' }}>
                                          <Typography variant="subtitle1" gutterBottom sx={{ color: 'var(--text-primary)' }}>
                                            9:30 PM Meal
                                          </Typography>
                                          {todayMealPlan.timeslots['9:30pm'].selectedFoods.map((food, idx) => (
                                            <Box key={idx} display="flex" justifyContent="space-between" mb={0.5}>
                                              <Typography variant="body2" sx={{ color: 'var(--text-primary)' }}>{food.name}</Typography>
                                              <Typography variant="body2" sx={{ color: 'var(--text-secondary)' }}>{food.amount}g</Typography>
                                            </Box>
                                          ))}
                                          
                                          {todayMealPlan.timeslots['9:30pm'].externalNutrition.calories > 0 && (
                                            <Typography variant="caption" sx={{ color: 'var(--text-secondary)' }}>
                                              + External: {todayMealPlan.timeslots['9:30pm'].externalNutrition.calories} cal
                                            </Typography>
                                          )}
                                        </Box>
                                      )}
                                    </Box>

                                    {/* Total Macros - Full width within food section */}
                                    {todayMealPlan.totalMacros && (
                                      <Box sx={{ mt: 2, p: 2, bgcolor: 'var(--accent-blue)', color: 'white', borderRadius: 1 }}>
                                        <Typography variant="subtitle1" gutterBottom>
                                          Total Macros
                                        </Typography>
                                        <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                                          <Typography variant="body2">
                                            Protein: {Math.round(todayMealPlan.totalMacros.protein)}g
                                          </Typography>
                                          <Typography variant="body2">
                                            Fats: {Math.round(todayMealPlan.totalMacros.fats)}g
                                          </Typography>
                                          <Typography variant="body2">
                                            Carbs: {Math.round(todayMealPlan.totalMacros.carbs)}g
                                          </Typography>
                                          <Typography variant="body2">
                                            Calories: {Math.round(todayMealPlan.totalMacros.calories)}
                                          </Typography>
                                        </Box>
                                      </Box>
                                    )}
                                  </>
                                );
                              }
                              return null;
                            })()}
                          </Box>

                          {/* Right: Gym Workout */}
                          <Box sx={{ minWidth: 0, maxHeight: { md: 560, lg: 680 }, overflowY: 'auto', pr: 0.5 }}>
                            {(() => {
                              const scheduledActivity = scheduledActivities.find(activity => 
                                activity.date === `${selectedDay.date.getFullYear()}-${(selectedDay.date.getMonth() + 1).toString().padStart(2, '0')}-${selectedDay.date.getDate().toString().padStart(2, '0')}`
                              );
                              const scheduledTasks = scheduledActivity?.tasks || [];
                              const hasGym = scheduledTasks.includes('gym-workout');

                              if (hasGym && todayWorkout) {
                                return (
                                  <>
                                    <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1.5, fontWeight: 600, color: 'var(--accent-orange)' }}>
                                      Gym Workout
                                    </Typography>

                                    <Box sx={{ p: 2, bgcolor: 'var(--surface-bg)', borderRadius: 1, mb: 2, border: '1px solid var(--border-color)' }}>
                                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                        <Typography variant="h6" sx={{ color: 'var(--text-primary)' }}>
                                          {todayWorkout.name}
                                        </Typography>
                                        <Chip
                                          label={todayWorkout.status}
                                          color={todayWorkout.status === 'completed' ? 'success' : 'default'}
                                          size="small"
                                        />
                                      </Box>

                                      <Typography variant="subtitle2" gutterBottom sx={{ color: 'var(--text-secondary)' }}>
                                        {todayWorkout.exercises?.length || 0} Exercise{(todayWorkout.exercises?.length || 0) !== 1 ? 's' : ''}
                                      </Typography>
                                    </Box>

                                    {/* Render ALL exercises - no truncation */}
                                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                      {todayWorkout.exercises
                                        ?.sort((a, b) => a.order - b.order)
                                        .map((exercise) => (
                                          <Paper
                                            key={exercise.id || `${exercise.name}-${exercise.order}`}
                                            sx={{
                                              bgcolor: 'var(--card-bg)',
                                              border: '1px solid var(--border-color)',
                                              borderRadius: 2,
                                              p: 1.25,
                                              mb: 1,
                                              transition: 'all 0.3s ease',
                                              '&:hover': {
                                                bgcolor: 'var(--card-hover-bg)',
                                                transform: 'translateY(-1px)',
                                                boxShadow: 'var(--elevation-1)'
                                              }
                                            }}
                                          >
                                            <Typography variant="body2" sx={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                                              {exercise.name}
                                            </Typography>
                                            <Typography variant="caption" sx={{ color: 'var(--text-secondary)' }}>
                                              {exercise.kg}kg • {exercise.sets} sets × {exercise.reps} reps
                                            </Typography>
                                            {exercise.notes && (
                                              <Typography variant="caption" sx={{ color: 'var(--text-secondary)', display: 'block', mt: 0.5 }}>
                                                {exercise.notes}
                                              </Typography>
                                            )}
                                          </Paper>
                                        ))}
                                    </Box>

                                    {todayWorkout.notes && (
                                      <Box sx={{ mt: 2, p: 1.5, bgcolor: 'var(--surface-bg)', borderRadius: 1, border: '1px solid var(--border-color)' }}>
                                        <Typography variant="subtitle2" gutterBottom sx={{ color: 'var(--text-primary)' }}>
                                          Notes
                                        </Typography>
                                        <Typography variant="body2" sx={{ color: 'var(--text-primary)' }}>
                                          {todayWorkout.notes.length > 100 
                                            ? `${todayWorkout.notes.substring(0, 100)}...` 
                                            : todayWorkout.notes}
                                        </Typography>
                                      </Box>
                                    )}
                                  </>
                                );
                              }
                              return null;
                            })()}
                          </Box>
                        </Box>

                        {/* Action Buttons */}
                        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mt: 3 }}>
                          <Button
                            variant="contained"
                            onClick={handleCreateMealPlan}
                            sx={{
                              flex: 1,
                              minWidth: 150,
                              transition: 'all 300ms cubic-bezier(0.4, 0, 0.2, 1)',
                              background: (() => {
                                const scheduledActivity = scheduledActivities.find(activity => 
                                  activity.date === `${selectedDay.date.getFullYear()}-${(selectedDay.date.getMonth() + 1).toString().padStart(2, '0')}-${selectedDay.date.getDate().toString().padStart(2, '0')}`
                                );
                                const scheduledTasks = scheduledActivity?.tasks || [];
                                return scheduledTasks.includes('meal-6pm') || scheduledTasks.includes('meal-9:30pm')
                                  ? 'linear-gradient(135deg, var(--accent-green) 0%, rgba(59, 186, 117, 0.8) 100%)'
                                  : 'linear-gradient(135deg, var(--primary-main) 0%, rgba(25, 118, 210, 0.8) 100%)';
                              })(),
                              border: '1px solid var(--border-color)',
                              color: 'white',
                              fontWeight: 600,
                              fontSize: '0.9rem',
                              py: 1.5,
                              px: 2,
                              borderRadius: 2,
                              position: 'relative',
                              overflow: 'hidden',
                              boxShadow: 'var(--elevation-2)',
                              '&::before': {
                                content: '""',
                                position: 'absolute',
                                inset: 0,
                                background: 'linear-gradient(135deg, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0.05) 100%)',
                                opacity: 0,
                                transition: 'opacity 300ms ease'
                              },
                              '&:hover': {
                                transform: 'translateY(-3px) scale(1.02)',
                                boxShadow: 'var(--elevation-3)',
                                borderColor: 'var(--accent-green)',
                                '&::before': { opacity: 1 }
                              }
                            }}
                          >
                            {(() => {
                              const scheduledActivity = scheduledActivities.find(activity => 
                                activity.date === `${selectedDay.date.getFullYear()}-${(selectedDay.date.getMonth() + 1).toString().padStart(2, '0')}-${selectedDay.date.getDate().toString().padStart(2, '0')}`
                              );
                              const scheduledTasks = scheduledActivity?.tasks || [];
                              return scheduledTasks.includes('meal-6pm') || scheduledTasks.includes('meal-9:30pm')
                                ? 'Edit Meal Plan'
                                : 'Create Meal Plan';
                            })()}
                          </Button>
                          <Button
                            variant="contained"
                            onClick={handleCreateWorkout}
                            sx={{
                              flex: 1,
                              minWidth: 150,
                              transition: 'all 300ms cubic-bezier(0.4, 0, 0.2, 1)',
                              background: (() => {
                                const scheduledActivity = scheduledActivities.find(activity => 
                                  activity.date === `${selectedDay.date.getFullYear()}-${(selectedDay.date.getMonth() + 1).toString().padStart(2, '0')}-${selectedDay.date.getDate().toString().padStart(2, '0')}`
                                );
                                const scheduledTasks = scheduledActivity?.tasks || [];
                                return scheduledTasks.includes('gym-workout')
                                  ? 'linear-gradient(135deg, var(--accent-orange) 0%, rgba(255, 152, 0, 0.8) 100%)'
                                  : 'linear-gradient(135deg, var(--primary-main) 0%, rgba(25, 118, 210, 0.8) 100%)';
                              })(),
                              border: '1px solid var(--border-color)',
                              color: 'white',
                              fontWeight: 600,
                              fontSize: '0.9rem',
                              py: 1.5,
                              px: 2,
                              borderRadius: 2,
                              position: 'relative',
                              overflow: 'hidden',
                              boxShadow: 'var(--elevation-2)',
                              '&::before': {
                                content: '""',
                                position: 'absolute',
                                inset: 0,
                                background: 'linear-gradient(135deg, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0.05) 100%)',
                                opacity: 0,
                                transition: 'opacity 300ms ease'
                              },
                              '&:hover': {
                                transform: 'translateY(-3px) scale(1.02)',
                                boxShadow: 'var(--elevation-3)',
                                borderColor: 'var(--accent-orange)',
                                '&::before': { opacity: 1 }
                              }
                            }}
                          >
                            {(() => {
                              const scheduledActivity = scheduledActivities.find(activity => 
                                activity.date === `${selectedDay.date.getFullYear()}-${(selectedDay.date.getMonth() + 1).toString().padStart(2, '0')}-${selectedDay.date.getDate().toString().padStart(2, '0')}`
                              );
                              const scheduledTasks = scheduledActivity?.tasks || [];
                              return scheduledTasks.includes('gym-workout')
                                ? 'Edit Workout'
                                : 'Create Workout';
                            })()}
                          </Button>
                        </Box>
                      </>
                    )}
                  </Box>
                )}
              </>
            }
          />
        </Box>
      )}

      {/* Day Detail Modal (only shown in expanded view when clicking days) */}
      {isExpandedView && (
        <DayModal
          selectedDay={clickedDay}
          scheduledActivities={scheduledActivities}
          onClose={() => setClickedDay(null)}
          onCreateMealPlan={handleCreateMealPlan}
          onCreateWorkout={handleCreateWorkout}
        />
      )}
    </Container>
  );
};

export default DashboardPage;
