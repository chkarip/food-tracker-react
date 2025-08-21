/**
 * AddFoodManager – admin CRUD panel for the master "foods" collection.
 * (header comments truncated)
 */

import React, { useState, useMemo } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Switch,
  Alert,
  Divider,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Stack
} from '@mui/material';

import { AccentButton } from '../shared';
import {
  Add as AddIcon,
  Restaurant as FoodIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Save as SaveIcon,
  Cancel as CancelIcon
} from '@mui/icons-material';
import { useFoodDatabase } from '../../contexts/FoodContext';
import { addFood, updateFood, deleteFood } from '../../services/firebase/nutrition/foodService';
import { FirestoreFood, FoodFormData } from '../../types/food';

/* ------------------------------------------------------------------ */
/* CONSTANTS */
/* ------------------------------------------------------------------ */

const FOOD_CATEGORIES = [
  'Dairy',
  'Protein',
  'Grains',
  'Legumes',
  'Nuts & Seeds',
  'Supplements',
  'Treats',
  'Vegetables',
  'Fruits',
  'Other'
];

/* ------------------------------------------------------------------ */
/* HELPER FUNCTIONS */
/* ------------------------------------------------------------------ */

// Format numbers to one decimal place
const formatNumber = (value: number): string => {
  return (Math.round(value * 10) / 10).toFixed(1);
};

/* ------------------------------------------------------------------ */
/* COMPONENT */
/* ------------------------------------------------------------------ */

