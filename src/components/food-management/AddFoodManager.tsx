/**
 * AddFoodManager
 * ------------------------------------------------------------
 * PURPOSE
 * Administration panel for managing the master “foods” collection
 * in Firestore.  Used only by power users / admins.
 *
 * RESPONSIBILITIES
 * • CRUD for food documents (add, edit, delete).
 * • Client-side validation of macros, cost and uniqueness.
 * • Re-load list after every mutation and display inline feedback.
 * • Support “fixed amount” & “unit food” flags for quick selection
 *   in meal-planning UI.
 *
 * STATE OVERVIEW
 * • formData        – controlled fields for the add/edit dialog.
 * • foods           – full list of DatabaseFood returned from DB.
 * • editingFood     – currently edited item (null = insert mode).
 * • deleteDialog    – item pending deletion confirmation.
 * • loading/error/success – UX feedback flags.
 *
 * TODO
 * • Break into smaller components (FoodForm, FoodsTable, etc.).
 * • Add search / filter when food list grows large.
 * • Move slug-generation logic into foodService to avoid drift.
 */
import React, { useState, useEffect } from 'react';
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
import { 
  addFood, 
  updateFood, 
  deleteFood, 
  getAllFoods, 
  DatabaseFood,
  FoodFormData 
} from '../../services/firebase/nutrition/foodService';

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

