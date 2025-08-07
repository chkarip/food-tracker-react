import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Chip,
  alpha,
  useTheme
} from '@mui/material';
import {
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  Today as TodayIcon,
  Restaurant as FoodIcon,
  FitnessCenter as GymIcon,
  Close as CloseIcon,
  CheckCircle as CheckCircleIcon,
  RadioButtonUnchecked as RadioButtonUncheckedIcon
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { ActivityCard } from '../components/Activity';
import { useModuleStats } from '../modules/shared/hooks/useModuleStats';
import { CalendarDay, CalendarEvent, ActivityData } from '../modules/shared/types';
import { 
  getDailyPlansForMonth, 
  getActivityHistoryForMonth,
  getScheduledActivitiesForMonth,
  loadTimeslots,
  saveActivityHistory,
  saveDailyPlan
} from '../services/firestoreService';
import { DailyPlanDocument, ActivityHistoryDocument, ScheduledActivitiesDocument, TimeslotsDocument } from '../types/firebase';

const DashboardPage: React.FC = () => {
  const theme = useTheme();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<CalendarDay | null>(null);
  const [mealPlans, setMealPlans] = useState<DailyPlanDocument[]>([]);
  const [scheduledActivities, setScheduledActivities] = useState<ScheduledActivitiesDocument[]>([]);
  const [activityHistory, setActivityHistory] = useState<ActivityHistoryDocument[]>([]);
  const [selectedDayTimeslots, setSelectedDayTimeslots] = useState<TimeslotsDocument | null>(null);
  const [loading, setLoading] = useState(false);
  const [calendarRefresh, setCalendarRefresh] = useState(0); // Force calendar updates

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
      console.log('🔍 DashboardPage: Loading data for:', { 
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
      
      // Load activity history for the same month
      const history = await getActivityHistoryForMonth(
        user.uid,
        currentDate.getFullYear(),
        currentDate.getMonth() + 1 // API expects 1-based month
      );
      
      console.log('🎯 DashboardPage: Loaded plans:', plans.length, 'plans');
      console.log('🎯 DashboardPage: Loaded scheduled activities:', activities.length, 'activities');
      console.log('🎯 DashboardPage: Loaded activity history:', history.length, 'records');
      
      setMealPlans(plans);
      setScheduledActivities(activities);
      setActivityHistory(history);
    } catch (error) {
      console.error('❌ Error loading data:', error);
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
      const dayKey = dayDate.toISOString().split('T')[0];
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
      const has6pmScheduled = scheduledActivity?.scheduledActivities?.['meal-6pm'] || false;
      const has930pmScheduled = scheduledActivity?.scheduledActivities?.['meal-9:30pm'] || false;
      const hasGymScheduled = scheduledActivity?.scheduledActivities?.['gym'] || false;
      const hasMorningScheduled = scheduledActivity?.scheduledActivities?.['morning'] || false;
      
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
      
      // Show gym session if scheduled or has activity history
      if (hasGymScheduled || activityMap.has('gym') || (isCurrentMonth && isWeekday && !isPastDay)) {
        events.push({ 
          type: 'gym', 
          title: 'Gym Session', 
          completed: activityMap.get('gym') || false
        });
      }
      
      // Show morning routine if scheduled or has activity history
      if (hasMorningScheduled || activityMap.has('morning') || (isCurrentMonth && !isPastDay)) {
        events.push({ 
          type: 'other', 
          title: 'Morning Routine', 
          completed: activityMap.get('morning') || false
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
  }, [currentDate, mealPlans, scheduledActivities, activityHistory, calendarRefresh]); // Include all data sources

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
    
    setSelectedDay(day);
    
    // Load detailed timeslots for the selected day
    console.log('🔍 Loading timeslots for selected day:', day.date.toISOString().split('T')[0]);
    try {
      const timeslots = await loadTimeslots(user.uid, day.date);
      setSelectedDayTimeslots(timeslots);
      console.log('✅ Timeslots loaded:', !!timeslots);
    } catch (error) {
      console.error('❌ Error loading timeslots:', error);
      setSelectedDayTimeslots(null);
    }
  };

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'food': return '🍽️';
      case 'gym': return '💪';
      case 'finance': return '💰';
      default: return '📅';
    }
  };

  const formatDate = (date: Date): string => {
    return date.toISOString().split('T')[0];
  };

  const handleCreateMealPlan = () => {
    if (selectedDay) {
      navigate(`/food?date=${formatDate(selectedDay.date)}`);
    }
    setSelectedDay(null);
  };

  const handleTaskToggle = async (activityType: '6pm' | '9:30pm' | 'gym' | 'morning', completed: boolean) => {
    if (!user || !selectedDay) return;
    
    console.log('🎯 DashboardPage: Task toggle initiated:', { 
      activityType, 
      completed, 
      userId: user.uid,
      date: selectedDay.date.toISOString().split('T')[0]
    });
    
    try {
      const dayKey = selectedDay.date.toISOString().split('T')[0];
      
      console.log('📊 Saving to activity history...');
      // Save to activity history
      await saveActivityHistory(user.uid, dayKey, activityType, completed);
      console.log('✅ Activity history saved successfully');
      
      // Immediately update local state for instant UI feedback
      const newActivityRecord = {
        id: `${user.uid}_${dayKey}_${activityType}`,
        userId: user.uid,
        activityType,
        date: dayKey,
        completed,
        createdAt: new Date() as any,
        updatedAt: new Date() as any
      };
      
      // Update activity history state immediately
      setActivityHistory(prev => {
        const filtered = prev.filter(a => !(a.date === dayKey && a.activityType === activityType));
        return [...filtered, newActivityRecord];
      });
      
      console.log('✅ Local activity history updated immediately');
      
      // For food activities (6pm/9:30pm), also ensure meal plan exists if completing
      if ((activityType === '6pm' || activityType === '9:30pm') && completed) {
        const existingPlan = mealPlans.find(plan => plan.date === dayKey);
        
        if (!existingPlan) {
          // Create a minimal meal plan entry for the specific timeslot
          const minimalPlan = {
            '6pm': {
              selectedFoods: activityType === '6pm' ? [{ name: 'Quick Meal', amount: 1 }] : [],
              externalNutrition: { protein: 0, fats: 0, carbs: 0, calories: 0 }
            },
            '9:30pm': {
              selectedFoods: activityType === '9:30pm' ? [{ name: 'Quick Meal', amount: 1 }] : [],
              externalNutrition: { protein: 0, fats: 0, carbs: 0, calories: 0 }
            }
          };
          
          console.log('Creating minimal meal plan for food activity completion');
          await saveDailyPlan(user.uid, minimalPlan, selectedDay.date);
          console.log('✅ Minimal meal plan created');
          
          // Refresh meal plans after creating new one
          await loadMealPlans();
        }
      }
      
      // Update the selected day with the new data
      const updatedCalendarDays = generateCalendarDays(currentDate);
      const updatedDay = updatedCalendarDays.find(d => 
        d.date.toDateString() === selectedDay.date.toDateString()
      );
      if (updatedDay) {
        setSelectedDay(updatedDay);
        console.log('✅ Selected day updated');
      }
      
      // Force calendar refresh to show updated completion status
      setCalendarRefresh(prev => prev + 1);
      console.log('✅ Calendar refresh triggered');
      
    } catch (error) {
      console.error('❌ Error updating activity completion:', error);
      // Show user-friendly error message
      alert(`Failed to update task: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  // Helper function to get activity completion status from activity history
  const getActivityStatus = (activityType: '6pm' | '9:30pm' | 'gym' | 'morning'): boolean => {
    if (!selectedDay) {
      console.log('❌ getActivityStatus: No selected day');
      return false;
    }
    
    const dayKey = selectedDay.date.toISOString().split('T')[0];
    const dayActivities = activityHistory.filter(activity => activity.date === dayKey);
    const activity = dayActivities.find(a => a.activityType === activityType);
    
    console.log('🔍 getActivityStatus:', { 
      activityType, 
      dayKey, 
      totalActivities: activityHistory.length, 
      dayActivities: dayActivities.length,
      foundActivity: !!activity,
      completed: activity?.completed || false 
    });
    
    return activity?.completed || false;
  };

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const monthYear = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

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

      {/* Calendar */}
      <Card sx={{ borderRadius: 4 }}>
        <CardContent sx={{ p: 3 }}>
          {/* Calendar Header */}
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
            <Typography variant="h5" sx={{ fontWeight: 600 }}>
              {monthYear}
            </Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                variant="outlined"
                size="small"
                startIcon={<TodayIcon />}
                onClick={goToToday}
              >
                Today
              </Button>
              <IconButton onClick={() => navigateMonth('prev')}>
                <ChevronLeftIcon />
              </IconButton>
              <IconButton onClick={() => navigateMonth('next')}>
                <ChevronRightIcon />
              </IconButton>
            </Box>
          </Box>

          {/* Calendar Grid */}
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

            {/* Calendar days */}
            <Box sx={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(7, 1fr)',
              gap: 1 
            }}>
              {calendarDays.map((day: CalendarDay, index: number) => (
                <Card
                  key={index}
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
                  onClick={() => handleDayClick(day)}
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
                    
                    {/* Event indicators */}
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {day.events.slice(0, 3).map((event: any, eventIndex: number) => (
                        <Box
                          key={eventIndex}
                          sx={{
                            minWidth: 16,
                            height: 16,
                            borderRadius: 1,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '0.6rem',
                            bgcolor: event.completed 
                              ? event.type === 'food' ? 'success.main'
                              : event.type === 'gym' ? 'warning.main'
                              : event.type === 'finance' ? 'info.main'
                              : 'secondary.main'
                              : alpha(theme.palette.text.secondary, 0.3),
                            color: event.completed ? 'white' : 'text.secondary',
                            border: event.completed ? 'none' : `1px dashed ${theme.palette.text.secondary}`,
                            opacity: event.completed ? 1 : 0.7,
                          }}
                        >
                          {getEventIcon(event.type)}
                        </Box>
                      ))}
                      {day.events.length > 3 && (
                        <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.6rem', alignSelf: 'center' }}>
                          +{day.events.length - 3}
                        </Typography>
                      )}
                    </Box>
                  </CardContent>
                </Card>
              ))}
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* Day Detail Dialog */}
      <Dialog
        open={!!selectedDay}
        onClose={() => setSelectedDay(null)}
        maxWidth="md"
        fullWidth
      >
        {selectedDay && (
          <>
            <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box>
                <Typography variant="h6">
                  {selectedDay.date.toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    year: 'numeric',
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {(() => {
                    const completedTasks = selectedDay.events.filter(e => e.completed).length;
                    const totalTasks = selectedDay.events.length;
                    return totalTasks > 0 
                      ? `${completedTasks}/${totalTasks} tasks completed`
                      : 'No tasks scheduled';
                  })()}
                </Typography>
              </Box>
              <IconButton onClick={() => setSelectedDay(null)}>
                <CloseIcon />
              </IconButton>
            </DialogTitle>
            
            <DialogContent>
              {/* Always show task scheduling options */}
              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  📅 Daily Tasks
                </Typography>
                
                {/* Find meal plan for this day */}
                {(() => {
                  const dayKey = selectedDay.date.toISOString().split('T')[0];
                  const mealPlan = mealPlans.find(plan => plan.date === dayKey);
                  const scheduledActivity = scheduledActivities.find(activity => activity.date === dayKey);
                  
                  // Use loaded timeslots or fallback to meal plan timeslots
                  const timeslots = selectedDayTimeslots?.timeslots || mealPlan?.timeslots;
                  const totalMacros = selectedDayTimeslots?.totalMacros || mealPlan?.totalMacros;
                  
                  console.log('🔍 Modal data sources:', {
                    hasSelectedDayTimeslots: !!selectedDayTimeslots,
                    hasMealPlan: !!mealPlan,
                    hasScheduledActivity: !!scheduledActivity,
                    hasTimeslots: !!timeslots
                  });
                  
                  return (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      {/* Meal Plan Section */}
                      {timeslots ? (
                        <>
                          <Typography variant="subtitle1" sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 2, mb: 1 }}>
                            <FoodIcon color="primary" />
                            Meal Plan
                          </Typography>
                          
                          {/* 6:00 PM Timeslot */}
                          {timeslots['6pm'] && timeslots['6pm'].selectedFoods.length > 0 && (
                            <Card variant="outlined">
                              <CardContent>
                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                                  <Typography variant="subtitle2" fontWeight="bold">
                                    🌅 6:00 PM - Afternoon Meal
                                  </Typography>
                                  <Chip
                                    icon={getActivityStatus('6pm') ? <CheckCircleIcon /> : <RadioButtonUncheckedIcon />}
                                    label={getActivityStatus('6pm') ? 'Completed' : 'Pending'}
                                    color={getActivityStatus('6pm') ? 'success' : 'default'}
                                    size="small"
                                    clickable
                                    onClick={() => handleTaskToggle('6pm', !getActivityStatus('6pm'))}
                                  />
                                </Box>
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, ml: 2 }}>
                                  {timeslots['6pm'].selectedFoods.map((food: any, index: number) => (
                                    <Typography key={index} variant="body2" color="text.secondary">
                                      • {food.name} - {food.amount}{['Eggs', 'Tortilla wrap', 'Canned tuna'].some(unitFood => food.name.includes(unitFood)) ? ' unit(s)' : 'g'}
                                    </Typography>
                                  ))}
                                </Box>
                              </CardContent>
                            </Card>
                          )}

                          {/* 9:30 PM Timeslot */}
                          {timeslots['9:30pm'] && timeslots['9:30pm'].selectedFoods.length > 0 && (
                            <Card variant="outlined">
                              <CardContent>
                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                                  <Typography variant="subtitle2" fontWeight="bold">
                                    🌙 9:30 PM - Evening Meal
                                  </Typography>
                                  <Chip
                                    icon={getActivityStatus('9:30pm') ? <CheckCircleIcon /> : <RadioButtonUncheckedIcon />}
                                    label={getActivityStatus('9:30pm') ? 'Completed' : 'Pending'}
                                    color={getActivityStatus('9:30pm') ? 'success' : 'default'}
                                    size="small"
                                    clickable
                                    onClick={() => handleTaskToggle('9:30pm', !getActivityStatus('9:30pm'))}
                                  />
                                </Box>
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, ml: 2 }}>
                                  {timeslots['9:30pm'].selectedFoods.map((food: any, index: number) => (
                                    <Typography key={index} variant="body2" color="text.secondary">
                                      • {food.name} - {food.amount}{['Eggs', 'Tortilla wrap', 'Canned tuna'].some(unitFood => food.name.includes(unitFood)) ? ' unit(s)' : 'g'}
                                    </Typography>
                                  ))}
                                </Box>
                              </CardContent>
                            </Card>
                          )}
                        </>
                      ) : (
                        <Box>
                          <Card variant="outlined" sx={{ bgcolor: 'grey.50', mb: 2 }}>
                            <CardContent>
                              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  <FoodIcon color="disabled" />
                                  <Typography variant="subtitle2" color="text.secondary">
                                    No detailed meal plan found
                                  </Typography>
                                </Box>
                                <Button
                                  variant="outlined"
                                  size="small"
                                  startIcon={<FoodIcon />}
                                  onClick={handleCreateMealPlan}
                                >
                                  Plan Meals
                                </Button>
                              </Box>
                            </CardContent>
                          </Card>
                          
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                            Or mark meals as completed without detailed planning:
                          </Typography>
                          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
                            <Chip
                              icon={getActivityStatus('6pm') ? <CheckCircleIcon /> : <RadioButtonUncheckedIcon />}
                              label="6pm Meal"
                              color={getActivityStatus('6pm') ? 'success' : 'default'}
                              size="small"
                              clickable
                              onClick={() => handleTaskToggle('6pm', !getActivityStatus('6pm'))}
                            />
                            <Chip
                              icon={getActivityStatus('9:30pm') ? <CheckCircleIcon /> : <RadioButtonUncheckedIcon />}
                              label="9:30pm Meal"
                              color={getActivityStatus('9:30pm') ? 'success' : 'default'}
                              size="small"
                              clickable
                              onClick={() => handleTaskToggle('9:30pm', !getActivityStatus('9:30pm'))}
                            />
                          </Box>
                        </Box>
                      )}

                      {/* Other Tasks Section */}
                      <Typography variant="subtitle1" sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 2, mb: 1 }}>
                        🎯 Other Activities
                      </Typography>

                      {/* Gym Session */}
                      <Card variant="outlined">
                        <CardContent>
                          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <GymIcon color="warning" />
                              <Typography variant="subtitle2" fontWeight="bold">
                                Gym Session
                              </Typography>
                              {scheduledActivity?.scheduledActivities?.['gym'] && (
                                <Chip label="Scheduled" size="small" color="info" variant="outlined" />
                              )}
                            </Box>
                            <Chip
                              icon={getActivityStatus('gym') ? <CheckCircleIcon /> : <RadioButtonUncheckedIcon />}
                              label={getActivityStatus('gym') ? 'Completed' : 'Pending'}
                              color={getActivityStatus('gym') ? 'success' : 'default'}
                              size="small"
                              clickable
                              onClick={() => handleTaskToggle('gym', !getActivityStatus('gym'))}
                            />
                          </Box>
                          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                            Daily workout session
                          </Typography>
                        </CardContent>
                      </Card>

                      {/* Daily Summary */}
                      {totalMacros && (
                        <Card variant="outlined" sx={{ bgcolor: 'primary.50', mt: 2 }}>
                          <CardContent>
                            <Typography variant="subtitle2" gutterBottom>Daily Nutrition Totals</Typography>
                            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                              <Chip label={`${Math.round(totalMacros.calories)} kcal`} size="small" />
                              <Chip label={`${Math.round(totalMacros.protein)}g protein`} size="small" />
                              <Chip label={`${Math.round(totalMacros.carbs)}g carbs`} size="small" />
                              <Chip label={`${Math.round(totalMacros.fats)}g fats`} size="small" />
                            </Box>
                          </CardContent>
                        </Card>
                      )}
                    </Box>
                  );
                })()}
              </Box>
            </DialogContent>
            
            <DialogActions>
              <Button onClick={() => setSelectedDay(null)}>
                Close
              </Button>
              <Button 
                variant="outlined" 
                onClick={() => {
                  const dayKey = selectedDay?.date.toISOString().split('T')[0];
                  const mealPlan = mealPlans.find(plan => plan.date === dayKey);
                  const scheduledActivity = scheduledActivities.find(activity => activity.date === dayKey);
                  
                  console.log('🔍 Debug Info:', {
                    selectedDay: dayKey,
                    activityHistoryCount: activityHistory.length,
                    activityHistoryForDay: activityHistory.filter(a => a.date === dayKey),
                    user: user?.uid,
                    mealPlansCount: mealPlans.length,
                    mealPlanForDay: mealPlan,
                    scheduledActivitiesCount: scheduledActivities.length,
                    scheduledActivityForDay: scheduledActivity,
                    selectedDayTimeslots: selectedDayTimeslots,
                    hasTimeslots: !!(selectedDayTimeslots?.timeslots || mealPlan?.timeslots),
                    moduleDataFood: selectedDay?.moduleData?.food
                  });
                }}
              >
                Debug
              </Button>
              {!selectedDay.moduleData.food?.hasMealPlan && (
                <Button
                  variant="contained"
                  startIcon={<FoodIcon />}
                  onClick={handleCreateMealPlan}
                >
                  Plan Meals
                </Button>
              )}
              {selectedDay.moduleData.food?.hasMealPlan && (
                <Button
                  variant="outlined"
                  startIcon={<FoodIcon />}
                  onClick={handleCreateMealPlan}
                >
                  Edit Meals
                </Button>
              )}
            </DialogActions>
          </>
        )}
      </Dialog>
    </Container>
  );
};

export default DashboardPage;
