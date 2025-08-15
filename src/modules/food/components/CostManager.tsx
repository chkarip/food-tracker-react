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
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  ArrowUpward as ArrowUpwardIcon,
  ArrowDownward as ArrowDownwardIcon
} from '@mui/icons-material';

import { useFoodDatabase } from '../../../contexts/FoodContext';
import { formatCost } from '../../../services/firebase/nutrition/foodService';

/* ------------------------------------------------------------------ */
/*  TYPES                                                             */
/* ------------------------------------------------------------------ */

interface CostEntry {
  id: string;
  foodName: string;
  costPerKg: number;
  unit: 'kg' | 'unit';
  supplier?: string;
  dateUpdated: string;
  notes?: string;
}

type SortField =
  | 'foodName'
  | 'costPer100gOrUnit'
  | 'costPerKg'
  | 'costPerGramProtein'
  | 'costPerGramCarbs'
  | 'costPerGramFats';

type SortDirection = 'asc' | 'desc';

interface FoodAnalysisRow {
  foodName: string;
  foodData: any;
  costInfo: { costPerKg: number };
  costPer100gOrUnit: number;
  costPerKg: number;
  costPerGramProtein: number | null;
  costPerGramCarbs: number | null;
  costPerGramFats: number | null;
  isUnitFood: boolean;
}

/* ------------------------------------------------------------------ */
/*  COMPONENT                                                         */
/* ------------------------------------------------------------------ */

