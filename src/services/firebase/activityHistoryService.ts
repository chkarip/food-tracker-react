import { 
  collection, 
  doc, 
  setDoc, 
  getDocs, 
  query, 
  where, 
  limit
} from 'firebase/firestore';
import { db } from '../../config/firebase';
import { ActivityHistoryDocument } from '../../types/firebase';
import { formatDate, COLLECTIONS, createTimestamp } from './utils';

// Save activity completion to history for 100-day tracking
export const saveActivityHistory = async (
  userId: string,
  date: string, // YYYY-MM-DD format
  activityType: '6pm' | '9:30pm' | 'gym',
  completed: boolean
): Promise<void> => {
  try {
    const historyId = `${userId}_${date}_${activityType}`;
    const historyRef = doc(db, COLLECTIONS.ACTIVITY_HISTORY, historyId);
    
    console.log('📊 Firestore DEBUG - saveActivityHistory:');
    console.log('  👤 UserId:', userId);
    console.log('  📅 Date:', date);
    console.log('  🎯 Activity:', activityType);
    console.log('  ✅ Completed:', completed);
    
    await setDoc(historyRef, {
      userId,
      activityType,
      date,
      completed,
      createdAt: createTimestamp(),
      updatedAt: createTimestamp()
    }, { merge: true });
    
    console.log('  ✅ Successfully saved activity history');
  } catch (error: any) {
    console.error('  ❌ Save activity history error:', error);
    throw new Error(`Failed to save activity history: ${error.message}`);
  }
};

// Get last 100 days of activity history for a specific activity type
export const getLast100DaysHistory = async (
  userId: string,
  activityType: '6pm' | '9:30pm' | 'gym'
): Promise<ActivityHistoryDocument[]> => {
  try {
    console.log('📊 Firestore DEBUG - getLast100DaysHistory:');
    console.log('  👤 UserId:', userId);
    console.log('  🎯 Activity:', activityType);
    
    // Calculate date 100 days ago
    const today = new Date();
    const hundredDaysAgo = new Date(today);
    hundredDaysAgo.setDate(today.getDate() - 99); // 99 days ago + today = 100 days
    
    const startDate = formatDate(hundredDaysAgo);
    const endDate = formatDate(today);
    
    console.log('  📅 Date range:', { startDate, endDate });
    
    const q = query(
      collection(db, COLLECTIONS.ACTIVITY_HISTORY),
      where('userId', '==', userId),
      where('activityType', '==', activityType),
      where('date', '>=', startDate),
      where('date', '<=', endDate)
      // Removed orderBy to work with existing index
    );
    
    const querySnapshot = await getDocs(q);
    console.log('  📊 History records found:', querySnapshot.docs.length);
    
    const results = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as ActivityHistoryDocument[];
    
    // Sort by date in JavaScript since we removed orderBy for index compatibility
    results.sort((a, b) => b.date.localeCompare(a.date));
    
    console.log('  ✅ Successfully loaded activity history');
    return results;
  } catch (error: any) {
    console.error('  ❌ Get activity history error:', error);
    throw new Error(`Failed to get activity history: ${error.message}`);
  }
};

// Generate 100-day history array with missing days filled as incomplete
export const generate100DayHistory = async (
  userId: string,
  activityType: '6pm' | '9:30pm' | 'gym'
): Promise<{ date: string; completed: boolean; isToday: boolean }[]> => {
  try {
    const historyRecords = await getLast100DaysHistory(userId, activityType);
    const historyMap = new Map<string, boolean>();
    
    // Create lookup map from database records
    historyRecords.forEach(record => {
      historyMap.set(record.date, record.completed);
    });
    
    // Generate last 100 days
    const today = new Date();
    const result: { date: string; completed: boolean; isToday: boolean }[] = [];
    
    for (let i = 99; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      const dateString = formatDate(date);
      const isToday = i === 0;
      
      result.push({
        date: dateString,
        completed: historyMap.get(dateString) || false,
        isToday
      });
    }
    
    console.log('📊 Generated 100-day history for', activityType, ':', result.length, 'days');
    return result;
  } catch (error: any) {
    console.error('❌ Generate 100-day history error:', error);
    throw new Error(`Failed to generate 100-day history: ${error.message}`);
  }
};

// Get activity history for a specific month (for calendar display)
export const getActivityHistoryForMonth = async (
  userId: string,
  year: number,
  month: number // 1-based month (1-12)
): Promise<ActivityHistoryDocument[]> => {
  try {
    console.log('📊 Firestore DEBUG - getActivityHistoryForMonth:');
    console.log('  👤 UserId:', userId);
    console.log('  📅 Year/Month:', year, month);
    
    // Calculate start and end dates for the month
    const startDate = `${year}-${month.toString().padStart(2, '0')}-01`;
    const lastDay = new Date(year, month, 0).getDate(); // Get last day of month
    const endDate = `${year}-${month.toString().padStart(2, '0')}-${lastDay.toString().padStart(2, '0')}`;
    
    console.log('  📅 Date range:', { startDate, endDate });
    
    const q = query(
      collection(db, COLLECTIONS.ACTIVITY_HISTORY),
      where('userId', '==', userId),
      where('date', '>=', startDate),
      where('date', '<=', endDate)
    );
    
    const querySnapshot = await getDocs(q);
    console.log('  📊 Activity history records found:', querySnapshot.docs.length);
    
    const results = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as ActivityHistoryDocument[];
    
    console.log('  ✅ Successfully loaded monthly activity history');
    return results;
  } catch (error: any) {
    console.error('  ❌ Get monthly activity history error:', error);
    throw new Error(`Failed to get monthly activity history: ${error.message}`);
  }
};

// Get activity history for a specific date (for day modal)
export const getActivityHistoryForDate = async (
  userId: string,
  date: string // YYYY-MM-DD format
): Promise<ActivityHistoryDocument[]> => {
  try {
    console.log('📊 Firestore DEBUG - getActivityHistoryForDate:');
    console.log('  👤 UserId:', userId);
    console.log('  📅 Date:', date);
    
    const q = query(
      collection(db, COLLECTIONS.ACTIVITY_HISTORY),
      where('userId', '==', userId),
      where('date', '==', date)
    );
    
    const querySnapshot = await getDocs(q);
    console.log('  📊 Activity history records found:', querySnapshot.docs.length);
    
    const results = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as ActivityHistoryDocument[];
    
    console.log('  ✅ Successfully loaded daily activity history');
    return results;
  } catch (error: any) {
    console.error('  ❌ Get daily activity history error:', error);
    throw new Error(`Failed to get daily activity history: ${error.message}`);
  }
};
