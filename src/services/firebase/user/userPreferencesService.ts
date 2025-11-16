import { 
  doc, 
  setDoc, 
  getDoc
} from 'firebase/firestore';
import { db } from '../../../config/firebase';
import { UserPreferences } from '../../../types/firebase';
import { COLLECTIONS, createTimestamp } from '../shared/utils';

// Default macro targets and preferences
const DEFAULT_PREFERENCES: Omit<UserPreferences, 'id' | 'userId' | 'createdAt' | 'updatedAt'> = {
  macroTargets: {
    protein: 127,
    fats: 65,
    carbs: 300,
    caloriesMin: 2300,
    caloriesMax: 2350
  },
  defaultFoodAmounts: {
    'Greek yogurt': 200,
    'Peanut butter': 30,
    'Dry rice': 80,
    'Dry lentils': 60,
    'Bulk oats': 50,
    'Chicken breast': 150,
    'Edamame': 100,
    'Canned tuna': 1,
    'Whey isolate': 30,
    'Eggs': 2,
    'Tortilla wrap': 1,
    'Almonds/Walnuts': 30,
    'Dark chocolate 74%': 20,
    'Oatmeal': 50
  },
  theme: 'auto'
};

// Save or update user preferences
export const saveUserPreferences = async (
  userId: string,
  preferences: Partial<Omit<UserPreferences, 'id' | 'userId' | 'createdAt' | 'updatedAt'>>
): Promise<void> => {
  try {
    const preferencesRef = doc(db, COLLECTIONS.USER_PREFERENCES, userId);
    
    console.log('⚙️ Firestore DEBUG - saveUserPreferences:');
    console.log('  👤 UserId:', userId);
    console.log('  🎛️ Preferences update:', preferences);
    
    // Get existing preferences or use defaults
    const existingDoc = await getDoc(preferencesRef);
    let existingPrefs = DEFAULT_PREFERENCES;
    
    if (existingDoc.exists()) {
      const data = existingDoc.data() as UserPreferences;
      existingPrefs = {
        macroTargets: data.macroTargets,
        defaultFoodAmounts: data.defaultFoodAmounts,
        theme: data.theme
      };
      console.log('  📋 Found existing preferences');
    } else {
      console.log('  🆕 Creating new preferences with defaults');
    }
    
    // Merge with new preferences
    const updatedPrefs: Omit<UserPreferences, 'id'> = {
      userId,
      macroTargets: {
        ...existingPrefs.macroTargets,
        ...preferences.macroTargets
      },
      defaultFoodAmounts: {
        ...existingPrefs.defaultFoodAmounts,
        ...preferences.defaultFoodAmounts
      },
      theme: preferences.theme || existingPrefs.theme,
      createdAt: existingDoc.exists() ? existingDoc.data()!.createdAt : createTimestamp(),
      updatedAt: createTimestamp()
    };
    
    await setDoc(preferencesRef, updatedPrefs, { merge: true });
    
    console.log('  ✅ Successfully saved user preferences');
  } catch (error: any) {
    console.error('  ❌ Save user preferences error:', error);
    throw new Error(`Failed to save user preferences: ${error.message}`);
  }
};

// Load user preferences (with defaults if none exist)
export const loadUserPreferences = async (userId: string): Promise<UserPreferences> => {
  try {
    console.log('⚙️ Firestore DEBUG - loadUserPreferences:');
    console.log('  👤 UserId:', userId);
    
    const preferencesRef = doc(db, COLLECTIONS.USER_PREFERENCES, userId);
    const docSnapshot = await getDoc(preferencesRef);
    
    if (docSnapshot.exists()) {
      const preferences = {
        id: docSnapshot.id,
        ...docSnapshot.data()
      } as UserPreferences;
      
      console.log('  📋 Loaded existing preferences:', {
        macroTargets: preferences.macroTargets,
        theme: preferences.theme,
        foodAmountsCount: Object.keys(preferences.defaultFoodAmounts).length
      });
      
      return preferences;
    } else {
      console.log('  🆕 No preferences found, creating defaults');
      
      // Create default preferences
      const defaultPrefs: Omit<UserPreferences, 'id'> = {
        userId,
        ...DEFAULT_PREFERENCES,
        createdAt: createTimestamp(),
        updatedAt: createTimestamp()
      };
      
      await setDoc(preferencesRef, defaultPrefs);
      
      console.log('  ✅ Created default preferences');
      return {
        id: userId,
        ...defaultPrefs
      };
    }
  } catch (error: any) {
    console.error('  ❌ Load user preferences error:', error);
    throw new Error(`Failed to load user preferences: ${error.message}`);
  }
};

// Update macro targets specifically
export const updateMacroTargets = async (
  userId: string,
  macroTargets: Partial<UserPreferences['macroTargets']>
): Promise<void> => {
  try {
    console.log('🎯 Firestore DEBUG - updateMacroTargets:');
    console.log('  👤 UserId:', userId);
    console.log('  🎯 New targets:', macroTargets);
    
    await saveUserPreferences(userId, { 
      macroTargets: macroTargets as UserPreferences['macroTargets']
    });
    
    console.log('  ✅ Successfully updated macro targets');
  } catch (error: any) {
    console.error('  ❌ Update macro targets error:', error);
    throw new Error(`Failed to update macro targets: ${error.message}`);
  }
};

// Update default food amounts
export const updateDefaultFoodAmounts = async (
  userId: string,
  foodAmounts: Partial<UserPreferences['defaultFoodAmounts']>
): Promise<void> => {
  try {
    console.log('🥘 Firestore DEBUG - updateDefaultFoodAmounts:');
    console.log('  👤 UserId:', userId);
    console.log('  🥘 Food amounts:', foodAmounts);
    
    await saveUserPreferences(userId, { 
      defaultFoodAmounts: foodAmounts as UserPreferences['defaultFoodAmounts']
    });
    
    console.log('  ✅ Successfully updated default food amounts');
  } catch (error: any) {
    console.error('  ❌ Update default food amounts error:', error);
    throw new Error(`Failed to update default food amounts: ${error.message}`);
  }
};

// Update theme preference
export const updateTheme = async (
  userId: string,
  theme: UserPreferences['theme']
): Promise<void> => {
  try {
    console.log('🎨 Firestore DEBUG - updateTheme:');
    console.log('  👤 UserId:', userId);
    console.log('  🎨 New theme:', theme);
    
    await saveUserPreferences(userId, { theme });
    
    console.log('  ✅ Successfully updated theme');
  } catch (error: any) {
    console.error('  ❌ Update theme error:', error);
    throw new Error(`Failed to update theme: ${error.message}`);
  }
};

// Reset preferences to defaults
export const resetUserPreferences = async (userId: string): Promise<void> => {
  try {
    console.log('🔄 Firestore DEBUG - resetUserPreferences:');
    console.log('  👤 UserId:', userId);
    
    const preferencesRef = doc(db, COLLECTIONS.USER_PREFERENCES, userId);
    
    const resetPrefs: Omit<UserPreferences, 'id'> = {
      userId,
      ...DEFAULT_PREFERENCES,
      createdAt: createTimestamp(),
      updatedAt: createTimestamp()
    };
    
    await setDoc(preferencesRef, resetPrefs);
    
    console.log('  ✅ Successfully reset user preferences to defaults');
  } catch (error: any) {
    console.error('  ❌ Reset user preferences error:', error);
    throw new Error(`Failed to reset user preferences: ${error.message}`);
  }
};
