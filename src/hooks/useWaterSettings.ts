/**
 * useWaterSettings.ts - Hook for managing water intake goal settings
 *
 * Following the useTemplates.ts pattern for consistent hook structure
 */

import { useState, useCallback, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { updateWaterIntakeGoal, getUserWaterGoal } from '../services/firebase/nutrition/userProfileService';

export const useWaterSettings = () => {
  const { user } = useAuth();
  const [waterGoal, setWaterGoal] = useState<number>(2500);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadWaterGoal = useCallback(async () => {
    if (!user?.uid) return;

    try {
      setLoading(true);
      setError(null);
      const goal = await getUserWaterGoal(user.uid);
      setWaterGoal(goal);
    } catch (err) {
      setError('Failed to load water goal');
    } finally {
      setLoading(false);
    }
  }, [user?.uid]);

  // Load water goal on mount or when user changes
  useEffect(() => {
    if (user?.uid) {
      loadWaterGoal();
    }
  }, [user?.uid, loadWaterGoal]);

  const saveWaterGoal = useCallback(async (newGoal: number) => {
    if (!user?.uid) {
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await updateWaterIntakeGoal(user.uid, newGoal);
      setWaterGoal(newGoal);
    } catch (err) {
      setError('Failed to save water goal');
    } finally {
      setLoading(false);
    }
  }, [user?.uid]);

  const updateWaterGoal = useCallback((newGoal: number) => {
    setWaterGoal(newGoal);
  }, []);

  return {
    waterGoal,
    loading,
    error,
    loadWaterGoal,
    saveWaterGoal,
    updateWaterGoal
  };
};