const CostManager: React.FC = () => {
  /* ---------- context ---------- */
  const { foodDatabase } = useFoodDatabase();

  /* ---------- local state ---------- */
  const [costs, setCosts] = useState<CostEntry[]>([]);
  const [editingCost, setEditingCost] = useState<CostEntry | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const [sortField, setSortField] = useState<SortField>('foodName');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  const [formData, setFormData] = useState<Partial<CostEntry>>({
    foodName: '',
    costPerKg: 0,
    unit: 'kg',
    supplier: '',
    notes: ''
  });

  /* ---------- persistence ---------- */
  useEffect(() => {
    try {
      const saved = localStorage.getItem('foodCosts');
      if (saved) setCosts(JSON.parse(saved));
    } catch (err) {
      console.error('Failed to load costs', err);
    }
  }, []);

  const saveCosts = (newCosts: CostEntry[]) => {
    try {
      localStorage.setItem('foodCosts', JSON.stringify(newCosts));
      setCosts(newCosts);
    } catch (err) {
      console.error('Failed to save costs', err);
    }
  };

  /* ---------- CRUD handlers ---------- */
  const handleSave = () => {
    if (!formData.foodName || !formData.costPerKg) return;

    const entry: CostEntry = {
      id: editingCost?.id ?? Date.now().toString(),
      foodName: formData.foodName,
      costPerKg: formData.costPerKg,
      unit: formData.unit ?? 'kg',
      supplier: formData.supplier ?? '',
      dateUpdated: new Date().toISOString().split('T')[0],
      notes: formData.notes ?? ''
    };

    const updated = editingCost
      ? costs.map(c => (c.id === editingCost.id ? entry : c))
      : [...costs, entry];

    saveCosts(updated);
    handleCloseDialog();
  };

  const handleEdit = (c: CostEntry) => {
    setEditingCost(c);
    setFormData({ ...c });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    saveCosts(costs.filter(c => c.id !== id));
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

  /* ---------- sorting ---------- */
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getSortIcon = (field: SortField) =>
    sortField === field ? (sortDirection === 'asc' ? <ArrowUpwardIcon /> : <ArrowDownwardIcon />) : null;

  /* ---------- derived data ---------- */
  const filteredCosts = costs.filter(
    c =>
      c.foodName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.supplier && c.supplier.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const stats = {
    total: costs.length,
    average: costs.length ? costs.reduce((s, c) => s + c.costPerKg, 0) / costs.length : 0,
    most: costs.reduce<CostEntry | null>((max, c) => (!max || c.costPerKg > max.costPerKg ? c : max), null),
    least: costs.reduce<CostEntry | null>((min, c) => (!min || c.costPerKg < min.costPerKg ? c : min), null)
  };

  /* ---------- analysis table ---------- */
  const getFoodAnalysis = (): FoodAnalysisRow[] =>
    Object.entries(foodDatabase)
      .map(([name, data]) => {
        const cost = (data as any).cost;
        if (!cost?.costPerKg) return null;

        const isUnit = (data as any).isUnitFood;
        const costPer100gOrUnit = isUnit ? cost.costPerKg : (cost.costPerKg / 1000) * 100;

        const n = (data as any).nutrition;
        return {
          foodName: name,
          foodData: data,
          costInfo: cost,
          costPer100gOrUnit,
          costPerKg: cost.costPerKg,
          costPerGramProtein: n.protein ? costPer100gOrUnit / n.protein : null,
          costPerGramCarbs: n.carbs ? costPer100gOrUnit / n.carbs : null,
          costPerGramFats: n.fats ? costPer100gOrUnit / n.fats : null,
          isUnitFood: isUnit
        };
      })
      .filter((row): row is FoodAnalysisRow => row !== null)
      .sort((a, b) => {
        const val = (r: FoodAnalysisRow) => {
          switch (sortField) {
            case 'foodName':
              return r.foodName.toLowerCase();
            case 'costPer100gOrUnit':
              return r.costPer100gOrUnit;
            case 'costPerKg':
              return r.costPerKg;
            case 'costPerGramProtein':
              return r.costPerGramProtein ?? Infinity;
            case 'costPerGramCarbs':
              return r.costPerGramCarbs ?? Infinity;
            case 'costPerGramFats':
              return r.costPerGramFats ?? Infinity;
            default:
              return 0;
          }
        };
        const aVal = val(a);
        const bVal = val(b);
        if (aVal === bVal) return 0;
        return sortDirection === 'asc' ? (aVal < bVal ? -1 : 1) : (aVal > bVal ? -1 : 1);
      });

  /* ------------------------------------------------------------------ */
  /*  RENDER                                                            */
  /* ------------------------------------------------------------------ */

  return (
    <Box sx={{ maxWidth: 1400, mx: 'auto', p: 3 }}>
      {/* Header */}
      <Typography variant="h4" gutterBottom>
        Cost Management
      </Typography>
      <Typography color="text.secondary" paragraph>
        Manage food costs, track price changes and monitor budget efficiency.
      </Typography>

      {/* Stats */}
      <Box display="flex" flexWrap="wrap" gap={2} mb={4}>
        {[
          { label: 'Total Items', value: stats.total },
          { label: 'Average Cost/kg', value: formatCost(stats.average) },
          {
            label: 'Most Expensive',
            value: stats.most ? formatCost(stats.most.costPerKg) : '-',
            extra: stats.most?.foodName
          },
          {
            label: 'Cheapest',
            value: stats.least ? formatCost(stats.least.costPerKg) : '-',
            extra: stats.least?.foodName
          }
        ].map(card => (
          <Card sx={{ minWidth: 200 }} key={card.label}>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h4">{card.value}</Typography>
              <Typography variant="body2">{card.label}</Typography>
              {card.extra && <Chip label={card.extra} size="small" sx={{ mt: 1 }} />}
            </CardContent>
          </Card>
        ))}
      </Box>

      {/* Controls */}
      <Box display="flex" gap={2} mb={3}>
        <TextField
          label="Search foods or suppliers"
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          size="small"
          sx={{ flex: 1 }}
        />
        <Button variant="contained" startIcon={<AddIcon />} onClick={handleAdd}>
          Add Cost Entry
        </Button>
      </Box>

      {/* Costs List */}
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Cost Database ({filteredCosts.length})
          </Typography>
          {filteredCosts.length === 0 ? (
            <Alert severity="info">No cost entries found.</Alert>
          ) : (
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Food</TableCell>
                    <TableCell>Cost</TableCell>
                    <TableCell>Unit</TableCell>
                    <TableCell>Supplier</TableCell>
                    <TableCell>Updated</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredCosts.map(c => (
                    <TableRow key={c.id}>
                      <TableCell>
                        <Typography fontWeight="medium">{c.foodName}</Typography>
                        {c.notes && (
                          <Typography variant="caption" color="text.secondary">
                            {c.notes}
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>{formatCost(c.costPerKg)}</TableCell>
                      <TableCell>
                        <Chip label={c.unit} size="small" />
                      </TableCell>
                      <TableCell>{c.supplier || '-'}</TableCell>
                      <TableCell>{c.dateUpdated}</TableCell>
                      <TableCell align="right">
                        <IconButton onClick={() => handleEdit(c)} color="primary">
                          <EditIcon />
                        </IconButton>
                        <IconButton onClick={() => handleDelete(c.id)} color="error">
                          <DeleteIcon />
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

      {/* Analysis */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Complete Food Database Analysis
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            Cost breakdown and nutritional efficiency metrics for every food.
          </Typography>

          <TableContainer component={Paper}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  {(
                    [
                      'foodName',
                      'costPer100gOrUnit',
                      'costPerKg',
                      'costPerGramProtein',
                      'costPerGramCarbs',
                      'costPerGramFats'
                    ] as SortField[]
                  ).map(field => (
                    <TableCell
                      key={field}
                      onClick={() => handleSort(field)}
                      sx={{ cursor: 'pointer', userSelect: 'none' }}
                    >
                      <Box display="flex" alignItems="center">
                        {field === 'foodName'
                          ? 'Food'
                          : field === 'costPer100gOrUnit'
                          ? 'Cost/100g or Unit'
                          : field === 'costPerKg'
                          ? 'Cost/kg'
                          : field === 'costPerGramProtein'
                          ? '€/g Protein'
                          : field === 'costPerGramCarbs'
                          ? '€/g Carbs'
                          : '€/g Fats'}
                        {getSortIcon(field)}
                      </Box>
                    </TableCell>
                  ))}
                  <TableCell>Unit Type</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {getFoodAnalysis().map(row => (
                  <TableRow key={row.foodName}>
                    <TableCell>{row.foodName}</TableCell>
                    <TableCell>{formatCost(row.costPer100gOrUnit)}</TableCell>
                    <TableCell>
                      {row.isUnitFood
                        ? `${formatCost(row.costPerKg)}/unit`
                        : formatCost(row.costPerKg)}
                    </TableCell>
                    <TableCell>
                      {row.costPerGramProtein ? formatCost(row.costPerGramProtein, 3) : '-'}
                    </TableCell>
                    <TableCell>
                      {row.costPerGramCarbs ? formatCost(row.costPerGramCarbs, 3) : '-'}
                    </TableCell>
                    <TableCell>
                      {row.costPerGramFats ? formatCost(row.costPerGramFats, 3) : '-'}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={row.isUnitFood ? 'Unit' : 'Weight'}
                        size="small"
                        color={row.isUnitFood ? 'primary' : 'default'}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>{editingCost ? 'Edit Cost Entry' : 'Add Cost Entry'}</DialogTitle>
        <DialogContent>
          <Box display="flex" flexDirection="column" gap={2} pt={1}>
            <TextField
              label="Food Name"
              value={formData.foodName ?? ''}
              onChange={e => setFormData(prev => ({ ...prev, foodName: e.target.value }))}
              fullWidth
              required
            />
            <TextField
              label="Cost"
              type="number"
              value={formData.costPerKg ?? 0}
              onChange={e => setFormData(prev => ({ ...prev, costPerKg: +e.target.value }))}
              InputProps={{ startAdornment: <InputAdornment position="start">€</InputAdornment> }}
              fullWidth
              required
            />
            <TextField
              label="Unit"
              select
              value={formData.unit ?? 'kg'}
              onChange={e => setFormData(prev => ({ ...prev, unit: e.target.value as 'kg' | 'unit' }))}
              SelectProps={{ native: true }}
              fullWidth
            >
              <option value="kg">Per Kilogram</option>
              <option value="unit">Per Unit</option>
            </TextField>
            <TextField
              label="Supplier"
              value={formData.supplier ?? ''}
              onChange={e => setFormData(prev => ({ ...prev, supplier: e.target.value }))}
              fullWidth
            />
            <TextField
              label="Notes"
              value={formData.notes ?? ''}
              onChange={e => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              multiline
              rows={2}
              fullWidth
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSave} variant="contained">
            {editingCost ? 'Update' : 'Add'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CostManager;
