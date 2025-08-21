/**
 * AppRoot.tsx - Main Application Entry Point
 * 
 * Root component that manages:
 * - Firebase authentication and routing
 * - Theme management (light/dark mode)
 * - Global providers and layout
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
import { FoodProvider } from './contexts/FoodContext';

function FoodTrackerApp() {
  const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)');
  const [darkMode, setDarkMode] = useState(prefersDarkMode);

  const theme = createTheme({
    palette: {
      mode: darkMode ? 'dark' : 'light',
      ...(darkMode ? {
        // Dark theme colors
        background: {
          default: '#121212',
          paper: '#1e1e1e',
        },
        text: {
          primary: '#EAEAEA',
          secondary: '#A9A9A9',
        },
        primary: { main: '#3BBA75' },
        secondary: { main: '#FF9800' },
      } : {
        // Light theme colors
        background: {
          default: '#ffffff',
          paper: '#fafafa',
        },
        primary: { main: '#2563eb' },
        secondary: { main: '#10b981' },
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
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          },
        },
      },
      MuiCssBaseline: {
        styleOverrides: {
          body: {
            backgroundColor: darkMode ? '#161616' : '#ffffff',
            color: darkMode ? '#EAEAEA' : '#000000',
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
