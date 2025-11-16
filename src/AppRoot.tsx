/**
 * AppRoot.tsx - Main Application Entry Point
 * 
 * Root component that manages:
 * - Firebase authentication and routing
 * - Theme management (light/dark mode)
 * - Global providers and layout
 */

import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import {
  createTheme,
  ThemeProvider,
  CssBaseline,
  useMediaQuery
} from '@mui/material';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { queryClient } from './config/queryClient';
import { useLocalStorage } from './hooks/useLocalStorage';

import Layout from './components/shared/MainLayout';
import DashboardPage from './pages/DashboardPage';
import FoodTrackerPage from './pages/FoodTrackerPage';
import ShoppingList from './components/food-management/ShoppingList';
import GymPage from './components/workout/GymPage';
import FinancePage from './modules/finance/pages/FinancePage';
import ProfilePage from './pages/ProfilePage';
import WaterTrackerPage from './pages/WaterTrackerPage';
import AboutPage from './pages/AboutPage';
import AuthGuard from './components/auth/AuthGuard';
import { AuthProvider } from './contexts/AuthContext';
import { FoodProvider } from './contexts/FoodContext';
import { getDefaultLocalPath } from './config/navConfig';

// Food module components
import FoodTrack from './components/food-management/FoodTrack';
import FoodInventory from './components/food-management/FoodInventory';
import NutritionGoalsManager from './components/food-management/NutritionGoalsManager';
import RecipeManager from './components/food-management/RecipeManager';
import MealCostDisplay from './components/food-management/MealCostDisplay';
import AddFoodManager from './components/food-management/AddFoodManager';
import TimeslotMealPlanner from './components/food-management/TimeslotMealPlanner';

// Gym module components
import GymWorkoutsPage from './components/workout/GymWorkoutsPage';
import GymExercisesPage from './components/workout/GymExercisesPage';
import GymProgressPage from './components/workout/GymProgressPage';
import GymSchedulePage from './components/workout/GymSchedulePage';

function FoodTrackerApp() {
  const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)');
  const [darkMode, setDarkMode] = useLocalStorage('theme-dark-mode', prefersDarkMode);

  // Apply data-theme attribute for CSS variable theming
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', darkMode ? 'dark' : 'light');
  }, [darkMode]);

  const theme = createTheme({
    palette: {
      mode: darkMode ? 'dark' : 'light',
      ...(darkMode ? {
        // Dark theme colors - using actual values, CSS variables handle dynamic theming
        background: {
          default: '#171c22',
          paper: '#1b2128',
        },
        text: {
          primary: '#eaeaea',
          secondary: '#bfc6cf',
        },
        primary: { 
          main: '#3BBA75',
          light: '#6CCF95',
          dark: '#2E8B57'
        },
        secondary: { 
          main: '#FF9800',
          light: '#FFB74D',
          dark: '#F57C00'
        },
      } : {
        // Light theme colors - using actual values, CSS variables handle dynamic theming
        background: {
          default: '#ffffff',
          paper: '#ffffff',
        },
        primary: { 
          main: '#3BBA75',
          light: '#6CCF95',
          dark: '#2E8B57'
        },
        secondary: { 
          main: '#FF9800',
          light: '#FFB74D',
          dark: '#F57C00'
        },
      }),
    },
    typography: {
      fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    },
    shape: {
      borderRadius: 12,
    },
    components: {
      MuiCard: {
        styleOverrides: {
          root: {
            backgroundColor: 'var(--card-bg)',
            color: 'var(--text-primary)',
            border: '1px solid var(--border-color)',
            boxShadow: 'var(--elevation-1)',
          },
        },
      },
      MuiCssBaseline: {
        styleOverrides: {
          body: {
            backgroundColor: 'var(--surface-bg)',
            color: 'var(--text-primary)',
          },
        },
      },
    },
  });

  const toggleDarkMode = () => {
    setDarkMode(prev => !prev);
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <FoodProvider>
        <Router>
          <AuthGuard>
            <Layout darkMode={darkMode} toggleDarkMode={toggleDarkMode}>
              <Routes>
                <Route path="/" element={<DashboardPage />} />
                {/* Food module routes */}
                <Route path="/food" element={<Navigate to={getDefaultLocalPath('food')} replace />} />
                <Route path="/food/plan" element={<TimeslotMealPlanner />} />
                <Route path="/food/track" element={<FoodTrack />} />
                <Route path="/food/inventory" element={<FoodInventory />} />
                <Route path="/food/recipes" element={<RecipeManager />} />
                <Route path="/food/manage" element={<AddFoodManager />} />
                {/* Gym module routes */}
                <Route path="/gym" element={<Navigate to={getDefaultLocalPath('gym')} replace />} />
                <Route path="/gym/workouts" element={<GymWorkoutsPage />} />
                <Route path="/gym/schedule" element={<GymSchedulePage />} />
                <Route path="/gym/exercises" element={<GymExercisesPage />} />
                <Route path="/gym/progress" element={<GymProgressPage />} />
                {/* Finance module routes */}
                <Route path="/finance" element={<Navigate to={getDefaultLocalPath('finance')} replace />} />
                <Route path="/finance/overview" element={<FinancePage />} />
                <Route path="/finance/budget" element={<div>Budget Page - Coming Soon</div>} />
                <Route path="/finance/expenses" element={<div>Expenses Page - Coming Soon</div>} />
                <Route path="/finance/reports" element={<div>Reports Page - Coming Soon</div>} />
                {/* Shopping module routes */}
                <Route path="/shopping" element={<Navigate to={getDefaultLocalPath('shopping')} replace />} />
                <Route path="/shopping/list" element={<ShoppingList />} />
                <Route path="/shopping/recipes" element={<div>Recipe Shopping - Coming Soon</div>} />
                <Route path="/shopping/history" element={<div>Purchase History - Coming Soon</div>} />
                {/* Water module routes */}
                <Route path="/water" element={<WaterTrackerPage />} />
                {/* Other routes */}
                <Route path="/profile" element={<ProfilePage />} />
                <Route path="/about" element={<AboutPage />} />
              </Routes>
            </Layout>
          </AuthGuard>
        </Router>
      </FoodProvider>
    </ThemeProvider>
  );
}

function App() {
  // Debug logging to catch duplicate localStorage keys
  useEffect(() => {
    const originalSetItem = localStorage.setItem;
    localStorage.setItem = function(key, value) {
      if (key === 'timeslotData') {
        console.error('🚨 DUPLICATE KEY CREATED:', key, new Error().stack);
      }
      return originalSetItem.call(this, key, value);
    };
  }, []);

  return (
    <AuthProvider>
      <QueryClientProvider client={queryClient}>
        <FoodTrackerApp />
        
        {/* Dev tools - only in development */}
        {process.env.NODE_ENV === 'development' && (
          <ReactQueryDevtools initialIsOpen={false} />
        )}
      </QueryClientProvider>
    </AuthProvider>
  );
}

export default App;
