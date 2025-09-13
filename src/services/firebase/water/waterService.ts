/**
 * waterService.ts - Water Intake Tracking Service
 *
 * BUSINESS PURPOSE:
 * Provides comprehensive water intake tracking functionality including:
 * - Real-time water consumption logging with preset amounts
 * - Daily goal tracking with streak calculation
 * - Historical data retrieval for analytics
 * - Integration with Firebase for persistent storage
 *
 * KEY FEATURES:
 * 1. WATER LOGGING:
 *    - Add water entries with timestamp tracking
 *    - Support for preset amounts (300ml, 700ml, 1L)
 *    - Manual entry capability for custom amounts
 *
 * 2. GOAL TRACKING:
 *    - Daily target monitoring (default: 2500ml)
 *    - Progress calculation and achievement detection
 *    - Streak tracking for consecutive goal achievement
 *
 * 3. DATA MANAGEMENT:
 *    - Real-time sync with Firebase listeners
 *    - Historical data retrieval for calendar integration
 *    - Monthly aggregation for dashboard statistics
 *
 * BUSINESS VALUE:
 * - Enables precise hydration tracking for health optimization
 * - Provides motivational feedback through streaks and goals
 * - Supports data-driven hydration recommendations
 * - Integrates seamlessly with existing activity tracking system
 */

import {
  collection,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  getDocs
} from 'firebase/firestore';
import { db } from '../../../config/firebase';
import { COLLECTIONS, formatDate, createTimestamp } from '../shared/utils';
import {
  WaterIntakeDocument,
  WaterEntry,
  WaterStats,
  WaterActivityData
} from '../../../types/water';
import { getUserWaterGoal } from '../nutrition/userProfileService';

/**
 * Get today's water intake document
 */
export const getTodayWaterIntake = async (userId: string): Promise<WaterIntakeDocument> => {
  const today = formatDate(new Date());
  const docRef = doc(db, COLLECTIONS.WATER_INTAKE, `${userId}_${today}`);

  const docSnap = await getDoc(docRef);

  if (docSnap.exists()) {
    return docSnap.data() as WaterIntakeDocument;
  }

  // Get user's custom water goal
  const userWaterGoal = await getUserWaterGoal(userId);

  // Create new document for today
  const newDoc: WaterIntakeDocument = {
    userId,
    date: today,
    totalAmount: 0,
    targetAmount: userWaterGoal,
    entries: [],
    goalAchieved: false,
    streakCount: 0,
    createdAt: createTimestamp(),
    updatedAt: createTimestamp()
  };

  await setDoc(docRef, newDoc);
  return newDoc;
};

/**
 * Add water intake entry
 */
export const addWaterIntake = async (
  userId: string,
  amount: number,
  source: WaterEntry['source'] = 'manual'
): Promise<void> => {
  const today = formatDate(new Date());
  const docRef = doc(db, COLLECTIONS.WATER_INTAKE, `${userId}_${today}`);

  const docSnap = await getDoc(docRef);
  let currentDoc: WaterIntakeDocument;

  if (docSnap.exists()) {
    currentDoc = docSnap.data() as WaterIntakeDocument;
  } else {
    // Get user's custom water goal for new documents
    const userWaterGoal = await getUserWaterGoal(userId);
    currentDoc = {
      userId,
      date: today,
      totalAmount: 0,
      targetAmount: userWaterGoal,
      entries: [],
      goalAchieved: false,
      streakCount: 0,
      createdAt: createTimestamp(),
      updatedAt: createTimestamp()
    };
  }

  // Create new entry
  const newEntry: WaterEntry = {
    id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    amount,
    timestamp: createTimestamp(),
    source
  };

  // Update document
  const updatedDoc: WaterIntakeDocument = {
    ...currentDoc,
    totalAmount: currentDoc.totalAmount + amount,
    entries: [...currentDoc.entries, newEntry],
    goalAchieved: (currentDoc.totalAmount + amount) >= currentDoc.targetAmount,
    updatedAt: createTimestamp()
  };

  // Calculate streak
  updatedDoc.streakCount = await calculateStreak(userId, today, updatedDoc.goalAchieved);

  await setDoc(docRef, updatedDoc);
};

/**
 * Calculate current streak for user
 */
const calculateStreak = async (userId: string, currentDate: string, goalAchieved: boolean): Promise<number> => {
  if (!goalAchieved) return 0;

  let streak = 1;
  let checkDate = new Date(currentDate);

  // Check previous days
  for (let i = 1; i <= 365; i++) { // Max 365 days back
    checkDate.setDate(checkDate.getDate() - 1);
    const dateStr = formatDate(checkDate);

    const docRef = doc(db, COLLECTIONS.WATER_INTAKE, `${userId}_${dateStr}`);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data() as WaterIntakeDocument;
      if (data.goalAchieved) {
        streak++;
      } else {
        break;
      }
    } else {
      break; // No data for this day
    }
  }

  return streak;
};

/**
 * Get water intake for specific date
 */
