/**
 * FILE: RecipeManager.tsx
 * ------------------------------------------------------------------
 * PURPOSE
 * • Let end-users create, edit and delete **custom recipes** that
 * automatically calculate nutrition + € cost from the master food DB.
 *
 * CORE RESPONSIBILITIES
 * 1. DATA BOOTSTRAP
 * – Fetch full food list from Firestore (via getAllFoods) for
 * ingredient lookup.
 * – Load any recipes stored in Firestore for real-time sync.
 *
 * 2. AUTHORING WORKFLOW
 * – Dialog-driven form with sections for basic info, ingredients,
 * instructions and tags.
 * – Supports variable or fixed serving sizes.
 * – CRUD on ingredients (add / change food / change amount / delete).
 * – Live nutrition + cost roll-ups (total & per-serving).
 *
 * 3. PERSISTENCE RULES
 * – Recipes are stored in Firestore 'recipes' collection
 * – Each recipe also creates a corresponding food item in 'foods' collection
 * – Each save updates `updatedAt`; new recipes also get `createdAt`.
 *
 * BUSINESS LOGIC HIGHLIGHTS
 * • Nutrition = Σ(ingredient macros × amount) with correct 100 g vs unit
 * math. Cost = Σ(costPerKg × amountKg). 100 % client-side.
 * • Validation: recipe must have a non-empty name and ≥ 1 ingredient.
 * • Tags, difficulty and category are plain enums to drive future search
 * / filter features.
 * • Total weight calculation for proper per-100g normalization in foods collection.
 * • Proper cost per kg calculation based on total ingredient costs / total weight.
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Divider,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Autocomplete,
  Alert,
  CardActions,
  FormControlLabel,
  Switch,
  Paper
} from '@mui/material';
import {
  Remove as RemoveIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Timer as TimerIcon,
  People as ServingsIcon,
  LocalDining as DifficultyIcon,
  AttachMoney as CostIcon,
  Fastfood as NutritionIcon,
  RestaurantMenu as RecipeIcon
} from '@mui/icons-material';
import  AccentButton  from '../shared/AccentButton';
import { NumberStepper } from '../shared/inputs';
import {
  collection,
  addDoc,
  setDoc,
  doc,
  deleteDoc,
  getDocs,
  query,
  orderBy
} from 'firebase/firestore';
import { db } from '../../config/firebase';
import { Recipe, RecipeIngredient, RecipeFormData } from '../../types/recipe';
import { useFoodDatabase } from '../../contexts/FoodContext';
import { addFood, deleteFood } from '../../services/firebase/nutrition/foodService';
import { FoodFormData } from '../../types/food';

const RECIPE_CATEGORIES = [
  'Breakfast',
  'Lunch',
  'Dinner',
  'Snack',
  'Dessert',
  'Beverage',
  'Sauce',
  'Side Dish',
  'Other'
];

const DIFFICULTY_LEVELS = ['Easy', 'Medium', 'Hard'] as const;

const COMMON_TAGS = [
  'High Protein',
  'Low Carb',
  'High Fiber',
  'Quick',
  'Make Ahead',
  'Vegetarian',
  'Vegan',
  'Gluten Free',
  'Dairy Free',
  'Budget Friendly'
];

// Helper functions to prevent undefined errors
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

const RecipeManager: React.FC = () => {
  // Firestore collections
  const recipesCollection = collection(db, 'recipes');
  const foodsCollection = collection(db, 'foods');

  // State for recipes
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const { foodDatabase: cachedFoodDatabase } = useFoodDatabase();

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRecipe, setEditingRecipe] = useState<Recipe | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState<Recipe | null>(null);

  // Form state
  const [formData, setFormData] = useState<RecipeFormData>({
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
  });

  // Helper functions for weight calculation and normalization
  const calculateTotalWeight = (ingredients: RecipeIngredient[]): number => {
    let totalWeight = 0;
    ingredients.forEach(ingredient => {
      if (ingredient.unit === 'g' || ingredient.unit === 'ml') {
        // Treat ml as g (1:1 ratio for water-like substances)
        totalWeight += ingredient.amount;
      }
      // For 'units', you'd need conversion factors per food item
      // For now, we'll skip unit-based ingredients in weight calculation
    });
    return totalWeight;
  };

  // Calculate proper cost per kg for recipe based on ingredients
  const calculateRecipeCostPerKg = (ingredients: RecipeIngredient[]): number => {
    // Calculate total cost of all ingredients
    const totalCost = ingredients.reduce((acc, ing) => acc + (ing.cost || 0), 0);
    
    // Calculate total weight in kg (from grams/ml)
    let totalGrams = 0;
    ingredients.forEach(ingredient => {
      if (ingredient.unit === 'g' || ingredient.unit === 'ml') {
        totalGrams += ingredient.amount;
      }
      // Skip unit-based ingredients for weight calculation
    });
    
    const totalWeightKg = totalGrams / 1000; // Convert to kg
    
    if (totalWeightKg === 0) return 0;
    return totalCost / totalWeightKg; // €/kg
  };

  // Normalize nutrition to per 100g basis
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

  // Load recipes from Firestore
  const loadRecipes = async () => {
    try {
      setLoading(true);
      setError(null);
      const q = query(recipesCollection, orderBy('updatedAt', 'desc'));
      const querySnapshot = await getDocs(q);
      const loadedRecipes: Recipe[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        loadedRecipes.push({ 
          id: doc.id, 
          ...cleanObject(data),
          // Ensure all required fields exist to avoid undefined errors
          createdAt: data.createdAt || new Date(),
          updatedAt: data.updatedAt || new Date(),
          tags: Array.isArray(data.tags) ? data.tags : [],
          description: data.description || '',
          instructions: Array.isArray(data.instructions) ? data.instructions : [''],
          ingredients: Array.isArray(data.ingredients) ? data.ingredients : []
        } as Recipe);
      });
      setRecipes(loadedRecipes);
    } catch (err) {
      console.error('Error loading recipes:', err);
      setError('Failed to load recipes');
    } finally {
      setLoading(false);
    }
  };

  // Save recipe to both recipes and foods collections using foodService
  const saveRecipeWithFood = async (recipeData: Recipe) => {
    try {
      setLoading(true);
      setError(null);
      
      // Clean the recipe data to avoid undefined issues
      const cleanRecipeData = cleanObject({
        ...recipeData,
        createdAt: recipeData.createdAt || new Date(),
        updatedAt: new Date(),
        tags: Array.isArray(recipeData.tags) ? recipeData.tags : [],
        description: recipeData.description || '',
        instructions: Array.isArray(recipeData.instructions) ? recipeData.instructions.filter(inst => inst && inst.trim()) : [''],
        ingredients: Array.isArray(recipeData.ingredients) ? recipeData.ingredients : [],
        totalNutrition: ensureNutritionComplete(recipeData.totalNutrition),
        nutritionPerServing: ensureNutritionComplete(recipeData.nutritionPerServing)
      });
      
      let recipeDocRef;
      
      if (recipeData.id && editingRecipe) {
        // Update existing recipe
        recipeDocRef = doc(recipesCollection, recipeData.id);
        await setDoc(recipeDocRef, cleanRecipeData);
      } else {
        // Create new recipe
        recipeDocRef = await addDoc(recipesCollection, cleanRecipeData);
        cleanRecipeData.id = recipeDocRef.id;
      }

      // Calculate total weight and normalize nutrition
      const totalWeight = calculateTotalWeight(cleanRecipeData.ingredients);
      const nutritionPer100g = normalizeNutritionPer100g(
        cleanRecipeData.totalNutrition, 
        totalWeight
      );

      // Calculate proper cost per kg based on ingredients
      const recipeCostPerKg = calculateRecipeCostPerKg(cleanRecipeData.ingredients);

      // Create food data using the same structure as foodService expects
      const foodFormData: FoodFormData = {
        name: `${cleanRecipeData.name} (Recipe)`,
        nutrition: ensureNutritionComplete(nutritionPer100g),
        cost: {
          costPerKg: recipeCostPerKg,
          unit: 'kg'
        },
        category: cleanRecipeData.category || 'Other',
        isUnitFood: false,
        useFixedAmount: false,
        fixedAmount: 100,
        hidden: false
      };

      // Use the foodService.addFood function to create the food item
      // This ensures proper structure with addedAt, lastUpdated, etc.
      await addFood(foodFormData);

      return cleanRecipeData.id;
    } catch (err) {
      console.error('Error saving recipe and food:', err);
      throw new Error(`Failed to save recipe: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  // Load recipes on mount
  useEffect(() => {
    loadRecipes();
  }, []);

  // Convert foods to legacy format for compatibility
  const foodDatabase = useMemo(() => cachedFoodDatabase, [cachedFoodDatabase]);
  const availableFoods = useMemo(() => Object.keys(foodDatabase), [foodDatabase]);

  // Calculate nutrition for an ingredient
  const calculateIngredientNutrition = useCallback((foodName: string, amount: number) => {
    const foodItem = foodDatabase[foodName];
    if (!foodItem) return { protein: 0, fats: 0, carbs: 0, calories: 0 };

    // Use the nutrition calculation from the existing utils
    const multiplier = foodItem.isUnitFood ? amount : amount / 100; // Convert per 100g to actual amount

    return ensureNutritionComplete({
      protein: (foodItem.nutrition?.protein || 0) * multiplier,
      fats: (foodItem.nutrition?.fats || 0) * multiplier,
      carbs: (foodItem.nutrition?.carbs || 0) * multiplier,
      calories: (foodItem.nutrition?.calories || 0) * multiplier
    });
  }, [foodDatabase]);

  // Calculate ingredient cost
  const calculateIngredientCost = useCallback((foodName: string, amount: number) => {
    const foodItem = foodDatabase[foodName];
    if (!foodItem || !foodItem.cost) return 0;

    const multiplier = foodItem.isUnitFood ? amount : amount / 1000; // Convert g to kg
    return Math.max(0, (foodItem.cost.costPerKg || 0) * multiplier);
  }, [foodDatabase]);

  // Get food unit
  const getFoodUnit = useCallback((foodName: string): string => {
    const foodItem = foodDatabase[foodName];
    return foodItem?.isUnitFood ? 'units' : 'g';
  }, [foodDatabase]);

  // Add ingredient to recipe
  const addIngredient = () => {
    if (availableFoods.length === 0) return;
    const firstFood = availableFoods[0];
    const foodItem = foodDatabase[firstFood];
    const defaultAmount = foodItem?.isUnitFood ? 1 : 100;

    const newIngredient: RecipeIngredient = {
      id: Date.now().toString(),
      foodName: firstFood,
      amount: defaultAmount,
      unit: getFoodUnit(firstFood),
      nutrition: calculateIngredientNutrition(firstFood, defaultAmount),
      cost: calculateIngredientCost(firstFood, defaultAmount)
    };

    setFormData(prev => ({
      ...prev,
      ingredients: [...prev.ingredients, newIngredient]
    }));
  };

  // Update ingredient
  const updateIngredient = (index: number, field: keyof RecipeIngredient, value: any) => {
    setFormData(prev => {
      const newIngredients = [...prev.ingredients];
      const ingredient = { ...newIngredients[index] };

      if (field === 'foodName') {
        ingredient.foodName = value;
        ingredient.unit = getFoodUnit(value);
        ingredient.nutrition = calculateIngredientNutrition(value, ingredient.amount);
        ingredient.cost = calculateIngredientCost(value, ingredient.amount);
      } else if (field === 'amount') {
        ingredient.amount = Math.max(0, value);
        ingredient.nutrition = calculateIngredientNutrition(ingredient.foodName, ingredient.amount);
        ingredient.cost = calculateIngredientCost(ingredient.foodName, ingredient.amount);
      } else {
        (ingredient as any)[field] = value;
      }

      newIngredients[index] = ingredient;
      return { ...prev, ingredients: newIngredients };
    });
  };

  // Remove ingredient
  const removeIngredient = (index: number) => {
    setFormData(prev => ({
      ...prev,
      ingredients: prev.ingredients.filter((_, i) => i !== index)
    }));
  };

  // Add instruction
  const addInstruction = () => {
    setFormData(prev => ({
      ...prev,
      instructions: [...prev.instructions, '']
    }));
  };

  // Update instruction
  const updateInstruction = (index: number, value: string) => {
    setFormData(prev => {
      const newInstructions = [...prev.instructions];
      newInstructions[index] = value;
      return { ...prev, instructions: newInstructions };
    });
  };

  // Remove instruction
  const removeInstruction = (index: number) => {
    setFormData(prev => ({
      ...prev,
      instructions: prev.instructions.filter((_, i) => i !== index)
    }));
  };

  // Calculate totals
  const totals = useMemo(() => {
    const totalNutrition = formData.ingredients.reduce(
      (acc, ing) => ({
        protein: acc.protein + (ing.nutrition?.protein || 0),
        fats: acc.fats + (ing.nutrition?.fats || 0),
        carbs: acc.carbs + (ing.nutrition?.carbs || 0),
        calories: acc.calories + (ing.nutrition?.calories || 0)
      }),
      { protein: 0, fats: 0, carbs: 0, calories: 0 }
    );

    const totalCost = formData.ingredients.reduce((acc, ing) => acc + (ing.cost || 0), 0);
    const servings = Math.max(1, formData.servings);

    const nutritionPerServing = {
      protein: totalNutrition.protein / servings,
      fats: totalNutrition.fats / servings,
      carbs: totalNutrition.carbs / servings,
      calories: totalNutrition.calories / servings
    };

    const costPerServing = totalCost / servings;

    return {
      totalNutrition: ensureNutritionComplete(totalNutrition),
      totalCost: Math.max(0, totalCost),
      nutritionPerServing: ensureNutritionComplete(nutritionPerServing),
      costPerServing: Math.max(0, costPerServing)
    };
  }, [formData.ingredients, formData.servings]);

  // Reset form
  const resetForm = () => {
    setFormData({
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
    });
    setEditingRecipe(null);
    setError(null);
    setSuccess(null);
  };

  // Open dialog for new recipe
  const handleNewRecipe = () => {
    resetForm();
    setDialogOpen(true);
  };

  // Open dialog for editing recipe
  const handleEditRecipe = (recipe: Recipe) => {
    setFormData({
      name: recipe.name || '',
      description: recipe.description || '',
      instructions: Array.isArray(recipe.instructions) ? recipe.instructions : [''],
      ingredients: Array.isArray(recipe.ingredients) ? recipe.ingredients : [],
      servings: Math.max(1, recipe.servings || 1),
      isFixedServing: recipe.isFixedServing || false,
      category: recipe.category || 'Other',
      cookingTime: Math.max(1, recipe.cookingTime || 30),
      difficulty: recipe.difficulty || 'Easy',
      tags: Array.isArray(recipe.tags) ? recipe.tags : []
    });
    setEditingRecipe(recipe);
    setDialogOpen(true);
  };

  // Save recipe to Firestore and create corresponding food item
  const handleSaveRecipe = async () => {
    if (!formData.name.trim()) {
      setError('Recipe name is required');
      return;
    }

    if (formData.ingredients.length === 0) {
      setError('At least one ingredient is required');
      return;
    }

    try {
      const recipe: Recipe = {
        id: editingRecipe?.id || '',
        name: formData.name.trim(),
        description: formData.description.trim(),
        instructions: formData.instructions.filter(inst => inst && inst.trim()),
        ingredients: formData.ingredients,
        servings: Math.max(1, formData.servings),
        isFixedServing: formData.isFixedServing,
        totalNutrition: totals.totalNutrition,
        totalCost: totals.totalCost,
        nutritionPerServing: totals.nutritionPerServing,
        costPerServing: totals.costPerServing,
        category: formData.category,
        cookingTime: Math.max(1, formData.cookingTime),
        difficulty: formData.difficulty,
        tags: formData.tags,
        createdAt: editingRecipe?.createdAt || new Date(),
        updatedAt: new Date()
      };

      await saveRecipeWithFood(recipe);
      await loadRecipes();

      setSuccess(`✅ Recipe "${recipe.name}" ${editingRecipe ? 'updated' : 'created'} successfully! Also added to foods collection.`);
      setDialogOpen(false);
      resetForm();

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(`Failed to save recipe: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  // Delete recipe from both collections
  const handleDeleteRecipe = async (recipe: Recipe) => {
    try {
      setLoading(true);
      setError(null);
      
      // Delete from recipes collection
      await deleteDoc(doc(recipesCollection, recipe.id));
      
      // Delete from foods collection using the foodService naming pattern
      const recipeFoodName = `${recipe.name} (Recipe)`;
      const foodDocId = recipeFoodName.toLowerCase().replace(/[^a-z0-9]/g, '-');
      await deleteFood(foodDocId);
      
      // Reload recipes
      await loadRecipes();

      setSuccess(`✅ Recipe "${recipe.name}" deleted successfully from both collections!`);
      setDeleteDialogOpen(null);

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('Error deleting recipe:', err);
      setError(`Failed to delete recipe: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  // Format nutrition value
  const formatNutrition = (value: number, decimals = 1) => {
    return Math.max(0, value || 0).toFixed(decimals);
  };

  // Format cost
  const formatCost = (cost: number) => {
    return `€${Math.max(0, cost || 0).toFixed(2)}`;
  };

  return (
    <Box sx={{ p: 3, maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header */}
      <Box sx={{ mb: 3, textAlign: 'center' }}>
        <Typography variant="h4" component="h1" gutterBottom>
          <RecipeIcon sx={{ mr: 2, verticalAlign: 'middle' }} />
          Recipe Manager
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          Create and manage your custom recipes with automatic nutrition and cost calculations
        </Typography>
        
          <AccentButton
            onClick={handleNewRecipe}
            size="large"
            disabled={loading}
            variant="primary"
          >
            ➕ New Recipe
          </AccentButton>
        </Box>

      {/* Success/Error Messages */}
      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Recipe Cards */}
      <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))' }}>
        {recipes.map((recipe) => (
          <Card key={recipe.id} sx={{ height: 'fit-content' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                {recipe.name}
              </Typography>
              
              <Box sx={{ display: 'flex', gap: 1, mb: 2, alignItems: 'center' }}>
                <IconButton size="small" onClick={() => handleEditRecipe(recipe)} disabled={loading}>
                  <EditIcon />
                </IconButton>
                <IconButton size="small" color="error" onClick={() => setDeleteDialogOpen(recipe)} disabled={loading}>
                  <DeleteIcon />
                </IconButton>
              </Box>

              {recipe.description && (
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  {recipe.description}
                </Typography>
              )}

              {/* Recipe Info */}
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
                <Chip
                  icon={<ServingsIcon />}
                  label={`${recipe.servings || 1} servings`}
                  size="small"
                  variant="outlined"
                />
                <Chip
                  icon={<TimerIcon />}
                  label={`${recipe.cookingTime || 30}min`}
                  size="small"
                  variant="outlined"
                />
                <Chip
                  icon={<DifficultyIcon />}
                  label={recipe.difficulty || 'Easy'}
                  size="small"
                  variant="outlined"
                  color={recipe.difficulty === 'Easy' ? 'success' : recipe.difficulty === 'Medium' ? 'warning' : 'error'}
                />
              </Box>

              {/* Nutrition per serving */}
              <Typography variant="subtitle2" gutterBottom>
                <NutritionIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                Per Serving
              </Typography>
              <Typography variant="body2" sx={{ mb: 1 }}>
                💪 {formatNutrition(recipe.nutritionPerServing?.protein || 0)}g protein •{' '}
                🥑 {formatNutrition(recipe.nutritionPerServing?.fats || 0)}g fats •{' '}
                🍞 {formatNutrition(recipe.nutritionPerServing?.carbs || 0)}g carbs •{' '}
                🔥 {formatNutrition(recipe.nutritionPerServing?.calories || 0, 0)} kcal
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                <CostIcon sx={{ mr: 0.5, verticalAlign: 'middle', fontSize: 16 }} />
                {formatCost(recipe.costPerServing || 0)} per serving
              </Typography>

              {/* Tags */}
              {recipe.tags && Array.isArray(recipe.tags) && recipe.tags.length > 0 && (
                <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                  {recipe.tags.map((tag, index) => (
                    <Chip key={index} label={tag} size="small" />
                  ))}
                </Box>
              )}
            </CardContent>
            
            <CardActions>
              <AccentButton 
                size="small" 
                onClick={() => handleEditRecipe(recipe)} 
                disabled={loading}
                variant="primary"
              >
                👁️ View Details
              </AccentButton>
            </CardActions>
          </Card>
        ))}
      </Box>

      {recipes.length === 0 && !loading && (
        <Paper sx={{ p: 4, textAlign: 'center', mt: 4 }}>
          <RecipeIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" gutterBottom>
            No Recipes Yet
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Create your first recipe to get started with automatic nutrition and cost calculations.
          </Typography>
          <AccentButton
            variant="primary"
            onClick={handleNewRecipe}
          >
            ➕ Create Your First Recipe
          </AccentButton>
        </Paper>
      )}

      {/* Recipe Dialog */}
      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{ sx: { maxHeight: '90vh' } }}
      >
        <DialogTitle>
          {editingRecipe ? 'Edit Recipe' : 'New Recipe'}
        </DialogTitle>
        
        <DialogContent sx={{ pb: 0 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, pt: 1 }}>
            {/* Basic Info */}
            <Box>
              <Typography variant="h6" gutterBottom>Basic Information</Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <TextField
                  label="Recipe Name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  fullWidth
                  required
                />
                
                <TextField
                  label="Description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  fullWidth
                  multiline
                  rows={2}
                />

                <Box sx={{ display: 'flex', gap: 2 }}>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="body2" sx={{ mb: 1, fontWeight: 500 }}>
                      Servings
                    </Typography>
                    <NumberStepper
                      value={formData.servings}
                      onChange={(value) => setFormData(prev => ({ ...prev, servings: Math.max(1, value) }))}
                      min={1}
                      max={20}
                      step={1}
                      unit="servings"
                      size="medium"
                    />
                  </Box>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="body2" sx={{ mb: 1, fontWeight: 500 }}>
                      Cooking Time
                    </Typography>
                    <NumberStepper
                      value={formData.cookingTime}
                      onChange={(value) => setFormData(prev => ({ ...prev, cookingTime: Math.max(1, value) }))}
                      min={1}
                      max={300}
                      step={5}
                      unit="min"
                      size="medium"
                    />
                  </Box>
                </Box>
                </Box>

                <Box sx={{ display: 'flex', gap: 2 }}>
                  <FormControl fullWidth>
                    <InputLabel>Category</InputLabel>
                    <Select
                      value={formData.category}
                      onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                      label="Category"
                    >
                      {RECIPE_CATEGORIES.map((cat) => (
                        <MenuItem key={cat} value={cat}>{cat}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  <FormControl fullWidth>
                    <InputLabel>Difficulty</InputLabel>
                    <Select
                      value={formData.difficulty}
                      onChange={(e) => setFormData(prev => ({ ...prev, difficulty: e.target.value as any }))}
                      label="Difficulty"
                    >
                      {DIFFICULTY_LEVELS.map((diff) => (
                        <MenuItem key={diff} value={diff}>{diff}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Box>

                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.isFixedServing}
                      onChange={(e) => setFormData(prev => ({ ...prev, isFixedServing: e.target.checked }))}
                    />
                  }
                  label="Fixed serving size (cannot be scaled)"
                />
              </Box>
            </Box>

            {/* Tags */}
            <Box>
              <Typography variant="h6" gutterBottom>Tags</Typography>
              <Autocomplete
                multiple
                options={COMMON_TAGS}
                value={formData.tags}
                onChange={(_, newValue) => setFormData(prev => ({ ...prev, tags: newValue }))}
                freeSolo
                renderTags={(value, getTagProps) =>
                  value.map((option, index) => (
                    <Chip variant="outlined" label={option} {...getTagProps({ index })} key={index} />
                  ))
                }
                renderInput={(params) => (
                  <TextField {...params} label="Tags" placeholder="Add tags..." />
                )}
              />
            </Box>

            {/* Ingredients */}
            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">Ingredients</Typography>
                <AccentButton 
                  onClick={addIngredient} 
                  disabled={availableFoods.length === 0}
                  variant="success"
                >
                  ➕ Add Ingredient
                </AccentButton>
              </Box>

              {formData.ingredients.map((ingredient, index) => (
                <Paper key={ingredient.id} sx={{ p: 2, mb: 2 }}>
                  <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start', mb: 2 }}>
                    <Autocomplete
                      value={ingredient.foodName}
                      onChange={(_, value) => value && updateIngredient(index, 'foodName', value)}
                      options={availableFoods}
                      renderInput={(params) => (
                        <TextField {...params} label="Food" fullWidth />
                      )}
                      sx={{ flex: 2 }}
                    />
                    
                    <NumberStepper
                      value={ingredient.amount}
                      onChange={(value) => updateIngredient(index, 'amount', value)}
                      min={0}
                      max={ingredient.unit === 'g' ? 2000 : 20}
                      step={ingredient.unit === 'g' ? 10 : 0.1}
                      unit={ingredient.unit}
                      size="small"
                    />
                    
                    <IconButton onClick={() => removeIngredient(index)} color="error">
                      <RemoveIcon />
                    </IconButton>
                  </Box>
                  
                  <Typography variant="body2" color="text.secondary">
                    💪 {formatNutrition(ingredient.nutrition?.protein || 0)}g •{' '}
                    🥑 {formatNutrition(ingredient.nutrition?.fats || 0)}g •{' '}
                    🍞 {formatNutrition(ingredient.nutrition?.carbs || 0)}g •{' '}
                    🔥 {formatNutrition(ingredient.nutrition?.calories || 0, 0)}kcal
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Cost: {formatCost(ingredient.cost || 0)}
                  </Typography>
                </Paper>
              ))}
            </Box>

            {/* Instructions */}
            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">Instructions</Typography>
                <AccentButton 
                  onClick={addInstruction}
                  variant="success"
                >
                  ➕ Add Step
                </AccentButton>
              </Box>

              {formData.instructions.map((instruction, index) => (
                <Box key={index} sx={{ display: 'flex', gap: 2, alignItems: 'flex-start', mb: 2 }}>
                  <Typography variant="body1" sx={{ mt: 2, minWidth: 'fit-content' }}>
                    {index + 1}.
                  </Typography>
                  <TextField
                    value={instruction}
                    onChange={(e) => updateInstruction(index, e.target.value)}
                    fullWidth
                    multiline
                    rows={2}
                    placeholder="Describe this step..."
                  />
                  <IconButton onClick={() => removeInstruction(index)} color="error">
                    <RemoveIcon />
                  </IconButton>
                </Box>
              ))}
            </Box>

            {/* Nutrition Summary */}
            {formData.ingredients.length > 0 && (
              <>
                <Divider />
                <Box>
                  <Typography variant="h6" gutterBottom>Recipe Totals</Typography>
                  
                  {/* Total weight display */}
                  <Typography variant="body1" gutterBottom>
                    <strong>Total Weight:</strong> {calculateTotalWeight(formData.ingredients).toFixed(0)}g
                  </Typography>

                  {/* Total cost per kg display */}
                  <Typography variant="body1" gutterBottom>
                    <strong>Cost per kg:</strong> {formatCost(calculateRecipeCostPerKg(formData.ingredients))}
                  </Typography>
                  
                  <Typography variant="body1" gutterBottom>
                    <strong>Total Nutrition:</strong><br />
                    💪 {formatNutrition(totals.totalNutrition.protein)}g protein •{' '}
                    🥑 {formatNutrition(totals.totalNutrition.fats)}g fats •{' '}
                    🍞 {formatNutrition(totals.totalNutrition.carbs)}g carbs •{' '}
                    🔥 {formatNutrition(totals.totalNutrition.calories, 0)} kcal
                  </Typography>
                  
                  <Typography variant="body1" gutterBottom>
                    <strong>Total Cost:</strong> {formatCost(totals.totalCost)}
                  </Typography>
                  
                  <Typography variant="body1" gutterBottom>
                    <strong>Per Serving ({formData.servings} servings):</strong><br />
                    💪 {formatNutrition(totals.nutritionPerServing.protein)}g protein •{' '}
                    🥑 {formatNutrition(totals.nutritionPerServing.fats)}g fats •{' '}
                    🍞 {formatNutrition(totals.nutritionPerServing.carbs)}g carbs •{' '}
                    🔥 {formatNutrition(totals.nutritionPerServing.calories, 0)} kcal
                  </Typography>

                  {/* Show nutrition per 100g preview */}
                  <Typography variant="body1" gutterBottom>
                    <strong>Per 100g (for foods collection):</strong><br />
                    {(() => {
                      const totalWeight = calculateTotalWeight(formData.ingredients);
                      const per100g = normalizeNutritionPer100g(totals.totalNutrition, totalWeight);
                      return `💪 ${formatNutrition(per100g.protein)}g protein • 🥑 ${formatNutrition(per100g.fats)}g fats • 🍞 ${formatNutrition(per100g.carbs)}g carbs • 🔥 ${formatNutrition(per100g.calories, 0)} kcal`;
                    })()}
                  </Typography>
                  
                  <Typography variant="body1">
                    <strong>Cost per serving:</strong> {formatCost(totals.costPerServing)}
                  </Typography>
                </Box>
              </>
            )}
        </DialogContent>

        <DialogActions sx={{ p: 3 }}>
          <AccentButton 
            onClick={() => setDialogOpen(false)} 
            disabled={loading}
            variant="secondary"
          >
            Cancel
          </AccentButton>
          <AccentButton 
            onClick={resetForm}
            disabled={loading}
            variant="secondary"
          >
            🧹 Clear Form
          </AccentButton>
          <AccentButton 
            onClick={handleSaveRecipe}
            variant="primary"
            disabled={loading}
            loading={loading}
          >
            {editingRecipe ? '💾 Update Recipe' : '💾 Save Recipe'}
          </AccentButton>
        </DialogActions>
      </Dialog>
      

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={!!deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(null)}
      >
        <DialogTitle>Delete Recipe</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete "{deleteDialogOpen?.name}"? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <AccentButton 
            onClick={() => setDeleteDialogOpen(null)} 
            disabled={loading}
            variant="secondary"
          >
            Cancel
          </AccentButton>
          <AccentButton
            onClick={() => {
              if (deleteDialogOpen) {
                handleDeleteRecipe(deleteDialogOpen);
              }
            }}
            variant="danger"
            disabled={loading}
            loading={loading}
          >
            🗑️ Delete
          </AccentButton>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default RecipeManager;
