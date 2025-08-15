import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  orderBy 
} from 'firebase/firestore';
import { db } from '../../../config/firebase';
import { TimeslotsDocument, TimeslotMealData } from '../../../types/firebase';
import { formatDate, COLLECTIONS, createTimestamp } from '../shared/utils';

// Save timeslots data for a specific date
export const saveTimeslots = async (
  userId: string,
  date: string, // YYYY-MM-DD format
  timeslots: TimeslotsDocument['timeslots'],
  totalMacros: TimeslotsDocument['totalMacros']
): Promise<void> => {
  try {
    const timeslotsId = `${userId}_${date}`;
    const timeslotsRef = doc(db, COLLECTIONS.TIMESLOTS, timeslotsId);
    
    console.log('⏰ Firestore DEBUG - saveTimeslots:');
    console.log('  👤 UserId:', userId);
    console.log('  📅 Date:', date);
    console.log('  🍽️ 6pm foods:', timeslots['6pm'].selectedFoods.length);
    console.log('  🍽️ 9:30pm foods:', timeslots['9:30pm'].selectedFoods.length);
    console.log('  🧮 Total macros:', totalMacros);
    
    const timeslotsDoc: Omit<TimeslotsDocument, 'id'> = {
      userId,
      date,
      timeslots,
      totalMacros,
      createdAt: createTimestamp(),
      updatedAt: createTimestamp()
    };
    
    await setDoc(timeslotsRef, timeslotsDoc, { merge: true });
    
    console.log('  ✅ Successfully saved timeslots data');
  } catch (error: any) {
    console.error('  ❌ Save timeslots error:', error);
    throw new Error(`Failed to save timeslots: ${error.message}`);
  }
};

// Load timeslots data for a specific date
export const loadTimeslots = async (
  userId: string,
  date: string // YYYY-MM-DD format
): Promise<TimeslotsDocument | null> => {
  try {
    console.log('⏰ Firestore DEBUG - loadTimeslots:');
    console.log('  👤 UserId:', userId);
    console.log('  📅 Date:', date);
    
    const timeslotsId = `${userId}_${date}`;
    const timeslotsRef = doc(db, COLLECTIONS.TIMESLOTS, timeslotsId);
    const docSnapshot = await getDoc(timeslotsRef);
    
    if (docSnapshot.exists()) {
      const timeslots = {
        id: docSnapshot.id,
        ...docSnapshot.data()
      } as TimeslotsDocument;
      
      console.log('  📋 Found timeslots data:', {
        '6pm_foods': timeslots.timeslots['6pm'].selectedFoods.length,
        '9:30pm_foods': timeslots.timeslots['9:30pm'].selectedFoods.length,
        totalMacros: timeslots.totalMacros
      });
      
      return timeslots;
    } else {
      console.log('  ❌ No timeslots data found for date');
      return null;
    }
  } catch (error: any) {
    console.error('  ❌ Load timeslots error:', error);
    throw new Error(`Failed to load timeslots: ${error.message}`);
  }
};

