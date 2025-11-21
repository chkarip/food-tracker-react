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
 * 2. VISUAL TASK MANAGEMENT: Shows sched                        <Box sx={{
                          position: 'relative',
                          minHeight: 500, // Increased to accommodate stacked cards with 40px offset
                          width: '100%',
                          overflow: 'visible' // Ensure cards aren't clipped
                        }}>activities as colored pills on calendar days
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
import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Paper,
  Typography,
  Button,
  CircularProgress
} from '@mui/material';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import Calendar from '../components/calendar/Calendar';
import DayModal from '../components/calendar/DayModal';
import { useModuleStats } from '../modules/shared/hooks/useModuleStats';
import { CalendarDay, CalendarEvent, ActivityData } from '../modules/shared/types';
import { 
  getActivityHistoryForMonth,
  loadTimeslots,
  getScheduledWorkoutsForMonth,
  useMonthlyScheduledActivities,
  useDailyPlansForMonth
} from '../services/firebase';
import { getWaterIntakeForMonth } from '../services/firebase/water/waterService';
import { DailyPlanDocument, ActivityHistoryDocument, ScheduledActivitiesDocument, ScheduledWorkoutDocument } from '../types/firebase';
import { ExpandMore as ExpandIcon, CalendarToday as CalendarIcon } from '@mui/icons-material';
import { GenericCard } from '../components/shared/cards';
import { TodayScheduleStack } from '../components/shared/TodayScheduleStack';

