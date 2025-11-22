/**
 * RecipeManager.tsx - REFACTORED VERSION
 * ------------------------------------------------------------------
 * Orchestration layer for recipe management.
 * Business logic extracted to hooks, keeping only UI coordination here.
 * 
 * ARCHITECTURE:
 * - useRecipes: Firestore CRUD operations
 * - useRecipeCalculations: Nutrition and cost calculations
 * - useRecipeForm: Form state management
 * - RecipeManager: UI orchestration only
 */

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  TextField,
  Paper,
  Chip,
  IconButton,
  Divider,
  CircularProgress,
  Switch,
  FormControlLabel,
  Autocomplete
} from '@mui/material';
import {
  Remove as RemoveIcon,
  Restaurant as RecipeIcon,
  Person as PersonIcon
} from '@mui/icons-material';

import { PageCard } from '../shared/PageCard';
import AccentButton from '../shared/AccentButton';
import { NumberStepper, CustomSelect } from '../shared/inputs';
import { Recipe, RecipeIngredient } from '../../types/recipe';

// Import refactored hooks
import { useRecipes, useRecipeCalculations, useRecipeForm } from './recipe/hooks';

const RECIPE_CATEGORIES = ['Breakfast', 'Lunch', 'Dinner', 'Snack', 'Dessert', 'Other'] as const;
const DIFFICULTY_LEVELS = ['Easy', 'Medium', 'Hard'] as const;
const COMMON_TAGS = [
  'High Protein', 'Low Carb', 'High Fiber', 'Quick', 'Make Ahead',
  'Vegetarian', 'Vegan', 'Gluten Free', 'Dairy Free', 'Budget Friendly'
];

