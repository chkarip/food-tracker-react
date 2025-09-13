import { useState, useEffect } from 'react';
import { ModuleStats, ActivityData } from '../types';

export const useModuleStats = (
  moduleType: 'food' | 'gym' | 'finance' | 'water',
  userId?: string
) => {
  const [stats, setStats] = useState<ModuleStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) return;

    const loadStats = async () => {
      setLoading(true);
      setError(null);

      try {
        // This will be implemented specific to each module
        const moduleStats = await getModuleStats(moduleType, userId);
        setStats(moduleStats);
      } catch (err) {
        console.error(`Error loading ${moduleType} stats:`, err);
        setError(`Failed to load ${moduleType} statistics`);
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, [moduleType, userId]);

  return { stats, loading, error };
};

// Placeholder function - will be replaced with actual implementations
const getModuleStats = async (
  moduleType: 'food' | 'gym' | 'finance' | 'water',
  userId: string
): Promise<ModuleStats> => {
  switch (moduleType) {
    case 'water':
      // Import water stats dynamically to avoid circular dependencies
      const { getWaterStats } = await import('../../../services/firebase/water/waterService');
      const waterStats = await getWaterStats(userId);
      return {
        title: 'Water Tracking',
        description: 'Daily hydration goals',
        icon: '💧',
        gradient: '#2196F3',
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
    default:
      // Keep existing mock implementations for now
      const mockStats: Record<string, ModuleStats> = {
        food: {
          title: 'Food Tracking',
          description: 'Daily meal planning & nutrition',
          icon: '🍽️',
          gradient: '#4CAF50',
          todayStatus: {
            completed: true,
            progress: 85,
            label: '2/2 meals'
          },
          monthlyStats: {
            completed: 28,
            total: 31,
            percentage: 90
          },
          streakInfo: {
            current: 7,
            longest: 14
          },
          actionButton: {
            label: 'Plan Meals',
            route: '/food'
          }
        },
        gym: {
          title: 'Fitness',
          description: 'Workout tracking & progress',
          icon: '💪',
          gradient: '#FF5722',
          todayStatus: {
            completed: false,
            progress: 0,
            label: 'Not started'
          },
          monthlyStats: {
            completed: 12,
            total: 20,
            percentage: 60
          },
          streakInfo: {
            current: 3,
            longest: 8
          },
          actionButton: {
            label: 'Start Workout',
            route: '/gym'
          }
        },
        finance: {
          title: 'Finance',
          description: 'Expense tracking & budgets',
          icon: '💰',
          gradient: '#2196F3',
          todayStatus: {
            completed: true,
            progress: 100,
            label: 'Logged expenses'
          },
          monthlyStats: {
            completed: 31,
            total: 31,
            percentage: 100
          },
          actionButton: {
            label: 'Add Expense',
            route: '/finance'
          }
        }
      };
      return mockStats[moduleType];
  }
};
