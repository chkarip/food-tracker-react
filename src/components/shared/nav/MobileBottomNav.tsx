import React, { useState } from 'react';
import { 
  BottomNavigation, 
  BottomNavigationAction, 
  Paper, 
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Box,
  Typography,
  IconButton
} from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Home as HomeIcon,
  Restaurant as FoodIcon,
  ShoppingCart as ShoppingIcon,
  FitnessCenter as GymIcon,
  MoreHoriz as MoreIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import { navConfig } from '../../../config/navConfig';

interface MobileBottomNavProps {
  // No props needed - component manages its own state
}

const MobileBottomNav: React.FC<MobileBottomNavProps> = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [moreDrawerOpen, setMoreDrawerOpen] = useState(false);

  // Primary navigation items (shown in bottom bar)
  const primaryItems = [
    { key: 'home', label: 'Home', icon: HomeIcon, path: '/' },
    { key: 'food', label: 'Food', icon: FoodIcon, path: '/food' },
    { key: 'gym', label: 'Gym', icon: GymIcon, path: '/gym' },
    { key: 'shopping', label: 'Shopping', icon: ShoppingIcon, path: '/shopping' }
  ];

  // Secondary navigation items (shown in "More" drawer)
  const moreItems = navConfig.filter(item =>
    !['food', 'gym', 'shopping'].includes(item.key) &&
    item.key !== 'home' &&
    (item.permission?.() ?? true)
  );

  // Get current module for active state
  const getCurrentValue = () => {
    if (location.pathname === '/') return 'home';
    
    // Check primary items first
    for (const item of primaryItems) {
      if (item.path !== '/' && location.pathname.startsWith(item.path)) {
        return item.key;
      }
    }
    
    // Check if current path is in "more" items
    const moreItem = moreItems.find(item =>
      location.pathname === item.path ||
      (item.path !== '/' && location.pathname.startsWith(item.path))
    );
    
    // Don't return a value if we're on a "more" page - this prevents selection highlight
    if (moreItem) {
      return '';
    }
    
    // Default fallback
    return '';
  };

  const handleChange = (event: React.SyntheticEvent, newValue: string) => {
    if (newValue === 'more') {
      setMoreDrawerOpen(true);
      return;
    }

    if (newValue === 'home') {
      navigate('/');
      return;
    }

    // For primary items, use their path directly
    const primaryItem = primaryItems.find(item => item.key === newValue);
    if (primaryItem) {
      navigate(primaryItem.path);
      return;
    }

    // Fallback to navConfig
    const item = navConfig.find(item => item.key === newValue);
    if (item) {
      navigate(item.path);
    }
  };

  const handleMoreItemClick = (path: string) => {
    navigate(path);
    setMoreDrawerOpen(false);
  };

  return (
    <>
      {/* Bottom Navigation Bar */}
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
          {primaryItems.map((item) => {
            const IconComponent = item.icon;
            return (
              <BottomNavigationAction
                key={item.key}
                label={item.label}
                value={item.key}
                icon={<IconComponent />}
                sx={{
                  '&.Mui-selected': {
                    color: 'var(--nav-active)',
                  },
                }}
              />
            );
          })}
          
          {/* More button */}
          <BottomNavigationAction
            label="More"
            value="more"
            icon={<MoreIcon />}
            sx={{
              '&.Mui-selected': {
                color: 'var(--nav-active)',
              },
            }}
          />
        </BottomNavigation>
      </Paper>

      {/* More Drawer (Bottom Sheet) */}
      <Drawer
        anchor="bottom"
        open={moreDrawerOpen}
        onClose={() => setMoreDrawerOpen(false)}
        sx={{
          '& .MuiDrawer-paper': {
            backgroundColor: 'var(--card-bg)',
            borderTopLeftRadius: '16px',
            borderTopRightRadius: '16px',
            maxHeight: '70vh',
          },
        }}
      >
        <Box sx={{ p: 2 }}>
          {/* Header */}
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            mb: 2,
            pb: 2,
            borderBottom: '1px solid var(--border-color)'
          }}>
            <Typography variant="h6" sx={{ fontWeight: 600, color: 'var(--text-primary)' }}>
              More Options
            </Typography>
            <IconButton 
              onClick={() => setMoreDrawerOpen(false)}
              size="small"
              sx={{ color: 'var(--text-secondary)' }}
            >
              <CloseIcon />
            </IconButton>
          </Box>

          {/* More Items List */}
          <List sx={{ py: 0 }}>
            {moreItems.map((item) => {
              const IconComponent = item.icon;
              const isActive = location.pathname === item.path ||
                (item.path !== '/' && location.pathname.startsWith(item.path));
              
              return (
                <ListItem key={item.key} disablePadding>
                  <ListItemButton
                    onClick={() => handleMoreItemClick(item.path)}
                    sx={{
                      borderRadius: 2,
                      mb: 0.5,
                      backgroundColor: isActive ? 'var(--nav-active-bg)' : 'transparent',
                      '&:hover': {
                        backgroundColor: 'var(--nav-hover)',
                      },
                    }}
                  >
                    {IconComponent && (
                      <ListItemIcon sx={{ 
                        color: isActive ? 'var(--nav-active)' : 'var(--text-secondary)',
                        minWidth: 40
                      }}>
                        <IconComponent />
                      </ListItemIcon>
                    )}
                    <ListItemText
                      primary={item.label}
                      sx={{
                        '& .MuiTypography-root': {
                          fontWeight: isActive ? 600 : 400,
                          color: isActive ? 'var(--nav-active)' : 'var(--text-primary)',
                        },
                      }}
                    />
                  </ListItemButton>
                </ListItem>
              );
            })}
          </List>
        </Box>
      </Drawer>
    </>
  );
};

export default MobileBottomNav;
