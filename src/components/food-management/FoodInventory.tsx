import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Alert,
  Stack,
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
  Tooltip
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Kitchen as InventoryIcon,
  ShoppingCart as ShoppingIcon,
  CheckCircle as FreshIcon,
  Warning as LowIcon,
  Error as EmptyIcon
} from '@mui/icons-material';

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
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [formData, setFormData] = useState({
    foodName: '',
    quantity: '',
    unit: 'g',
    expiryDate: '',
    location: 'pantry',
    notes: ''
  });
  const [success, setSuccess] = useState<string | null>(null);

  // Load inventory from localStorage on mount
  useEffect(() => {
    const savedInventory = localStorage.getItem('foodInventory');
    if (savedInventory) {
      try {
        const parsed = JSON.parse(savedInventory);
        setInventory(parsed);
      } catch (error) {
        console.error('Error loading inventory:', error);
      }
    }
  }, []);

  // Save inventory to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('foodInventory', JSON.stringify(inventory));
  }, [inventory]);

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

  const handleOpenDialog = (item?: InventoryItem) => {
    if (item) {
      setEditingItem(item);
      setFormData({
        foodName: item.foodName,
        quantity: item.quantity.toString(),
        unit: item.unit,
        expiryDate: item.expiryDate || '',
        location: item.location,
        notes: item.notes || ''
      });
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
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingItem(null);
    setSuccess(null);
  };

  const handleSave = () => {
    if (!formData.foodName || !formData.quantity) {
      return;
    }

    const quantity = parseFloat(formData.quantity);
    const status = calculateStatus(quantity);

    const itemData: InventoryItem = {
      id: editingItem?.id || `item_${Date.now()}`,
      foodName: formData.foodName,
      quantity,
      unit: formData.unit,
      expiryDate: formData.expiryDate || undefined,
      location: formData.location,
      status,
      lastUpdated: new Date().toISOString(),
      notes: formData.notes || undefined
    };

    if (editingItem) {
      setInventory(prev => prev.map(item => 
        item.id === editingItem.id ? itemData : item
      ));
      setSuccess('✅ Inventory item updated successfully!');
    } else {
      setInventory(prev => [...prev, itemData]);
      setSuccess('✅ New inventory item added successfully!');
    }

    setTimeout(() => setSuccess(null), 3000);
    handleCloseDialog();
  };

  const handleDelete = (id: string) => {
    setInventory(prev => prev.filter(item => item.id !== id));
    setSuccess('🗑️ Inventory item deleted successfully!');
    setTimeout(() => setSuccess(null), 3000);
  };

  const getLocationInfo = (location: string) => {
    return STORAGE_LOCATIONS.find(loc => loc.value === location) || STORAGE_LOCATIONS[2];
  };

  const groupedInventory = STORAGE_LOCATIONS.reduce((acc, location) => {
    acc[location.value] = inventory.filter(item => item.location === location.value);
    return acc;
  }, {} as Record<string, InventoryItem[]>);

  return (
    <Box>
      <Card sx={{ mb: 3, borderRadius: 4 }}>
        <CardContent sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <InventoryIcon />
              Food Inventory Manager
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => handleOpenDialog()}
              size="large"
            >
              Add Item
            </Button>
          </Box>

          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Track what you have in your kitchen. Monitor quantities, expiry dates, and storage locations.
          </Typography>

          {success && <Alert severity="success" sx={{ mb: 3 }}>{success}</Alert>}

          {/* Inventory Summary */}
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 4 }}>
            <Paper sx={{ p: 2, minWidth: '150px', flex: 1, textAlign: 'center' }}>
              <Typography variant="h4" color="primary.main">
                {inventory.length}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Total Items
              </Typography>
            </Paper>
            <Paper sx={{ p: 2, minWidth: '150px', flex: 1, textAlign: 'center' }}>
              <Typography variant="h4" color="warning.main">
                {inventory.filter(item => item.status === 'low').length}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Running Low
              </Typography>
            </Paper>
            <Paper sx={{ p: 2, minWidth: '150px', flex: 1, textAlign: 'center' }}>
              <Typography variant="h4" color="error.main">
                {inventory.filter(item => isExpiringSoon(item.expiryDate)).length}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Expiring Soon
              </Typography>
            </Paper>
            <Paper sx={{ p: 2, minWidth: '150px', flex: 1, textAlign: 'center' }}>
              <Typography variant="h4" color="error.main">
                {inventory.filter(item => item.status === 'empty').length}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Out of Stock
              </Typography>
            </Paper>
          </Box>

          {/* Inventory by Location */}
          <Stack spacing={3}>
            {STORAGE_LOCATIONS.map(location => {
              const items = groupedInventory[location.value];
              if (items.length === 0) return null;

              return (
                <Box key={location.value}>
                  <Typography variant="h6" sx={{ mb: 2, color: location.color }}>
                    {location.label} ({items.length} items)
                  </Typography>
                  <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell>Food</TableCell>
                          <TableCell>Quantity</TableCell>
                          <TableCell>Status</TableCell>
                          <TableCell>Expiry Date</TableCell>
                          <TableCell>Notes</TableCell>
                          <TableCell>Actions</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {items.map(item => (
                          <TableRow key={item.id}>
                            <TableCell>
                              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                {item.foodName}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2">
                                {item.quantity} {item.unit}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Chip
                                icon={getStatusIcon(item.status)}
                                label={item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                                color={getStatusColor(item.status) as any}
                                size="small"
                              />
                            </TableCell>
                            <TableCell>
                              {item.expiryDate ? (
                                <Typography 
                                  variant="body2" 
                                  color={isExpiringSoon(item.expiryDate) ? 'error.main' : 'text.primary'}
                                  sx={{ fontWeight: isExpiringSoon(item.expiryDate) ? 600 : 400 }}
                                >
                                  {new Date(item.expiryDate).toLocaleDateString()}
                                  {isExpiringSoon(item.expiryDate) && ' ⚠️'}
                                </Typography>
                              ) : (
                                <Typography variant="body2" color="text.secondary">
                                  No expiry
                                </Typography>
                              )}
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2" color="text.secondary">
                                {item.notes || '-'}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Box sx={{ display: 'flex', gap: 1 }}>
                                <Tooltip title="Edit item">
                                  <IconButton
                                    size="small"
                                    onClick={() => handleOpenDialog(item)}
                                  >
                                    <EditIcon />
                                  </IconButton>
                                </Tooltip>
                                <Tooltip title="Delete item">
                                  <IconButton
                                    size="small"
                                    onClick={() => handleDelete(item.id)}
                                    color="error"
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
          </Stack>

          {inventory.length === 0 && (
            <Box sx={{ textAlign: 'center', py: 6 }}>
              <ShoppingIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                Your inventory is empty
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Start by adding the food items you have at home
              </Typography>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => handleOpenDialog()}
              >
                Add Your First Item
              </Button>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingItem ? 'Edit Inventory Item' : 'Add New Inventory Item'}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 1 }}>
            <TextField
              label="Food Name"
              value={formData.foodName}
              onChange={(e) => setFormData(prev => ({ ...prev, foodName: e.target.value }))}
              fullWidth
              required
            />
            
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                label="Quantity"
                type="number"
                value={formData.quantity}
                onChange={(e) => setFormData(prev => ({ ...prev, quantity: e.target.value }))}
                required
                sx={{ flex: 2 }}
                inputProps={{ min: 0, step: 0.1 }}
              />
              <TextField
                label="Unit"
                select
                value={formData.unit}
                onChange={(e) => setFormData(prev => ({ ...prev, unit: e.target.value }))}
                sx={{ flex: 1 }}
                SelectProps={{ native: true }}
              >
                <option value="g">grams</option>
                <option value="kg">kg</option>
                <option value="ml">ml</option>
                <option value="L">liters</option>
                <option value="pieces">pieces</option>
                <option value="cans">cans</option>
                <option value="packs">packs</option>
              </TextField>
            </Box>

            <TextField
              label="Storage Location"
              select
              value={formData.location}
              onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
              fullWidth
              SelectProps={{ native: true }}
            >
              {STORAGE_LOCATIONS.map(location => (
                <option key={location.value} value={location.value}>
                  {location.label}
                </option>
              ))}
            </TextField>

            <TextField
              label="Expiry Date"
              type="date"
              value={formData.expiryDate}
              onChange={(e) => setFormData(prev => ({ ...prev, expiryDate: e.target.value }))}
              fullWidth
              InputLabelProps={{ shrink: true }}
            />

            <TextField
              label="Notes"
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              fullWidth
              multiline
              rows={2}
              placeholder="Any additional notes..."
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button
            onClick={handleSave}
            variant="contained"
            disabled={!formData.foodName || !formData.quantity}
          >
            {editingItem ? 'Update' : 'Add'} Item
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default FoodInventory;
