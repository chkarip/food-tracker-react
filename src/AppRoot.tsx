/**
 * AppRoot.tsx - Main Application Entry Point & Routing System
 * 
 * BUSINESS PURPOSE:
 * Root component that orchestrates a comprehensive task scheduling and tracking application:
 * - Firebase authentication and user session management
 * - Application routing between dashboard, task modules, and activity tracking
 * - Global theme and Material-UI configuration
 * - Error boundaries and loading state management
 * - Progressive Web App (PWA) configuration for mobile task management
 * 
 * KEY BUSINESS LOGIC:
 * 1. AUTHENTICATION FLOW: Manages user login/logout with Firebase Auth
 * 2. ROUTE PROTECTION: Ensures authenticated access to all task management features
 * 3. MODULE NAVIGATION: Routes between dashboard, food tasks, gym tasks, finance tasks, and custom activities
 * 4. THEME MANAGEMENT: Dual-theme support (light/dark mode) with user preferences
 * 5. PWA CAPABILITIES: Offline support and mobile app-like experience for on-the-go task management
 * 
 * APPLICATION ARCHITECTURE:
 * - Dashboard: Central hub with calendar and comprehensive task overview
 * - Food Module: Nutrition and meal planning tasks (one of many task categories)
 * - Gym Module: Workout and fitness activity scheduling and tracking
 * - Finance Module: Budget and expense tracking tasks
 * - Custom Tasks: User-defined activities and goals (expandable system)
 * 
 * BUSINESS VALUE:
 * - Provides unified platform for scheduling and tracking ANY type of recurring activity
 * - Ensures secure, authenticated access to personal productivity and goal-tracking data
 * - Enables seamless navigation between different life management modules
 * - Supports consistent user experience across all task categories
 * - Maintains user preferences and long-term activity tracking for goal achievement
 */
import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import {
  createTheme,
  ThemeProvider,
  CssBaseline,
  useMediaQuery
} from '@mui/material';

import Layout from './components/shared/MainLayout';
import DashboardPage from './pages/DashboardPage';
import FoodTrackerPage from './pages/FoodTrackerPage';
import GymPage from './components/workout/GymPage';
import FinancePage from './modules/finance/pages/FinancePage';
import AuthGuard from './components/auth/AuthGuard';
import { AuthProvider } from './contexts/AuthContext';

function FoodTrackerApp() {
  // Theme state
  const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)');
  const [darkMode, setDarkMode] = useState(prefersDarkMode);

  // Create theme
  const theme = createTheme({
    palette: {
      mode: darkMode ? 'dark' : 'light',
      primary: {
        main: '#2563eb',
      },
      secondary: {
        main: '#10b981',
      },
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
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
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
      <Router>
        <Routes>
          <Route path="/" element={<Layout darkMode={darkMode} toggleDarkMode={toggleDarkMode} />}>
            <Route index element={<DashboardPage />} />
            <Route path="food" element={<FoodTrackerPage />} />
            <Route path="gym" element={<GymPage />} />
            <Route path="finance" element={<FinancePage />} />
          </Route>
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

// Main App component with Auth Provider and Guard
function App() {
  return (
    <AuthProvider>
      <AuthGuard>
        <FoodTrackerApp />
      </AuthGuard>
    </AuthProvider>
  );
}

export default App;
