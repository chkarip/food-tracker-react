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

import { useState, useEffect } from 'react';
import { ModuleStats } from '../../shared/types';
import { getWaterStats, subscribeToTodayWaterIntake } from '../../../services/firebase/water/waterService';

export const useWaterModuleStats = (userId?: string) => {
  const [stats, setStats] = useState<ModuleStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) return;

    const loadStats = async () => {
      setLoading(true);
      setError(null);

      try {
        const waterStats = await getWaterStats(userId);

        const moduleStats: ModuleStats = {
          title: 'Water Tracking',
          description: 'Daily hydration goals',
          icon: '💧',
          gradient: '#2196F3', // Blue theme for water
          todayStatus: {
            completed: waterStats.todayProgress >= 100,
            progress: waterStats.todayProgress,
            label: `${Math.round(waterStats.todayAmount)}ml / ${waterStats.todayTarget}ml`
          },
          monthlyStats: {
            completed: waterStats.monthlyCompleted,
            total: waterStats.monthlyTotal,
            percentage: waterStats.monthlyPercentage
          },
          streakInfo: {
            current: waterStats.currentStreak,
            longest: waterStats.longestStreak
          },
          actionButton: {
            label: 'Track Water',
            route: '/water'
          }
        };

        setStats(moduleStats);
      } catch (err) {
        console.error('Error loading water stats:', err);
        setError('Failed to load water statistics');
      } finally {
        setLoading(false);
      }
    };

    loadStats();

    // Subscribe to real-time updates for today
    const unsubscribe = subscribeToTodayWaterIntake(userId, async () => {
      // Reload stats when today's data changes
      await loadStats();
    });

    return () => unsubscribe();
  }, [userId]);

  return { stats, loading, error };
};