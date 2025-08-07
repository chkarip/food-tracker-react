import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Collapse,
  LinearProgress,
  Divider,
  Tabs,
  Tab,
  Alert,
  CircularProgress
} from '@mui/material';
import {
  History as HistoryIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Delete as DeleteIcon,
  RestaurantMenu as MealIcon,
  CalendarToday as CalendarIcon,
  TrendingUp as StatsIcon,
  Analytics as AnalyticsIcon
} from '@mui/icons-material';
import FoodHistoryAnalytics from './FoodHistoryAnalytics';
import { useAuth } from '../contexts/AuthContext';
import { getRecentDailyPlans, deleteDailyPlan } from '../services/firestoreService';
import { DailyPlanDocument } from '../types/firebase';
import { FOOD_DATABASE } from '../data/foodDatabase';
import foodHistoryService from '../services/foodHistoryService';

interface TrackedFood {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  protein: number;
  fats: number;
  carbs: number;
  calories: number;
}

interface DayProgram {
  date: string;
  foods: TrackedFood[];
  externalNutrition: {
    protein: number;
    fats: number;
    carbs: number;
    calories: number;
  };
  totalNutrition: {
    protein: number;
    fats: number;
    carbs: number;
    calories: number;
  };
  completed: boolean;
  completionStatus?: {
    '6pm': boolean;
    '9:30pm': boolean;
    'gym': boolean;
    'morning': boolean;
  };
}

interface NutritionGoals {
  protein: number;
  fats: number;
  carbs: number;
  calories: number;
}

const DEFAULT_GOALS: NutritionGoals = {
  protein: 125,
  fats: 61,
  carbs: 287,
  calories: 2150
};