const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<CalendarDay | null>(null);
  const [clickedDay, setClickedDay] = useState<CalendarDay | null>(null); // Track clicked days separately
  const [mealPlans, setMealPlans] = useState<DailyPlanDocument[]>([]);
  const [scheduledActivities, setScheduledActivities] = useState<ScheduledActivitiesDocument[]>([]);
  const [scheduledWorkouts, setScheduledWorkouts] = useState<ScheduledWorkoutDocument[]>([]);
  const [activityHistory, setActivityHistory] = useState<ActivityHistoryDocument[]>([]);
  const [calendarRefresh, setCalendarRefresh] = useState(0); // Force calendar updates
  const [isExpandedView, setIsExpandedView] = useState(false); // Control view mode
  const [calendarDays, setCalendarDays] = useState<CalendarDay[]>([]);
  const [calendarDataLoaded, setCalendarDataLoaded] = useState(false);
  const [dayModalLoading, setDayModalLoading] = useState(false);

  // Module stats hooks
  const { stats: foodStats } = useModuleStats('food', user?.uid);
  const { stats: gymStats } = useModuleStats('gym', user?.uid);
  const { stats: financeStats } = useModuleStats('finance', user?.uid);

  // React Query hooks for calendar data
  const { data: monthlyScheduledActivities, isLoading: scheduledActivitiesLoading } = useMonthlyScheduledActivities(
    user?.uid || '', 
    currentDate.getFullYear(), 
    currentDate.getMonth()
  );
  const { data: monthlyDailyPlans, isLoading: dailyPlansLoading } = useDailyPlansForMonth(
    user?.uid || '', 
    currentDate.getFullYear(), 
    currentDate.getMonth()
  );

  // Generate sample activity data for the last 100 days
  const generateActivityData = (moduleType: 'food' | 'gym' | 'finance'): ActivityData[] => {
    const activities: ActivityData[] = [];
    
    for (let i = 99; i >= 0; i--) {
      const date = new Date();
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

  // Load only today's data for initial compact view
  const loadTodayData = async () => {
    if (!user) return;

    try {
      // Don't load scheduled activities for compact view - only needed for calendar
      setScheduledActivities([]);
      setMealPlans([]); // Clear monthly data
      setScheduledWorkouts([]); // Clear monthly data
      setActivityHistory([]); // Clear monthly data
    } catch (error) {
      console.error('Error loading today data:', error);
    }
  };

  // Load full month data for calendar view - now uses React Query hooks
  const loadFullMonthData = async () => {
    if (!user) return;

    setCalendarDataLoaded(false);
    try {
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth();

      // Use React Query data instead of direct calls
      const plans = monthlyDailyPlans || [];
      const activities = monthlyScheduledActivities || [];

      // Load other data that still needs direct calls
      const [workouts, history] = await Promise.all([
        getScheduledWorkoutsForMonth(user.uid, year, month),
        getActivityHistoryForMonth(user.uid, year, month + 1)
      ]);

      setMealPlans(plans);
      setScheduledActivities(activities);
      setScheduledWorkouts(workouts);
      setActivityHistory(history);
      setCalendarDataLoaded(true);
    } catch (error) {
      console.error('Error loading full month data:', error);
      setCalendarDataLoaded(true); // Set to true even on error to prevent infinite loading
    }
  };

  // Load additional data for calendar display
  const loadAdditionalCalendarData = () => {
    // Force re-render to load localStorage data for gym and finance
    // This ensures the calendar updates when we navigate between months
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
    loadTodayData();
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
  }, [user]); // Remove currentDate dependency since we start with today's data

  // Generate calendar days with comprehensive task tracking
  const generateCalendarDays = async (date: Date): Promise<CalendarDay[]> => {
    const year = date.getFullYear();
    const month = date.getMonth();
    
    // Get first day of month and how many days to show from previous month
    const firstDay = new Date(year, month, 1);
    
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    // Load all water intake data for the current month to avoid 42 individual requests
    const waterDataMap = new Map<string, any>();
    if (user) {
      try {
        const monthlyWaterData = await getWaterIntakeForMonth(user.uid, year, month + 1); // API expects 1-based month
        monthlyWaterData.forEach(waterDoc => {
          waterDataMap.set(waterDoc.date, waterDoc);
        });
      } catch (error) {
        console.error('Error loading monthly water data:', error);
      }
    }
    
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
      
      // Get water intake for this day from the pre-loaded monthly data
      const waterIntake = waterDataMap.get(dayKey) || null;
      
      // Generate events based on scheduled activities and meal plans
      const events: CalendarEvent[] = [];
      
      // Food events - check scheduled activities first, then fallback to meal plans
      const scheduledTasks = scheduledActivity?.tasks || [];
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
          } : undefined,
          water: waterIntake ? {
            hasIntake: waterIntake.totalAmount > 0,
            totalAmount: waterIntake.totalAmount,
            goalAchieved: waterIntake.goalAchieved,
            entries: waterIntake.entries.length
          } : {
            hasIntake: false,
            totalAmount: 0,
            goalAchieved: false,
            entries: 0
          }
        }
      });
      
      currentIteration.setDate(currentIteration.getDate() + 1);
    }
    
    return days;
  };

  // Load calendar days asynchronously - only when expanded view and data is loaded
  useEffect(() => {
    const loadCalendarDays = async () => {
      if (!user || !isExpandedView || !calendarDataLoaded) return;
      try {
        const days = await generateCalendarDays(currentDate);
        setCalendarDays(days);
      } catch (error) {
        console.error('Error loading calendar days:', error);
      }
    };
    loadCalendarDays();
  }, [currentDate, mealPlans, scheduledActivities, scheduledWorkouts, activityHistory, calendarRefresh, user, isExpandedView, calendarDataLoaded, monthlyScheduledActivities, monthlyDailyPlans]);

  // Set today's date as default selected day when data is loaded (for compact view)
  useEffect(() => {
    if (!isExpandedView && scheduledActivities.length >= 0 && !selectedDay) {
      // Create a mock today day for compact view
      const today = new Date();
      const todayKey = today.toISOString().split('T')[0];
      
      // Find today's scheduled activity
      const todayScheduledActivity = scheduledActivities.find(activity => activity.date === todayKey);
      
      const todayDay: CalendarDay = {
        date: today,
        isCurrentMonth: true,
        isToday: true,
        hasEvents: !!(todayScheduledActivity?.tasks?.length),
        events: [], // We'll populate this in the compact view
        scheduledTasks: todayScheduledActivity?.tasks || [],
        moduleData: {
          food: { hasMealPlan: false, completedMeals: 0, totalMeals: 2 },
          gym: { hasWorkout: false, completed: false },
          finance: undefined,
          water: { hasIntake: false, totalAmount: 0, goalAchieved: false, entries: 0 }
        }
      };
      
      setSelectedDay(todayDay);
    }
  }, [scheduledActivities, selectedDay, isExpandedView, monthlyScheduledActivities]);

  const navigateMonth = async (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 1 : -1));
    setCurrentDate(newDate);
    
    // Reload full month data for the new month if in expanded view
    if (isExpandedView) {
      // Temporarily store the new date for loading
      const tempDate = new Date(newDate);
      setTimeout(async () => {
        const year = tempDate.getFullYear();
        const month = tempDate.getMonth();
        
        setCalendarDataLoaded(false);
        try {
          // Use React Query data instead of direct calls
          const plans = monthlyDailyPlans || [];
          const activities = monthlyScheduledActivities || [];

          // Load other data that still needs direct calls
          const [workouts, history] = await Promise.all([
            getScheduledWorkoutsForMonth(user!.uid, year, month),
            getActivityHistoryForMonth(user!.uid, year, month + 1)
          ]);

          setMealPlans(plans);
          setScheduledActivities(activities);
          setScheduledWorkouts(workouts);
          setActivityHistory(history);
          setCalendarDataLoaded(true);
        } catch (error) {
          console.error('Error loading new month data:', error);
          setCalendarDataLoaded(true);
        }
      }, 0);
    }
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const handleDayClick = async (day: CalendarDay) => {
    if (!day.isCurrentMonth || !user) return;
    
    setClickedDay(day);
    setDayModalLoading(true);
    
    try {
      // Load detailed timeslots for the selected day
      const dayDateString = day.date.toISOString().split('T')[0];
      await loadTimeslots(user.uid, dayDateString);
    } catch (error) {
      console.error('Error loading timeslots:', error);
    } finally {
      setDayModalLoading(false);
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

  return (
    <Box sx={{ minHeight: '100vh', p: 2 }}>
      <Paper
        sx={{
          borderRadius: 4,
          overflow: 'hidden',
          backgroundColor: 'var(--card-bg)',
          border: '1px solid var(--border-color)',
          boxShadow: 'var(--elevation-1)',
          width: { xs: '100%', lg: '80%' },
          maxWidth: 1200,
          mx: 'auto'
        }}
      >
        <Box sx={{ p: 3, backgroundColor: 'var(--surface-bg)' }}>
          {/* Conditional Content */}
          {isExpandedView ? (
            /* Full Calendar View */
            !calendarDataLoaded ? (
              <Box display="flex" justifyContent="center" py={8}>
                <Box textAlign="center">
                  <CircularProgress size={48} sx={{ mb: 2 }} />
                  <Typography variant="h6" color="text.secondary">
                    Loading calendar data...
                  </Typography>
                </Box>
              </Box>
            ) : (
              <Calendar
                currentDate={currentDate}
                calendarDays={calendarDays}
                onNavigateMonth={navigateMonth}
                onGoToToday={goToToday}
                onDayClick={handleDayClick}
              />
            )
          ) : (
            /* Compact Today's Details View */
            <Box>
          {/* Header with Title and Expand Button side by side */}
          <Box
            display="flex"
            flexDirection={{ xs: 'column', sm: 'row' }}
            alignItems="center"
            justifyContent="space-between"
            sx={{ mb: 2 }}
          >
            <Typography variant="h3" sx={{ fontWeight: 700, mb: { xs: 2, sm: 0 } }}>
              Dashboard
            </Typography>

            <Button
              variant="contained"
              color="primary"
              onClick={async () => {
                const newExpandedView = !isExpandedView;
                setIsExpandedView(newExpandedView);

                if (newExpandedView) {
                  // Switching to expanded view - load full month data
                  await loadFullMonthData();
                  // Clear any selected day from compact view
                  setSelectedDay(null);
                } else {
                  // Switching to compact view - reload today's data and set today's date
                  await loadTodayData();
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
                borderRadius: 5,
                px: 4,
                minWidth: { xs: '100%', sm: 'auto' }
              }}
            >
              {isExpandedView ? "Show Today's Details" : 'Expand to Full Calendar'}
            </Button>
          </Box>

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
                {/* Schedule Cards */}
                {selectedDay && (
                  <TodayScheduleStack
                    gymStats={gymStats}
                    gymActivityData={gymActivityData}
                  />
                )}
              </>
            }
          />
        </Box>
      )}

      {/* Day Detail Modal (only shown in expanded view when clicking days) */}
      {isExpandedView && clickedDay && (
        dayModalLoading ? (
          <Box
            position="fixed"
            top={0}
            left={0}
            right={0}
            bottom={0}
            bgcolor="rgba(0,0,0,0.5)"
            display="flex"
            alignItems="center"
            justifyContent="center"
            zIndex={1300}
          >
            <Box textAlign="center" bgcolor="background.paper" p={4} borderRadius={2}>
              <CircularProgress size={48} sx={{ mb: 2 }} />
              <Typography variant="h6" color="text.secondary">
                Loading day details...
              </Typography>
            </Box>
          </Box>
        ) : (
          <DayModal
            selectedDay={clickedDay}
            scheduledActivities={scheduledActivities}
            onClose={() => setClickedDay(null)}
            onCreateMealPlan={handleCreateMealPlan}
            onCreateWorkout={handleCreateWorkout}
          />
        )
      )}
        </Box>
      </Paper>
    </Box>
  );
};

export default DashboardPage;
