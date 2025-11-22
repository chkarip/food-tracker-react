/**
 * AddFoodManager – admin CRUD panel for the master "foods" collection.
 * (header comments truncated)
 */

import React, { useState, useMemo } from 'react';
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  Typography,
  FormControlLabel,
  Switch,
  Alert,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  ListItemButton,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Stack,
  TextField,
  InputAdornment
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import SmartTextInput from '../shared/inputs/SmartTextInput';
import { NumberStepper } from '../shared/inputs';
import { CustomSelect, SelectOption } from '../shared/inputs';

import  AccentButton  from '../shared/AccentButton';
import { PageCard } from '../shared/PageCard';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { useFoodDatabase, useAddFood, useUpdateFood, useDeleteFood } from '../../services/firebase/nutrition/foodService';
import { FirestoreFood, FoodFormData, FoodSearchState, OpenFoodFactsProduct } from '../../types/food';
import { searchOpenFoodFacts, mapOpenFoodFactsToFoodFormData } from '../../services/external/openFoodFactsService';

/* ------------------------------------------------------------------ */
/* CONSTANTS */
/* ------------------------------------------------------------------ */

const FOOD_CATEGORIES: SelectOption[] = [
  { value: 'Protein', label: 'Protein' },
  { value: 'Fats', label: 'Fats' },
  { value: 'Carbs', label: 'Carbs' },
  { value: 'Fruits & Treats', label: 'Fruits & Treats' }
];

/* ------------------------------------------------------------------ */
/* HELPER FUNCTIONS */
/* ------------------------------------------------------------------ */

// Format numbers to one decimal place
const formatNumber = (value: number): string => {
  return (Math.round(value * 10) / 10).toFixed(1);
};

// Helper function to get display properties for Open Food Facts products
const getFoodDisplayProps = (food: OpenFoodFactsProduct) => {
  return {
    id: food.code,
    name: food.product_name,
    brand: food.brands || '',
    nutrientsCount: food.nutriments ? Object.keys(food.nutriments).length : 0
  };
};

/* ------------------------------------------------------------------ */
/* COMPONENT */
/* ------------------------------------------------------------------ */