const RecipeManager: React.FC = React.memo(() => {
  const navigate = useNavigate();
  
  // Hooks for business logic
  const { recipes, loading: recipesLoading, error: recipesError, loadRecipes, saveRecipe, deleteRecipe } = useRecipes();
  const { availableFoods } = useRecipeCalculations();
  const {
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
  } = useRecipeForm();

  // Local UI state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState<Recipe | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Load recipes on mount - only once
  useEffect(() => {
    loadRecipes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty deps - only run once on mount

  // Open dialog for new recipe
  const handleNewRecipe = () => {
    resetForm();
    setDialogOpen(true);
    setError(null);
  };

  // Open dialog for editing
  const handleEditRecipe = (recipe: Recipe) => {
    loadRecipeForEdit(recipe);
    setDialogOpen(true);
    setError(null);
  };

  // Save recipe (create or update)
  const handleSaveRecipe = async () => {
    const validation = validate();
    if (!validation.isValid) {
      setError(validation.error || 'Validation failed');
      return;
    }

    const recipe = toRecipe();
    const result = await saveRecipe(recipe);

    if (result.success) {
      setSuccess(`Recipe "${recipe.name}" ${editingRecipe ? 'updated' : 'created'} successfully!`);
      setDialogOpen(false);
      resetForm();
      setTimeout(() => setSuccess(null), 3000);
    } else {
      setError(result.error || 'Failed to save recipe');
    }
  };

  // Confirm delete
  const handleDeleteRecipe = async (recipe: Recipe) => {
    const result = await deleteRecipe(recipe.id, recipe.name);

    if (result.success) {
      setSuccess(`Recipe "${recipe.name}" deleted successfully!`);
      setDeleteDialogOpen(null);
      setTimeout(() => setSuccess(null), 3000);
    } else {
      setError(result.error || 'Failed to delete recipe');
    }
  };

  // Format helpers - memoized to prevent re-creation
  const formatNutrition = React.useCallback((value: number, decimals = 1) => Math.max(0, value || 0).toFixed(decimals), []);
  const formatCost = React.useCallback((cost: number) => `€${Math.max(0, cost || 0).toFixed(2)}`, []);

  return (
    <PageCard title="Recipes">
      <Box sx={{ display: 'flex', gap: 3, height: '100%' }}>
        {/* LEFT: Recipe List */}
        <Box sx={{ flexBasis: { xs: '100%', md: '70%' }, minWidth: 0 }}>
          {/* Header */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" sx={{ mb: 1, color: 'var(--text-primary)', fontWeight: 600 }}>
              Your Recipes
            </Typography>
            <AccentButton onClick={handleNewRecipe} fullWidth variant="success">
              Create New Recipe
            </AccentButton>
          </Box>

          {/* Success/Error Messages */}
          {success && (
            <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>
              {success}
            </Alert>
          )}
          {(error || recipesError) && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => { setError(null); }}>
              {error || recipesError}
            </Alert>
          )}

          {/* Loading State */}
          {recipesLoading && (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          )}

          {/* Recipe Grid */}
          {!recipesLoading && (
            <Box sx={{ 
              display: 'grid', 
              gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' },
              gap: 2 
            }}>
              {recipes.map((recipe, index) => {
                const key = recipe.id || `recipe-${index}-${recipe.name}`;
                console.log('🎨 Rendering recipe:', { index, id: recipe.id, name: recipe.name, key });
                return (
                <Paper key={key} sx={{ p: 2, height: '100%', display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                    {recipe.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ flex: 1 }}>
                    {recipe.description || 'No description'}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    <Chip label={recipe.category} size="small" />
                    <Chip label={recipe.difficulty} size="small" />
                    <Chip label={`${recipe.cookingTime}min`} size="small" />
                  </Box>
                  <Typography variant="caption">
                    {formatNutrition(recipe.nutritionPerServing.calories, 0)} kcal/serving • {formatCost(recipe.totalCost / recipe.servings)}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                    <Button size="small" onClick={() => handleEditRecipe(recipe)} fullWidth>
                      Edit
                    </Button>
                    <Button size="small" color="error" onClick={() => setDeleteDialogOpen(recipe)} fullWidth>
                      Delete
                    </Button>
                  </Box>
                </Paper>
                );
              })}
            </Box>
          )}

          {!recipesLoading && recipes.length === 0 && (
            <Box sx={{ textAlign: 'center', py: 4, color: 'text.secondary' }}>
              <RecipeIcon sx={{ fontSize: 48, mb: 2, opacity: 0.5 }} />
              <Typography>No recipes yet. Create your first recipe!</Typography>
            </Box>
          )}
        </Box>

        {/* RIGHT: Info Panel */}
        <Box sx={{ flexBasis: { xs: 0, md: '30%' }, display: { xs: 'none', md: 'block' } }}>
          <Paper sx={{ p: 2, bgcolor: 'var(--surface-bg)' }}>
            <Typography variant="h6" gutterBottom>Recipe Manager</Typography>
            <Typography variant="body2" color="text.secondary">
              Create custom recipes that automatically calculate nutrition and cost.
              Recipes are saved to your foods collection for easy meal planning.
            </Typography>
          </Paper>
        </Box>
      </Box>

      {/* Recipe Form Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>{editingRecipe ? 'Edit Recipe' : 'Create New Recipe'}</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, pt: 2 }}>
            {/* Basic Info */}
            <TextField
              label="Recipe Name"
              value={formData.name}
              onChange={(e) => updateField('name', e.target.value)}
              fullWidth
              required
            />
            <TextField
              label="Description"
              value={formData.description}
              onChange={(e) => updateField('description', e.target.value)}
              fullWidth
              multiline
              rows={2}
            />

            {/* Category, Difficulty, Time */}
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Box sx={{ flex: 1 }}>
                <CustomSelect
                  label="Category"
                  value={formData.category}
                  onChange={(value) => updateField('category', value as string)}
                  options={RECIPE_CATEGORIES.map(c => ({ value: c, label: c }))}
                  fullWidth
                />
              </Box>
              <Box sx={{ flex: 1 }}>
                <CustomSelect
                  label="Difficulty"
                  value={formData.difficulty}
                  onChange={(value) => updateField('difficulty', value as any)}
                  options={DIFFICULTY_LEVELS.map(d => ({ value: d, label: d }))}
                  fullWidth
                />
              </Box>
              <Box sx={{ flex: 1 }}>
                <Typography variant="body2" sx={{ mb: 1, fontWeight: 500 }}>
                  Cooking Time
                </Typography>
                <NumberStepper
                  value={formData.cookingTime}
                  onChange={(value) => updateField('cookingTime', value)}
                  min={1}
                  max={300}
                  step={5}
                  unit="min"
                  size="small"
                />
              </Box>
            </Box>

            {/* Servings */}
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-end' }}>
              <Box sx={{ flex: 1 }}>
                <Typography variant="body2" sx={{ mb: 1, fontWeight: 500 }}>
                  Servings
                </Typography>
                <NumberStepper
                  value={formData.servings}
                  onChange={(value) => updateField('servings', value)}
                  min={1}
                  max={20}
                  step={1}
                  unit=""
                  size="small"
                />
              </Box>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.isFixedServing}
                    onChange={(e) => updateField('isFixedServing', e.target.checked)}
                  />
                }
                label="Fixed serving size"
              />
            </Box>

            <Divider />

            {/* Ingredients */}
            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="h6">Ingredients</Typography>
                <AccentButton onClick={addIngredient} variant="success" disabled={availableFoods.length === 0}>
                  Add Ingredient
                </AccentButton>
              </Box>

              {formData.ingredients.map((ingredient, index) => {
                const key = ingredient.id || `ingredient-${index}-${ingredient.foodName}`;
                console.log('🥕 Rendering ingredient:', { index, id: ingredient.id, foodName: ingredient.foodName, key, isEmpty: !ingredient.id || ingredient.id.trim() === '' });
                return (
                <Paper key={key} sx={{ p: 2, mb: 2, bgcolor: 'var(--meal-bg-card)' }}>
                  <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-end', mb: 1 }}>
                    <Autocomplete
                      value={ingredient.foodName}
                      onChange={(_, newValue) => newValue && updateIngredient(index, 'foodName', newValue)}
                      options={availableFoods}
                      renderInput={(params) => <TextField {...params} label="Food" />}
                      sx={{ flex: 2 }}
                    />
                    <Box>
                      <Typography variant="body2" sx={{ mb: 1, fontWeight: 500, fontSize: '0.75rem' }}>
                        Amount
                      </Typography>
                      <NumberStepper
                        value={ingredient.amount}
                        onChange={(value) => updateIngredient(index, 'amount', value)}
                        min={0}
                        max={ingredient.unit === 'g' ? 2000 : 20}
                        step={ingredient.unit === 'g' ? 10 : 0.1}
                        unit={ingredient.unit}
                        size="small"
                      />
                    </Box>
                    <IconButton onClick={() => removeIngredient(index)} color="error">
                      <RemoveIcon />
                    </IconButton>
                  </Box>
                  <Typography variant="caption" color="text.secondary">
                    {formatNutrition(ingredient.nutrition?.protein || 0)}g protein • 
                    {formatNutrition(ingredient.nutrition?.calories || 0, 0)} kcal • 
                    {formatCost(ingredient.cost || 0)}
                  </Typography>
                </Paper>
                );
              })}
            </Box>

            {/* Instructions */}
            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="h6">Instructions</Typography>
                <AccentButton onClick={addInstruction} variant="success">
                  Add Step
                </AccentButton>
              </Box>
              {formData.instructions.map((instruction, index) => (
                <Box key={index} sx={{ display: 'flex', gap: 2, mb: 2 }}>
                  <TextField
                    value={instruction}
                    onChange={(e) => updateInstruction(index, e.target.value)}
                    placeholder={`Step ${index + 1}...`}
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

            {/* Tags */}
            <Box>
              <Typography variant="h6" gutterBottom>Tags</Typography>
              <Autocomplete
                freeSolo
                options={COMMON_TAGS}
                onInputChange={(_, newValue) => {
                  if (newValue && !formData.tags.includes(newValue)) {
                    addTag(newValue);
                  }
                }}
                renderInput={(params) => <TextField {...params} placeholder="Add tags..." />}
              />
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 1 }}>
                {formData.tags.map((tag, index) => {
                  const key = tag || `tag-${index}`;
                  console.log('🏷️ Rendering tag:', { index, tag, key, isEmpty: !tag || tag.trim() === '' });
                  return (
                    <Chip key={key} label={tag} onDelete={() => removeTag(tag)} size="small" />
                  );
                })}
              </Box>
            </Box>

            {/* Nutrition Summary */}
            {formData.ingredients.length > 0 && (
              <>
                <Divider />
                <Box>
                  <Typography variant="h6" gutterBottom>Recipe Totals</Typography>
                  <Typography variant="body2">
                    <strong>Total:</strong> {formatNutrition(totals.totalNutrition.protein)}g protein • 
                    {formatNutrition(totals.totalNutrition.calories, 0)} kcal • {formatCost(totals.totalCost)}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Per Serving:</strong> {formatNutrition(totals.nutritionPerServing.protein)}g protein • 
                    {formatNutrition(totals.nutritionPerServing.calories, 0)} kcal • {formatCost(totals.costPerServing)}
                  </Typography>
                </Box>
              </>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <AccentButton onClick={handleSaveRecipe} variant="success">
            {editingRecipe ? 'Update' : 'Create'} Recipe
          </AccentButton>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={Boolean(deleteDialogOpen)} onClose={() => setDeleteDialogOpen(null)}>
        <DialogTitle>Delete Recipe?</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete "{deleteDialogOpen?.name}"? This will also remove it from your foods collection.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(null)}>Cancel</Button>
          <Button color="error" onClick={() => deleteDialogOpen && handleDeleteRecipe(deleteDialogOpen)}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </PageCard>
  );
});

RecipeManager.displayName = 'RecipeManager';

export default RecipeManager;
