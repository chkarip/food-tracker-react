/**
 * water.ts - Water Tracking Type Definitions
 *
 * BUSINESS PURPOSE:
 * Defines the complete data structure for water intake tracking including:
 * - Daily water consumption with timestamped entries
 * - Streak tracking for hydration consistency
 * - Integration with existing activity tracking system
 * - Real-time progress monitoring against daily goals
 *
 * KEY BUSINESS DATA MODELS:
 * 1. WATER INTAKE TRACKING:
 *    - WaterIntakeDocument: Daily water consumption with multiple entries
 *    - WaterEntry: Individual water intake entries with amount and timestamp
 *    - Streak tracking for consecutive days meeting hydration goals
 *
 * 2. HYDRATION GOALS:
 *    - Daily target: 2500ml (configurable)
 *    - Progress tracking with visual indicators
 *    - Achievement notifications and streak rewards
 *
 * 3. INTEGRATION POINTS:
 *    - Calendar integration for historical view
 *    - Dashboard activity cards for quick stats
 *    - Day modal display with other daily activities
 *
 * BUSINESS VALUE:
 * - Promotes healthy hydration habits through gamification
 * - Provides visual feedback on daily water consumption
 * - Integrates seamlessly with existing activity tracking
 * - Supports data-driven health optimization
 */

import { Timestamp } from 'firebase/firestore';

export interface WaterEntry {
  id: string;
  amount: number; // ml
  timestamp: Timestamp;
  source?: 'manual' | 'preset-300ml' | 'preset-700ml' | 'preset-1L';
}

export interface WaterIntakeDocument {
  id?: string;
  userId: string;
  date: string; // YYYY-MM-DD format
  totalAmount: number; // ml
  targetAmount: number; // ml (default: 2500)
  entries: WaterEntry[];
  goalAchieved: boolean;
  streakCount: number; // consecutive days meeting goal
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface WaterStats {
  todayAmount: number;
  todayTarget: number;
  todayProgress: number; // 0-100
  currentStreak: number;
  longestStreak: number;
  monthlyCompleted: number;
  monthlyTotal: number;
  monthlyPercentage: number;
}

export interface WaterActivityData {
  date: string;
  completed: boolean; // goal achieved
  amount: number;
  target: number;
  streakDay: boolean;
}

// Preset water amounts (ml)
export const WATER_PRESETS = {
  SMALL: 300,
  MEDIUM: 700,
  LARGE: 1000
} as const;

export type WaterPreset = typeof WATER_PRESETS[keyof typeof WATER_PRESETS];

// Default daily target
export const DEFAULT_DAILY_TARGET = 2500; // ml