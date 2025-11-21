import React, { useState } from 'react';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import {
  Box,
  Drawer,
  List,
  Typography,
  Divider,
  IconButton,
  ListItem,
  ListItemButton,
  ListItemText,
  Button,
  Menu,
  MenuItem,
  Avatar,
  useMediaQuery,
  useTheme
} from '@mui/material';
import {
  Menu as MenuIcon,
  Brightness4 as DarkModeIcon,
  Brightness7 as LightModeIcon,
  Login as LoginIcon,
  Logout as LogoutIcon
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { signOutUser } from '../../services/firebase/authService';
import AuthDialog from '../auth/AuthDialog';
import GlobalHeader from './nav/GlobalHeader';
import LocalNav from './nav/LocalNav';
import MobileBottomNav from './nav/MobileBottomNav';
import { getCurrentModule, getLocalItems } from '../../config/navConfig';

const drawerWidth = 280;

interface LayoutProps {
  darkMode: boolean;
  toggleDarkMode: () => void;
  children?: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ 
  darkMode, 
  toggleDarkMode, 
  children // ✅ Added children to destructuring
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated } = useAuth();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [authDialogOpen, setAuthDialogOpen] = useState(false);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const currentModule = getCurrentModule(location.pathname);
  const localItems = getLocalItems(currentModule);
  const hasLocalNav = localItems.length > 0;

  const menuItems = [
    {
      text: 'Dashboard',
      path: '/',
      description: 'Calendar & Overview'
    },
    {
      text: 'Food',
      path: '/food',
      description: 'Nutrition & Meal Planning'
    },
    {
      text: 'Shopping List',
      path: '/shopping',
      description: 'Grocery Planning & Costs'
    },
    {
      text: 'Gym',
      path: '/gym',
      description: 'Workouts & Training'
    },
    {
      text: 'Finance',
      path: '/finance',
      description: 'Budget & Expenses'
    },
    {
      text: 'Profile',
      path: '/profile',
      description: 'Personal Information & Settings'
    }
  ];

  const drawer = (
    <div>
      {/* Sidebar Header */}
      <Box sx={{ p: 2, textAlign: 'center' }}>
        <Typography variant="h6" component="div" sx={{ fontWeight: 700 }}>
          Track Everything
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Food • Gym • Finance
        </Typography>
      </Box>

      <Divider />

      {/* Date Display */}
      <Box sx={{ p: 2, textAlign: 'center', bgcolor: 'primary.50' }}>
        <Typography variant="overline" display="block">
          Today
        </Typography>
        <Typography variant="h6" sx={{ fontWeight: 600 }}>
          {new Date().toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric'
          })}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {new Date().toLocaleDateString('en-US', { weekday: 'long' })}
        </Typography>
      </Box>

      <Divider />

      {/* Navigation Menu */}
      <List>
        {menuItems.map((item) => (
          <ListItem key={item.text} disablePadding>
            <ListItemButton
              selected={location.pathname === item.path}
              onClick={() => {
                navigate(item.path);
                if (isMobile) {
                  setMobileOpen(false);
                }
              }}
              sx={{
                py: 2,
                '&.Mui-selected': {
                  bgcolor: 'primary.50',
                  borderRight: 3,
                  borderColor: 'primary.main',
                  '& .MuiListItemText-primary': {
                    fontWeight: 600,
                    color: 'primary.main',
                  }
                }
              }}
            >
              <ListItemText 
                primary={item.text}
                secondary={item.description}
                sx={{ ml: 2 }}
              />
            </ListItemButton>
          </ListItem>
        ))}
      </List>

    </div>
  );

  return (
    <Box 
      sx={{ 
        display: 'flex',
        minHeight: '100vh',
        backgroundImage: 'var(--app-gradient)',
        backgroundAttachment: 'fixed',
        backgroundSize: 'cover',
        color: 'var(--text-primary)'
      }}
    >
      {/* Mobile drawer only */}
      <Box
        component="nav"
        sx={{ width: { md: 0 }, flexShrink: { md: 0 } }}
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
        >
          {drawer}
        </Drawer>
      </Box>

      {/* Main content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          display: 'flex',
          flexDirection: 'column',
          minHeight: '100vh',
          // Add bottom padding for mobile bottom nav
          pb: isMobile ? '80px' : 0,
        }}
      >
        {/* Global Header - Desktop only */}
        {!isMobile && (
          <GlobalHeader 
            darkMode={darkMode} 
            toggleDarkMode={toggleDarkMode}
            onOpenAuthDialog={() => setAuthDialogOpen(true)}
          />
        )}

        {/* Content area with local nav positioned at top-right */}
        <Box
          sx={{
            flexGrow: 1,
            p: 3,
            pt: isMobile ? '16px' : 'calc(var(--nav-height) + 24px)',
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {/* Local Navigation positioned at top-center if it exists */}
          {hasLocalNav && !isMobile && (
            <Box
              sx={{
                alignSelf: 'center', // Position to the center
                mb: 2, // Margin bottom to separate from content
                maxWidth: 'fit-content', // Don't take full width
              }}
            >
              <LocalNav currentModule={currentModule} />
            </Box>
          )}

          {/* Page content */}
          <Box sx={{ flexGrow: 1 }}>
            {children || <Outlet />}
          </Box>
        </Box>
      </Box>

      {/* Mobile Bottom Navigation */}
      {isMobile && (
        <MobileBottomNav />
      )}

      {/* Auth Dialog */}
      <AuthDialog 
        open={authDialogOpen}
        onClose={() => setAuthDialogOpen(false)}
      />
    </Box>
  );
};

export default Layout;
