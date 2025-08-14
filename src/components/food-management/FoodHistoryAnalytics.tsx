import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Collapse,
  LinearProgress,
  Alert,
  CircularProgress,
  Button,
  TextField,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import {
  Restaurant as RestaurantIcon,
  History as HistoryIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  TrendingUp as TrendingUpIcon,
  CalendarMonth as CalendarIcon,
  Scale as ScaleIcon,
  QueryStats as StatsIcon,
  FileDownload as ExportIcon
} from '@mui/icons-material';
import foodHistoryService, { 
  FoodHistoryStats, 
  MonthlyFoodSummary 
} from '../../services/foodHistoryService';

interface FoodHistoryAnalyticsProps {
  userId?: string;
}

const FoodHistoryAnalytics: React.FC<FoodHistoryAnalyticsProps> = ({ userId }) => {
  const [foodStats, setFoodStats] = useState<FoodHistoryStats[]>([]);
  const [monthlyData, setMonthlyData] = useState<MonthlyFoodSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedFood, setExpandedFood] = useState<string | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<string>('');
  const [exportDialog, setExportDialog] = useState(false);

  // Initialize with current month
  useEffect(() => {
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}`;
    setSelectedMonth(currentMonth);
  }, []);

  // Load food statistics
  useEffect(() => {
    if (!selectedMonth) return;

    const loadFoodStats = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const [year, month] = selectedMonth.split('-').map(Number);
        
        // Load current month stats and monthly summary
        const [stats, summary] = await Promise.all([
          foodHistoryService.getCurrentMonthFoodStats(userId),
          foodHistoryService.getMonthlyFoodSummary(year, month, userId)
        ]);
        
        setFoodStats(stats);
        setMonthlyData(summary);
      } catch (err) {
        console.error('Error loading food statistics:', err);
        setError('Failed to load food history data');
      } finally {
        setLoading(false);
      }
    };

    loadFoodStats();
  }, [selectedMonth, userId]);

  const toggleFoodExpansion = (foodName: string) => {
    setExpandedFood(expandedFood === foodName ? null : foodName);
  };

  const formatDate = (date: Date) => {
    const now = new Date();
    const diffTime = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    });
  };

  const formatWeight = (kilos: number) => {
    if (kilos < 0.001) {
      return '0g';
    } else if (kilos < 1) {
      return `${Math.round(kilos * 1000)}g`;
    } else if (kilos < 10) {
      return `${kilos.toFixed(2)}kg`;
    } else {
      return `${kilos.toFixed(1)}kg`;
    }
  };

  const getFrequencyColor = (times: number) => {
    if (times >= 20) return 'success';
    if (times >= 10) return 'warning';
    return 'default';
  };

  const handleExportData = () => {
    if (!foodStats.length) return;
    
    // Create CSV data
    const headers = [
      'Food Name',
      'Last Eaten',
      'Times Eaten This Month',
      'Total Kilos This Month',
      'Average Quantity Per Meal',
      'Total Protein (g)',
      'Total Fats (g)',
      'Total Carbs (g)',
      'Total Calories'
    ];
    
    const csvData = [
      headers.join(','),
      ...foodStats.map(food => [
        food.foodName,
        food.lastEaten.toISOString().split('T')[0],
        food.timesEatenThisMonth,
        food.totalKilosThisMonth.toFixed(3),
        food.averageQuantityPerMeal.toFixed(1),
        Math.round(food.nutritionTotals.protein),
        Math.round(food.nutritionTotals.fats),
        Math.round(food.nutritionTotals.carbs),
        Math.round(food.nutritionTotals.calories)
      ].join(','))
    ].join('\n');
    
    // Download CSV
    const blob = new Blob([csvData], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `food-history-${selectedMonth}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    
    setExportDialog(false);
  };

  const generateMonthOptions = () => {
    const options = [];
    const now = new Date();
    
    // Generate last 12 months
    for (let i = 0; i < 12; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const value = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
      const label = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      options.push({ value, label });
    }
    
    return options;
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 4 }}>
        <CircularProgress />
        <Typography variant="body2" sx={{ ml: 2 }}>
          Loading food history...
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ m: 2 }}>
        {error}
      </Alert>
    );
  }

  return (
    <Box>
      {/* Header and Controls */}
      <Card sx={{ mb: 3, borderRadius: 4 }}>
        <CardContent sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Box>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <HistoryIcon />
                Food History Analytics
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Track your food consumption patterns and nutrition trends
              </Typography>
            </Box>
            
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
              <TextField
                select
                label="Month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                size="small"
                sx={{ minWidth: 150 }}
              >
                {generateMonthOptions().map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </TextField>
              
              <Button
                variant="outlined"
                startIcon={<ExportIcon />}
                onClick={() => setExportDialog(true)}
                disabled={!foodStats.length}
              >
                Export
              </Button>
            </Box>
          </Box>

          {/* Monthly Summary Stats */}
          {monthlyData && (
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 3 }}>
              <Paper sx={{ p: 2, minWidth: '120px', flex: 1, textAlign: 'center' }}>
                <Typography variant="h4" color="primary.main">
                  {monthlyData.uniqueFoods}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Different Foods
                </Typography>
              </Paper>
              <Paper sx={{ p: 2, minWidth: '120px', flex: 1, textAlign: 'center' }}>
                <Typography variant="h4" color="success.main">
                  {monthlyData.totalDays}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Active Days
                </Typography>
              </Paper>
              <Paper sx={{ p: 2, minWidth: '120px', flex: 1, textAlign: 'center' }}>
                <Typography variant="h4" color="info.main">
                  {Math.round(monthlyData.totalNutrition.protein)}g
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Total Protein
                </Typography>
              </Paper>
              <Paper sx={{ p: 2, minWidth: '120px', flex: 1, textAlign: 'center' }}>
                <Typography variant="h4" color="warning.main">
                  {Math.round(monthlyData.totalNutrition.calories)}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Total Calories
                </Typography>
              </Paper>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Food History Table */}
      <Card sx={{ borderRadius: 4 }}>
        <CardContent sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <RestaurantIcon />
            Food Consumption History ({foodStats.length} foods)
          </Typography>

          {foodStats.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 6 }}>
              <RestaurantIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No food history found
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Start tracking your meals to see your consumption patterns
              </Typography>
            </Box>
          ) : (
            <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 'bold' }}>Food Name</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Last Eaten</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }} align="center">Times This Month</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }} align="center">Weight This Month</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }} align="center">Avg per Meal</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }} align="center">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {foodStats.map((food) => (
                    <React.Fragment key={food.foodName}>
                      <TableRow sx={{ '&:hover': { backgroundColor: 'action.hover' } }}>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            {food.foodName}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" color="text.secondary">
                            {formatDate(food.lastEaten)}
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          <Chip
                            label={`${food.timesEatenThisMonth}×`}
                            color={getFrequencyColor(food.timesEatenThisMonth) as any}
                            size="small"
                          />
                        </TableCell>
                        <TableCell align="center">
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {formatWeight(food.totalKilosThisMonth)}
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          <Typography variant="body2">
                            {food.averageQuantityPerMeal.toFixed(0)}g
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          <IconButton
                            size="small"
                            onClick={() => toggleFoodExpansion(food.foodName)}
                          >
                            {expandedFood === food.foodName ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                          </IconButton>
                        </TableCell>
                      </TableRow>
                      
                      {/* Expanded Details */}
                      <TableRow>
                        <TableCell colSpan={6} sx={{ py: 0, border: 0 }}>
                          <Collapse in={expandedFood === food.foodName}>
                            <Box sx={{ p: 2, bgcolor: 'background.default', borderRadius: 2, m: 1 }}>
                              <Typography variant="subtitle2" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <StatsIcon fontSize="small" />
                                Nutrition Totals This Month
                              </Typography>
                              
                              <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                                <Box>
                                  <Typography variant="caption" color="text.secondary">Protein</Typography>
                                  <Typography variant="h6" color="primary.main">
                                    {Math.round(food.nutritionTotals.protein)}g
                                  </Typography>
                                </Box>
                                <Box>
                                  <Typography variant="caption" color="text.secondary">Fats</Typography>
                                  <Typography variant="h6" color="warning.main">
                                    {Math.round(food.nutritionTotals.fats)}g
                                  </Typography>
                                </Box>
                                <Box>
                                  <Typography variant="caption" color="text.secondary">Carbs</Typography>
                                  <Typography variant="h6" color="info.main">
                                    {Math.round(food.nutritionTotals.carbs)}g
                                  </Typography>
                                </Box>
                                <Box>
                                  <Typography variant="caption" color="text.secondary">Calories</Typography>
                                  <Typography variant="h6" color="error.main">
                                    {Math.round(food.nutritionTotals.calories)}
                                  </Typography>
                                </Box>
                              </Box>
                              
                              <Box sx={{ mt: 2 }}>
                                <Typography variant="caption" color="text.secondary">
                                  Total consumptions: {food.totalConsumptions} • 
                                  Average per meal: {food.averageQuantityPerMeal.toFixed(1)}g
                                </Typography>
                              </Box>
                            </Box>
                          </Collapse>
                        </TableCell>
                      </TableRow>
                    </React.Fragment>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>

      {/* Export Dialog */}
      <Dialog open={exportDialog} onClose={() => setExportDialog(false)}>
        <DialogTitle>Export Food History</DialogTitle>
        <DialogContent>
          <Typography>
            Export your food consumption data for {selectedMonth} as a CSV file. 
            The file will include all foods with their consumption statistics and nutrition totals.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setExportDialog(false)}>Cancel</Button>
          <Button onClick={handleExportData} variant="contained" startIcon={<ExportIcon />}>
            Download CSV
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default FoodHistoryAnalytics;
