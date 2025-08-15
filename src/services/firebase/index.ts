// Export all Firebase service modules
export * from './shared/utils';
export * from './meal-planning/dailyPlansService';
export * from './scheduling/activityHistoryService';
export * from './meal-planning/foodHistoryService';
export * from './user/userPreferencesService';
export * from './meal-planning/timeslotsService';
export * from './workout/workoutService';

// Export specific helpers from scheduledActivitiesService to avoid conflicts
export { 
  addTaskToUnifiedSchedule, 
  removeTaskFromUnifiedSchedule, 
  updateUnifiedScheduleStatus, 
  getUnifiedScheduleForDate 
} from './scheduling/scheduledActivitiesService';
