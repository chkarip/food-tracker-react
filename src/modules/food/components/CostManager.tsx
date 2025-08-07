import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
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
  Alert,
  InputAdornment
} from '@mui/material';
import {
  Euro as EuroIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  ArrowUpward as ArrowUpwardIcon,
  ArrowDownward as ArrowDownwardIcon
} from '@mui/icons-material';
import { formatCost, COST_DATABASE, calculatePortionCost } from '../../../data/costDatabase';
import { FOOD_DATABASE } from '../../../data/foodDatabase';

interface CostEntry {
  id: string;
  foodName: string;
  costPerKg: number;
  unit: 'kg' | 'unit';
  supplier?: string;
  dateUpdated: string;
  notes?: string;
}

interface CostManagerProps {
  // Props for parent communication if needed
}

type SortField = 'foodName' | 'costPer100gOrUnit' | 'costPerKg' | 'costPerGramProtein' | 'costPerGramCarbs' | 'costPerGramFats';
type SortDirection = 'asc' | 'desc';

interface FoodAnalysisRow {
  foodName: string;
  foodData: any;
  costInfo: any;
  costPer100gOrUnit: number;
  costPerKg: number;
  costPerGramProtein: number | null;
  costPerGramCarbs: number | null;
  costPerGramFats: number | null;
  isUnitFood: boolean;
}

