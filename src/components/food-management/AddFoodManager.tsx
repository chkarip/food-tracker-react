/**
 * AddFoodManager – admin CRUD panel for the master “foods” collection.
 * (header comments truncated)
 */

import React, { useState, useMemo } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
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
import {
  Add as AddIcon,
  Restaurant as FoodIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Save as SaveIcon,
  Cancel as CancelIcon
} from '@mui/icons-material';

import { useFoodDatabase } from '../../contexts/FoodContext';

import {
  addFood,
  updateFood,
  deleteFood,
  FirestoreFood,
  FoodFormData
} from '../../services/firebase/nutrition/foodService';

/* ------------------------------------------------------------------ */
/*  CONSTANTS                                                          */
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
/*  COMPONENT                                                          */
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
    fixedAmount: 100
  });

  /* ---------- ui state ---------- */
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [editingFood, setEditingFood] = useState<FirestoreFood | null>(null);
  const [deleteDialog, setDeleteDialog] = useState<FirestoreFood | null>(null);

  /* ------------------------------------------------------------------ */
  /*  HELPERS                                                           */
  /* ------------------------------------------------------------------ */

  const resetForm = () => {
    setFormData({
      name: '',
      nutrition: { protein: 0, fats: 0, carbs: 0, calories: 0 },
      cost: { costPerKg: 0, unit: 'kg' },
      category: 'Other',
      isUnitFood: false,
      useFixedAmount: false,
      fixedAmount: 100
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
  /*  CRUD                                                               */
  /* ------------------------------------------------------------------ */

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
      fixedAmount: food.metadata?.fixedAmount ?? 0
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
  /*  RENDER                                                             */
  /* ------------------------------------------------------------------ */

  return (
    <Box sx={{ maxWidth: 1000, mx: 'auto', p: 3 }}>
      {/* -------------------------------------------------- */}
      {/* Add / Edit Form                                    */}
      {/* -------------------------------------------------- */}
      <Card sx={{ mb: 4 }}>
        <CardContent component="form" onSubmit={handleSubmit}>
          <Typography variant="h6" gutterBottom>
            {editingFood ? 'Edit Food' : 'Add New Food'}
          </Typography>

          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

          {/* Basic information */}
          <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
            <TextField
              label="Food name"
              value={formData.name}
              onChange={e => handleInputChange('name', e.target.value)}
              required
              sx={{ flex: 1 }}
            />
            <FormControl sx={{ minWidth: 140 }}>
              <InputLabel>Category</InputLabel>
              <Select
                value={formData.category}
                label="Category"
                onChange={e => handleInputChange('category', e.target.value)}
              >
                {FOOD_CATEGORIES.map(cat => (
                  <MenuItem key={cat} value={cat}>
                    {cat}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Stack>

          <FormControlLabel
            control={
              <Switch
                checked={formData.isUnitFood}
                onChange={e => handleInputChange('isUnitFood', e.target.checked)}
              />
            }
            label="Unit food"
          />

          <FormControlLabel
            control={
              <Switch
                checked={formData.useFixedAmount}
                onChange={e =>
                  handleInputChange('useFixedAmount', e.target.checked)
                }
              />
            }
            label="Use fixed amount"
            sx={{ ml: 2 }}
          />

          {formData.useFixedAmount && (
            <TextField
              label="Fixed amount"
              type="number"
              value={formData.fixedAmount}
              onChange={e => handleInputChange('fixedAmount', e.target.value)}
              inputProps={{
                min: 0,
                step: formData.isUnitFood ? 1 : 10
              }}
              sx={{ mt: 2 }}
              helperText={`Default amount when selected in Meal Planner (${formData.isUnitFood ? 'units' : 'g'})`}
            />
          )}

          <Divider sx={{ my: 3 }} />

          {/* Nutrition */}
          <Typography variant="subtitle1" gutterBottom>
            Nutrition (per {formData.isUnitFood ? 'unit' : '100g'})
          </Typography>
          <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
            {(['protein', 'fats', 'carbs', 'calories'] as const).map(field => (
              <TextField
                key={field}
                label={field.charAt(0).toUpperCase() + field.slice(1)}
                type="number"
                value={formData.nutrition[field]}
                onChange={e =>
                  handleInputChange(`nutrition.${field}`, e.target.value)
                }
                inputProps={{ min: 0, step: field === 'calories' ? 1 : 0.1 }}
                sx={{ flex: 1, minWidth: 120 }}
              />
            ))}
          </Stack>

          {/* Cost */}
          <Typography variant="subtitle1" gutterBottom>
            Cost
          </Typography>
          <Stack direction="row" spacing={2} sx={{ mb: 3 }}>
            <TextField
              label="Cost"
              type="number"
              value={formData.cost.costPerKg}
              onChange={e => handleInputChange('cost.costPerKg', e.target.value)}
              inputProps={{ min: 0, step: 0.01 }}
              sx={{ flex: 1 }}
            />
            <FormControl sx={{ minWidth: 120 }}>
              <InputLabel>Unit</InputLabel>
              <Select
                value={formData.cost.unit}
                label="Unit"
                onChange={e => handleInputChange('cost.unit', e.target.value)}
              >
                <MenuItem value="kg">€/kg</MenuItem>
                <MenuItem value="unit">€/unit</MenuItem>
              </Select>
            </FormControl>
          </Stack>

          {/* Buttons */}
          <Stack direction="row" spacing={2}>
            <Button
              type="submit"
              variant="contained"
              startIcon={editingFood ? <SaveIcon /> : <AddIcon />}
              disabled={loading}
            >
              {editingFood ? 'Update' : 'Add'}
            </Button>

            {editingFood && (
              <Button
                variant="outlined"
                color="secondary"
                startIcon={<CancelIcon />}
                onClick={resetForm}
                disabled={loading}
              >
                Cancel
              </Button>
            )}
          </Stack>
        </CardContent>
      </Card>

      {/* -------------------------------------------------- */}
      {/* Saved Foods list                                   */}
      {/* -------------------------------------------------- */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Saved Foods ({foods.length})
          </Typography>

          {foods.length === 0 ? (
            <Alert severity="info">No foods in database yet.</Alert>
          ) : (
            <List>
              {foods.map(food => (
                <ListItem key={food.firestoreId}>
                  <FoodIcon sx={{ mr: 1 }} />
                  <ListItemText
                    primary={
                      <>
                        {food.name}{' '}
                        {food.metadata?.isUnitFood && (
                          <Chip
                            size="small"
                            label="Unit"
                            color="primary"
                            sx={{ ml: 0.5 }}
                          />
                        )}
                        {food.metadata?.useFixedAmount && (
                          <Chip
                            size="small"
                            label="Fixed"
                            color="secondary"
                            sx={{ ml: 0.5 }}
                          />
                        )}
                      </>
                    }
                    secondary={
                      <>
                        Protein: {food.nutrition.protein}g&nbsp;|&nbsp;Fats:{' '}
                        {food.nutrition.fats}g&nbsp;|&nbsp;Carbs:{' '}
                        {food.nutrition.carbs}g&nbsp;|&nbsp;Calories:{' '}
                        {food.nutrition.calories}kcal&nbsp;|&nbsp;Cost:{' '}
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
                      edge="end"
                      onClick={() => handleEdit(food)}
                      sx={{ mr: 1 }}
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton color="error" onClick={() => setDeleteDialog(food)}>
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
      {/* Delete dialog                                      */}
      {/* -------------------------------------------------- */}
      <Dialog open={!!deleteDialog} onClose={() => setDeleteDialog(null)}>
        <DialogTitle>Delete Food</DialogTitle>
        <DialogContent>
          Are you sure you want to delete &quot;{deleteDialog?.name}&quot;? This
          cannot be undone.
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog(null)}>Cancel</Button>
          <Button
            variant="contained"
            color="error"
            onClick={() => deleteDialog && handleDelete(deleteDialog)}
            disabled={loading}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AddFoodManager;
