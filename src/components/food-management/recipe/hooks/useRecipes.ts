/**
 * useRecipes.ts - Firestore CRUD operations for recipes
 * 
 * Handles all recipe database operations:
 * - Loading recipes from Firestore
 * - Creating new recipes
 * - Updating existing recipes
 * - Deleting recipes
 * - Creating corresponding food items for recipes
 */

import { useState, useCallback } from 'react';
import { collection, query, orderBy, getDocs, doc, setDoc, addDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../../../../config/firebase';
import { Recipe, RecipeIngredient } from '../../../../types/recipe';
import { addFood, deleteFood } from '../../../../services/firebase/nutrition/foodService';
import { useQueryClient } from '@tanstack/react-query';

// Helper functions
const cleanObject = (obj: any): any => {
  if (obj === null || obj === undefined) return {};
  if (typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.filter(item => item !== undefined);
  
  const cleaned: any = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) {
      cleaned[key] = typeof value === 'object' ? cleanObject(value) : value;
    }
  }
  return cleaned;
};

const ensureNutritionComplete = (nutrition: any) => ({
  protein: nutrition?.protein || 0,
  fats: nutrition?.fats || 0,
  carbs: nutrition?.carbs || 0,
  calories: nutrition?.calories || 0
});

export const useRecipes = () => {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const queryClient = useQueryClient();

  // Load all recipes
  const loadRecipes = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const recipesCollection = collection(db, 'recipes');
      const q = query(recipesCollection, orderBy('updatedAt', 'desc'));
      const querySnapshot = await getDocs(q);
      const loadedRecipes: Recipe[] = [];
      querySnapshot.forEach((docSnap) => {
        const data = docSnap.data();
        const firestoreDocId = docSnap.id; // The actual Firestore document ID
        const dataId = data.id; // The id field stored in the document (often empty)
        
        // Use Firestore document ID if the stored id field is empty
        const recipeId = (dataId && dataId.trim() !== '') ? dataId : firestoreDocId;
        
        console.log('🔍 Loading recipe:', { 
          firestoreDocId, 
          dataId, 
          finalId: recipeId, 
          name: data.name,
          hasEmptyDataId: !dataId || dataId.trim() === '' 
        });
        
        const recipe = { 
          ...cleanObject(data),
          id: recipeId, // Override with correct ID
          // Ensure all required fields exist to avoid undefined errors
          createdAt: data.createdAt || new Date(),
          updatedAt: data.updatedAt || new Date(),
          tags: Array.isArray(data.tags) ? data.tags : [],
          description: data.description || '',
          instructions: Array.isArray(data.instructions) ? data.instructions : [''],
          ingredients: Array.isArray(data.ingredients) ? data.ingredients : []
        } as Recipe;
        
        console.log('✅ Recipe loaded:', { id: recipe.id, ingredientsCount: recipe.ingredients?.length || 0, tagsCount: recipe.tags?.length || 0 });
        
        // Check for empty ingredient IDs and fix them
        if (recipe.ingredients?.length > 0) {
          recipe.ingredients = recipe.ingredients.map((ing, idx) => {
            if (!ing.id || ing.id.trim() === '') {
              console.warn(`⚠️ Recipe "${recipe.name}" has ingredient at index ${idx} with empty ID, generating new ID`);
              return { ...ing, id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}-${idx}` };
            }
            return ing;
          });
        }
        
        // Check for empty tags and filter them out
        if (recipe.tags && recipe.tags.length > 0) {
          const emptyTags = recipe.tags.filter(tag => !tag || tag.trim() === '');
          if (emptyTags.length > 0) {
            console.warn(`⚠️ Recipe "${recipe.name}" has ${emptyTags.length} empty tags, filtering them out`);
            recipe.tags = recipe.tags.filter(tag => tag && tag.trim() !== '');
          }
        }
        
        loadedRecipes.push(recipe);
      });
      
      console.log('📊 Total recipes loaded:', loadedRecipes.length);
      setRecipes(loadedRecipes);
    } catch (err) {
      setError('Failed to load recipes');
      console.error('❌ Load recipes error:', err);
    } finally {
      setLoading(false);
    }
  }, []); // Remove recipesCollection dependency

  // Save recipe (create or update)
  const saveRecipe = useCallback(async (recipeData: Recipe): Promise<{ success: boolean; error?: string }> => {
    try {
      setLoading(true);
      setError(null);
      
      const recipesCollection = collection(db, 'recipes');
      let recipeDocRef;
      let finalRecipeId: string;
      
      // Determine if this is create or update
      const isUpdate = recipeData.id && recipeData.id.trim() !== '';
      
      if (isUpdate) {
        // Update existing recipe
        finalRecipeId = recipeData.id;
        recipeDocRef = doc(recipesCollection, finalRecipeId);
        console.log('📝 Updating existing recipe:', finalRecipeId);
      } else {
        // Create new recipe - generate a temporary doc ref to get the ID
        recipeDocRef = doc(recipesCollection);
        finalRecipeId = recipeDocRef.id;
        console.log('✨ Creating new recipe with ID:', finalRecipeId);
      }
      
      // Build the recipe data object directly without cleanObject initially to preserve ID
      const recipeDataToSave = {
        ...recipeData,
        id: finalRecipeId, // CRITICAL: Always set the ID
        createdAt: recipeData.createdAt || new Date(),
        updatedAt: new Date(),
        tags: Array.isArray(recipeData.tags) ? recipeData.tags : [],
        description: recipeData.description || '',
        instructions: Array.isArray(recipeData.instructions) ? recipeData.instructions.filter(inst => inst && inst.trim()) : [''],
        ingredients: Array.isArray(recipeData.ingredients) ? recipeData.ingredients : [],
        totalNutrition: ensureNutritionComplete(recipeData.totalNutrition),
        nutritionPerServing: ensureNutritionComplete(recipeData.nutritionPerServing)
      };
      
      console.log('💾 Saving recipe with ID:', recipeDataToSave.id, 'Name:', recipeDataToSave.name);
      
      // Clean the data (but ID should already be set)
      const cleanRecipeData = cleanObject(recipeDataToSave);
      
      console.log('✅ After cleaning, ID is:', cleanRecipeData.id);
      
      // Save to Firestore (works for both create and update)
      await setDoc(recipeDocRef, cleanRecipeData);

      // Create/update corresponding food item
      await saveFoodItemForRecipe(cleanRecipeData);

      // Invalidate food cache to refresh the food database
      queryClient.invalidateQueries({ queryKey: ['foods'] });

      // Reload recipes
      await loadRecipes();
      
      return { success: true };
    } catch (err: any) {
      const errorMsg = 'Failed to save recipe';
      setError(errorMsg);
      console.error('Save recipe error:', err);
      return { success: false, error: errorMsg };
    } finally {
      setLoading(false);
    }
  }, [loadRecipes]);

  // Delete recipe
  const deleteRecipe = useCallback(async (recipeId: string, recipeName: string): Promise<{ success: boolean; error?: string }> => {
    try {
      setLoading(true);
      setError(null);

      // Validate recipe ID
      if (!recipeId || recipeId.trim() === '') {
        throw new Error('Recipe ID is missing or empty');
      }

      console.log('🗑️ Deleting recipe:', { id: recipeId, name: recipeName });

      const recipesCollection = collection(db, 'recipes');
      // Delete from recipes collection
      await deleteDoc(doc(recipesCollection, recipeId));

      // Delete corresponding food item - convert recipe name to document ID
      const foodDocId = recipeName.toLowerCase().replace(/[^a-z0-9]/g, '-');
      console.log('🗑️ Deleting food:', foodDocId);
      await deleteFood(foodDocId);

      // Reload recipes
      await loadRecipes();

      return { success: true };
    } catch (err: any) {
      const errorMsg = `Failed to delete recipe: ${err.message || 'Unknown error'}`;
      setError(errorMsg);
      console.error('❌ Delete recipe error:', err);
      return { success: false, error: errorMsg };
    } finally {
      setLoading(false);
    }
  }, [loadRecipes]);

  // Helper: Save food item for recipe
  const saveFoodItemForRecipe = async (recipe: Recipe) => {
    const totalWeight = calculateTotalWeight(recipe.ingredients);
    const nutritionPer100g = normalizeNutritionPer100g(recipe.totalNutrition, totalWeight);
    const costPerKg = calculateRecipeCostPerKg(recipe.ingredients);

    const foodData = {
      name: recipe.name,
      nutrition: nutritionPer100g,
      cost: {
        costPerKg: costPerKg,
        unit: 'kg' as const
      },
      category: recipe.category || 'Recipes',
      isUnitFood: false,
      useFixedAmount: recipe.isFixedServing,
      fixedAmount: recipe.isFixedServing ? totalWeight / recipe.servings : 100,
      fixedAmounts: recipe.isFixedServing ? [totalWeight / recipe.servings] : [100],
      hidden: false,
      favorite: false,
      isRecipe: true, // Mark as recipe
      recipeId: recipe.id // Store recipe reference
    };

    console.log('🍳 [useRecipes] Saving food for recipe:', {
      name: foodData.name,
      isRecipe: foodData.isRecipe,
      recipeId: foodData.recipeId,
      category: foodData.category
    });

    // addFood uses setDoc which will create or update
    await addFood(foodData);
  };

  // Helper: Calculate total weight
  const calculateTotalWeight = (ingredients: RecipeIngredient[]): number => {
    let totalWeight = 0;
    ingredients.forEach(ingredient => {
      if (ingredient.unit === 'g' || ingredient.unit === 'ml') {
        totalWeight += ingredient.amount;
      }
    });
    return totalWeight;
  };

  // Helper: Calculate cost per kg
  const calculateRecipeCostPerKg = (ingredients: RecipeIngredient[]): number => {
    const totalCost = ingredients.reduce((acc, ing) => acc + (ing.cost || 0), 0);
    
    let totalGrams = 0;
    ingredients.forEach(ingredient => {
      if (ingredient.unit === 'g' || ingredient.unit === 'ml') {
        totalGrams += ingredient.amount;
      }
    });
    
    const totalWeightKg = totalGrams / 1000;
    if (totalWeightKg === 0) return 0;
    return totalCost / totalWeightKg;
  };

  // Helper: Normalize nutrition to per 100g
  const normalizeNutritionPer100g = (totalNutrition: any, totalWeight: number) => {
    if (totalWeight === 0) return ensureNutritionComplete(totalNutrition);
    
    const factor = totalWeight / 100;
    return {
      protein: (totalNutrition?.protein || 0) / factor,
      fats: (totalNutrition?.fats || 0) / factor,
      carbs: (totalNutrition?.carbs || 0) / factor,
      calories: (totalNutrition?.calories || 0) / factor
    };
  };

  return {
    recipes,
    loading,
    error,
    loadRecipes,
    saveRecipe,
    deleteRecipe
  };
};