const FoodTrack: React.FC = () => {
  const { user } = useAuth();
  const [history, setHistory] = useState<DayProgram[]>([]);
  const [expandedDays, setExpandedDays] = useState<Set<string>>(new Set());
  const [deleteDialog, setDeleteDialog] = useState<{open: boolean, date: string}>({open: false, date: ''});
  const [goals, setGoals] = useState<NutritionGoals>(DEFAULT_GOALS);
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load history and goals from Firebase/localStorage on mount
  useEffect(() => {
    const loadHistory = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Load recent daily plans from Firebase (last 30 days)
        const recentPlans = await getRecentDailyPlans(user.uid, 30);
        console.log('📊 Loaded recent plans:', recentPlans);

        // Convert Firebase plans to DayProgram format for display
        const convertedHistory: DayProgram[] = recentPlans.map(plan => {
          // Combine foods from both timeslots
          const allFoods: TrackedFood[] = [];
          let combinedExternalNutrition = { protein: 0, fats: 0, carbs: 0, calories: 0 };

          Object.entries(plan.timeslots).forEach(([timeslotId, timeslotData]) => {
            // Add foods with timeslot identifier
            timeslotData.selectedFoods.forEach((food, index) => {
              allFoods.push({
                id: `${timeslotId}_${index}`,
                name: food.name,
                quantity: food.amount,
                unit: 'g', // Default unit
                protein: 0, // Will be calculated from food database if needed
                fats: 0,
                carbs: 0,
                calories: 0
              });
            });

            // Add external nutrition
            combinedExternalNutrition.protein += timeslotData.externalNutrition.protein;
            combinedExternalNutrition.fats += timeslotData.externalNutrition.fats;
            combinedExternalNutrition.carbs += timeslotData.externalNutrition.carbs;
            combinedExternalNutrition.calories += timeslotData.externalNutrition.calories;
          });

          // Check if day is completed (at least one activity completed)
          const isCompleted = plan.completionStatus && 
            (plan.completionStatus['6pm'] || plan.completionStatus['9:30pm'] || 
             plan.completionStatus['gym'] || plan.completionStatus['morning']);

          return {
            date: plan.date,
            foods: allFoods,
            externalNutrition: combinedExternalNutrition,
            totalNutrition: plan.totalMacros,
            completed: isCompleted || false,
            completionStatus: plan.completionStatus
          };
        });

        // Sort by date descending (newest first)
        convertedHistory.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        
        setHistory(convertedHistory);

        // Also import meal data to food history service for analytics
        await importMealDataToHistory(recentPlans);

      } catch (err) {
        console.error('Error loading food history:', err);
        setError('Failed to load food tracking history');
      } finally {
        setLoading(false);
      }
    };

    // Load nutrition goals from localStorage as backup
    const loadGoals = () => {
      try {
        const savedGoals = localStorage.getItem('nutritionGoals');
        if (savedGoals) {
          setGoals(JSON.parse(savedGoals));
        }
      } catch (error) {
        console.error('Error loading nutrition goals:', error);
      }
    };

    loadHistory();
    loadGoals();
  }, [user?.uid]); // Use user.uid instead of user object to avoid size changes

  // Import meal data to food history service for analytics
  const importMealDataToHistory = async (plans: DailyPlanDocument[]) => {
    try {
      for (const plan of plans) {
        // Convert plan to format expected by food history service
        const allFoods: Array<{
          name: string;
          quantity: number;
          protein: number;
          fats: number;
          carbs: number;
          calories: number;
        }> = [];

        Object.values(plan.timeslots).forEach(timeslotData => {
          timeslotData.selectedFoods.forEach(food => {
            // Calculate nutrition based on food database and quantity
            const foodInfo = FOOD_DATABASE[food.name];
            if (foodInfo) {
              const { protein, fats, carbs, calories } = foodInfo.nutrition;
              
              // Calculate nutrition for the specific quantity
              let nutritionMultiplier;
              if (foodInfo.isUnitFood) {
                // For unit foods, nutrition is per unit
                nutritionMultiplier = food.amount;
              } else {
                // For weight foods, nutrition is per 100g
                nutritionMultiplier = food.amount / 100;
              }
              
              allFoods.push({
                name: food.name,
                quantity: food.amount,
                protein: protein * nutritionMultiplier,
                fats: fats * nutritionMultiplier,
                carbs: carbs * nutritionMultiplier,
                calories: calories * nutritionMultiplier
              });
            } else {
              // Fallback for unknown foods
              allFoods.push({
                name: food.name,
                quantity: food.amount,
                protein: 0,
                fats: 0,
                carbs: 0,
                calories: 0
              });
            }
          });
        });

        if (allFoods.length > 0) {
          await foodHistoryService.importDailyMealProgram({
            date: plan.date,
            foods: allFoods
          }, user?.uid);
        }
      }
    } catch (error) {
      console.warn('Failed to import meal data to history service:', error);
      // Don't throw error as this is supplementary functionality
    }
  };

  const toggleDayExpansion = (date: string) => {
    setExpandedDays(prev => {
      const newSet = new Set(prev);
      if (newSet.has(date)) {
        newSet.delete(date);
      } else {
        newSet.add(date);
      }
      return newSet;
    });
  };

  const handleDeleteDay = (date: string) => {
    setDeleteDialog({open: true, date});
  };

  const confirmDeleteDay = async () => {
    if (!user) return;

    try {
      // Delete from Firebase
      const dateToDelete = new Date(deleteDialog.date);
      await deleteDailyPlan(user.uid, dateToDelete);

      // Update local state
      const newHistory = history.filter(day => day.date !== deleteDialog.date);
      setHistory(newHistory);
      
      setDeleteDialog({open: false, date: ''});
    } catch (error) {
      console.error('Error deleting day:', error);
      setError('Failed to delete day record');
    }
  };

  const calculateProgress = (value: number, target: number) => {
    return Math.min((value / target) * 100, 100);
  };

  const getProgressColor = (value: number, target: number) => {
    const percentage = (value / target) * 100;
    if (percentage < 80) return 'error';
    if (percentage < 95) return 'warning';
    return 'success';
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
    }
  };

  const getTotalStats = () => {
    const totalDays = history.length;
    const completedDays = history.filter(day => day.completed).length;
    const avgNutrition = history.reduce((acc, day) => ({
      protein: acc.protein + day.totalNutrition.protein,
      fats: acc.fats + day.totalNutrition.fats,
      carbs: acc.carbs + day.totalNutrition.carbs,
      calories: acc.calories + day.totalNutrition.calories
    }), { protein: 0, fats: 0, carbs: 0, calories: 0 });

    if (totalDays > 0) {
      avgNutrition.protein /= totalDays;
      avgNutrition.fats /= totalDays;
      avgNutrition.carbs /= totalDays;
      avgNutrition.calories /= totalDays;
    }

    return { totalDays, completedDays, avgNutrition };
  };

  const stats = getTotalStats();

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  // Show loading spinner while data loads
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

  // Show error message if loading failed
  if (error) {
    return (
      <Alert severity="error" sx={{ m: 2 }}>
        {error}
      </Alert>
    );
  }

  // Show authentication required message
  if (!user) {
    return (
      <Alert severity="info" sx={{ m: 2 }}>
        Please sign in to view your food tracking history.
      </Alert>
    );
  }

  return (
    <Box>
      {/* Tab Navigation */}
      <Card sx={{ mb: 3, borderRadius: 4 }}>
        <CardContent sx={{ p: 2 }}>
          <Tabs 
            value={activeTab} 
            onChange={handleTabChange}
            aria-label="food tracking tabs"
            sx={{ borderBottom: 1, borderColor: 'divider' }}
          >
            <Tab 
              icon={<HistoryIcon />} 
              label="Daily History" 
              iconPosition="start"
            />
            <Tab 
              icon={<AnalyticsIcon />} 
              label="Food Analytics" 
              iconPosition="start"
            />
          </Tabs>
        </CardContent>
      </Card>

      {/* Tab Content */}
      {activeTab === 0 && (
        <Card sx={{ mb: 3, borderRadius: 4 }}>
          <CardContent sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <HistoryIcon />
              Food Tracking History
            </Typography>

            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              View your daily meal programs and nutrition tracking history.
            </Typography>

            {/* Summary Stats */}
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 4 }}>
              <Paper sx={{ p: 2, minWidth: '150px', flex: 1, textAlign: 'center' }}>
                <Typography variant="h4" color="primary.main">
                  {stats.totalDays}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Total Days Tracked
                </Typography>
              </Paper>
              <Paper sx={{ p: 2, minWidth: '150px', flex: 1, textAlign: 'center' }}>
                <Typography variant="h4" color="success.main">
                  {stats.completedDays}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Completed Days
                </Typography>
              </Paper>
              <Paper sx={{ p: 2, minWidth: '150px', flex: 1, textAlign: 'center' }}>
                <Typography variant="h4" color="info.main">
                  {Math.round(stats.avgNutrition.protein)}g
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Avg Daily Protein
                </Typography>
              </Paper>
              <Paper sx={{ p: 2, minWidth: '150px', flex: 1, textAlign: 'center' }}>
                <Typography variant="h4" color="warning.main">
                  {Math.round(stats.avgNutrition.calories)}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Avg Daily Calories
                </Typography>
              </Paper>
            </Box>

            {/* History Timeline */}
            <Stack spacing={2}>
              {history.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 6 }}>
                  <CalendarIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                  <Typography variant="h6" color="text.secondary" gutterBottom>
                    No tracking history yet
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Your completed daily meal programs will appear here
                  </Typography>
                </Box>
              ) : (
                history.map((day) => (
                  <Card key={day.date} sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
                    <CardContent sx={{ p: 2 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Typography variant="h6">
                            {formatDate(day.date)}
                          </Typography>
                          <Chip
                            label={day.completed ? 'Completed' : 'Incomplete'}
                            color={day.completed ? 'success' : 'warning'}
                            size="small"
                          />
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <IconButton
                            onClick={() => handleDeleteDay(day.date)}
                            color="error"
                            size="small"
                          >
                            <DeleteIcon />
                          </IconButton>
                          <IconButton
                            onClick={() => toggleDayExpansion(day.date)}
                            size="small"
                          >
                            {expandedDays.has(day.date) ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                          </IconButton>
                        </Box>
                      </Box>

                      {/* Nutrition Summary */}
                      <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap', mb: 2 }}>
                        <Box sx={{ minWidth: '120px' }}>
                          <Typography variant="body2" color="text.secondary">Protein</Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="body1" sx={{ fontWeight: 600 }}>
                              {Math.round(day.totalNutrition.protein)}g
                            </Typography>
                            <LinearProgress
                              variant="determinate"
                              value={calculateProgress(day.totalNutrition.protein, goals.protein)}
                              color={getProgressColor(day.totalNutrition.protein, goals.protein) as any}
                              sx={{ flex: 1, height: 6, borderRadius: 3 }}
                            />
                          </Box>
                        </Box>
                        <Box sx={{ minWidth: '120px' }}>
                          <Typography variant="body2" color="text.secondary">Fats</Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="body1" sx={{ fontWeight: 600 }}>
                              {Math.round(day.totalNutrition.fats)}g
                            </Typography>
                            <LinearProgress
                              variant="determinate"
                              value={calculateProgress(day.totalNutrition.fats, goals.fats)}
                              color={getProgressColor(day.totalNutrition.fats, goals.fats) as any}
                              sx={{ flex: 1, height: 6, borderRadius: 3 }}
                            />
                          </Box>
                        </Box>
                        <Box sx={{ minWidth: '120px' }}>
                          <Typography variant="body2" color="text.secondary">Carbs</Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="body1" sx={{ fontWeight: 600 }}>
                              {Math.round(day.totalNutrition.carbs)}g
                            </Typography>
                            <LinearProgress
                              variant="determinate"
                              value={calculateProgress(day.totalNutrition.carbs, goals.carbs)}
                              color={getProgressColor(day.totalNutrition.carbs, goals.carbs) as any}
                              sx={{ flex: 1, height: 6, borderRadius: 3 }}
                            />
                          </Box>
                        </Box>
                        <Box sx={{ minWidth: '120px' }}>
                          <Typography variant="body2" color="text.secondary">Calories</Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="body1" sx={{ fontWeight: 600 }}>
                              {Math.round(day.totalNutrition.calories)}
                            </Typography>
                            <LinearProgress
                              variant="determinate"
                              value={calculateProgress(day.totalNutrition.calories, goals.calories)}
                              color={getProgressColor(day.totalNutrition.calories, goals.calories) as any}
                              sx={{ flex: 1, height: 6, borderRadius: 3 }}
                            />
                          </Box>
                        </Box>
                      </Box>

                      {/* Expandable Details */}
                      <Collapse in={expandedDays.has(day.date)}>
                        <Divider sx={{ my: 2 }} />
                        
                        {/* Food List */}
                        {day.foods.length > 0 && (
                          <Box sx={{ mb: 3 }}>
                            <Typography variant="subtitle2" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <MealIcon fontSize="small" />
                              Foods Consumed
                            </Typography>
                            <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
                              <Table size="small">
                                <TableHead>
                                  <TableRow>
                                    <TableCell>Food</TableCell>
                                    <TableCell>Quantity</TableCell>
                                    <TableCell>Protein</TableCell>
                                    <TableCell>Fats</TableCell>
                                    <TableCell>Carbs</TableCell>
                                    <TableCell>Calories</TableCell>
                                  </TableRow>
                                </TableHead>
                                <TableBody>
                                  {day.foods.map((food) => (
                                    <TableRow key={food.id}>
                                      <TableCell>{food.name}</TableCell>
                                      <TableCell>{food.quantity}{food.unit}</TableCell>
                                      <TableCell>{Math.round(food.protein)}g</TableCell>
                                      <TableCell>{Math.round(food.fats)}g</TableCell>
                                      <TableCell>{Math.round(food.carbs)}g</TableCell>
                                      <TableCell>{Math.round(food.calories)}</TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            </TableContainer>
                          </Box>
                        )}

                        {/* External Nutrition */}
                        {(day.externalNutrition.protein > 0 || day.externalNutrition.fats > 0 || 
                          day.externalNutrition.carbs > 0 || day.externalNutrition.calories > 0) && (
                          <Box>
                            <Typography variant="subtitle2" gutterBottom>
                              External Nutrition Added
                            </Typography>
                            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                              {day.externalNutrition.protein > 0 && (
                                <Chip label={`+${day.externalNutrition.protein}g protein`} size="small" />
                              )}
                              {day.externalNutrition.fats > 0 && (
                                <Chip label={`+${day.externalNutrition.fats}g fats`} size="small" />
                              )}
                              {day.externalNutrition.carbs > 0 && (
                                <Chip label={`+${day.externalNutrition.carbs}g carbs`} size="small" />
                              )}
                              {day.externalNutrition.calories > 0 && (
                                <Chip label={`+${day.externalNutrition.calories} calories`} size="small" />
                              )}
                            </Box>
                          </Box>
                        )}
                      </Collapse>
                    </CardContent>
                  </Card>
                ))
              )}
            </Stack>
          </CardContent>
        </Card>
      )}

      {/* Food Analytics Tab */}
      {activeTab === 1 && (
        <FoodHistoryAnalytics userId={user?.uid} />
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialog.open} onClose={() => setDeleteDialog({open: false, date: ''})}>
        <DialogTitle>Delete Day Record</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete the tracking record for {formatDate(deleteDialog.date)}? 
            This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog({open: false, date: ''})}>Cancel</Button>
          <Button onClick={confirmDeleteDay} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default FoodTrack;
