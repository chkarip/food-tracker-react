/**
 * useRecipeDetails.ts
 * Hook to fetch recipe details by name from Firestore
 */

import { useState, useCallback } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../config/firebase';
import { Recipe } from '../types/recipe';

export const useRecipeDetails = () => {
  const [loading, setLoading] = useState(false);
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchRecipe = useCallback(async (recipeName: string) => {
    // Remove the " (Recipe)" suffix to get the actual recipe name
    const cleanName = recipeName.replace(/\s*\(Recipe\)\s*$/i, '').trim();
    
    setLoading(true);
    setError(null);
    
    try {
      const recipesRef = collection(db, 'recipes');
      const q = query(recipesRef, where('name', '==', cleanName));
      const snapshot = await getDocs(q);
      
      if (snapshot.empty) {
        setError('Recipe not found');
        setRecipe(null);
        return;
      }
      
      const doc = snapshot.docs[0];
      const data = doc.data();
      
      // Helper to convert Firestore timestamp to Date
      const toDate = (timestamp: any): Date => {
        if (!timestamp) return new Date();
        if (timestamp.toDate && typeof timestamp.toDate === 'function') {
          return timestamp.toDate();
        }
        if (timestamp instanceof Date) return timestamp;
        if (typeof timestamp === 'string') return new Date(timestamp);
        return new Date();
      };

      const recipeData: Recipe = {
        id: doc.id,
        name: data.name || '',
        description: data.description || '',
        instructions: Array.isArray(data.instructions) ? data.instructions : [],
        ingredients: Array.isArray(data.ingredients) ? data.ingredients : [],
        servings: data.servings || 1,
        isFixedServing: data.isFixedServing || false,
        totalNutrition: data.totalNutrition || { protein: 0, fats: 0, carbs: 0, calories: 0 },
        totalCost: data.totalCost || 0,
        nutritionPerServing: data.nutritionPerServing || { protein: 0, fats: 0, carbs: 0, calories: 0 },
        costPerServing: data.costPerServing || 0,
        category: data.category,
        cookingTime: data.cookingTime,
        difficulty: data.difficulty,
        tags: data.tags || [],
        createdAt: toDate(data.createdAt),
        updatedAt: toDate(data.updatedAt),
      };
      
      setRecipe(recipeData);
    } catch (err) {
      console.error('Error fetching recipe:', err);
      setError('Failed to load recipe');
      setRecipe(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const clearRecipe = useCallback(() => {
    setRecipe(null);
    setError(null);
    setLoading(false);
  }, []);

  return {
    recipe,
    loading,
    error,
    fetchRecipe,
    clearRecipe,
  };
};
