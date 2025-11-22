/**
 * FoodInventory
 * ------------------------------------------------------------
 * PURPOSE
 * Local-only (offline-friendly) tracker of what ingredients the
 * user has at home and where they are stored.
 *
 * RESPONSIBILITIES
 * • CRUD on inventory items, persisted in localStorage.
 * • Compute “status” badge (fresh | low | empty) from quantity.
 * • Highlight items expiring within 3 days.
 * • Group rows by storage location (fridge / freezer / pantry / counter).
 *
 * STATE SNAPSHOT
 * • inventory     – InventoryItem[]
 * • openDialog    – add/edit dialog visibility
 * • editingItem   – InventoryItem | null
 * • formData      – controlled inputs inside dialog
 *
 * BUSINESS RULES
 * • Quantity ≤ 0  → status = 'empty'
 * • Quantity ≤ 100g/ml (configurable) → status = 'low'
 * • Else               → status = 'fresh'
 *
 * TODO
 * • Sync with Firestore so the same inventory appears on multiple
 *   devices (optional; keep local fallback).
 * • Add bulk actions: “Clear Empty”, “Mark Purchased”, etc.
 * • Responsive layout: switch to card grid on <600 px width.
 */
import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  Tooltip,
  MenuItem,
  Autocomplete,
  Stack,
  Divider,
  CircularProgress
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Kitchen as InventoryIcon,
  ShoppingCart as ShoppingIcon,
  CheckCircle as FreshIcon,
  Warning as LowIcon,
  Error as EmptyIcon,
  CloudUpload as CloudIcon,
  CloudOff as OfflineIcon
} from '@mui/icons-material';
import { useFoodDatabase } from '../../contexts/FoodContext';
import { useAuth } from '../../contexts/AuthContext';
import foodInventoryService, { FoodInventoryItem } from '../../services/firebase/nutrition/foodInventoryService';

interface InventoryItem {
  id: string;
  foodName: string;
  quantity: number;
  unit: string;
  expiryDate?: string;
  location: string; // 'fridge', 'freezer', 'pantry', 'counter'
  status: 'fresh' | 'low' | 'empty';
  lastUpdated: string;
  notes?: string;
}

const STORAGE_LOCATIONS = [
  { value: 'fridge', label: '🧊 Fridge', color: '#2196f3' },
  { value: 'freezer', label: '❄️ Freezer', color: '#00bcd4' },
  { value: 'pantry', label: '🥫 Pantry', color: '#ff9800' },
  { value: 'counter', label: '🍎 Counter', color: '#4caf50' }
];