const AddFoodManager: React.FC = () => {
  /* ---------- context ---------- */
  const { foodDatabase } = useFoodDatabase();

  /* ---------- derived list ---------- */
  const foods = useMemo(() => {
    return Object.values(foodDatabase).map(
      food =>
        ({
          ...food,
          // always ensure metadata exists and has the 3 known keys
          metadata: {
            category: 'Other',
            isUnitFood: false,
            useFixedAmount: false,
            fixedAmount: 0,
            hidden: false,
            ...food.metadata
          },
          firestoreId: food.name.toLowerCase().replace(/[^a-z0-9]/g, '-')
        } as FirestoreFood)
    );
  }, [foodDatabase]);

  /* ---------- form state ---------- */
  const [formData, setFormData] = useState<FoodFormData>({
  name: '',
  nutrition: { protein: 0, fats: 0, carbs: 0, calories: 0 },
  cost: { costPerKg: 0, unit: 'kg' },
  category: 'Other',
  isUnitFood: false,
  useFixedAmount: false,
  fixedAmount: 100,
  hidden: false // ← NEW
  });

  /* ---------- ui state ---------- */
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [editingFood, setEditingFood] = useState<FirestoreFood | null>(null);
  const [deleteDialog, setDeleteDialog] = useState<FirestoreFood | null>(null);

  /* ------------------------------------------------------------------ */
  /* HELPERS */
  /* ------------------------------------------------------------------ */

  const resetForm = () => {
    setFormData({
      name: '',
      nutrition: { protein: 0, fats: 0, carbs: 0, calories: 0 },
      cost: { costPerKg: 0, unit: 'kg' },
      category: 'Other',
      isUnitFood: false,
      useFixedAmount: false,
      fixedAmount: 100,
      hidden: false // ← NEW
    });
    setEditingFood(null);
    setError(null);
    setSuccess(null);
  };

  const handleInputChange = (field: string, value: any) => {
    if (field.startsWith('nutrition.')) {
      const k = field.split('.')[1] as keyof FoodFormData['nutrition'];
      setFormData(prev => ({
        ...prev,
        nutrition: { ...prev.nutrition, [k]: parseFloat(value) || 0 }
      }));
    } else if (field.startsWith('cost.')) {
      const k = field.split('.')[1] as keyof FoodFormData['cost'];
      setFormData(prev => ({
        ...prev,
        cost: {
          ...prev.cost,
          [k]: k === 'unit' ? value : parseFloat(value) || 0
        }
      }));
    } else {
      setFormData(prev => ({ ...prev, [field]: value }));
    }
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      setError('Food name is required');
      return false;
    }

    const n = formData.nutrition;
    if (n.protein < 0 || n.fats < 0 || n.carbs < 0 || n.calories < 0) {
      setError('Nutrition values cannot be negative');
      return false;
    }

    if (formData.cost.costPerKg < 0) {
      setError('Cost cannot be negative');
      return false;
    }

    return true;
  };

  /* ------------------------------------------------------------------ */
  /* CRUD */
  /* ------------------------------------------------------------------ */

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!validateForm()) return;

    try {
      setLoading(true);
      setError(null);
      
      if (editingFood) {
        await updateFood(editingFood.firestoreId, formData);
        setSuccess(`✅ ${formData.name} updated`);
      } else {
        await addFood(formData);
        setSuccess(`✅ ${formData.name} added`);
      }

      resetForm(); // context will auto-refresh list
    } catch (err) {
      setError(
        `Failed to ${editingFood ? 'update' : 'add'} food: ${
          err instanceof Error ? err.message : 'Unknown error'
        }`
      );
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (food: FirestoreFood) => {
    setFormData({
      name: food.name,
      nutrition: food.nutrition,
      cost: { costPerKg: food.cost.costPerKg, unit: food.cost.unit },
      category: food.metadata?.category ?? 'Other',
      isUnitFood: food.metadata?.isUnitFood ?? false,
      useFixedAmount: food.metadata?.useFixedAmount ?? false,
      fixedAmount: food.metadata?.fixedAmount ?? 0,
      hidden: typeof food.metadata?.hidden === 'boolean' ? food.metadata.hidden : false
    });
    setEditingFood(food);
    setError(null);
    setSuccess(null);
  };

  const handleDelete = async (food: FirestoreFood) => {
    try {
      setLoading(true);
      await deleteFood(food.firestoreId);
      setSuccess(`✅ ${food.name} deleted`);
      setDeleteDialog(null);
    } catch (err) {
      setError(
        `Failed to delete food: ${
          err instanceof Error ? err.message : 'Unknown error'
        }`
      );
    } finally {
      setLoading(false);
    }
  };

  /* ------------------------------------------------------------------ */
  /* RENDER */
  /* ------------------------------------------------------------------ */

  return (
    <Box sx={{ p: 3, maxWidth: '1200px', margin: '0 auto' }}>
      {/* -------------------------------------------------- */}
      {/* Add / Edit Form */}
      {/* -------------------------------------------------- */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h5" gutterBottom>
            <FoodIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
            {editingFood ? 'Edit Food' : 'Add New Food'}
          </Typography>
          
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

          <Box component="form" onSubmit={handleSubmit}>
            {/* Basic information */}
            <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
              <TextField
                label="Food Name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                required
                sx={{ flex: 1 }}
              />
              
              <FormControl sx={{ flex: 1 }}>
                <InputLabel>Category</InputLabel>
                <Select
                  value={formData.category}
                  onChange={(e) => handleInputChange('category', e.target.value)}
                  label="Category"
                >
                  {FOOD_CATEGORIES.map(cat => (
                    <MenuItem key={cat} value={cat}>{cat}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Stack>

            <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.isUnitFood}
                    onChange={(e) => handleInputChange('isUnitFood', e.target.checked)}
                  />
                }
                label="Unit food"
              />
              
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.useFixedAmount}
                    onChange={(e) => handleInputChange('useFixedAmount', e.target.checked)}
                  />
                }
                label="Use fixed amount"
                sx={{ ml: 2 }}
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.hidden}
                    onChange={(e) => handleInputChange('hidden', e.target.checked)}
                  />
                }
                label="Hidden (exclude from meal plans)"
                sx={{ ml: 2 }}
              />
            </Stack>

            {formData.useFixedAmount && (
              <TextField
                label="Fixed Amount"
                type="number"
                value={formData.fixedAmount}
                onChange={(e) => handleInputChange('fixedAmount', e.target.value)}
                inputProps={{
                  min: 0,
                  step: formData.isUnitFood ? 1 : 10
                }}
                sx={{ mt: 2 }}
                helperText={`Default amount when selected in Meal Planner (${formData.isUnitFood ? 'units' : 'g'})`}
              />
            )}

            <Divider sx={{ my: 2 }} />

            {/* Nutrition */}
            <Typography variant="h6" gutterBottom>
              Nutrition (per {formData.isUnitFood ? 'unit' : '100g'})
            </Typography>
            <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
              {(['protein', 'fats', 'carbs', 'calories'] as const).map(field => (
                <TextField
                  key={field}
                  label={field.charAt(0).toUpperCase() + field.slice(1)}
                  type="number"
                  value={formData.nutrition[field]}
                  onChange={(e) => handleInputChange(`nutrition.${field}`, e.target.value)}
                  inputProps={{ min: 0, step: field === 'calories' ? 1 : 0.1 }}
                  sx={{ flex: 1, minWidth: 120 }}
                />
              ))}
            </Stack>

            <Divider sx={{ my: 2 }} />

            {/* Cost */}
            <Typography variant="h6" gutterBottom>Cost</Typography>
            <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
              <TextField
                label="Cost"
                type="number"
                value={formData.cost.costPerKg}
                onChange={(e) => handleInputChange('cost.costPerKg', e.target.value)}
                inputProps={{ min: 0, step: 0.01 }}
                sx={{ flex: 1 }}
              />
              
              <FormControl sx={{ minWidth: 120 }}>
                <InputLabel>Unit</InputLabel>
                <Select
                  value={formData.cost.unit}
                  onChange={(e) => handleInputChange('cost.unit', e.target.value)}
                  label="Unit"
                >
                  <MenuItem value="kg">€/kg</MenuItem>
                  <MenuItem value="unit">€/unit</MenuItem>
                </Select>
              </FormControl>
            </Stack>

            {/* Buttons */}
            <Stack direction="row" spacing={2}>
              <AccentButton
                onClick={handleSubmit}
                disabled={loading}
                loading={loading}
                variant="primary"
                size="medium"
              >
                {editingFood ? '✏️ Update' : '➕ Add'}
              </AccentButton>
              {editingFood && (
                <AccentButton
                  onClick={resetForm}
                  disabled={loading}
                  variant="secondary"
                  size="medium"
                >
                  Cancel
                </AccentButton>
              )}
            </Stack>
          </Box>
        </CardContent>
      </Card>

      {/* -------------------------------------------------- */}
      {/* Saved Foods list */}
      {/* -------------------------------------------------- */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Saved Foods ({foods.length})
          </Typography>
          
          {foods.length === 0 ? (
            <Typography color="text.secondary">
              No foods in database yet.
            </Typography>
          ) : (
            <List>
              {foods.map(food => (
                <ListItem key={food.firestoreId} divider>
                  <ListItemText
                    primary={
                      <>
                        {food.name}{' '}
                        {food.metadata?.isUnitFood && (
                          <Chip label="unit" size="small" />
                        )}
                        {food.metadata?.useFixedAmount && (
                          <Chip label="fixed" size="small" color="secondary" />
                        )}
                      </>
                    }
                    secondary={
                      <>
                        Protein: {formatNumber(food.nutrition.protein)}g | Fats:{' '}
                        {formatNumber(food.nutrition.fats)}g | Carbs:{' '}
                        {formatNumber(food.nutrition.carbs)}g | Calories:{' '}
                        {formatNumber(food.nutrition.calories)}kcal | Cost:{' '}
                        €{food.cost.costPerKg.toFixed(2)}/{food.cost.unit}
                        {food.metadata?.useFixedAmount && (
                          <>
                            {' '}
                            | Default:{' '}
                            {food.metadata.fixedAmount}{' '}
                            {food.metadata.isUnitFood ? 'units' : 'g'}
                          </>
                        )}
                      </>
                    }
                  />
                  <ListItemSecondaryAction>
                    <IconButton
                      onClick={() => handleEdit(food)}
                      sx={{ mr: 1 }}
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton 
                      color="error"
                      onClick={() => setDeleteDialog(food)}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </ListItemSecondaryAction>
                </ListItem>
              ))}
            </List>
          )}
        </CardContent>
      </Card>

      {/* -------------------------------------------------- */}
      {/* Delete dialog */}
      {/* -------------------------------------------------- */}
      <Dialog open={!!deleteDialog} onClose={() => setDeleteDialog(null)}>
        <DialogTitle>Delete Food</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete "{deleteDialog?.name}"? This
            cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <AccentButton 
            onClick={() => setDeleteDialog(null)}
            variant="secondary"
          >
            Cancel
          </AccentButton>
          <AccentButton
            onClick={() => {
              if (deleteDialog) {
                handleDelete(deleteDialog);
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

export default AddFoodManager;