const AddFoodManager: React.FC = () => {
  /* ---------- context ---------- */
  const { data: firestoreFoods = [] } = useFoodDatabase();
  const addFoodMutation = useAddFood();
  const updateFoodMutation = useUpdateFood();
  const deleteFoodMutation = useDeleteFood();

  /* ---------- derived list ---------- */
  const foods = useMemo(() => {
    return firestoreFoods.map(
      food =>
        ({
          ...food,
          // always ensure metadata exists and has the 3 known keys
          metadata: {
            category: 'Fruits & Treats',
            isUnitFood: false,
            useFixedAmount: false,
            fixedAmount: 0,
            hidden: false,
            favorite: false,
            ...food.metadata
          },
          firestoreId: food.firestoreId
        } as FirestoreFood)
    );
  }, [firestoreFoods]);

  /* ---------- form state ---------- */
  const [formData, setFormData] = useState<FoodFormData>({
  name: '',
  nutrition: { protein: 0, fats: 0, carbs: 0, calories: 0 },
  cost: { costPerKg: 0, unit: 'kg' },
  category: 'Fruits & Treats',
  isUnitFood: false,
  useFixedAmount: false,
  fixedAmount: 100,
  hidden: false, // ← NEW
  favorite: false // ← NEW
  });

  /* ---------- ui state ---------- */
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [editingFood, setEditingFood] = useState<FirestoreFood | null>(null);
  const [deleteDialog, setDeleteDialog] = useState<FirestoreFood | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  /* ---------- API search state ---------- */
  const [apiSearch, setApiSearch] = useState<FoodSearchState>({
    isSearching: false,
    searchResults: [],
    selectedApiFood: null,
    error: null
  });

  /* ---------- filtered foods ---------- */
  const filteredFoods = useMemo(() => {
    if (!searchTerm.trim()) return foods;
    
    const term = searchTerm.toLowerCase();
    return foods.filter(food => 
      food.name.toLowerCase().includes(term) ||
      (food.metadata?.category && food.metadata.category.toLowerCase().includes(term))
    );
  }, [foods, searchTerm]);

  /* ------------------------------------------------------------------ */
  /* API FUNCTIONS */
  /* ------------------------------------------------------------------ */

  const handleSearchApi = async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setApiSearch(prev => ({ ...prev, searchResults: [], error: null }));
      return;
    }

    setApiSearch(prev => ({ ...prev, isSearching: true, error: null }));

    try {
      const results = await searchOpenFoodFacts(searchQuery);
      setApiSearch(prev => ({
        ...prev,
        searchResults: results.products,
        isSearching: false
      }));
    } catch (error) {
      console.error('Open Food Facts search failed:', error);
      setApiSearch(prev => ({
        ...prev,
        isSearching: false,
        error: error instanceof Error ? error.message : 'Failed to search food database'
      }));
    }
  };

  const handleSelectApiFood = (apiFood: OpenFoodFactsProduct) => {
    const mappedFood = mapOpenFoodFactsToFoodFormData(apiFood);
    setFormData(prev => ({
      ...prev,
      ...mappedFood,
      // Keep existing cost if it exists, otherwise use default
      cost: prev.cost || { costPerKg: 0, unit: 'kg' }
    }));
    setApiSearch(prev => ({ ...prev, selectedApiFood: apiFood }));
    setError(null);
    setSuccess(null);
  };

  const resetApiSearch = () => {
    setApiSearch({
      isSearching: false,
      searchResults: [],
      selectedApiFood: null,
      error: null
    });
  };

  const resetForm = () => {
    setFormData({
      name: '',
      nutrition: { protein: 0, fats: 0, carbs: 0, calories: 0 },
      cost: { costPerKg: 0, unit: 'kg' },
  category: 'Fruits & Treats',
      isUnitFood: false,
      useFixedAmount: false,
      fixedAmount: 100,
      hidden: false, // ← NEW
      favorite: false // ← NEW
    });
    setEditingFood(null);
    setError(null);
    setSuccess(null);
    resetApiSearch();
  };

  const handleInputChange = (field: string, value: any) => {
    if (field.startsWith('nutrition.')) {
      const k = field.split('.')[1] as keyof FoodFormData['nutrition'];
  setFormData((prev: FoodFormData) => ({
        ...prev,
        nutrition: { ...prev.nutrition, [k]: typeof value === 'number' ? value : parseFloat(value) || 0 }
      }));
    } else if (field.startsWith('cost.')) {
      const k = field.split('.')[1] as keyof NonNullable<FoodFormData['cost']>;
  setFormData((prev: FoodFormData) => ({
        ...prev,
        cost: prev.cost ? {
          ...prev.cost,
          [k]: k === 'unit' ? value : (typeof value === 'number' ? value : parseFloat(value) || 0)
        } : {
          costPerKg: k === 'costPerKg' ? (typeof value === 'number' ? value : parseFloat(value) || 0) : 0,
          unit: k === 'unit' ? value : 'kg'
        }
      }));
    } else {
      const numericValue = typeof value === 'number' ? value : parseFloat(value) || 0;
  setFormData((prev: FoodFormData) => ({ ...prev, [field]: field === 'fixedAmount' ? numericValue : value }));
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

    if (formData.cost && formData.cost.costPerKg < 0) {
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
        await updateFoodMutation.mutateAsync({ firestoreId: editingFood.firestoreId, foodData: formData });
        setSuccess(`${formData.name} updated`);
      } else {
        await addFoodMutation.mutateAsync(formData);
        setSuccess(`${formData.name} added`);
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
      hidden: typeof food.metadata?.hidden === 'boolean' ? food.metadata.hidden : false,
      favorite: typeof food.metadata?.favorite === 'boolean' ? food.metadata.favorite : false
    });
    setEditingFood(food);
    setError(null);
    setSuccess(null);
  };

  const handleDelete = async (food: FirestoreFood) => {
    try {
      setLoading(true);
      await deleteFoodMutation.mutateAsync(food.firestoreId);
      setSuccess(`${food.name} deleted`);
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
    <PageCard title="Manage Foods">
      <Box 
        sx={{ 
          display: 'flex', 
          gap: 3, 
          height: '100%', 
          flexDirection: { xs: 'column', md: 'row' }
        }}
      >
        {/* ========== LEFT COLUMN: Add/Edit Form ========== */}
        <Box 
          sx={{ 
            flexBasis: { xs: '100%', md: '50%' },
            minWidth: 0
          }}
        >
          {/* Food Search */}
          <Card
          elevation={1}
          sx={{
            mb: 3,
            backgroundColor: 'var(--surface-bg)',
            border: '1px solid var(--border-color)',
            borderRadius: 2
          }}
        >
          <CardHeader
            title="Search Open Food Facts Database"
            titleTypographyProps={{
              variant: 'h6',
              sx: { 
                color: 'var(--text-primary)', 
                fontWeight: 600,
                opacity: 0.94,
                position: 'relative',
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  left: 0,
                  top: 0,
                  bottom: 0,
                  width: '3px',
                  backgroundColor: 'var(--accent-green)',
                  borderRadius: '2px'
                },
                paddingLeft: '12px'
              }
            }}
          />
          <CardContent>
            <Typography variant="body2" sx={{ mb: 2, color: 'var(--text-secondary)' }}>
              Search for foods to automatically populate nutrition data. Cost can be added manually.
            </Typography>
            <TextField
              fullWidth
              placeholder="Search for food (e.g., chicken breast, apple, rice)..."
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  const target = e.target as HTMLInputElement;
                  handleSearchApi(target.value);
                }
              }}
              sx={{ mb: 2 }}
            />

            {/* Search Results */}
            {apiSearch.isSearching && (
              <Box sx={{ mb: 2, textAlign: 'center' }}>
                <Typography variant="body2" sx={{ color: 'var(--text-secondary)' }}>
                  🔍 Searching...
                </Typography>
              </Box>
            )}

            {apiSearch.error && (
              <Alert 
                severity="error" 
                sx={{ 
                  mb: 2,
                  borderRadius: 2,
                  backgroundColor: 'var(--surface-bg)',
                  border: '1px solid var(--error-color)',
                  color: 'var(--text-primary)'
                }}
              >
                {apiSearch.error}
              </Alert>
            )}

            {apiSearch.searchResults.length > 0 && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" sx={{ mb: 1, fontWeight: 600, color: 'var(--text-primary)' }}>
                  Search Results ({apiSearch.searchResults.length}):
                </Typography>
                <Box sx={{ 
                  backgroundColor: 'var(--surface-bg)',
                  borderRadius: 2,
                  border: '1px solid var(--border-color)',
                  maxHeight: '200px',
                  overflow: 'auto'
                }}>
                  <List dense>
                    {apiSearch.searchResults.map((food, index) => {
                      const displayProps = getFoodDisplayProps(food);
                      return (
                        <ListItemButton 
                          key={displayProps.id}
                          onClick={() => handleSelectApiFood(food)}
                          sx={{
                            '&:hover': {
                              backgroundColor: 'var(--meal-row-bg)'
                            },
                            borderBottom: index < apiSearch.searchResults.length - 1 ? '1px solid var(--border-color)' : 'none'
                          }}
                        >
                          <ListItemText
                            primary={
                              <Typography variant="body2" sx={{ fontWeight: 500, color: 'var(--text-primary)' }}>
                                {displayProps.name}
                              </Typography>
                            }
                            secondary={
                              <Typography variant="caption" sx={{ color: 'var(--text-secondary)' }}>
                                {displayProps.brand ? `${displayProps.brand} • ` : ''}
                                {displayProps.nutrientsCount} nutrients available
                              </Typography>
                            }
                          />
                        </ListItemButton>
                      );
                    })}
                  </List>
                </Box>
              </Box>
            )}
          </CardContent>
        </Card>

        {/* Add/Edit Form */}
        <Card
          elevation={1}
          sx={{
            backgroundColor: 'var(--surface-bg)',
            border: '1px solid var(--border-color)',
            borderRadius: 2
          }}
        >
          <CardHeader
            title={editingFood ? 'Edit Food' : 'Add New Food'}
            titleTypographyProps={{
              variant: 'h6',
              sx: { 
                color: 'var(--text-primary)', 
                fontWeight: 600,
                opacity: 0.94,
                position: 'relative',
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  left: 0,
                  top: 0,
                  bottom: 0,
                  width: '3px',
                  backgroundColor: 'var(--accent-green)',
                  borderRadius: '2px'
                },
                paddingLeft: '12px'
              }
            }}
          />
          <CardContent>
            <Box component="form" onSubmit={handleSubmit}>
              {/* Success/Error Messages */}
              {error && (
                <Alert 
                  severity="error" 
                  sx={{ 
                    mb: 3,
                    borderRadius: 2,
                    backgroundColor: 'var(--surface-bg)',
                    border: '1px solid var(--error-color)',
                    color: 'var(--text-primary)'
                  }}
                  onClose={() => setError(null)}
                >
                  {error}
                </Alert>
              )}
              {success && (
                <Alert 
                  severity="success" 
                  sx={{ 
                    mb: 3,
                    borderRadius: 2,
                    backgroundColor: 'var(--surface-bg)',
                    border: '1px solid var(--accent-green)',
                    color: 'var(--text-primary)'
                  }}
                  onClose={() => setSuccess(null)}
                >
                  {success}
                </Alert>
              )}

              {/* Basic Information */}
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" sx={{ 
                  mb: 2, 
                  color: 'var(--text-primary)', 
                  fontWeight: 600,
                  position: 'relative',
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    left: 0,
                    top: 0,
                    bottom: 0,
                    width: '2px',
                    backgroundColor: 'var(--accent-blue)',
                    borderRadius: '1px'
                  },
                  paddingLeft: '10px'
                }}>
                  Basic Information
                </Typography>

                <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="body2" sx={{ mb: 1, fontWeight: 500, color: 'var(--text-primary)' }}>
                      Food Name
                    </Typography>
                    <SmartTextInput
                      value={formData.name}
                      placeholder="Food Name"
                      onChange={(value) => handleInputChange('name', value)}
                      disabled={loading}
                    />
                  </Box>
                  
                  <CustomSelect
                    value={formData.category}
                    options={FOOD_CATEGORIES}
                    onChange={(value) => handleInputChange('category', value)}
                    placeholder="Select category"
                    label="Category"
                    size="small"
                  />
                </Stack>
              </Box>

              {/* Food Settings */}
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" sx={{ 
                  mb: 2, 
                  color: 'var(--text-primary)', 
                  fontWeight: 600,
                  position: 'relative',
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    left: 0,
                    top: 0,
                    bottom: 0,
                    width: '2px',
                    backgroundColor: 'var(--accent-purple)',
                    borderRadius: '1px'
                  },
                  paddingLeft: '10px'
                }}>
                  Food Settings
                </Typography>

                <Box sx={{ 
                  backgroundColor: 'var(--meal-row-bg)',
                  borderRadius: 2,
                  border: '1px solid var(--border-color)',
                  p: 2
                }}>
                  <Stack direction="row" spacing={2} sx={{ mb: 2, flexWrap: 'wrap' }}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={formData.isUnitFood}
                          onChange={(e) => handleInputChange('isUnitFood', e.target.checked)}
                          sx={{
                            '& .MuiSwitch-switchBase.Mui-checked': {
                              color: 'var(--accent-green)',
                              '& + .MuiSwitch-track': {
                                backgroundColor: 'var(--accent-green)'
                              }
                            }
                          }}
                        />
                      }
                      label="Unit food (eggs, tortillas)"
                    />
                    
                    <FormControlLabel
                      control={
                        <Switch
                          checked={formData.useFixedAmount}
                          onChange={(e) => handleInputChange('useFixedAmount', e.target.checked)}
                          sx={{
                            '& .MuiSwitch-switchBase.Mui-checked': {
                              color: 'var(--accent-blue)',
                              '& + .MuiSwitch-track': {
                                backgroundColor: 'var(--accent-blue)'
                              }
                            }
                          }}
                        />
                      }
                      label="Use fixed amount"
                    />
                  </Stack>

                  <Stack direction="row" spacing={2} sx={{ mb: 2, flexWrap: 'wrap' }}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={formData.hidden}
                          onChange={(e) => handleInputChange('hidden', e.target.checked)}
                          sx={{
                            '& .MuiSwitch-switchBase.Mui-checked': {
                              color: 'var(--warning-color)',
                              '& + .MuiSwitch-track': {
                                backgroundColor: 'var(--warning-color)'
                              }
                            }
                          }}
                        />
                      }
                      label="Hidden (exclude from meal plans)"
                    />
                    <FormControlLabel
                      control={
                        <Switch
                          checked={formData.favorite}
                          onChange={(e) => handleInputChange('favorite', e.target.checked)}
                          sx={{
                            '& .MuiSwitch-switchBase.Mui-checked': {
                              color: 'var(--accent-green)',
                              '& + .MuiSwitch-track': {
                                backgroundColor: 'var(--accent-green)'
                              }
                            }
                          }}
                        />
                      }
                      label="Favorite"
                    />
                  </Stack>

                  {formData.useFixedAmount && (
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="body2" sx={{ mb: 1, fontWeight: 500, color: 'var(--text-primary)' }}>
                        Fixed Amount
                      </Typography>
                      <NumberStepper
                        value={formData.fixedAmount}
                        onChange={(value) => handleInputChange('fixedAmount', value)}
                        min={0}
                        max={formData.isUnitFood ? 100 : 5000}
                        step={formData.isUnitFood ? 1 : 10}
                        unit={formData.isUnitFood ? 'units' : 'g'}
                        size="small"
                      />
                      <Typography variant="caption" sx={{ 
                        mt: 1, 
                        display: 'block',
                        color: 'var(--text-secondary)'
                      }}>
                        Default amount when selected in Meal Planner ({formData.isUnitFood ? 'units' : 'g'})
                      </Typography>
                    </Box>
                  )}
                </Box>
              </Box>

              {/* Nutrition Information */}
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" sx={{ 
                  mb: 2, 
                  color: 'var(--text-primary)', 
                  fontWeight: 600,
                  position: 'relative',
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    left: 0,
                    top: 0,
                    bottom: 0,
                    width: '2px',
                    backgroundColor: 'var(--accent-green)',
                    borderRadius: '1px'
                  },
                  paddingLeft: '10px'
                }}>
                  Nutrition (per {formData.isUnitFood ? 'unit' : '100g'})
                </Typography>

                <Box sx={{ 
                  backgroundColor: 'var(--meal-row-bg)',
                  borderRadius: 2,
                  border: '1px solid var(--border-color)',
                  p: 2
                }}>
                  <Stack direction="row" spacing={2} sx={{ flexWrap: 'wrap' }}>
                    {(['protein', 'fats', 'carbs', 'calories'] as const).map(field => (
                      <Box key={field} sx={{ flex: 1, minWidth: 120 }}>
                        <Typography variant="body2" sx={{ mb: 1, fontWeight: 500, color: 'var(--text-primary)' }}>
                          {field.charAt(0).toUpperCase() + field.slice(1)} ({field === 'calories' ? 'kcal' : 'g'})
                        </Typography>
                        <NumberStepper
                          value={formData.nutrition[field]}
                          onChange={(value) => handleInputChange(`nutrition.${field}`, value)}
                          min={0}
                          max={field === 'calories' ? 1000 : 100}
                          step={field === 'calories' ? 1 : 0.1}
                          unit={field === 'calories' ? 'kcal' : 'g'}
                          size="small"
                        />
                      </Box>
                    ))}
                  </Stack>
                </Box>
              </Box>

              {/* Cost Information */}
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" sx={{ 
                  mb: 2, 
                  color: 'var(--text-primary)', 
                  fontWeight: 600,
                  position: 'relative',
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    left: 0,
                    top: 0,
                    bottom: 0,
                    width: '2px',
                    backgroundColor: 'var(--accent-blue)',
                    borderRadius: '1px'
                  },
                  paddingLeft: '10px'
                }}>
                  Cost Information
                </Typography>

                <Box sx={{ 
                  backgroundColor: 'var(--meal-row-bg)',
                  borderRadius: 2,
                  border: '1px solid var(--border-color)',
                  p: 2
                }}>
                <Stack direction="row" spacing={2}>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="body2" sx={{ mb: 1, fontWeight: 500, color: 'var(--text-primary)' }}>
                        Cost per {formData.cost?.unit || 'kg'}
                      </Typography>
                      <NumberStepper
                        value={formData.cost?.costPerKg || 0}
                        onChange={(value) => handleInputChange('cost.costPerKg', value)}
                        min={0}
                        max={100}
                        step={0.01}
                        unit="€"
                        size="small"
                      />
                    </Box>
                    
                    <CustomSelect
                      value={formData.cost?.unit || 'kg'}
                      options={[
                        { value: 'kg', label: '€/kg' },
                        { value: 'unit', label: '€/unit' }
                      ]}
                      onChange={(value) => handleInputChange('cost.unit', value)}
                      placeholder="Select unit"
                      size="small"
                    />
                  </Stack>
                </Box>
              </Box>

              {/* Action Buttons */}
              <Stack direction="row" spacing={2}>
                <AccentButton
                  onClick={handleSubmit}
                  disabled={loading}
                  loading={loading}
                  variant="primary"
                  style={{
                    backgroundColor: 'var(--accent-green)',
                    borderRadius: '8px',
                    fontWeight: 600
                  }}
                >
                  {editingFood ? 'Update Food' : 'Add Food'}
                </AccentButton>
                {editingFood && (
                  <AccentButton
                    onClick={resetForm}
                    disabled={loading}
                    variant="secondary"
                    style={{
                      borderRadius: '8px',
                      fontWeight: 600
                    }}
                  >
                    Cancel
                  </AccentButton>
                )}
              </Stack>
            </Box>
          </CardContent>
        </Card>
      </Box>

      {/* ========== RIGHT COLUMN: Food List & Tips ========== */}
      <Box 
        sx={{ 
          flexBasis: { xs: '100%', md: '50%' },
          position: { md: 'sticky' },
          top: { md: 16 },
          alignSelf: { md: 'flex-start' },
          height: { md: 'fit-content' }
        }}
      >
        {/* Saved Foods List */}
        <Card
          elevation={1}
          sx={{
            mb: 3,
            backgroundColor: 'var(--surface-bg)',
            border: '1px solid var(--border-color)',
            borderRadius: 2
          }}
        >
          <CardHeader
            title={`Saved Foods (${filteredFoods.length}${searchTerm ? ` of ${foods.length}` : ''})`}
            titleTypographyProps={{
              variant: 'h6',
              sx: { 
                color: 'var(--text-primary)', 
                fontWeight: 600,
                opacity: 0.94,
                position: 'relative',
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  left: 0,
                  top: 0,
                  bottom: 0,
                  width: '3px',
                  backgroundColor: 'var(--accent-green)',
                  borderRadius: '2px'
                },
                paddingLeft: '12px'
              }
            }}
          />
          <CardContent>
            {foods.length === 0 ? (
              <Box sx={{ 
                textAlign: 'center', 
                py: 6,
                backgroundColor: 'var(--surface-bg)',
                borderRadius: 3,
                border: '2px dashed var(--border-color)'
              }}>
                <Typography variant="h6" sx={{ color: 'var(--text-secondary)', mb: 1 }}>
                  No Foods Yet
                </Typography>
                <Typography variant="body2" sx={{ color: 'var(--text-secondary)', mb: 3 }}>
                  Start by adding your first food to the database
                </Typography>
              </Box>
            ) : (
              <Box>
                {/* Search Input */}
                <Box sx={{ mb: 2 }}>
                  <TextField
                    fullWidth
                    placeholder="Search foods by name or category..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <SearchIcon sx={{ color: 'var(--text-secondary)' }} />
                        </InputAdornment>
                      ),
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        backgroundColor: 'var(--surface-bg)',
                        borderRadius: 2,
                        '& fieldset': {
                          borderColor: 'var(--border-color)',
                        },
                        '&:hover fieldset': {
                          borderColor: 'var(--accent-green)',
                        },
                        '&.Mui-focused fieldset': {
                          borderColor: 'var(--accent-green)',
                        },
                      },
                      '& .MuiInputBase-input': {
                        color: 'var(--text-primary)',
                        '&::placeholder': {
                          color: 'var(--text-secondary)',
                          opacity: 0.7,
                        },
                      },
                    }}
                  />
                </Box>

                <Box sx={{ 
                  backgroundColor: 'var(--surface-bg)',
                  borderRadius: 2,
                  border: '1px solid var(--border-color)',
                  overflow: 'hidden'
                }}>
                  <List sx={{ maxHeight: '400px', overflow: 'auto' }}>
                    {filteredFoods.map(food => (
                      <ListItem 
                        key={food.firestoreId} 
                        divider
                        sx={{
                          '&:hover': {
                            backgroundColor: 'var(--meal-row-bg)'
                          }
                        }}
                      >
                        <ListItemText
                          primary={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                              <Typography variant="body1" sx={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                                {food.name}
                              </Typography>
                              {food.metadata?.isUnitFood && (
                                <Chip label="unit" size="small" sx={{ backgroundColor: 'var(--accent-blue)', color: 'white' }} />
                              )}
                              {food.metadata?.useFixedAmount && (
                                <Chip label="fixed" size="small" sx={{ backgroundColor: 'var(--accent-purple)', color: 'white' }} />
                              )}
                              {food.metadata?.favorite && (
                                <Chip label="⭐" size="small" sx={{ backgroundColor: '#ffd700', color: '#000' }} />
                              )}
                              {food.metadata?.hidden && (
                                <Chip label="hidden" size="small" sx={{ backgroundColor: 'var(--text-secondary)', color: 'white' }} />
                              )}
                            </Box>
                          }
                          secondary={
                            <Typography variant="body2" sx={{ color: 'var(--text-secondary)', mt: 0.5 }}>
                              Protein: {formatNumber(food.nutrition.protein)}g • Fats: {formatNumber(food.nutrition.fats)}g • 
                              Carbs: {formatNumber(food.nutrition.carbs)}g • Calories: {formatNumber(food.nutrition.calories)}kcal • 
                              Cost: €{food.cost.costPerKg.toFixed(2)}/{food.cost.unit}
                              {food.metadata?.useFixedAmount && (
                                <> • Default: {food.metadata.fixedAmount} {food.metadata.isUnitFood ? 'units' : 'g'}</>
                              )}
                            </Typography>
                          }
                        />
                        <ListItemSecondaryAction>
                          <IconButton
                            onClick={() => handleEdit(food)}
                            sx={{
                              color: 'var(--accent-blue)',
                              '&:hover': {
                                backgroundColor: 'var(--accent-blue-light)',
                                transform: 'scale(1.1)'
                              },
                              transition: 'all 200ms ease'
                            }}
                          >
                            <EditIcon />
                          </IconButton>
                          <IconButton 
                            color="error"
                            onClick={() => setDeleteDialog(food)}
                            sx={{
                              color: 'var(--error-color)',
                              '&:hover': {
                                backgroundColor: 'var(--error-color-light)',
                                transform: 'scale(1.1)'
                              },
                              transition: 'all 200ms ease'
                            }}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </ListItemSecondaryAction>
                      </ListItem>
                    ))}
                  </List>
                </Box>
              </Box>
            )}
          </CardContent>
        </Card>

        {/* Food Management Tips */}
        <Box sx={{ mt: 3 }}>
          <Typography variant="subtitle1" sx={{ 
            mb: 2, 
            color: 'var(--text-primary)', 
            fontWeight: 600,
            position: 'relative',
            '&::before': {
              content: '""',
              position: 'absolute',
              left: 0,
              top: 0,
              bottom: 0,
              width: '2px',
              backgroundColor: 'var(--accent-purple)',
              borderRadius: '1px'
            },
            paddingLeft: '10px'
          }}>
            Food Management Tips
          </Typography>
          
          <Box sx={{ 
            backgroundColor: 'var(--surface-bg)',
            borderRadius: 2,
            border: '1px solid var(--border-color)',
            p: 2
          }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                <Typography variant="body2" sx={{ color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                  Use favorites for quick access to commonly used foods
                </Typography>
              </Box>
              
              <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                <Typography variant="body2" sx={{ color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                  Unit foods (eggs, tortillas) are measured per individual item
                </Typography>
              </Box>
              
              <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                <Typography variant="body2" sx={{ color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                  Hidden foods won't appear in meal planning but can still be used in recipes
                </Typography>
              </Box>
            </Box>
          </Box>
        </Box>
      </Box>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteDialog} onClose={() => setDeleteDialog(null)}>
        <DialogTitle>Delete Food</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete "{deleteDialog?.name}"? This cannot be undone.
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
            Delete
          </AccentButton>
        </DialogActions>
      </Dialog>
      </Box>
    </PageCard>
  );
};

export default AddFoodManager;
