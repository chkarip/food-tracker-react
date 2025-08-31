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
  const [userMenuAnchor, setUserMenuAnchor] = useState<null | HTMLElement>(null);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleSignOut = async () => {
    try {
      await signOutUser();
      setUserMenuAnchor(null);
    } catch (error) {
      // Sign out error
    }
  };

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

      <Divider />

      {/* Quick Stats */}
      <Box sx={{ p: 2 }}>
        <Typography variant="overline" display="block" gutterBottom>
          Quick Stats
        </Typography>
        
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
          <Typography variant="body2">Today's Meals</Typography>
          <Typography variant="body2" fontWeight="bold">0/3</Typography>
        </Box>
        
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
          <Typography variant="body2">Gym Sessions</Typography>
          <Typography variant="body2" fontWeight="bold">0/1</Typography>
        </Box>
        
        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <Typography variant="body2">Tasks Done</Typography>
          <Typography variant="body2" fontWeight="bold">0/0</Typography>
        </Box>
      </Box>

      <Divider />

      {/* Theme Toggle & User Profile */}
      <Box sx={{ p: 2 }}>
        {/* Theme Toggle */}
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <IconButton onClick={toggleDarkMode} sx={{ mr: 1 }}>
            {darkMode ? <LightModeIcon /> : <DarkModeIcon />}
          </IconButton>
          <Typography variant="body2">
            {darkMode ? 'Light Mode' : 'Dark Mode'}
          </Typography>
        </Box>

        {/* User Profile/Auth */}
        {isAuthenticated ? (
          <Button
            fullWidth
            onClick={(e) => setUserMenuAnchor(e.currentTarget)}
            startIcon={<Avatar sx={{ width: 32, height: 32 }}>{user?.email?.charAt(0).toUpperCase()}</Avatar>}
            sx={{ justifyContent: 'flex-start', textTransform: 'none' }}
          >
            <Box sx={{ textAlign: 'left' }}>
              <Typography variant="body1" sx={{ fontWeight: 600 }}>
                {user?.displayName || user?.email?.split('@')[0]}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {user?.email}
              </Typography>
            </Box>
          </Button>
        ) : (
          <Button
            fullWidth
            startIcon={<LoginIcon />}
            onClick={() => setAuthDialogOpen(true)}
            sx={{ textTransform: 'none' }}
          >
            Sign In
          </Button>
        )}

        {/* User Menu */}
        <Menu
          anchorEl={userMenuAnchor}
          open={Boolean(userMenuAnchor)}
          onClose={() => setUserMenuAnchor(null)}
        >
          <MenuItem onClick={() => {
            navigate('/profile');
            setUserMenuAnchor(null);
          }}>
            <Avatar sx={{ mr: 1, width: 20, height: 20 }}>{user?.email?.charAt(0).toUpperCase()}</Avatar>
            Profile Settings
          </MenuItem>
          <Divider />
          <MenuItem onClick={handleSignOut}>
            <LogoutIcon sx={{ mr: 1 }} />
            Sign Out
          </MenuItem>
        </Menu>
      </Box>
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
      {/* App Bar - REMOVED */}
      {/* <AppBar
        position="fixed"
        sx={{
          width: { md: `calc(100% - ${drawerWidth}px)` },
          ml: { md: `${drawerWidth}px` },
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { md: 'none' } }}
          >
            <MenuIcon />
          </IconButton>

          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            {menuItems.find(item => item.path === location.pathname)?.text || 'Track Everything'}
          </Typography>

          <IconButton onClick={toggleDarkMode} color="inherit">
            {darkMode ? <LightModeIcon /> : <DarkModeIcon />}
          </IconButton>

          {isAuthenticated ? (
            <>
              <Button
                onClick={(e) => setUserMenuAnchor(e.currentTarget)}
                startIcon={<Avatar sx={{ width: 24, height: 24 }}>{user?.email?.charAt(0).toUpperCase()}</Avatar>}
                color="inherit"
              >
                {user?.displayName || user?.email?.split('@')[0]}
              </Button>
              <Menu
                anchorEl={userMenuAnchor}
                open={Boolean(userMenuAnchor)}
                onClose={() => setUserMenuAnchor(null)}
              >
                <MenuItem onClick={handleSignOut}>
                  <LogoutIcon sx={{ mr: 1 }} />
                  Sign Out
                </MenuItem>
              </Menu>
            </>
          ) : (
            <Button
              startIcon={<LoginIcon />}
              color="inherit"
              onClick={() => setAuthDialogOpen(true)}
            >
              Sign In
            </Button>
          )}
        </Toolbar>
      </AppBar> */}

      {/* Sidebar */}
      <Box
        component="nav"
        sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}
      >
        {/* Mobile drawer */}
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

        {/* Desktop drawer */}
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', md: 'block' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>

      {/* Main content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { md: `calc(100% - ${drawerWidth}px)` },
        }}
      >
        {/* Page content - NO SPACER NEEDED */}
        {children || <Outlet />} {/* ✅ FIXED: Render children if passed, otherwise use Outlet */}
      </Box>

      {/* Auth Dialog */}
      <AuthDialog 
        open={authDialogOpen}
        onClose={() => setAuthDialogOpen(false)}
      />
    </Box>
  );
};

export default Layout;
