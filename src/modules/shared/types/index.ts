/**
 * Shared types across all modules
 */

export interface ModuleStats {
  title: string;
  description: string;
  icon: React.ReactNode;
  gradient: string;
  todayStatus: {
    completed: boolean;
    progress: number; // 0-100
    label: string;
  };
  monthlyStats: {
    completed: number;
    total: number;
    percentage: number;
  };
  streakInfo?: {
    current: number;
    longest: number;
  };
  actionButton: {
    label: string;
    route: string;
  };
}

export interface ActivityData {
  date: string;
  completed: boolean;
  value?: number; // For numeric tracking (calories, expenses, etc.)
  maxValue?: number; // Maximum possible value for this activity
  metadata?: Record<string, any>;
}

export interface CalendarEvent {
  type: 'food' | 'gym' | 'finance' | 'other';
  title: string;
  completed: boolean;
  priority?: 'low' | 'medium' | 'high';
}

export interface CalendarDay {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  hasEvents: boolean;
  events: CalendarEvent[];
  moduleData: {
    food?: {
      hasMealPlan: boolean;
      completedMeals: number;
      totalMeals: number;
    };
    gym?: {
      hasWorkout: boolean;
      completed: boolean;
    };
    finance?: {
      hasTransactions?: boolean;
      totalAmount?: number;
      count?: number;
    };
  };
}

export interface BaseDocument {
  id?: string;
  userId: string;
  createdAt: any; // Timestamp
  updatedAt: any; // Timestamp
}
