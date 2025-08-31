import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Tabs,
  Tab
} from '@mui/material';
import {
  Restaurant as FoodIcon,
} from '@mui/icons-material';
import TimeslotMealPlanner from '../components/food-management/TimeslotMealPlanner';
import AddFoodManager from '../components/food-management/AddFoodManager';
import FoodTrack from '../components/food-management/FoodTrack';
import NutritionGoalsManager from '../components/food-management/NutritionGoalsManager';
import FoodInventory from '../components/food-management/FoodInventory';
import RecipeManager from '../components/food-management/RecipeManager';
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
      <Paper 
        sx={{ 
          borderRadius: 4, 
          overflow: 'hidden',
          backgroundColor: 'var(--card-bg)',
          border: '1px solid var(--border-color)',
          boxShadow: 'var(--elevation-1)'
        }}
      >
        {/* Header */}
        <Box sx={{ 
          p: 3, 
          background: 'linear-gradient(135deg, var(--meal-bg-primary) 0%, var(--meal-bg-secondary) 100%)',
          borderRadius: '16px 16px 0 0',
          borderBottom: '2px solid var(--meal-border-primary)',
          display: 'flex', 
          alignItems: 'center', 
          gap: 2,
          boxShadow: 'var(--meal-shadow-primary)'
        }}>
          <FoodIcon 
            sx={{ 
              fontSize: 40, 
              color: 'var(--meal-primary)',
              filter: 'drop-shadow(0 2px 4px rgba(59, 186, 117, 0.3))'
            }} 
          />
          <Box>
            <Typography 
              variant="h4" 
              sx={{ 
                color: 'var(--meal-heading-color)',
                fontWeight: 700,
                textShadow: '0 1px 2px rgba(0,0,0,0.1)',
                mb: 0.5
              }}
            >
              Food Management System
            </Typography>
            <Typography 
              variant="body1" 
              sx={{ 
                color: 'var(--meal-subheading-color)',
                fontWeight: 500
              }}
            >
              Complete food tracking, planning, and nutrition management
            </Typography>
          </Box>
        </Box>

        {/* Tabs */}
        <Box sx={{ 
          borderBottom: '2px solid var(--meal-border-primary)',
          backgroundColor: 'var(--meal-bg-card)',
          px: 2
        }}>
          <Tabs 
            value={currentTab} 
            onChange={(e, newValue) => setCurrentTab(newValue)}
            aria-label="food management tabs"
            variant="scrollable"
            scrollButtons="auto"
            sx={{
              '& .MuiTab-root': {
                color: 'var(--meal-subheading-color)',
                fontWeight: 600,
                fontSize: '0.9rem',
                minHeight: 56,
                borderRadius: '8px 8px 0 0',
                transition: 'all 0.3s ease',
                '&:hover': {
                  backgroundColor: 'var(--meal-bg-hover)',
                  color: 'var(--meal-primary)',
                  transform: 'translateY(-2px)'
                },
                '&.Mui-selected': {
                  backgroundColor: 'var(--meal-bg-primary)',
                  color: 'var(--meal-primary)',
                  fontWeight: 700,
                  boxShadow: 'var(--meal-shadow-primary)',
                  '&::after': {
                    content: '""',
                    position: 'absolute',
                    bottom: 0,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    width: '60%',
                    height: '3px',
                    background: 'var(--button-primary)',
                    borderRadius: '2px 2px 0 0'
                  }
                }
              },
              '& .MuiTabs-indicator': {
                display: 'none'
              }
            }}
          >
            <Tab 
              label="Meal Plan" 
              {...a11yProps(0)} 
              sx={{ minWidth: 120 }}
            />
            <Tab 
              label="Food Track" 
              {...a11yProps(1)} 
              sx={{ minWidth: 120 }}
            />
            <Tab 
              label="Nutrition Goals" 
              {...a11yProps(2)} 
              sx={{ minWidth: 120 }}
            />
            <Tab 
              label="Food Inventory" 
              {...a11yProps(3)} 
              sx={{ minWidth: 120 }}
            />
            <Tab 
              label="Recipes" 
              {...a11yProps(4)} 
              sx={{ minWidth: 120 }}
            />
            <Tab 
              label="Cost Management" 
              {...a11yProps(5)} 
              sx={{ minWidth: 120 }}
            />
            <Tab 
              label="Manage Foods" 
              {...a11yProps(6)} 
              sx={{ minWidth: 120 }}
            />
          </Tabs>
        </Box>

        {/* Tab Content */}
        <Box sx={{ 
          backgroundColor: 'var(--surface-bg)',
          minHeight: 'calc(100vh - 200px)',
          p: 2
        }}>
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
        </Box>
      </Paper>
    </Box>
  );
};

export default FoodTrackerPage;