const FoodInventory: React.FC = () => {
  const [inventory, setInventory] = useState<FoodInventoryItem[]>([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingItem, setEditingItem] = useState<FoodInventoryItem | null>(null);
  const [formData, setFormData] = useState({
    foodName: '',
    quantity: '',
    unit: 'g',
    expiryDate: '',
    location: 'pantry',
    notes: ''
  });
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [inputMode, setInputMode] = useState<'manual' | 'select'>('select');

  // Authentication and food database
  const { user, isAuthenticated } = useAuth();
  const { foodDatabase, loading: foodLoading, error: foodError } = useFoodDatabase();

  // Load inventory from Firebase on mount and when user changes
  useEffect(() => {
    if (!isAuthenticated || !user) {
      setInventory([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    // Load initial data
    const loadInventory = async () => {
      try {
        const items = await foodInventoryService.getUserInventory(user.uid);
        setInventory(items);
      } catch (err: any) {
        console.error('Error loading inventory:', err);
        setError('Failed to load inventory from cloud');
      } finally {
        setLoading(false);
      }
    };

    loadInventory();

    // Set up real-time subscription
    const unsubscribe = foodInventoryService.subscribeToUserInventory(
      user.uid,
      (items) => {
        setInventory(items);
        setLoading(false);
      },
      (err) => {
        console.error('Inventory subscription error:', err);
        setError('Lost connection to cloud storage');
      }
    );

    return unsubscribe;
  }, [user, isAuthenticated]);

  // Migrate localStorage data to Firebase on first load
  useEffect(() => {
    if (!isAuthenticated || !user || loading) return;

    const migrateLocalStorage = async () => {
      const savedInventory = localStorage.getItem('foodInventory');
      if (savedInventory && inventory.length === 0) {
        try {
          const parsed = JSON.parse(savedInventory);
          if (parsed.length > 0) {
            await foodInventoryService.migrateLocalStorageToFirebase(user.uid, parsed);
            setSuccess('✅ Your inventory has been migrated to cloud storage!');
            localStorage.removeItem('foodInventory'); // Clean up after migration
            setTimeout(() => setSuccess(null), 5000);
          }
        } catch (err: any) {
          console.error('Migration error:', err);
          setError('Failed to migrate local data to cloud');
        }
      }
    };

    migrateLocalStorage();
  }, [user, isAuthenticated, loading, inventory.length]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'fresh': return <FreshIcon sx={{ color: 'success.main' }} />;
      case 'low': return <LowIcon sx={{ color: 'warning.main' }} />;
      case 'empty': return <EmptyIcon sx={{ color: 'error.main' }} />;
      default: return <FreshIcon sx={{ color: 'success.main' }} />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'fresh': return 'success';
      case 'low': return 'warning';
      case 'empty': return 'error';
      default: return 'success';
    }
  };

  const calculateStatus = (quantity: number): 'fresh' | 'low' | 'empty' => {
    if (quantity <= 0) return 'empty';
    if (quantity <= 100) return 'low'; // Assuming 100g/ml is low threshold
    return 'fresh';
  };

  const isExpiringSoon = (expiryDate?: string) => {
    if (!expiryDate) return false;
    const expiry = new Date(expiryDate);
    const now = new Date();
    const threeDays = 3 * 24 * 60 * 60 * 1000;
    return expiry.getTime() - now.getTime() <= threeDays;
  };

  const handleOpenDialog = (item?: FoodInventoryItem) => {
    if (!isAuthenticated || !user) {
      setError('You must be logged in to manage inventory');
      return;
    }

    if (item) {
      setEditingItem(item);
      setFormData({
        foodName: item.foodName,
        quantity: item.quantity.toString(),
        unit: item.unit,
        expiryDate: item.expiryDate ? new Date(item.expiryDate).toISOString().split('T')[0] : '',
        location: item.location,
        notes: item.notes || ''
      });
      setInputMode('manual'); // When editing, use manual mode
    } else {
      setEditingItem(null);
      setFormData({
        foodName: '',
        quantity: '',
        unit: 'g',
        expiryDate: '',
        location: 'pantry',
        notes: ''
      });
      setInputMode('select'); // Default to select mode for new items
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingItem(null);
    setSuccess(null);
    setError(null);
    setInputMode('select');
  };

  // Handle food selection from database
  const handleFoodSelect = (foodName: string | null) => {
    if (!foodName || !foodDatabase[foodName]) {
      setFormData(prev => ({ ...prev, foodName: foodName || '' }));
      return;
    }

    const foodData = foodDatabase[foodName];
    const defaultAmount = foodData.useFixedAmount && foodData.fixedAmount
      ? foodData.fixedAmount
      : (foodData.isUnitFood ? (foodName === 'Eggs' ? 2 : 1) : 100);

    setFormData({
      foodName: foodName,
      quantity: defaultAmount.toString(),
      unit: foodData.isUnitFood ? 'units' : 'g',
      expiryDate: '',
      location: 'pantry',
      notes: ''
    });
  };

  const handleSave = async () => {
    if (!isAuthenticated || !user) {
      setError('You must be logged in to save inventory items');
      return;
    }

    if (!formData.foodName || !formData.quantity) {
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const quantity = parseFloat(formData.quantity);
      const status = calculateStatus(quantity);

      // Prepare the item data, only including optional fields if they have values
      const itemData: any = {
        userId: user.uid,
        foodName: formData.foodName,
        quantity,
        unit: formData.unit,
        location: formData.location as 'fridge' | 'freezer' | 'pantry' | 'counter',
        status,
        lastUpdated: new Date()
      };

      // Only include expiryDate if it has a value
      if (formData.expiryDate) {
        itemData.expiryDate = formData.expiryDate;
      }

      // Only include notes if they have a value
      if (formData.notes && formData.notes.trim()) {
        itemData.notes = formData.notes.trim();
      }

      if (editingItem) {
        // Update existing item
        await foodInventoryService.updateInventoryItem(editingItem.id, itemData);
        setSuccess('✅ Inventory item updated successfully!');
      } else {
        // Add new item
        await foodInventoryService.addInventoryItem(itemData);
        setSuccess('✅ New inventory item added successfully!');
      }

      setTimeout(() => setSuccess(null), 3000);
      handleCloseDialog();
    } catch (err: any) {
      console.error('Error saving inventory item:', err);
      setError(`Failed to save item: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!isAuthenticated || !user) {
      setError('You must be logged in to delete inventory items');
      return;
    }

    try {
      await foodInventoryService.deleteInventoryItem(id);
      setSuccess('🗑️ Inventory item deleted successfully!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      console.error('Error deleting inventory item:', err);
      setError(`Failed to delete item: ${err.message}`);
    }
  };

  const handleAddToShoppingList = (item: FoodInventoryItem) => {
    if (!isAuthenticated || !user) {
      setError('You must be logged in to add items to shopping list');
      return;
    }

    try {
      // Get existing shopping list from localStorage
      const shoppingListKey = `shoppingList_${user.uid}`;
      const existingList = localStorage.getItem(shoppingListKey);
      const shoppingList = existingList ? JSON.parse(existingList) : [];

      // Check if item is already in shopping list
      const existingItem = shoppingList.find((listItem: any) => 
        listItem.foodName.toLowerCase() === item.foodName.toLowerCase()
      );

      if (existingItem) {
        // Update quantity if already exists
        existingItem.quantity += 1;
        existingItem.lastUpdated = new Date().toISOString();
      } else {
        // Add new item to shopping list
        shoppingList.push({
          id: `${item.foodName.toLowerCase().replace(/[^a-z0-9]/g, '-')}_${Date.now()}`,
          foodName: item.foodName,
          quantity: 1,
          unit: item.unit,
          addedDate: new Date().toISOString(),
          lastUpdated: new Date().toISOString(),
          notes: `Out of stock - was ${item.quantity} ${item.unit}`
        });
      }

      // Save updated shopping list
      localStorage.setItem(shoppingListKey, JSON.stringify(shoppingList));

      setSuccess(`✅ ${item.foodName} added to shopping list!`);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      console.error('Error adding to shopping list:', err);
      setError('Failed to add item to shopping list');
    }
  };

  const groupedInventory = STORAGE_LOCATIONS.reduce((acc, location) => {
    acc[location.value] = inventory.filter(item => item.location === location.value);
    return acc;
  }, {} as Record<string, FoodInventoryItem[]>);

  return (
    <Box>
      {/* Title with separator */}
      <Box sx={{ 
        mb: 3, 
        pb: 2, 
        borderBottom: '1px solid var(--border-color)' 
      }}>
        <Typography variant="h5" sx={{ 
          fontWeight: 600, 
          color: 'var(--text-primary)' 
        }}>
          Food Inventory
        </Typography>
      </Box>

      <Box 
        sx={{ 
          display: 'flex', 
          gap: 3, 
          height: '100%', 
          p: 1.5,
          flexDirection: { xs: 'column', md: 'row' },
          background: 'linear-gradient(135deg, var(--meal-bg-card) 0%, rgba(255,255,255,0.5) 100%)',
          borderRadius: 3,
          minHeight: 'calc(100vh - 200px)',
          maxWidth: '80%',
          marginLeft: 'auto',
          marginRight: 'auto'
        }}
      >
        {/* ========== LEFT COLUMN: Inventory Management ========== */}
        <Box 
          sx={{ 
            flexBasis: { xs: '100%', md: '70%' },
            minWidth: 0
          }}
        >
          {/* Header */}
          <Box sx={{ mb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1.5 }}>
              <Typography variant="h6" sx={{ 
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
              }}>
                Food Inventory Manager
              </Typography>
            {isAuthenticated && !loading && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CloudIcon sx={{ color: 'var(--accent-blue)', fontSize: 18 }} />
                <Typography variant="caption" sx={{ color: 'var(--text-secondary)' }}>
                  Cloud Synced
                </Typography>
              </Box>
            )}
            {!isAuthenticated && !loading && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <OfflineIcon sx={{ color: 'var(--warning-color)', fontSize: 18 }} />
                <Typography variant="caption" sx={{ color: 'var(--text-secondary)' }}>
                  Offline Mode
                </Typography>
              </Box>
            )}
          </Box>
          <Typography variant="body2" sx={{ 
            color: 'var(--text-secondary)',
            pl: '12px'
          }}>
            Track what you have in your kitchen and monitor expiry dates
          </Typography>
        </Box>

        {/* Add Item Button */}
        <Box sx={{ mb: 3 }}>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
            size="large"
            sx={{
              backgroundColor: 'var(--accent-green)',
              '&:hover': {
                backgroundColor: 'var(--accent-green-dark)',
                transform: 'translateY(-1px)',
                boxShadow: '0 4px 12px rgba(59, 186, 117, 0.3)'
              },
              transition: 'all 200ms ease',
              borderRadius: 2,
              fontWeight: 600
            }}
          >
            Add Item
          </Button>
        </Box>

        {/* Error Message */}
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

        {/* Loading State */}
        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress sx={{ color: 'var(--accent-blue)' }} />
            <Typography variant="body2" sx={{ ml: 2, color: 'var(--text-secondary)' }}>
              Loading inventory from cloud...
            </Typography>
          </Box>
        )}

        {/* Not Authenticated State */}
        {!isAuthenticated && !loading && (
          <Alert 
            severity="warning" 
            sx={{ 
              mb: 3,
              borderRadius: 2,
              backgroundColor: 'var(--surface-bg)',
              border: '1px solid var(--warning-color)',
              color: 'var(--text-primary)'
            }}
          >
            Please log in to access your food inventory
          </Alert>
        )}

        {/* Inventory Summary Cards */}
        <Box sx={{ 
          display: 'grid', 
          gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' }, 
          gap: 2,
          mb: 4
        }}>
          <Paper sx={{ 
            p: 2, 
            textAlign: 'center',
            backgroundColor: 'var(--surface-bg)',
            border: '1px solid var(--border-color)',
            borderRadius: 2,
            transition: 'all 200ms ease',
            '&:hover': {
              transform: 'translateY(-2px)',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
            }
          }}>
            <Typography variant="h4" sx={{ color: 'var(--text-primary)', fontWeight: 700 }}>
              {inventory.length}
            </Typography>
            <Typography variant="caption" sx={{ color: 'var(--text-secondary)' }}>
              Total Items
            </Typography>
          </Paper>
          <Paper sx={{ 
            p: 2, 
            textAlign: 'center',
            backgroundColor: 'var(--surface-bg)',
            border: '1px solid var(--border-color)',
            borderRadius: 2,
            transition: 'all 200ms ease',
            '&:hover': {
              transform: 'translateY(-2px)',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
            }
          }}>
            <Typography variant="h4" sx={{ color: 'var(--warning-color)', fontWeight: 700 }}>
              {inventory.filter(item => item.status === 'low').length}
            </Typography>
            <Typography variant="caption" sx={{ color: 'var(--text-secondary)' }}>
              Running Low
            </Typography>
          </Paper>
          <Paper sx={{ 
            p: 2, 
            textAlign: 'center',
            backgroundColor: 'var(--surface-bg)',
            border: '1px solid var(--border-color)',
            borderRadius: 2,
            transition: 'all 200ms ease',
            '&:hover': {
              transform: 'translateY(-2px)',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
            }
          }}>
            <Typography variant="h4" sx={{ color: 'var(--error-color)', fontWeight: 700 }}>
              {inventory.filter(item => isExpiringSoon(item.expiryDate)).length}
            </Typography>
            <Typography variant="caption" sx={{ color: 'var(--text-secondary)' }}>
              Expiring Soon
            </Typography>
          </Paper>
          <Paper sx={{ 
            p: 2, 
            textAlign: 'center',
            backgroundColor: 'var(--surface-bg)',
            border: '1px solid var(--border-color)',
            borderRadius: 2,
            transition: 'all 200ms ease',
            '&:hover': {
              transform: 'translateY(-2px)',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
            }
          }}>
            <Typography variant="h4" sx={{ color: 'var(--error-color)', fontWeight: 700 }}>
              {inventory.filter(item => item.status === 'empty').length}
            </Typography>
            <Typography variant="caption" sx={{ color: 'var(--text-secondary)' }}>
              Out of Stock
            </Typography>
          </Paper>
        </Box>

        {/* Inventory by Location */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {STORAGE_LOCATIONS.map(location => {
            const items = groupedInventory[location.value];
            if (items.length === 0) return null;

            return (
              <Box key={location.value}>
                <Typography variant="h6" sx={{ 
                  mb: 2, 
                  color: location.color, 
                  fontWeight: 600,
                  position: 'relative',
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    left: 0,
                    top: 0,
                    bottom: 0,
                    width: '2px',
                    backgroundColor: location.color,
                    borderRadius: '1px'
                  },
                  paddingLeft: '10px'
                }}>
                  {location.label} ({items.length} items)
                </Typography>
                <TableContainer 
                  component={Paper} 
                  sx={{ 
                    borderRadius: 2,
                    backgroundColor: 'var(--surface-bg)',
                    border: '1px solid var(--border-color)',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
                  }}
                >
                  <Table>
                    <TableHead>
                      <TableRow sx={{ backgroundColor: 'var(--meal-bg-card)' }}>
                        <TableCell sx={{ fontWeight: 600, color: 'var(--text-primary)' }}>Food</TableCell>
                        <TableCell sx={{ fontWeight: 600, color: 'var(--text-primary)' }}>Quantity</TableCell>
                        <TableCell sx={{ fontWeight: 600, color: 'var(--text-primary)' }}>Status</TableCell>
                        <TableCell sx={{ fontWeight: 600, color: 'var(--text-primary)' }}>Expiry Date</TableCell>
                        <TableCell sx={{ fontWeight: 600, color: 'var(--text-primary)' }}>Notes</TableCell>
                        <TableCell sx={{ fontWeight: 600, color: 'var(--text-primary)' }}>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {items.map(item => (
                        <TableRow 
                          key={item.id}
                          sx={{
                            '&:hover': {
                              backgroundColor: 'var(--meal-bg-hover)',
                            },
                            transition: 'background-color 200ms ease'
                          }}
                        >
                          <TableCell>
                            <Typography variant="body2" sx={{ fontWeight: 500, color: 'var(--text-primary)' }}>
                              {item.foodName}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" sx={{ color: 'var(--text-primary)' }}>
                              {item.quantity} {item.unit}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Chip
                              icon={getStatusIcon(item.status)}
                              label={item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                              color={getStatusColor(item.status) as any}
                              size="small"
                              sx={{ fontWeight: 600 }}
                            />
                          </TableCell>
                          <TableCell>
                            {item.expiryDate ? (
                              <Typography 
                                variant="body2" 
                                sx={{ 
                                  color: isExpiringSoon(item.expiryDate) ? 'var(--error-color)' : 'var(--text-primary)',
                                  fontWeight: isExpiringSoon(item.expiryDate) ? 600 : 400
                                }}
                              >
                                {new Date(item.expiryDate).toLocaleDateString()}
                                {isExpiringSoon(item.expiryDate) && ' ⚠️'}
                              </Typography>
                            ) : (
                              <Typography variant="body2" sx={{ color: 'var(--text-secondary)' }}>
                                No expiry
                              </Typography>
                            )}
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" sx={{ color: 'var(--text-secondary)' }}>
                              {item.notes || '-'}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                              {item.status === 'empty' && (
                                <Tooltip title="Add to shopping list">
                                  <IconButton
                                    size="small"
                                    onClick={() => handleAddToShoppingList(item)}
                                    sx={{
                                      color: 'var(--accent-orange)',
                                      '&:hover': {
                                        backgroundColor: 'var(--accent-orange-light)',
                                        transform: 'scale(1.1)'
                                      },
                                      transition: 'all 200ms ease'
                                    }}
                                  >
                                    <ShoppingIcon />
                                  </IconButton>
                                </Tooltip>
                              )}
                              <Tooltip title="Edit item">
                                <IconButton
                                  size="small"
                                  onClick={() => handleOpenDialog(item)}
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
                              </Tooltip>
                              <Tooltip title="Delete item">
                                <IconButton
                                  size="small"
                                  onClick={() => handleDelete(item.id)}
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
                              </Tooltip>
                            </Box>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
            );
          })}
        </Box>

        {inventory.length === 0 && (
          <Box sx={{ 
            textAlign: 'center', 
            py: 8,
            backgroundColor: 'var(--surface-bg)',
            borderRadius: 3,
            border: '2px dashed var(--border-color)',
            mt: 4
          }}>
            <ShoppingIcon sx={{ 
              fontSize: 64, 
              color: 'var(--text-secondary)', 
              mb: 2,
              opacity: 0.6
            }} />
            <Typography variant="h6" sx={{ color: 'var(--text-secondary)', mb: 1 }}>
              Your inventory is empty
            </Typography>
            <Typography variant="body2" sx={{ color: 'var(--text-secondary)', mb: 3 }}>
              Start by adding the food items you have at home
            </Typography>
          </Box>
        )}
      </Box>

      {/* ========== RIGHT COLUMN: Quick Actions & Tips ========== */}
      <Box 
        sx={{ 
          flexBasis: { xs: '100%', md: '30%' },
          position: { md: 'sticky' },
          top: { md: 16 },
          alignSelf: { md: 'flex-start' },
          height: { md: 'fit-content' }
        }}
      >
        {/* Quick Actions */}
        <Box sx={{ mb: 3 }}>
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
              backgroundColor: 'var(--accent-blue)',
              borderRadius: '1px'
            },
            paddingLeft: '10px'
          }}>
            Quick Actions
          </Typography>
          
          <Box sx={{ 
            backgroundColor: 'var(--surface-bg)',
            borderRadius: 2,
            border: '1px solid var(--border-color)',
            p: 2
          }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              <Button
                variant="outlined"
                startIcon={<ShoppingIcon />}
                onClick={() => {
                  // TODO: Navigate to shopping list page or open shopping list dialog
                  console.log('Navigate to shopping list');
                  setSuccess('🛒 Shopping list feature coming soon!');
                  setTimeout(() => setSuccess(null), 3000);
                }}
                sx={{
                  justifyContent: 'flex-start',
                  borderColor: 'var(--accent-orange)',
                  color: 'var(--accent-orange)',
                  '&:hover': {
                    borderColor: 'var(--accent-orange-dark)',
                    backgroundColor: 'var(--accent-orange-light)',
                    transform: 'translateY(-1px)'
                  },
                  transition: 'all 200ms ease'
                }}
              >
                View Shopping List
              </Button>
              <Button
                variant="outlined"
                startIcon={<InventoryIcon />}
                sx={{
                  justifyContent: 'flex-start',
                  borderColor: 'var(--accent-blue)',
                  color: 'var(--accent-blue)',
                  '&:hover': {
                    borderColor: 'var(--accent-blue-dark)',
                    backgroundColor: 'var(--accent-blue-light)',
                    transform: 'translateY(-1px)'
                  },
                  transition: 'all 200ms ease'
                }}
              >
                Export Inventory
              </Button>
            </Box>
          </Box>
        </Box>

        {/* Inventory Tips */}
        <Box sx={{ mb: 3 }}>
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
            Inventory Tips
          </Typography>
          
          <Box sx={{ 
            backgroundColor: 'var(--surface-bg)',
            borderRadius: 2,
            border: '1px solid var(--border-color)',
            p: 2
          }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                <Typography variant="body2" sx={{ color: 'var(--accent-orange)', fontWeight: 600, minWidth: '20px' }}>
                  🛒
                </Typography>
                <Typography variant="body2" sx={{ color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                  Click the shopping cart icon on empty items to add them to your shopping list
                </Typography>
              </Box>
              
              <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                <Typography variant="body2" sx={{ color: 'var(--warning-color)', fontWeight: 600, minWidth: '20px' }}>
                  ⚠️
                </Typography>
                <Typography variant="body2" sx={{ color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                  Check expiry dates weekly to avoid food waste
                </Typography>
              </Box>
              
              <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                <Typography variant="body2" sx={{ color: 'var(--accent-green)', fontWeight: 600, minWidth: '20px' }}>
                  💡
                </Typography>
                <Typography variant="body2" sx={{ color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                  Use oldest items first (FIFO method)
                </Typography>
              </Box>
              
              <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                <Typography variant="body2" sx={{ color: 'var(--accent-blue)', fontWeight: 600, minWidth: '20px' }}>
                  📝
                </Typography>
                <Typography variant="body2" sx={{ color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                  Add notes for storage instructions
                </Typography>
              </Box>
            </Box>
          </Box>
        </Box>
      </Box>

      {/* Add Food Dialog */}
      <Dialog 
        open={openDialog} 
        onClose={handleCloseDialog}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            backgroundColor: 'var(--surface-bg)',
            border: '1px solid var(--border-color)',
            borderRadius: 2
          }
        }}
      >
        <DialogTitle sx={{ 
          color: 'var(--text-primary)',
          borderBottom: '1px solid var(--border-color)',
          pb: 2
        }}>
          Add New Food Item
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {/* Input Mode Toggle */}
            {!editingItem && (
              <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
                <Button
                  variant={inputMode === 'select' ? 'contained' : 'outlined'}
                  size="small"
                  onClick={() => setInputMode('select')}
                  sx={{
                    flex: 1,
                    backgroundColor: inputMode === 'select' ? 'var(--accent-blue)' : 'transparent',
                    borderColor: 'var(--accent-blue)',
                    color: inputMode === 'select' ? 'white' : 'var(--accent-blue)',
                    '&:hover': {
                      backgroundColor: inputMode === 'select' ? 'var(--accent-blue-dark)' : 'var(--accent-blue-light)',
                      borderColor: 'var(--accent-blue)',
                    }
                  }}
                >
                  Select from Database
                </Button>
                <Button
                  variant={inputMode === 'manual' ? 'contained' : 'outlined'}
                  size="small"
                  onClick={() => setInputMode('manual')}
                  sx={{
                    flex: 1,
                    backgroundColor: inputMode === 'manual' ? 'var(--accent-green)' : 'transparent',
                    borderColor: 'var(--accent-green)',
                    color: inputMode === 'manual' ? 'white' : 'var(--accent-green)',
                    '&:hover': {
                      backgroundColor: inputMode === 'manual' ? 'var(--accent-green-dark)' : 'var(--accent-green-light)',
                      borderColor: 'var(--accent-green)',
                    }
                  }}
                >
                  Manual Entry
                </Button>
              </Box>
            )}

            {/* Food Selection */}
            {inputMode === 'select' && !editingItem ? (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Autocomplete
                  options={Object.keys(foodDatabase).filter(name => !foodDatabase[name]?.metadata?.hidden)}
                  value={formData.foodName}
                  onChange={(_, newValue) => handleFoodSelect(newValue)}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Select Food from Database"
                      required
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          backgroundColor: 'var(--input-bg)',
                          '& fieldset': {
                            borderColor: 'var(--border-color)',
                          },
                          '&:hover fieldset': {
                            borderColor: 'var(--accent-blue)',
                          },
                          '&.Mui-focused fieldset': {
                            borderColor: 'var(--accent-blue)',
                          },
                        },
                        '& .MuiInputLabel-root': {
                          color: 'var(--text-secondary)',
                          '&.Mui-focused': {
                            color: 'var(--accent-blue)',
                          },
                        },
                        '& .MuiOutlinedInput-input': {
                          color: 'var(--text-primary)',
                        },
                      }}
                    />
                  )}
                  renderOption={(props, option) => {
                    const food = foodDatabase[option];
                    return (
                      <li {...props}>
                        <Box sx={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {option}
                          </Typography>
                          {food?.metadata?.category && (
                            <Typography variant="caption" sx={{ color: 'var(--text-secondary)' }}>
                              {food.metadata.category}
                            </Typography>
                          )}
                        </Box>
                      </li>
                    );
                  }}
                  loading={foodLoading}
                  loadingText="Loading foods..."
                  noOptionsText={foodError || "No foods found"}
                  sx={{
                    '& .MuiAutocomplete-popupIndicator': {
                      color: 'var(--text-secondary)',
                    },
                    '& .MuiAutocomplete-clearIndicator': {
                      color: 'var(--text-secondary)',
                    },
                  }}
                />

                {/* Show selected food info */}
                {formData.foodName && foodDatabase[formData.foodName] && (
                  <Box sx={{ 
                    p: 2, 
                    backgroundColor: 'var(--surface-bg)', 
                    borderRadius: 2,
                    border: '1px solid var(--border-color)'
                  }}>
                    <Typography variant="subtitle2" sx={{ mb: 1, color: 'var(--text-primary)' }}>
                      {formData.foodName} - Nutrition Info (per {formData.unit === 'units' ? 'unit' : '100g'})
                    </Typography>
                    <Stack direction="row" spacing={2} sx={{ flexWrap: 'wrap' }}>
                      <Typography variant="body2" sx={{ color: 'var(--text-secondary)' }}>
                        Protein: {foodDatabase[formData.foodName]?.protein || 0}g
                      </Typography>
                      <Typography variant="body2" sx={{ color: 'var(--text-secondary)' }}>
                        Fats: {foodDatabase[formData.foodName]?.fats || 0}g
                      </Typography>
                      <Typography variant="body2" sx={{ color: 'var(--text-secondary)' }}>
                        Carbs: {foodDatabase[formData.foodName]?.carbs || 0}g
                      </Typography>
                      <Typography variant="body2" sx={{ color: 'var(--text-secondary)' }}>
                        Calories: {foodDatabase[formData.foodName]?.calories || 0} kcal
                      </Typography>
                    </Stack>
                  </Box>
                )}
              </Box>
            ) : (
              /* Manual Food Name Entry */
              <TextField
                label="Food Name"
                value={formData.foodName}
                onChange={(e) => setFormData({ ...formData, foodName: e.target.value })}
                fullWidth
                required
                sx={{
                  '& .MuiOutlinedInput-root': {
                    backgroundColor: 'var(--input-bg)',
                    '& fieldset': {
                      borderColor: 'var(--border-color)',
                    },
                    '&:hover fieldset': {
                      borderColor: 'var(--accent-blue)',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: 'var(--accent-blue)',
                    },
                  },
                  '& .MuiInputLabel-root': {
                    color: 'var(--text-secondary)',
                    '&.Mui-focused': {
                      color: 'var(--accent-blue)',
                    },
                  },
                  '& .MuiOutlinedInput-input': {
                    color: 'var(--text-primary)',
                  },
                }}
              />
            )}

            <Divider sx={{ my: 1 }} />

            {/* Quantity and Unit */}
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                label="Quantity"
                type="number"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                fullWidth
                required
                inputProps={{ min: 0, step: 0.1 }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    backgroundColor: 'var(--input-bg)',
                    '& fieldset': {
                      borderColor: 'var(--border-color)',
                    },
                    '&:hover fieldset': {
                      borderColor: 'var(--accent-blue)',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: 'var(--accent-blue)',
                    },
                  },
                  '& .MuiInputLabel-root': {
                    color: 'var(--text-secondary)',
                    '&.Mui-focused': {
                      color: 'var(--accent-blue)',
                    },
                  },
                  '& .MuiOutlinedInput-input': {
                    color: 'var(--text-primary)',
                  },
                }}
              />
              
              <TextField
                label="Unit"
                value={formData.unit}
                onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                fullWidth
                required
                sx={{
                  '& .MuiOutlinedInput-root': {
                    backgroundColor: 'var(--input-bg)',
                    '& fieldset': {
                      borderColor: 'var(--border-color)',
                    },
                    '&:hover fieldset': {
                      borderColor: 'var(--accent-blue)',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: 'var(--accent-blue)',
                    },
                  },
                  '& .MuiInputLabel-root': {
                    color: 'var(--text-secondary)',
                    '&.Mui-focused': {
                      color: 'var(--accent-blue)',
                    },
                  },
                  '& .MuiOutlinedInput-input': {
                    color: 'var(--text-primary)',
                  },
                }}
              />
            </Box>
            
            <TextField
              label="Expiry Date"
              type="date"
              value={formData.expiryDate}
              onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
              fullWidth
              InputLabelProps={{
                shrink: true,
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  backgroundColor: 'var(--input-bg)',
                  '& fieldset': {
                    borderColor: 'var(--border-color)',
                  },
                  '&:hover fieldset': {
                    borderColor: 'var(--accent-blue)',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: 'var(--accent-blue)',
                  },
                },
                '& .MuiInputLabel-root': {
                  color: 'var(--text-secondary)',
                  '&.Mui-focused': {
                    color: 'var(--accent-blue)',
                  },
                },
                '& .MuiOutlinedInput-input': {
                  color: 'var(--text-primary)',
                },
              }}
            />
            
            <TextField
              label="Storage Location"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              fullWidth
              select
              sx={{
                '& .MuiOutlinedInput-root': {
                  backgroundColor: 'var(--input-bg)',
                  '& fieldset': {
                    borderColor: 'var(--border-color)',
                  },
                  '&:hover fieldset': {
                    borderColor: 'var(--accent-blue)',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: 'var(--accent-blue)',
                  },
                },
                '& .MuiInputLabel-root': {
                  color: 'var(--text-secondary)',
                  '&.Mui-focused': {
                    color: 'var(--accent-blue)',
                  },
                },
                '& .MuiOutlinedInput-input': {
                  color: 'var(--text-primary)',
                },
              }}
            >
              {STORAGE_LOCATIONS.map((location) => (
                <MenuItem key={location.value} value={location.value}>
                  {location.label}
                </MenuItem>
              ))}
            </TextField>
            
            <TextField
              label="Notes (Optional)"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              fullWidth
              multiline
              rows={3}
              sx={{
                '& .MuiOutlinedInput-root': {
                  backgroundColor: 'var(--input-bg)',
                  '& fieldset': {
                    borderColor: 'var(--border-color)',
                  },
                  '&:hover fieldset': {
                    borderColor: 'var(--accent-blue)',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: 'var(--accent-blue)',
                  },
                },
                '& .MuiInputLabel-root': {
                  color: 'var(--text-secondary)',
                  '&.Mui-focused': {
                    color: 'var(--accent-blue)',
                  },
                },
                '& .MuiOutlinedInput-input': {
                  color: 'var(--text-primary)',
                },
              }}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ 
          p: 3, 
          pt: 2,
          borderTop: '1px solid var(--border-color)',
          gap: 1
        }}>
          <Button 
            onClick={handleCloseDialog}
            sx={{ 
              color: 'var(--text-secondary)',
              '&:hover': {
                backgroundColor: 'var(--hover-bg)',
              }
            }}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSave}
            variant="contained"
            disabled={
              saving ||
              !formData.foodName.trim() || 
              !formData.quantity || 
              !formData.unit.trim() ||
              (inputMode === 'select' && !editingItem && !foodDatabase[formData.foodName])
            }
            sx={{
              backgroundColor: 'var(--accent-blue)',
              color: 'white',
              '&:hover': {
                backgroundColor: 'var(--accent-blue-dark)',
                transform: 'translateY(-1px)'
              },
              '&:disabled': {
                backgroundColor: 'var(--disabled-bg)',
                color: 'var(--text-disabled)',
              },
              transition: 'all 200ms ease'
            }}
          >
            {saving ? <CircularProgress size={20} sx={{ color: 'white' }} /> : 'Add Item'}
          </Button>
        </DialogActions>
      </Dialog>
      </Box>
    </Box>
  );
};

export default FoodInventory;
