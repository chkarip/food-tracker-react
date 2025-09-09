import React from 'react';
import { BottomNavigation, BottomNavigationAction, Paper } from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Dashboard as DashboardIcon,
  Restaurant as FoodIcon,
  ShoppingCart as ShoppingIcon,
  FitnessCenter as GymIcon,
  AccountBalance as FinanceIcon
} from '@mui/icons-material';
import { navConfig } from '../../../config/navConfig';

interface MobileBottomNavProps {
  // No props needed - component manages its own state
}

const MobileBottomNav: React.FC<MobileBottomNavProps> = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Get current module for active state
  const getCurrentValue = () => {
    const currentModule = navConfig.find(item =>
      location.pathname === item.path ||
      (item.path !== '/' && location.pathname.startsWith(item.path))
    );
    return currentModule?.key || 'dashboard';
  };

  const handleChange = (event: React.SyntheticEvent, newValue: string) => {
    const item = navConfig.find(item => item.key === newValue);
    if (item) {
      navigate(item.path);
    }
  };

  // Filter to show only primary navigation items on mobile (max 5)
  const primaryNavItems = navConfig.filter(item =>
    ['dashboard', 'food', 'shopping', 'gym', 'finance'].includes(item.key) &&
    (item.permission?.() ?? true)
  );

  return (
    <Paper
      sx={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 'var(--nav-z)',
        backgroundColor: 'var(--nav-bg)',
        borderTop: '1px solid var(--nav-border)',
      }}
      elevation={3}
    >
      <BottomNavigation
        value={getCurrentValue()}
        onChange={handleChange}
        sx={{
          backgroundColor: 'var(--nav-bg)',
          '& .MuiBottomNavigationAction-root': {
            color: 'var(--nav-text)',
            minWidth: 'auto',
            padding: '6px 8px',
            '&.Mui-selected': {
              color: 'var(--nav-active)',
              '& .MuiBottomNavigationAction-label': {
                fontSize: '0.75rem',
                fontWeight: 600,
              },
            },
            '&:hover': {
              backgroundColor: 'var(--nav-hover)',
            },
            '&:focus-visible': {
              outline: 'var(--focus-ring)',
              outlineOffset: '2px',
            },
          },
          '& .MuiBottomNavigationAction-label': {
            fontSize: '0.75rem',
            '&.Mui-selected': {
              fontSize: '0.75rem',
            },
          },
        }}
      >
        {primaryNavItems.map((item) => {
          const IconComponent = item.icon;
          return (
            <BottomNavigationAction
              key={item.key}
              label={item.label}
              value={item.key}
              icon={IconComponent ? <IconComponent /> : undefined}
              sx={{
                '&.Mui-selected': {
                  color: 'var(--nav-active)',
                },
              }}
            />
          );
        })}
      </BottomNavigation>
    </Paper>
  );
};

export default MobileBottomNav;
