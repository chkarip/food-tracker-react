import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
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
  Stack,
  Avatar,
  CardActions,
  Tooltip,
  FormControlLabel,
  Switch,
  Paper
} from '@mui/material';
import {
  Add as AddIcon,
  Remove as RemoveIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Restaurant as RecipeIcon,
  Timer as TimerIcon,
  People as ServingsIcon,
  LocalDining as DifficultyIcon,
  AttachMoney as CostIcon,
  Fastfood as NutritionIcon,
  Save as SaveIcon,
  Clear as ClearIcon,
  MenuBook as InstructionsIcon
} from '@mui/icons-material';
import { Recipe, RecipeIngredient, RecipeFormData } from '../types/recipe';
import { getAllFoods, DatabaseFood, convertToLegacyFoodFormat } from '../services/foodService';
import { calculateMacros } from '../utils/nutritionCalculations';

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

const RecipeManager: React.FC = () => {
  // State for recipes
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [foods, setFoods] = useState<DatabaseFood[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

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

  // Load foods and recipes on mount
  useEffect(() => {
    loadFoods();
    loadRecipes();
  }, []);

  const loadFoods = async () => {
    try {
      const foodsData = await getAllFoods();
      setFoods(foodsData);
    } catch (err) {
      setError('Failed to load foods');
    }
  };

  const loadRecipes = () => {
    const savedRecipes = localStorage.getItem('recipes');
    if (savedRecipes) {
      setRecipes(JSON.parse(savedRecipes));
    }
  };

  const saveRecipes = (updatedRecipes: Recipe[]) => {
    localStorage.setItem('recipes', JSON.stringify(updatedRecipes));
    setRecipes(updatedRecipes);
  };

  // Convert foods to legacy format for compatibility
  const foodDatabase = useMemo(() => convertToLegacyFoodFormat(foods), [foods]);
  const availableFoods = useMemo(() => Object.keys(foodDatabase), [foodDatabase]);

  // Calculate nutrition for an ingredient
  const calculateIngredientNutrition = useCallback((foodName: string, amount: number) => {
    const foodItem = foodDatabase[foodName];
    if (!foodItem) return { protein: 0, fats: 0, carbs: 0, calories: 0 };

    // Use the nutrition calculation from the existing utils
    const multiplier = foodItem.isUnitFood ? amount : amount / 100; // Convert per 100g to actual amount
    return {
      protein: foodItem.nutrition.protein * multiplier,
      fats: foodItem.nutrition.fats * multiplier,
      carbs: foodItem.nutrition.carbs * multiplier,
      calories: foodItem.nutrition.calories * multiplier
    };
  }, [foodDatabase]);

  // Calculate ingredient cost
  const calculateIngredientCost = useCallback((foodName: string, amount: number) => {
    const food = foods.find(f => f.name === foodName);
    if (!food) return 0;

    const multiplier = food.metadata.isUnitFood ? amount : amount / 1000; // Convert g to kg
    return food.cost.costPerKg * multiplier;
  }, [foods]);

  // Get food unit
  const getFoodUnit = useCallback((foodName: string): string => {
    const food = foods.find(f => f.name === foodName);
    return food?.metadata.isUnitFood ? 'units' : 'g';
  }, [foods]);

  // Add ingredient to recipe
  const addIngredient = () => {
    if (availableFoods.length === 0) return;

    const firstFood = availableFoods[0];
    const defaultAmount = foods.find(f => f.name === firstFood)?.metadata.isUnitFood ? 1 : 100;
    
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
        ingredient.amount = value;
        ingredient.nutrition = calculateIngredientNutrition(ingredient.foodName, value);
        ingredient.cost = calculateIngredientCost(ingredient.foodName, value);
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
        protein: acc.protein + ing.nutrition.protein,
        fats: acc.fats + ing.nutrition.fats,
        carbs: acc.carbs + ing.nutrition.carbs,
        calories: acc.calories + ing.nutrition.calories
      }),
      { protein: 0, fats: 0, carbs: 0, calories: 0 }
    );

    const totalCost = formData.ingredients.reduce((acc, ing) => acc + ing.cost, 0);

    const nutritionPerServing = {
      protein: totalNutrition.protein / formData.servings,
      fats: totalNutrition.fats / formData.servings,
      carbs: totalNutrition.carbs / formData.servings,
      calories: totalNutrition.calories / formData.servings
    };

    const costPerServing = totalCost / formData.servings;

    return {
      totalNutrition,
      totalCost,
      nutritionPerServing,
      costPerServing
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
  };

  // Open dialog for new recipe
  const handleNewRecipe = () => {
    resetForm();
    setDialogOpen(true);
  };

  // Open dialog for editing recipe
  const handleEditRecipe = (recipe: Recipe) => {
    setFormData({
      name: recipe.name,
      description: recipe.description || '',
      instructions: recipe.instructions,
      ingredients: recipe.ingredients,
      servings: recipe.servings,
      isFixedServing: recipe.isFixedServing,
      category: recipe.category || 'Other',
      cookingTime: recipe.cookingTime || 30,
      difficulty: recipe.difficulty || 'Easy',
      tags: recipe.tags || []
    });
    setEditingRecipe(recipe);
    setDialogOpen(true);
  };

  // Save recipe
  const handleSaveRecipe = () => {
    if (!formData.name.trim()) {
      setError('Recipe name is required');
      return;
    }

    if (formData.ingredients.length === 0) {
      setError('At least one ingredient is required');
      return;
    }

    const recipe: Recipe = {
      id: editingRecipe?.id || Date.now().toString(),
      name: formData.name.trim(),
      description: formData.description.trim(),
      instructions: formData.instructions.filter(inst => inst.trim()),
      ingredients: formData.ingredients,
      servings: formData.servings,
      isFixedServing: formData.isFixedServing,
      totalNutrition: totals.totalNutrition,
      totalCost: totals.totalCost,
      nutritionPerServing: totals.nutritionPerServing,
      costPerServing: totals.costPerServing,
      category: formData.category,
      cookingTime: formData.cookingTime,
      difficulty: formData.difficulty,
      tags: formData.tags,
      createdAt: editingRecipe?.createdAt || new Date(),
      updatedAt: new Date()
    };

    const updatedRecipes = editingRecipe
      ? recipes.map(r => r.id === editingRecipe.id ? recipe : r)
      : [...recipes, recipe];

    saveRecipes(updatedRecipes);
    setSuccess(`Recipe "${recipe.name}" ${editingRecipe ? 'updated' : 'created'} successfully!`);
    setDialogOpen(false);
    resetForm();
    setError(null);

    // Clear success message after 3 seconds
    setTimeout(() => setSuccess(null), 3000);
  };

  // Delete recipe
  const handleDeleteRecipe = (recipe: Recipe) => {
    const updatedRecipes = recipes.filter(r => r.id !== recipe.id);
    saveRecipes(updatedRecipes);
    setSuccess(`Recipe "${recipe.name}" deleted successfully!`);
    setDeleteDialogOpen(null);

    // Clear success message after 3 seconds
    setTimeout(() => setSuccess(null), 3000);
  };

  // Format nutrition value
  const formatNutrition = (value: number, decimals = 1) => {
    return value.toFixed(decimals);
  };

  // Format cost
  const formatCost = (cost: number) => {
    return `$${cost.toFixed(2)}`;
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <RecipeIcon color="primary" />
            Recipe Manager
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Create and manage your custom recipes with automatic nutrition and cost calculations
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleNewRecipe}
          size="large"
        >
          New Recipe
        </Button>
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
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' }, gap: 3 }}>
        {recipes.map((recipe) => (
          <Card key={recipe.id} sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <CardContent sx={{ flex: 1 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                <Typography variant="h6" component="h3" gutterBottom>
                  {recipe.name}
                </Typography>
                <Box>
                  <IconButton size="small" onClick={() => handleEditRecipe(recipe)}>
                    <EditIcon />
                  </IconButton>
                  <IconButton size="small" color="error" onClick={() => setDeleteDialogOpen(recipe)}>
                    <DeleteIcon />
                  </IconButton>
                </Box>
              </Box>

              {recipe.description && (
                <Typography variant="body2" color="text.secondary" paragraph>
                  {recipe.description}
                </Typography>
              )}

              {/* Recipe Info */}
              <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
                <Tooltip title="Servings">
                  <Chip
                    icon={<ServingsIcon />}
                    label={recipe.servings}
                    size="small"
                    variant="outlined"
                  />
                </Tooltip>
                <Tooltip title="Cooking Time">
                  <Chip
                    icon={<TimerIcon />}
                    label={`${recipe.cookingTime}min`}
                    size="small"
                    variant="outlined"
                  />
                </Tooltip>
                <Tooltip title="Difficulty">
                  <Chip
                    icon={<DifficultyIcon />}
                    label={recipe.difficulty}
                    size="small"
                    variant="outlined"
                    color={recipe.difficulty === 'Easy' ? 'success' : recipe.difficulty === 'Medium' ? 'warning' : 'error'}
                  />
                </Tooltip>
              </Stack>

              {/* Nutrition per serving */}
              <Box sx={{ bgcolor: 'primary.50', p: 2, borderRadius: 2, mb: 2 }}>
                <Typography variant="subtitle2" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <NutritionIcon fontSize="small" />
                  Per Serving
                </Typography>
                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1 }}>
                  <Box>
                    <Typography variant="caption" display="block">
                      💪 {formatNutrition(recipe.nutritionPerServing.protein)}g protein
                    </Typography>
                    <Typography variant="caption" display="block">
                      🥑 {formatNutrition(recipe.nutritionPerServing.fats)}g fats
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" display="block">
                      🍞 {formatNutrition(recipe.nutritionPerServing.carbs)}g carbs
                    </Typography>
                    <Typography variant="caption" display="block">
                      🔥 {formatNutrition(recipe.nutritionPerServing.calories, 0)} kcal
                    </Typography>
                  </Box>
                </Box>
                <Typography variant="body2" sx={{ mt: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CostIcon fontSize="small" />
                  {formatCost(recipe.costPerServing)} per serving
                </Typography>
              </Box>

              {/* Tags */}
              {recipe.tags && recipe.tags.length > 0 && (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {recipe.tags.map((tag) => (
                    <Chip key={tag} label={tag} size="small" variant="outlined" />
                  ))}
                </Box>
              )}
            </CardContent>

            <CardActions>
              <Button size="small" onClick={() => handleEditRecipe(recipe)}>
                View Details
              </Button>
            </CardActions>
          </Card>
        ))}

        {recipes.length === 0 && (
          <Box sx={{ gridColumn: '1 / -1' }}>
            <Paper sx={{ p: 4, textAlign: 'center' }}>
              <RecipeIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                No Recipes Yet
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                Create your first recipe to get started with automatic nutrition and cost calculations.
              </Typography>
              <Button variant="contained" startIcon={<AddIcon />} onClick={handleNewRecipe}>
                Create Your First Recipe
              </Button>
            </Paper>
          </Box>
        )}
      </Box>

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
        <DialogContent dividers>
          <Stack spacing={3} sx={{ mt: 1 }}>
            {/* Basic Info */}
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

            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' }, gap: 2 }}>
              <TextField
                label="Servings"
                type="number"
                value={formData.servings}
                onChange={(e) => setFormData(prev => ({ ...prev, servings: Math.max(1, Number(e.target.value)) }))}
                fullWidth
                inputProps={{ min: 1, step: 1 }}
              />
              <TextField
                label="Cook Time (min)"
                type="number"
                value={formData.cookingTime}
                onChange={(e) => setFormData(prev => ({ ...prev, cookingTime: Math.max(1, Number(e.target.value)) }))}
                fullWidth
                inputProps={{ min: 1, step: 5 }}
              />
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

            {/* Tags */}
            <Autocomplete
              multiple
              options={COMMON_TAGS}
              value={formData.tags}
              onChange={(_, newValue) => setFormData(prev => ({ ...prev, tags: newValue }))}
              freeSolo
              renderTags={(value, getTagProps) =>
                value.map((option, index) => (
                  <Chip variant="outlined" label={option} {...getTagProps({ index })} />
                ))
              }
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Tags"
                  placeholder="Add tags..."
                />
              )}
            />

            <Divider />

            {/* Ingredients */}
            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">Ingredients</Typography>
                <Button startIcon={<AddIcon />} onClick={addIngredient}>
                  Add Ingredient
                </Button>
              </Box>

              {formData.ingredients.map((ingredient, index) => (
                <Paper key={ingredient.id} sx={{ p: 2, mb: 2 }}>
                  <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '2fr 1fr 2fr auto' }, gap: 2, alignItems: 'center' }}>
                    <Autocomplete
                      options={availableFoods}
                      value={ingredient.foodName}
                      onChange={(_, value) => value && updateIngredient(index, 'foodName', value)}
                      renderInput={(params) => (
                        <TextField {...params} label="Food" fullWidth />
                      )}
                    />
                    <TextField
                      label={`Amount (${ingredient.unit})`}
                      type="number"
                      value={ingredient.amount}
                      onChange={(e) => updateIngredient(index, 'amount', Number(e.target.value))}
                      fullWidth
                      inputProps={{ min: 0, step: ingredient.unit === 'g' ? 10 : 0.1 }}
                    />
                    <Box>
                      <Typography variant="caption" display="block">
                        💪 {formatNutrition(ingredient.nutrition.protein)}g • 
                        🥑 {formatNutrition(ingredient.nutrition.fats)}g • 
                        🍞 {formatNutrition(ingredient.nutrition.carbs)}g • 
                        🔥 {formatNutrition(ingredient.nutrition.calories, 0)}kcal
                      </Typography>
                      <Typography variant="caption" color="primary">
                        Cost: {formatCost(ingredient.cost)}
                      </Typography>
                    </Box>
                    <IconButton onClick={() => removeIngredient(index)} color="error">
                      <RemoveIcon />
                    </IconButton>
                  </Box>
                </Paper>
              ))}
            </Box>

            <Divider />

            {/* Instructions */}
            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <InstructionsIcon />
                  Instructions
                </Typography>
                <Button startIcon={<AddIcon />} onClick={addInstruction}>
                  Add Step
                </Button>
              </Box>

              {formData.instructions.map((instruction, index) => (
                <Box key={index} sx={{ display: 'flex', gap: 2, mb: 2, alignItems: 'flex-start' }}>
                  <Typography variant="body2" sx={{ mt: 2, minWidth: 24 }}>
                    {index + 1}.
                  </Typography>
                  <TextField
                    label={`Step ${index + 1}`}
                    value={instruction}
                    onChange={(e) => updateInstruction(index, e.target.value)}
                    fullWidth
                    multiline
                    rows={2}
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
                <Paper sx={{ p: 2, bgcolor: 'success.50' }}>
                  <Typography variant="h6" gutterBottom>
                    Recipe Totals
                  </Typography>
                  <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
                    <Box>
                      <Typography variant="body2">
                        <strong>Total Nutrition:</strong>
                      </Typography>
                      <Typography variant="body2">
                        💪 {formatNutrition(totals.totalNutrition.protein)}g protein •{' '}
                        🥑 {formatNutrition(totals.totalNutrition.fats)}g fats •{' '}
                        🍞 {formatNutrition(totals.totalNutrition.carbs)}g carbs •{' '}
                        🔥 {formatNutrition(totals.totalNutrition.calories, 0)} kcal
                      </Typography>
                      <Typography variant="body2" sx={{ mt: 1 }}>
                        <strong>Total Cost:</strong> {formatCost(totals.totalCost)}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="body2">
                        <strong>Per Serving ({formData.servings} servings):</strong>
                      </Typography>
                      <Typography variant="body2">
                        💪 {formatNutrition(totals.nutritionPerServing.protein)}g protein •{' '}
                        🥑 {formatNutrition(totals.nutritionPerServing.fats)}g fats •{' '}
                        🍞 {formatNutrition(totals.nutritionPerServing.carbs)}g carbs •{' '}
                        🔥 {formatNutrition(totals.nutritionPerServing.calories, 0)} kcal
                      </Typography>
                      <Typography variant="body2" sx={{ mt: 1 }}>
                        <strong>Cost per serving:</strong> {formatCost(totals.costPerServing)}
                      </Typography>
                    </Box>
                  </Box>
                </Paper>
              </>
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button onClick={resetForm} startIcon={<ClearIcon />}>
            Clear Form
          </Button>
          <Button onClick={handleSaveRecipe} variant="contained" startIcon={<SaveIcon />}>
            {editingRecipe ? 'Update Recipe' : 'Save Recipe'}
          </Button>
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
          <Button onClick={() => setDeleteDialogOpen(null)}>Cancel</Button>
          <Button 
            onClick={() => deleteDialogOpen && handleDeleteRecipe(deleteDialogOpen)} 
            color="error" 
            variant="contained"
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default RecipeManager;
