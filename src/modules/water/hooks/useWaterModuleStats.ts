/**
 * useWaterModuleStats.ts - Water Module Statistics Hook
 *
 * BUSINESS PURPOSE:
 * Provides water tracking statistics for dashboard integration including:
 * - Today's hydration progress and goal status
 * - Monthly completion rates and streak information
 * - Real-time updates for activity card display
 * - Integration with existing ModuleStats interface
 *
 * KEY FEATURES:
 * 1. DASHBOARD INTEGRATION:
 *    - Today's water intake progress (0-100%)
 *    - Current and longest streak tracking
 *    - Monthly completion statistics
 *
 * 2. REAL-TIME UPDATES:
 *    - Live progress updates as water is logged
 *    - Automatic goal achievement detection
 *    - Streak calculation and maintenance
 *
 * 3. VISUAL FEEDBACK:
 *    - Progress indicators for dashboard cards
 *    - Achievement status for goal completion
 *    - Streak information for motivation
 *
 * BUSINESS VALUE:
 * - Provides comprehensive hydration analytics
 * - Enables motivational feedback through streaks
 * - Supports data-driven hydration optimization
 * - Integrates seamlessly with existing dashboard system
 */

import { ModuleStats } from '../../shared/types';
import { useTodayWaterIntake, useWaterStats } from '../../../services/firebase/water/waterService';

export const useWaterModuleStats = (userId?: string) => {
  // Use React Query hooks for data fetching
  const { data: todayWaterData, isLoading: todayLoading, error: todayError } = useTodayWaterIntake(userId || '');
  const { data: waterStatsData, isLoading: statsLoading, error: statsError } = useWaterStats(userId || '');

  // Combine loading and error states
  const loading = todayLoading || statsLoading;
  const error = todayError || statsError;

  // Transform data into ModuleStats format
  const stats = todayWaterData && waterStatsData ? {
    title: 'Water Tracking',
    description: 'Daily hydration goals',
    icon: '💧',
    gradient: '#2196F3', // Blue theme for water
    todayStatus: {
      completed: todayWaterData.totalAmount >= todayWaterData.targetAmount,
      progress: Math.min((todayWaterData.totalAmount / todayWaterData.targetAmount) * 100, 100),
      label: `${Math.round(todayWaterData.totalAmount)}ml / ${todayWaterData.targetAmount}ml`
    },
    monthlyStats: {
      completed: waterStatsData.monthlyCompleted,
      total: waterStatsData.monthlyTotal,
      percentage: waterStatsData.monthlyPercentage
    },
    streakInfo: {
      current: waterStatsData.currentStreak,
      longest: waterStatsData.longestStreak
    },
    actionButton: {
      label: 'Track Water',
      route: '/water'
    }
  } : null;

  return { stats, loading, error };
};