const AddFoodManager: React.FC = () => {
  // Form state
  const [formData, setFormData] = useState<FoodFormData>({
    name: '',
    nutrition: {
      protein: 0,
      fats: 0,
      carbs: 0,
      calories: 0
    },
    cost: {
      costPerKg: 0,
      unit: 'kg'
    },
    category: 'Other',
    isUnitFood: false,
    useFixedAmount: false,
    fixedAmount: 100
  });

  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [foods, setFoods] = useState<DatabaseFood[]>([]);
  const [editingFood, setEditingFood] = useState<DatabaseFood | null>(null);
  const [deleteDialog, setDeleteDialog] = useState<DatabaseFood | null>(null);

  // Load existing foods on component mount
  useEffect(() => {
    loadFoods();
  }, []);

  const loadFoods = async () => {
    try {
      setLoading(true);
      const allFoods = await getAllFoods();
      setFoods(allFoods);
    } catch (err) {
      setError('Failed to load foods from database');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

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
  };

  const handleInputChange = (field: string, value: any) => {
    if (field.startsWith('nutrition.')) {
      const nutritionField = field.split('.')[1];
      setFormData(prev => ({
        ...prev,
        nutrition: {
          ...prev.nutrition,
          [nutritionField]: parseFloat(value) || 0
        }
      }));
    } else if (field.startsWith('cost.')) {
      const costField = field.split('.')[1];
      setFormData(prev => ({
        ...prev,
        cost: {
          ...prev.cost,
          [costField]: costField === 'unit' ? value : (parseFloat(value) || 0)
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  const validateForm = (): boolean => {
    if (!formData.name.trim()) {
      setError('Food name is required');
      return false;
    }
    
    if (formData.nutrition.protein < 0 || formData.nutrition.fats < 0 || 
        formData.nutrition.carbs < 0 || formData.nutrition.calories < 0) {
      setError('Nutrition values cannot be negative');
      return false;
    }
    
    if (formData.cost.costPerKg < 0) {
      setError('Cost cannot be negative');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      if (editingFood) {
        await updateFood(editingFood.firestoreId, formData);
        setSuccess(`✅ ${formData.name} updated successfully!`);
      } else {
        await addFood(formData);
        setSuccess(`✅ ${formData.name} added successfully!`);
      }

      resetForm();
      await loadFoods(); // Refresh the list
      
    } catch (err) {
      setError(`Failed to ${editingFood ? 'update' : 'add'} food: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (food: DatabaseFood) => {
    setFormData({
      name: food.name,
      nutrition: food.nutrition,
      cost: {
        costPerKg: food.cost.costPerKg,
        unit: food.cost.unit as 'kg' | 'unit'
      },
      category: food.metadata.category,
      isUnitFood: food.metadata.isUnitFood,
      useFixedAmount: food.metadata.useFixedAmount ?? false,
      fixedAmount: food.metadata.fixedAmount ?? 0
    });
    setEditingFood(food);
    setError(null);
    setSuccess(null);
  };

  const handleDelete = async (food: DatabaseFood) => {
    try {
      setLoading(true);
      await deleteFood(food.firestoreId);
      setSuccess(`✅ ${food.name} deleted successfully!`);
      setDeleteDialog(null);
      await loadFoods(); // Refresh the list
    } catch (err) {
      setError(`Failed to delete food: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      {/* Add/Edit Food Form */}
      <Card sx={{ mb: 3, borderRadius: 4 }}>
        <CardContent sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <AddIcon />
            {editingFood ? 'Edit Food' : 'Add New Food'}
          </Typography>

          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

          <form onSubmit={handleSubmit}>
            <Stack spacing={3}>
              {/* Basic Information */}
              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                Basic Information
              </Typography>
              
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <TextField
                  label="Food Name"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  required
                  placeholder="e.g., Greek Yogurt"
                  sx={{ flex: 1, minWidth: 200 }}
                />

                <FormControl sx={{ minWidth: 120 }}>
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

                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.isUnitFood}
                      onChange={(e) => handleInputChange('isUnitFood', e.target.checked)}
                    />
                  }
                  label="Unit Food"
                />
              </Box>

              {/* Fixed Amount Settings */}
              <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.useFixedAmount}
                      onChange={(e) => handleInputChange('useFixedAmount', e.target.checked)}
                    />
                  }
                  label="Use Fixed Amount"
                />

                {formData.useFixedAmount && (
                  <TextField
                    label={`Fixed Amount (${formData.isUnitFood ? 'units' : 'grams'})`}
                    type="number"
                    value={formData.fixedAmount}
                    onChange={(e) => handleInputChange('fixedAmount', e.target.value)}
                    inputProps={{ min: 0, step: formData.isUnitFood ? 1 : 10 }}
                    sx={{ minWidth: 150 }}
                    helperText="Default amount when selected in Food Program"
                  />
                )}
              </Box>

              {/* Nutrition Information */}
              <Divider />
              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                Nutrition (per {formData.isUnitFood ? 'unit' : '100g'})
              </Typography>

              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <TextField
                  label="Protein (g)"
                  type="number"
                  value={formData.nutrition.protein}
                  onChange={(e) => handleInputChange('nutrition.protein', e.target.value)}
                  inputProps={{ min: 0, step: 0.1 }}
                  sx={{ flex: 1, minWidth: 120 }}
                />

                <TextField
                  label="Fats (g)"
                  type="number"
                  value={formData.nutrition.fats}
                  onChange={(e) => handleInputChange('nutrition.fats', e.target.value)}
                  inputProps={{ min: 0, step: 0.1 }}
                  sx={{ flex: 1, minWidth: 120 }}
                />

                <TextField
                  label="Carbs (g)"
                  type="number"
                  value={formData.nutrition.carbs}
                  onChange={(e) => handleInputChange('nutrition.carbs', e.target.value)}
                  inputProps={{ min: 0, step: 0.1 }}
                  sx={{ flex: 1, minWidth: 120 }}
                />

                <TextField
                  label="Calories (kcal)"
                  type="number"
                  value={formData.nutrition.calories}
                  onChange={(e) => handleInputChange('nutrition.calories', e.target.value)}
                  inputProps={{ min: 0, step: 1 }}
                  sx={{ flex: 1, minWidth: 120 }}
                />
              </Box>

              {/* Cost Information */}
              <Divider />
              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                Cost Information
              </Typography>

              <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
                <TextField
                  label="Cost"
                  type="number"
                  value={formData.cost.costPerKg}
                  onChange={(e) => handleInputChange('cost.costPerKg', e.target.value)}
                  inputProps={{ min: 0, step: 0.01 }}
                  sx={{ flex: 1, minWidth: 150 }}
                />

                <FormControl sx={{ minWidth: 100 }}>
                  <InputLabel>Unit</InputLabel>
                  <Select
                    value={formData.cost.unit}
                    onChange={(e) => handleInputChange('cost.unit', e.target.value)}
                    label="Unit"
                  >
                    <MenuItem value="kg">€ / kg</MenuItem>
                    <MenuItem value="unit">€ / unit</MenuItem>
                  </Select>
                </FormControl>
              </Box>

              {/* Buttons */}
              <Box sx={{ display: 'flex', gap: 2, pt: 2 }}>
                <Button
                  type="submit"
                  variant="contained"
                  startIcon={<SaveIcon />}
                  disabled={loading}
                  size="large"
                >
                  {editingFood ? 'Update Food' : 'Add Food'}
                </Button>

                {editingFood && (
                  <Button
                    variant="outlined"
                    startIcon={<CancelIcon />}
                    onClick={resetForm}
                    disabled={loading}
                    size="large"
                  >
                    Cancel Edit
                  </Button>
                )}
              </Box>
            </Stack>
          </form>
        </CardContent>
      </Card>

      {/* Foods List */}
      <Card sx={{ borderRadius: 4 }}>
        <CardContent sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <FoodIcon />
            Saved Foods ({foods.length})
          </Typography>

          {foods.length === 0 ? (
            <Typography color="text.secondary" sx={{ py: 3, textAlign: 'center' }}>
              No foods in database. Add some foods using the form above.
            </Typography>
          ) : (
            <List>
              {foods.map((food) => (
                <ListItem key={food.firestoreId} divider>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="subtitle1" component="span">
                          {food.name}
                        </Typography>
                        <Chip 
                          label={food.metadata.category} 
                          size="small" 
                          color="primary" 
                          variant="outlined" 
                        />
                        {food.metadata.isUnitFood && (
                          <Chip 
                            label="Unit Food" 
                            size="small" 
                            color="secondary" 
                            variant="outlined" 
                          />
                        )}
                        {food.metadata.useFixedAmount && (
                          <Chip 
                            label={`Fixed: ${food.metadata.fixedAmount ?? 0}${food.metadata.isUnitFood ? 'u' : 'g'}`}
                            size="small" 
                            color="success" 
                            variant="outlined" 
                          />
                        )}
                      </Box>
                    }
                    secondary={
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          Protein: {food.nutrition.protein}g | 
                          Fats: {food.nutrition.fats}g | 
                          Carbs: {food.nutrition.carbs}g | 
                          Calories: {food.nutrition.calories}kcal | 
                          Cost: €{food.cost.costPerKg.toFixed(2)}/{food.cost.unit}
                        </Typography>
                        {food.metadata.useFixedAmount && (
                          <Typography variant="body2" color="primary.main" sx={{ mt: 0.5 }}>
                            Fixed Amount: {food.metadata.fixedAmount ?? 0} {food.metadata.isUnitFood ? 'units' : 'g'}
                          </Typography>
                        )}
                      </Box>
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
                    <IconButton 
                      edge="end" 
                      onClick={() => setDeleteDialog(food)}
                      color="error"
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

      {/* Delete Confirmation Dialog */}
      <Dialog 
        open={!!deleteDialog} 
        onClose={() => setDeleteDialog(null)}
      >
        <DialogTitle>Delete Food</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete "{deleteDialog?.name}"? 
            This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog(null)}>Cancel</Button>
          <Button 
            onClick={() => deleteDialog && handleDelete(deleteDialog)} 
            color="error"
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