// Get timeslots data for a specific month
export const getTimeslotsForMonth = async (
  userId: string,
  year: number,
  month: number // 1-based month (1-12)
): Promise<TimeslotsDocument[]> => {
  try {
    console.log('⏰ Firestore DEBUG - getTimeslotsForMonth:');
    console.log('  👤 UserId:', userId);
    console.log('  📅 Year/Month:', year, month);
    
    // Calculate start and end dates for the month
    const startDate = `${year}-${month.toString().padStart(2, '0')}-01`;
    const lastDay = new Date(year, month, 0).getDate(); // Get last day of month
    const endDate = `${year}-${month.toString().padStart(2, '0')}-${lastDay.toString().padStart(2, '0')}`;
    
    console.log('  📅 Date range:', { startDate, endDate });
    
    const q = query(
      collection(db, COLLECTIONS.TIMESLOTS),
      where('userId', '==', userId),
      where('date', '>=', startDate),
      where('date', '<=', endDate),
      orderBy('date', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    console.log('  ⏰ Timeslots records found:', querySnapshot.docs.length);
    
    const results = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as TimeslotsDocument[];
    
    console.log('  ✅ Successfully loaded monthly timeslots');
    return results;
  } catch (error: any) {
    console.error('  ❌ Get monthly timeslots error:', error);
    throw new Error(`Failed to get monthly timeslots: ${error.message}`);
  }
};

// Get recent timeslots data (last N days)
export const getRecentTimeslots = async (
  userId: string,
  daysBack: number = 7
): Promise<TimeslotsDocument[]> => {
  try {
    console.log('⏰ Firestore DEBUG - getRecentTimeslots:');
    console.log('  👤 UserId:', userId);
    console.log('  📅 Days back:', daysBack);
    
    // Calculate start date
    const today = new Date();
    const startDate = new Date(today);
    startDate.setDate(today.getDate() - daysBack + 1); // Include today
    
    const startDateString = formatDate(startDate);
    const endDateString = formatDate(today);
    
    console.log('  📅 Date range:', { startDateString, endDateString });
    
    const q = query(
      collection(db, COLLECTIONS.TIMESLOTS),
      where('userId', '==', userId),
      where('date', '>=', startDateString),
      where('date', '<=', endDateString),
      orderBy('date', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    console.log('  ⏰ Recent timeslots records found:', querySnapshot.docs.length);
    
    const results = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as TimeslotsDocument[];
    
    console.log('  ✅ Successfully loaded recent timeslots');
    return results;
  } catch (error: any) {
    console.error('  ❌ Get recent timeslots error:', error);
    throw new Error(`Failed to get recent timeslots: ${error.message}`);
  }
};

// Update a specific timeslot without affecting the other
export const updateTimeslot = async (
  userId: string,
  date: string, // YYYY-MM-DD format
  timeslot: '6pm' | '9:30pm',
  mealData: TimeslotMealData,
  newTotalMacros: TimeslotsDocument['totalMacros']
): Promise<void> => {
  try {
    console.log('⏰ Firestore DEBUG - updateTimeslot:');
    console.log('  👤 UserId:', userId);
    console.log('  📅 Date:', date);
    console.log('  🕕 Timeslot:', timeslot);
    console.log('  🍽️ Foods:', mealData.selectedFoods.length);
    
    // Load existing timeslots data
    const existingTimeslots = await loadTimeslots(userId, date);
    
    let timeslots: TimeslotsDocument['timeslots'];
    
    if (existingTimeslots) {
      // Update specific timeslot
      timeslots = {
        ...existingTimeslots.timeslots,
        [timeslot]: mealData
      };
      console.log('  📋 Updated existing timeslots data');
    } else {
      // Create new timeslots data with empty data for the other timeslot
      const emptyMeal: TimeslotMealData = {
        selectedFoods: [],
        externalNutrition: { protein: 0, fats: 0, carbs: 0, calories: 0 }
      };
      
      timeslots = {
        '6pm': timeslot === '6pm' ? mealData : emptyMeal,
        '9:30pm': timeslot === '9:30pm' ? mealData : emptyMeal
      };
      console.log('  🆕 Created new timeslots data');
    }
    
    await saveTimeslots(userId, date, timeslots, newTotalMacros);
    
    console.log('  ✅ Successfully updated timeslot');
  } catch (error: any) {
    console.error('  ❌ Update timeslot error:', error);
    throw new Error(`Failed to update timeslot: ${error.message}`);
  }
};

// Delete timeslots data for a specific date
export const deleteTimeslots = async (
  userId: string,
  date: string // YYYY-MM-DD format
): Promise<void> => {
  try {
    console.log('⏰ Firestore DEBUG - deleteTimeslots:');
    console.log('  👤 UserId:', userId);
    console.log('  📅 Date:', date);
    
    const timeslotsId = `${userId}_${date}`;
    const timeslotsRef = doc(db, COLLECTIONS.TIMESLOTS, timeslotsId);
    
    // Set empty data instead of deleting document
    const emptyMeal: TimeslotMealData = {
      selectedFoods: [],
      externalNutrition: { protein: 0, fats: 0, carbs: 0, calories: 0 }
    };
    
    const emptyTimeslots: TimeslotsDocument['timeslots'] = {
      '6pm': emptyMeal,
      '9:30pm': emptyMeal
    };
    
    const emptyTotalMacros = { protein: 0, fats: 0, carbs: 0, calories: 0 };
    
    await saveTimeslots(userId, date, emptyTimeslots, emptyTotalMacros);
    
    console.log('  ✅ Successfully cleared timeslots data');
  } catch (error: any) {
    console.error('  ❌ Delete timeslots error:', error);
    throw new Error(`Failed to delete timeslots: ${error.message}`);
  }
};
