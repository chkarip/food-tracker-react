/**
 * useRecipeForm.ts - Recipe form state management and validation
 * 
 * Manages all form-related state and operations:
 * - Form data state
 * - Form validation
 * - Ingredient CRUD operations
 * - Instruction management
 * - Tag management
 */

import { useState, useCallback, useMemo } from 'react';
import { Recipe, RecipeFormData, RecipeIngredient } from '../../../../types/recipe';
import { useRecipeCalculations } from './useRecipeCalculations';

const emptyFormData: RecipeFormData = {
  name: '',
  description: '',
  instructions: [''],
  ingredients: [],
  servings: 1,
  isFixedServing: false,
  category: 'Other',
  cookingTime: 30,
  difficulty: 'Easy',
  tags: []
};

export const useRecipeForm = () => {
  const [formData, setFormData] = useState<RecipeFormData>(emptyFormData);
  const [editingRecipe, setEditingRecipe] = useState<Recipe | null>(null);
  
  const {
    availableFoods,
    createIngredient,
    updateIngredientCalculations,
    calculateTotalNutrition,
    calculateTotalCost,
    calculateNutritionPerServing
  } = useRecipeCalculations();

  // Calculate totals based on current ingredients
  const totals = useMemo(() => {
    const totalNutrition = calculateTotalNutrition(formData.ingredients);
    const totalCost = calculateTotalCost(formData.ingredients);
    const nutritionPerServing = calculateNutritionPerServing(totalNutrition, formData.servings);
    const costPerServing = formData.servings > 0 ? totalCost / formData.servings : 0;

    return {
      totalNutrition,
      totalCost,
      nutritionPerServing,
      costPerServing
    };
  }, [formData.ingredients, formData.servings, calculateTotalNutrition, calculateTotalCost, calculateNutritionPerServing]);

  // Reset form to initial state
  const resetForm = useCallback(() => {
    setFormData(emptyFormData);
    setEditingRecipe(null);
  }, []);

  // Load recipe for editing
  const loadRecipeForEdit = useCallback((recipe: Recipe) => {
    setEditingRecipe(recipe);
    setFormData({
      name: recipe.name,
      description: recipe.description || '',
      instructions: recipe.instructions,
      ingredients: recipe.ingredients,
      servings: recipe.servings,
      isFixedServing: recipe.isFixedServing,
      category: recipe.category || 'Other',
      cookingTime: recipe.cookingTime || 30,
      difficulty: recipe.difficulty || 'Medium',
      tags: (recipe.tags || []).filter(tag => tag && tag.trim())
    });
  }, []);

  // Update form field
  const updateField = useCallback(<K extends keyof RecipeFormData>(field: K, value: RecipeFormData[K]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  // Ingredient operations
  const addIngredient = useCallback(() => {
    if (availableFoods.length === 0) return;
    
    const firstFood = availableFoods[0];
    const newIngredient = createIngredient(firstFood);

    setFormData(prev => ({
      ...prev,
      ingredients: [...prev.ingredients, newIngredient]
    }));
  }, [availableFoods, createIngredient]);

  const updateIngredient = useCallback((index: number, field: keyof RecipeIngredient, value: any) => {
    setFormData(prev => {
      const newIngredients = [...prev.ingredients];
      const ingredient = newIngredients[index];

      if (field === 'foodName' || field === 'amount') {
        newIngredients[index] = updateIngredientCalculations(ingredient, field, value);
      } else {
        newIngredients[index] = { ...ingredient, [field]: value };
      }

      return { ...prev, ingredients: newIngredients };
    });
  }, [updateIngredientCalculations]);

  const removeIngredient = useCallback((index: number) => {
    setFormData(prev => ({
      ...prev,
      ingredients: prev.ingredients.filter((_, i) => i !== index)
    }));
  }, []);

  // Instruction operations
  const addInstruction = useCallback(() => {
    setFormData(prev => ({
      ...prev,
      instructions: [...prev.instructions, '']
    }));
  }, []);

  const updateInstruction = useCallback((index: number, value: string) => {
    setFormData(prev => {
      const newInstructions = [...prev.instructions];
      newInstructions[index] = value;
      return { ...prev, instructions: newInstructions };
    });
  }, []);

  const removeInstruction = useCallback((index: number) => {
    setFormData(prev => ({
      ...prev,
      instructions: prev.instructions.filter((_, i) => i !== index)
    }));
  }, []);

  // Tag operations
  const addTag = useCallback((tag: string) => {
    const trimmedTag = tag?.trim() || '';
    if (!trimmedTag || formData.tags.includes(trimmedTag)) return;
    
    setFormData(prev => ({
      ...prev,
      tags: [...prev.tags, trimmedTag]
    }));
  }, [formData.tags]);

  const removeTag = useCallback((tag: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(t => t !== tag)
    }));
  }, []);

  // Form validation
  const validate = useCallback((): { isValid: boolean; error?: string } => {
    if (!formData.name.trim()) {
      return { isValid: false, error: 'Recipe name is required' };
    }

    if (formData.ingredients.length === 0) {
      return { isValid: false, error: 'At least one ingredient is required' };
    }

    if (formData.servings <= 0) {
      return { isValid: false, error: 'Servings must be greater than 0' };
    }

    return { isValid: true };
  }, [formData]);

  // Convert form data to Recipe object
  const toRecipe = useCallback((): Recipe => {
    return {
      id: editingRecipe?.id || '',
      name: formData.name,
      description: formData.description,
      instructions: formData.instructions.filter(inst => inst.trim() !== ''),
      ingredients: formData.ingredients,
      servings: formData.servings,
      isFixedServing: formData.isFixedServing,
      category: formData.category,
      cookingTime: formData.cookingTime,
      difficulty: formData.difficulty,
      tags: formData.tags,
      totalNutrition: totals.totalNutrition,
      nutritionPerServing: totals.nutritionPerServing,
      totalCost: totals.totalCost,
      costPerServing: totals.costPerServing,
      createdAt: editingRecipe?.createdAt || new Date(),
      updatedAt: new Date()
    };
  }, [formData, editingRecipe, totals]);

  return {
    formData,
    editingRecipe,
    totals,
    resetForm,
    loadRecipeForEdit,
    updateField,
    addIngredient,
    updateIngredient,
    removeIngredient,
    addInstruction,
    updateInstruction,
    removeInstruction,
    addTag,
    removeTag,
    validate,
    toRecipe
  };
};