export const getWaterIntakeForDate = async (
  userId: string,
  date: Date
): Promise<WaterIntakeDocument | null> => {
  const dateStr = formatDate(date);
  const docRef = doc(db, COLLECTIONS.WATER_INTAKE, `${userId}_${dateStr}`);

  const docSnap = await getDoc(docRef);
  return docSnap.exists() ? (docSnap.data() as WaterIntakeDocument) : null;
};

/**
 * Get water intake for month
 */
export const getWaterIntakeForMonth = async (
  userId: string,
  year: number,
  month: number // 1-based
): Promise<WaterIntakeDocument[]> => {
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 1);

  const q = query(
    collection(db, COLLECTIONS.WATER_INTAKE),
    where('userId', '==', userId),
    where('date', '>=', formatDate(startDate)),
    where('date', '<', formatDate(endDate)),
    orderBy('date', 'asc')
  );

  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => doc.data() as WaterIntakeDocument);
};

/**
 * Get water statistics for dashboard
 */
export const getWaterStats = async (userId: string): Promise<WaterStats> => {
  const today = new Date();
  const currentMonth = today.getMonth() + 1;
  const currentYear = today.getFullYear();

  // Get today's data
  const todayData = await getTodayWaterIntake(userId);

  // Get monthly data
  const monthlyData = await getWaterIntakeForMonth(userId, currentYear, currentMonth);

  // Calculate monthly stats
  const monthlyCompleted = monthlyData.filter(day => day.goalAchieved).length;
  const monthlyTotal = monthlyData.length;

  return {
    todayAmount: todayData.totalAmount,
    todayTarget: todayData.targetAmount,
    todayProgress: Math.min((todayData.totalAmount / todayData.targetAmount) * 100, 100),
    currentStreak: todayData.streakCount,
    longestStreak: await getLongestStreak(userId),
    monthlyCompleted,
    monthlyTotal,
    monthlyPercentage: monthlyTotal > 0 ? (monthlyCompleted / monthlyTotal) * 100 : 0
  };
};

/**
 * Get longest streak for user
 */
const getLongestStreak = async (userId: string): Promise<number> => {
  // Get all water intake documents for user (last 365 days)
  const oneYearAgo = new Date();
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

  const q = query(
    collection(db, COLLECTIONS.WATER_INTAKE),
    where('userId', '==', userId),
    where('date', '>=', formatDate(oneYearAgo)),
    orderBy('date', 'desc')
  );

  const querySnapshot = await getDocs(q);
  const documents = querySnapshot.docs
    .map(doc => doc.data() as WaterIntakeDocument)
    .sort((a, b) => a.date.localeCompare(b.date));

  let maxStreak = 0;
  let currentStreak = 0;

  for (const doc of documents) {
    if (doc.goalAchieved) {
      currentStreak++;
      maxStreak = Math.max(maxStreak, currentStreak);
    } else {
      currentStreak = 0;
    }
  }

  return maxStreak;
};

/**
 * Get water activity data for last N days (for activity grid)
 */
export const getWaterActivityData = async (
  userId: string,
  days: number = 100
): Promise<WaterActivityData[]> => {
  const activityData: WaterActivityData[] = [];
  const today = new Date();
  const userWaterGoal = await getUserWaterGoal(userId);

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = formatDate(date);

    const data = await getWaterIntakeForDate(userId, date);

    activityData.push({
      date: dateStr,
      completed: data?.goalAchieved || false,
      amount: data?.totalAmount || 0,
      target: data?.targetAmount || userWaterGoal,
      streakDay: (data?.streakCount || 0) > 0
    });
  }

  return activityData;
};

/**
 * Subscribe to today's water intake changes
 */
export const subscribeToTodayWaterIntake = (
  userId: string,
  callback: (data: WaterIntakeDocument) => void
) => {
  const today = formatDate(new Date());
  const docRef = doc(db, COLLECTIONS.WATER_INTAKE, `${userId}_${today}`);

  return onSnapshot(docRef, async (docSnap) => {
    if (docSnap.exists()) {
      callback(docSnap.data() as WaterIntakeDocument);
    } else {
      // Get user's custom water goal for empty document
      const userWaterGoal = await getUserWaterGoal(userId);
      const emptyDoc: WaterIntakeDocument = {
        userId,
        date: today,
        totalAmount: 0,
        targetAmount: userWaterGoal,
        entries: [],
        goalAchieved: false,
        streakCount: 0,
        createdAt: createTimestamp(),
        updatedAt: createTimestamp()
      };
      callback(emptyDoc);
    }
  });
};

/**
 * Update daily target
 */
export const updateDailyTarget = async (userId: string, target: number): Promise<void> => {
  const today = formatDate(new Date());
  const docRef = doc(db, COLLECTIONS.WATER_INTAKE, `${userId}_${today}`);

  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    await updateDoc(docRef, {
      targetAmount: target,
      goalAchieved: (docSnap.data() as WaterIntakeDocument).totalAmount >= target,
      updatedAt: createTimestamp()
    });
  }
};