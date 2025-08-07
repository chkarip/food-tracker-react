import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Tabs,
  Tab
} from '@mui/material';
import {
  RestaurantMenu as PlanIcon,
  History as TrackIcon,
  TrendingUp as GoalIcon,
  Kitchen as InventoryIcon,
  Settings as ManageIcon,
  Restaurant as FoodIcon,
  MenuBook as RecipeIcon,
  Euro as CostIcon,
} from '@mui/icons-material';
import TimeslotMealPlanner from '../components/TimeslotMealPlanner';
import AddFoodManager from '../components/AddFoodManager';
import FoodTrack from '../components/FoodTrack';
import NutritionGoalsManager from '../components/NutritionGoalsManager';
import FoodInventory from '../components/FoodInventory';
import RecipeManager from '../components/RecipeManager';
import CostManager from '../modules/food/components/CostManager';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`food-tabpanel-${index}`}
      aria-labelledby={`food-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 1 }}>{children}</Box>}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `food-tab-${index}`,
    'aria-controls': `food-tabpanel-${index}`,
  };
}

const FoodTrackerPage: React.FC = () => {
  const [currentTab, setCurrentTab] = useState(0);

  return (
    <Box sx={{ minHeight: '100vh', p: 2 }}>
      <Paper sx={{ borderRadius: 4, overflow: 'hidden' }}>
        {/* Header */}
        <Box sx={{ p: 2, bgcolor: 'primary.50', display: 'flex', alignItems: 'center', gap: 2 }}>
          <FoodIcon color="primary" sx={{ fontSize: 32 }} />
          <Box>
            <Typography variant="h5" gutterBottom color="primary.main" sx={{ mb: 0 }}>
              Food Management System
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Complete food tracking, planning, and nutrition management
            </Typography>
          </Box>
        </Box>

        {/* Tabs */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs 
            value={currentTab} 
            onChange={(e, newValue) => setCurrentTab(newValue)}
            aria-label="food management tabs"
            variant="scrollable"
            scrollButtons="auto"
          >
            <Tab 
              icon={<PlanIcon fontSize="small" />} 
              label="Meal Plan" 
              {...a11yProps(0)} 
              sx={{ minWidth: 100, minHeight: 48 }}
            />
            <Tab 
              icon={<TrackIcon fontSize="small" />} 
              label="Food Track" 
              {...a11yProps(1)} 
              sx={{ minWidth: 100, minHeight: 48 }}
            />
            <Tab 
              icon={<GoalIcon fontSize="small" />} 
              label="Nutrition Goals" 
              {...a11yProps(2)} 
              sx={{ minWidth: 100, minHeight: 48 }}
            />
            <Tab 
              icon={<InventoryIcon fontSize="small" />} 
              label="Food Inventory" 
              {...a11yProps(3)} 
              sx={{ minWidth: 100, minHeight: 48 }}
            />
            <Tab 
              icon={<RecipeIcon fontSize="small" />} 
              label="Recipes" 
              {...a11yProps(4)} 
              sx={{ minWidth: 100, minHeight: 48 }}
            />
            <Tab 
              icon={<CostIcon fontSize="small" />} 
              label="Cost Management" 
              {...a11yProps(5)} 
              sx={{ minWidth: 100, minHeight: 48 }}
            />
            <Tab 
              icon={<ManageIcon fontSize="small" />} 
              label="Manage Foods" 
              {...a11yProps(6)} 
              sx={{ minWidth: 100, minHeight: 48 }}
            />
          </Tabs>
        </Box>

        {/* Tab Content */}
        <TabPanel value={currentTab} index={0}>
          {/* Meal Plan - Timeslot-based meal planning */}
          <TimeslotMealPlanner />
        </TabPanel>

        <TabPanel value={currentTab} index={1}>
          {/* Food Track - History of daily programs */}
          <FoodTrack />
        </TabPanel>

        <TabPanel value={currentTab} index={2}>
          {/* Nutrition Goals - Manager for protein, fats, carbs, calories targets */}
          <NutritionGoalsManager />
        </TabPanel>

        <TabPanel value={currentTab} index={3}>
          {/* Food Inventory - What you have at home */}
          <FoodInventory />
        </TabPanel>

        <TabPanel value={currentTab} index={4}>
          {/* Recipes - Recipe management with ingredients and nutrition */}
          <RecipeManager />
        </TabPanel>

        <TabPanel value={currentTab} index={5}>
          {/* Cost Management - Track and manage food costs */}
          <CostManager />
        </TabPanel>

        <TabPanel value={currentTab} index={6}>
          {/* Manage Foods - Add/edit/delete foods in database */}
          <AddFoodManager />
        </TabPanel>
      </Paper>
    </Box>
  );
};

export default FoodTrackerPage;
