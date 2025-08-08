// Export all Firebase service modules
export * from './utils';
export * from './dailyPlansService';
export * from './activityHistoryService';
export * from './foodHistoryService';
export * from './userPreferencesService';
export * from './timeslotsService';
export * from './workoutService';

// Export specific helpers from scheduledActivitiesService to avoid conflicts
export { 
  addTaskToUnifiedSchedule, 
  removeTaskFromUnifiedSchedule, 
  updateUnifiedScheduleStatus, 
  getUnifiedScheduleForDate 
} from './scheduledActivitiesService';
