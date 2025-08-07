import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import {
  createTheme,
  ThemeProvider,
  CssBaseline,
  useMediaQuery
} from '@mui/material';

import Layout from './components/MainLayout';
import DashboardPage from './pages/DashboardPage';
import FoodTrackerPage from './pages/FoodTrackerPage';
import GymPage from './modules/gym/pages/GymPage';
import FinancePage from './modules/finance/pages/FinancePage';
import AuthGuard from './components/AuthGuard';
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
