/**
 * AppRoot.tsx - Main Application Entry Point
 * 
 * Root component that manages:
 * - Firebase authentication and routing
 * - Theme management (light/dark mode)
 * - Global providers and layout
 */

import React, { useState, useEffect } from 'react';
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
import { FoodProvider } from './contexts/FoodContext';

function FoodTrackerApp() {
  const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)');
  const [darkMode, setDarkMode] = useState(prefersDarkMode);

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
                <Route path="/food" element={<FoodTrackerPage />} />
                <Route path="/gym" element={<GymPage />} />
                <Route path="/finance" element={<FinancePage />} />
              </Routes>
            </Layout>
          </AuthGuard>
        </Router>
      </FoodProvider>
    </ThemeProvider>
  );
}

function App() {
  return (
    <AuthProvider>
      <FoodTrackerApp />
    </AuthProvider>
  );
}

export default App;
