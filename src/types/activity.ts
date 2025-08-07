// Activity-specific types - PURE ACTIVITIES ONLY (no calendar)

export interface Activity {
  id: string;
  type: 'gym' | 'work' | 'personal' | 'health' | 'custom';
  label: string;              // "Gym Session", "Morning Workout"
  time?: string;              // "07:00" (optional)
  duration?: number;          // 60 minutes (optional)
  completed?: boolean;        // true/false
  color?: string;             // "#FF5722" 
  description?: string;       // "Chest and triceps workout"
  metadata?: {
    exerciseType?: string;    // For gym
    workType?: string;        // For work
    healthType?: string;      // For health
    [key: string]: any;       // Any other custom data
  };
}

export interface ActivityDay {
  date: string;               // "2025-08-04"
  dayNumber: number;          // 4
  isCurrentMonth: boolean;    // true/false
  isToday: boolean;          // true/false
  isWeekend: boolean;        // true/false
  activities: Activity[];     // All activities for this day
  completed: boolean;         // Overall completion status
  value: number;             // Activity completion value (0-100)
  maxValue: number;          // Maximum possible value (usually 100)
}

export interface ActivityMonth {
  year: number;              // 2025
  month: number;             // 7 (0-indexed)
  days: ActivityDay[];       // Array of all activity days
}

// Activity type configurations
export interface ActivityTypeConfig {
  type: Activity['type'];
  defaultColor: string;
  label: string;
  description: string;
}

export const ACTIVITY_TYPE_CONFIGS: ActivityTypeConfig[] = [
  {
    type: 'gym',
    defaultColor: '#FF5722',
    label: 'Gym Session',
    description: 'Physical workout and exercise'
  },
  {
    type: 'work',
    defaultColor: '#2196F3',
    label: 'Work Task',
    description: 'Professional work activities'
  },
  {
    type: 'personal',
    defaultColor: '#9C27B0',
    label: 'Personal',
    description: 'Personal tasks and activities'
  },
  {
    type: 'health',
    defaultColor: '#00BCD4',
    label: 'Health',
    description: 'Health-related activities'
  },
  {
    type: 'custom',
    defaultColor: '#607D8B',
    label: 'Custom Activity',
    description: 'Custom user-defined activities'
  }
];

// Activity completion status
export interface ActivityCompletion {
  date: string;
  activityId: string;
  completed: boolean;
  completedAt?: string;       // ISO timestamp
  notes?: string;
}
