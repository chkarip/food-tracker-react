// Calendar-specific types - PURE CALENDAR ONLY (no activities/tasks)

export interface CalendarMealPlan {
  date: string; // YYYY-MM-DD format
  timeslot: '6pm' | '9:30pm';
  selectedFoods: Array<{
    name: string;
    amount: number;
  }>;
  externalNutrition: {
    protein: number;
    fats: number;
    carbs: number;
    calories: number;
  };
  totalMacros: {
    protein: number;
    fats: number;
    carbs: number;
    calories: number;
  };
}

export interface CalendarDay {
  date: string;              // "2025-08-04"
  dayNumber: number;         // 4
  isCurrentMonth: boolean;   // true/false
  isToday: boolean;         // true/false
  mealPlans: {              // Only meal plans - no activities/tasks
    '6pm'?: CalendarMealPlan;
    '9:30pm'?: CalendarMealPlan;
  };
}

export interface CalendarMonth {
  year: number;             // 2025
  month: number;            // 7 (0-indexed, so August = 7)
  days: CalendarDay[];      // Array of all days in the month
}
