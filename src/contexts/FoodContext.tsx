import React, { createContext, useContext, useState, useEffect } from 'react';
import { subscribeToFoods, convertToLegacyFoodFormat } from '../services/firebase/nutrition/foodService';

interface FoodContextType {
  foodDatabase: Record<string, any>;
  loading: boolean;
  error: string | null;
}

const FoodContext = createContext<FoodContextType | null>(null);

export const FoodProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [foodDatabase, setFoodDatabase] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log('Starting Firestore foods subscription...');
    
    const unsubscribe = subscribeToFoods(
      (firestoreFoods) => {
        // Convert to legacy format with cost data
            const legacyDB = convertToLegacyFoodFormat(firestoreFoods);
            /* DEBUG: verify category field made it through */
            console.log('🟡 First 5 foods after convert:',
              Object.entries(legacyDB).slice(0, 5).map(([k, v]) => [k, v?.metadata?.category])
            );
        setFoodDatabase(legacyDB);
        setLoading(false);
        setError(null);
        console.log('Food cache updated:', Object.keys(legacyDB).length, 'foods');
      },
      (err) => {
        setError((err as Error).message || 'Failed to load foods');
        setLoading(false);
        console.error('Food subscription error:', err);
      }
    );

    return () => unsubscribe();
  }, []);

  return (
    <FoodContext.Provider value={{ foodDatabase, loading, error }}>
      {children}
    </FoodContext.Provider>
  );
};

export const useFoodDatabase = () => {
  const context = useContext(FoodContext);
  if (!context) {
    throw new Error('useFoodDatabase must be used within FoodProvider');
  }
  return context;
};