const CostManager: React.FC<CostManagerProps> = () => {
  const [costs, setCosts] = useState<CostEntry[]>([]);
  const [editingCost, setEditingCost] = useState<CostEntry | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Sorting state for food database table
  const [sortField, setSortField] = useState<SortField>('foodName');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  // Form state
  const [formData, setFormData] = useState<Partial<CostEntry>>({
    foodName: '',
    costPerKg: 0,
    unit: 'kg',
    supplier: '',
    notes: ''
  });

  // Load costs from localStorage (can be replaced with Firebase later)
  useEffect(() => {
    loadCosts();
  }, []);

  const loadCosts = () => {
    try {
      const savedCosts = localStorage.getItem('foodCosts');
      if (savedCosts) {
        setCosts(JSON.parse(savedCosts));
      }
    } catch (error) {
      console.error('Error loading costs:', error);
    }
  };

  const saveCosts = (newCosts: CostEntry[]) => {
    try {
      localStorage.setItem('foodCosts', JSON.stringify(newCosts));
      setCosts(newCosts);
    } catch (error) {
      console.error('Error saving costs:', error);
    }
  };

  const handleSave = () => {
    if (!formData.foodName || !formData.costPerKg) {
      return;
    }

    const newCost: CostEntry = {
      id: editingCost?.id || Date.now().toString(),
      foodName: formData.foodName,
      costPerKg: formData.costPerKg,
      unit: formData.unit || 'kg',
      supplier: formData.supplier || '',
      dateUpdated: new Date().toISOString().split('T')[0],
      notes: formData.notes || ''
    };

    let newCosts;
    if (editingCost) {
      // Update existing
      newCosts = costs.map(cost => cost.id === editingCost.id ? newCost : cost);
    } else {
      // Add new
      newCosts = [...costs, newCost];
    }

    saveCosts(newCosts);
    handleCloseDialog();
  };

  const handleEdit = (cost: CostEntry) => {
    setEditingCost(cost);
    setFormData({
      foodName: cost.foodName,
      costPerKg: cost.costPerKg,
      unit: cost.unit,
      supplier: cost.supplier,
      notes: cost.notes
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    const newCosts = costs.filter(cost => cost.id !== id);
    saveCosts(newCosts);
  };

  const handleAdd = () => {
    setEditingCost(null);
    setFormData({
      foodName: '',
      costPerKg: 0,
      unit: 'kg',
      supplier: '',
      notes: ''
    });
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingCost(null);
    setFormData({});
  };

  // Sorting functions
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      // Toggle direction if same field
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // New field, default to ascending
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return null;
    return sortDirection === 'asc' ? <ArrowUpwardIcon fontSize="small" /> : <ArrowDownwardIcon fontSize="small" />;
  };

  // Prepare and sort food data
  const getFoodAnalysisData = (): FoodAnalysisRow[] => {
    const rows: FoodAnalysisRow[] = Object.entries(FOOD_DATABASE).map(([foodName, foodData]) => {
      const costInfo = COST_DATABASE[foodName];
      if (!costInfo) return null;

      // Calculate costs
      const isUnitFood = foodData.isUnitFood;
      let costPer100gOrUnit: number;
      let costPerKg: number;
      
      if (isUnitFood) {
        costPer100gOrUnit = costInfo.costPerKg; // This is actually cost per unit
        costPerKg = costInfo.costPerKg; // Same for unit foods
      } else {
        costPer100gOrUnit = (costInfo.costPerKg / 1000) * 100; // €/100g
        costPerKg = costInfo.costPerKg; // €/kg
      }

      // Calculate nutritional efficiency
      const nutrition = foodData.nutrition;
      let costPerGramProtein: number | null = null;
      let costPerGramCarbs: number | null = null;
      let costPerGramFats: number | null = null;

      if (nutrition.protein > 0) {
        costPerGramProtein = costPer100gOrUnit / nutrition.protein;
      }
      if (nutrition.carbs > 0) {
        costPerGramCarbs = costPer100gOrUnit / nutrition.carbs;
      }
      if (nutrition.fats > 0) {
        costPerGramFats = costPer100gOrUnit / nutrition.fats;
      }

      return {
        foodName,
        foodData,
        costInfo,
        costPer100gOrUnit,
        costPerKg,
        costPerGramProtein,
        costPerGramCarbs,
        costPerGramFats,
        isUnitFood
      };
    }).filter(Boolean) as FoodAnalysisRow[];

    // Sort the data
    return rows.sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortField) {
        case 'foodName':
          aValue = a.foodName.toLowerCase();
          bValue = b.foodName.toLowerCase();
          break;
        case 'costPer100gOrUnit':
          aValue = a.costPer100gOrUnit;
          bValue = b.costPer100gOrUnit;
          break;
        case 'costPerKg':
          aValue = a.costPerKg;
          bValue = b.costPerKg;
          break;
        case 'costPerGramProtein':
          aValue = a.costPerGramProtein ?? Infinity; // Null values go to end
          bValue = b.costPerGramProtein ?? Infinity;
          break;
        case 'costPerGramCarbs':
          aValue = a.costPerGramCarbs ?? Infinity;
          bValue = b.costPerGramCarbs ?? Infinity;
          break;
        case 'costPerGramFats':
          aValue = a.costPerGramFats ?? Infinity;
          bValue = b.costPerGramFats ?? Infinity;
          break;
        default:
          return 0;
      }

      if (sortDirection === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });
  };

  // Filter costs based on search term
  const filteredCosts = costs.filter(cost =>
    cost.foodName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (cost.supplier && cost.supplier.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Calculate statistics
  const totalItems = costs.length;
  const averageCost = costs.length > 0 
    ? costs.reduce((sum, cost) => sum + cost.costPerKg, 0) / costs.length 
    : 0;
  const mostExpensive = costs.length > 0 
    ? costs.reduce((max, cost) => cost.costPerKg > max.costPerKg ? cost : max, costs[0])
    : null;
  const cheapest = costs.length > 0
    ? costs.reduce((min, cost) => cost.costPerKg < min.costPerKg ? cost : min, costs[0])
    : null;

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <EuroIcon />
        Cost Management
      </Typography>

      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Manage food costs, track price changes, and monitor your budget efficiency.
      </Typography>

      {/* Statistics Cards */}
      <Box sx={{ 
        display: 'grid', 
        gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' },
        gap: 2, 
        mb: 3 
      }}>
        <Card>
          <CardContent sx={{ textAlign: 'center' }}>
            <Typography variant="h4" color="primary.main">
              {totalItems}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Total Items
            </Typography>
          </CardContent>
        </Card>
        <Card>
          <CardContent sx={{ textAlign: 'center' }}>
            <Typography variant="h4" color="info.main">
              {formatCost(averageCost)}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Average Cost/kg
            </Typography>
          </CardContent>
        </Card>
        <Card>
          <CardContent sx={{ textAlign: 'center' }}>
            <Typography variant="h6" color="error.main" sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
              <TrendingUpIcon fontSize="small" />
              {mostExpensive ? formatCost(mostExpensive.costPerKg) : '-'}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Most Expensive
            </Typography>
            {mostExpensive && (
              <Typography variant="caption" display="block" color="text.secondary">
                {mostExpensive.foodName}
              </Typography>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardContent sx={{ textAlign: 'center' }}>
            <Typography variant="h6" color="success.main" sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
              <TrendingDownIcon fontSize="small" />
              {cheapest ? formatCost(cheapest.costPerKg) : '-'}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Cheapest
            </Typography>
            {cheapest && (
              <Typography variant="caption" display="block" color="text.secondary">
                {cheapest.foodName}
              </Typography>
            )}
          </CardContent>
        </Card>
      </Box>

      {/* Controls */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3, alignItems: 'center' }}>
        <TextField
          label="Search foods or suppliers"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          sx={{ flex: 1 }}
          size="small"
        />
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleAdd}
        >
          Add Cost Entry
        </Button>
      </Box>

      {/* Costs Table */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Cost Database ({filteredCosts.length} items)
          </Typography>
          
          {filteredCosts.length === 0 ? (
            <Alert severity="info" sx={{ mt: 2 }}>
              No cost entries found. Add some cost data to get started.
            </Alert>
          ) : (
            <TableContainer component={Paper} sx={{ mt: 2 }}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Food Name</TableCell>
                    <TableCell>Cost</TableCell>
                    <TableCell>Unit</TableCell>
                    <TableCell>Supplier</TableCell>
                    <TableCell>Last Updated</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredCosts.map((cost) => (
                    <TableRow key={cost.id}>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          {cost.foodName}
                        </Typography>
                        {cost.notes && (
                          <Typography variant="caption" color="text.secondary" display="block">
                            {cost.notes}
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 600, color: 'primary.main' }}>
                          {formatCost(cost.costPerKg)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={cost.unit === 'kg' ? '/ kg' : '/ unit'} 
                          size="small" 
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {cost.supplier || '-'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary">
                          {cost.dateUpdated}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <IconButton 
                          size="small" 
                          onClick={() => handleEdit(cost)}
                          color="primary"
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                        <IconButton 
                          size="small" 
                          onClick={() => handleDelete(cost.id)}
                          color="error"
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>

      {/* Food Database Analysis */}
      <Card sx={{ mt: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Complete Food Database Analysis
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            All available foods with cost breakdown and nutritional efficiency metrics
          </Typography>
          
          <TableContainer component={Paper}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell 
                    sx={{ fontWeight: 'bold', cursor: 'pointer', userSelect: 'none' }}
                    onClick={() => handleSort('foodName')}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      Food Name
                      {getSortIcon('foodName')}
                    </Box>
                  </TableCell>
                  <TableCell 
                    sx={{ fontWeight: 'bold', cursor: 'pointer', userSelect: 'none' }} 
                    align="right"
                    onClick={() => handleSort('costPer100gOrUnit')}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 0.5 }}>
                      Cost/100g or Unit
                      {getSortIcon('costPer100gOrUnit')}
                    </Box>
                  </TableCell>
                  <TableCell 
                    sx={{ fontWeight: 'bold', cursor: 'pointer', userSelect: 'none' }} 
                    align="right"
                    onClick={() => handleSort('costPerKg')}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 0.5 }}>
                      Cost/kg
                      {getSortIcon('costPerKg')}
                    </Box>
                  </TableCell>
                  <TableCell 
                    sx={{ fontWeight: 'bold', cursor: 'pointer', userSelect: 'none' }} 
                    align="right"
                    onClick={() => handleSort('costPerGramProtein')}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 0.5 }}>
                      €/g Protein
                      {getSortIcon('costPerGramProtein')}
                    </Box>
                  </TableCell>
                  <TableCell 
                    sx={{ fontWeight: 'bold', cursor: 'pointer', userSelect: 'none' }} 
                    align="right"
                    onClick={() => handleSort('costPerGramCarbs')}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 0.5 }}>
                      €/g Carbs
                      {getSortIcon('costPerGramCarbs')}
                    </Box>
                  </TableCell>
                  <TableCell 
                    sx={{ fontWeight: 'bold', cursor: 'pointer', userSelect: 'none' }} 
                    align="right"
                    onClick={() => handleSort('costPerGramFats')}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 0.5 }}>
                      €/g Fats
                      {getSortIcon('costPerGramFats')}
                    </Box>
                  </TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Unit Type</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {getFoodAnalysisData().map((row) => (
                  <TableRow key={row.foodName}>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {row.foodName}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        P: {row.foodData.nutrition.protein}g | C: {row.foodData.nutrition.carbs}g | F: {row.foodData.nutrition.fats}g
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {formatCost(row.costPer100gOrUnit)}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2">
                        {row.isUnitFood ? formatCost(row.costPerKg) + '/unit' : formatCost(row.costPerKg)}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography 
                        variant="body2" 
                        color={row.costPerGramProtein && row.costPerGramProtein < 0.1 ? 'success.main' : 'text.primary'}
                      >
                        {row.costPerGramProtein ? formatCost(row.costPerGramProtein, 3) : '-'}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography 
                        variant="body2"
                        color={row.costPerGramCarbs && row.costPerGramCarbs < 0.05 ? 'success.main' : 'text.primary'}
                      >
                        {row.costPerGramCarbs ? formatCost(row.costPerGramCarbs, 3) : '-'}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography 
                        variant="body2"
                        color={row.costPerGramFats && row.costPerGramFats < 0.2 ? 'success.main' : 'text.primary'}
                      >
                        {row.costPerGramFats ? formatCost(row.costPerGramFats, 3) : '-'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={row.isUnitFood ? 'per unit' : 'per 100g'} 
                        size="small" 
                        variant="outlined"
                        color={row.isUnitFood ? 'secondary' : 'primary'}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          
          <Box sx={{ mt: 2, p: 2, bgcolor: 'background.paper', borderRadius: 1, border: '1px solid', borderColor: 'divider' }}>
            <Typography variant="caption" color="text.secondary">
              <strong>Legend:</strong><br/>
              • <strong>Cost/100g or Unit:</strong> Base cost for comparison<br/>
              • <strong>Cost/kg:</strong> Standardized cost per kilogram (or per unit for unit foods)<br/>
              • <strong>€/g Protein/Carbs/Fats:</strong> Cost efficiency - lower is better<br/>
              • <strong>Green values:</strong> Highly cost-efficient for that macro<br/>
              • <strong>Unit foods:</strong> Eggs, Tortilla wrap, Canned tuna (measured individually)
            </Typography>
          </Box>
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingCost ? 'Edit Cost Entry' : 'Add Cost Entry'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField
              label="Food Name"
              value={formData.foodName || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, foodName: e.target.value }))}
              fullWidth
              required
            />
            <TextField
              label="Cost"
              type="number"
              value={formData.costPerKg || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, costPerKg: Number(e.target.value) }))}
              InputProps={{
                startAdornment: <InputAdornment position="start">€</InputAdornment>,
              }}
              fullWidth
              required
            />
            <TextField
              label="Unit Type"
              select
              value={formData.unit || 'kg'}
              onChange={(e) => setFormData(prev => ({ ...prev, unit: e.target.value as 'kg' | 'unit' }))}
              SelectProps={{ native: true }}
              fullWidth
            >
              <option value="kg">Per Kilogram</option>
              <option value="unit">Per Unit</option>
            </TextField>
            <TextField
              label="Supplier (Optional)"
              value={formData.supplier || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, supplier: e.target.value }))}
              fullWidth
            />
            <TextField
              label="Notes (Optional)"
              value={formData.notes || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              multiline
              rows={2}
              fullWidth
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>
            Cancel
          </Button>
          <Button 
            onClick={handleSave} 
            variant="contained"
            disabled={!formData.foodName || !formData.costPerKg}
          >
            {editingCost ? 'Update' : 'Add'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CostManager;
