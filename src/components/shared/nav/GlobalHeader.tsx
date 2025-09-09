import React from 'react';
import { Box, Typography, IconButton, Avatar, Button, Menu, MenuItem } from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Brightness4 as DarkModeIcon,
  Brightness7 as LightModeIcon,
  Login as LoginIcon,
  Logout as LogoutIcon
} from '@mui/icons-material';
import { useAuth } from '../../../contexts/AuthContext';
import { signOutUser } from '../../../services/firebase/authService';
import { navConfig } from '../../../config/navConfig';

interface GlobalHeaderProps {
  darkMode: boolean;
  toggleDarkMode: () => void;
  onOpenAuthDialog?: () => void;
}

const GlobalHeader: React.FC<GlobalHeaderProps> = ({ darkMode, toggleDarkMode, onOpenAuthDialog }) => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [userMenuAnchor, setUserMenuAnchor] = React.useState<null | HTMLElement>(null);

  const handleSignOut = async () => {
    try {
      await signOutUser();
      setUserMenuAnchor(null);
    } catch (error) {
      // Sign out error
    }
  };

  const handleNavClick = (path: string) => {
    navigate(path);
  };

  const handleKeyDown = (event: React.KeyboardEvent, currentIndex: number) => {
    const navItems = navConfig.filter(item => item.permission?.() ?? true);
    if (event.key === 'ArrowLeft' && currentIndex > 0) {
      event.preventDefault();
      const prevItem = navItems[currentIndex - 1];
      handleNavClick(prevItem.path);
    } else if (event.key === 'ArrowRight' && currentIndex < navItems.length - 1) {
      event.preventDefault();
      const nextItem = navItems[currentIndex + 1];
      handleNavClick(nextItem.path);
    } else if (event.key === 'Home') {
      event.preventDefault();
      const firstItem = navItems[0];
      handleNavClick(firstItem.path);
    } else if (event.key === 'End') {
      event.preventDefault();
      const lastItem = navItems[navItems.length - 1];
      handleNavClick(lastItem.path);
    }
  };

  return (
    <Box
      sx={{
        position: 'sticky',
        top: 0,
        height: 'var(--nav-height)',
        backgroundColor: 'var(--nav-bg)',
        borderBottom: '1px solid var(--nav-border)',
        color: 'var(--nav-text)',
        zIndex: 'var(--nav-z)',
        boxShadow: 'var(--nav-shadow)',
        display: 'flex',
        alignItems: 'center',
        px: 3,
        gap: 2,
      }}
    >
      {/* Brand/Title Area */}
      <Box sx={{ flexShrink: 0 }}>
        <Typography variant="h6" sx={{ fontWeight: 700 }}>
          Track Everything
        </Typography>
      </Box>

      {/* Global Navigation Items */}
      <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
        {navConfig
          .filter(item => item.permission?.() ?? true)
          .map((item, index) => {
            const isActive = location.pathname === item.path;
            const IconComponent = item.icon;

            return (
              <Button
                key={item.key}
                onClick={() => handleNavClick(item.path)}
                onKeyDown={(event) => handleKeyDown(event, index)}
                sx={{
                  color: 'var(--nav-text)',
                  textTransform: 'none',
                  fontWeight: isActive ? 600 : 400,
                  borderBottom: isActive ? '2px solid var(--nav-active)' : '2px solid transparent',
                  borderRadius: 0,
                  px: 2,
                  py: 1,
                  minHeight: 'var(--nav-height)',
                  backgroundColor: isActive ? 'var(--nav-active)' : 'transparent',
                  transition: 'all 0.2s ease-in-out',
                  '&:hover': {
                    backgroundColor: 'var(--nav-hover)',
                    borderBottomColor: isActive ? 'var(--nav-active)' : 'var(--nav-hover)',
                  },
                  '&:focus-visible': {
                    outline: 'var(--focus-ring)',
                    outlineOffset: '2px',
                    backgroundColor: 'var(--nav-hover)',
                  },
                  '&:active': {
                    transform: 'scale(0.98)',
                  },
                }}
                startIcon={IconComponent ? <IconComponent /> : undefined}
              >
                {item.label}
              </Button>
            );
          })}
      </Box>

      {/* Right Side: Theme Toggle + User Menu */}
      <Box sx={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 1 }}>
        {/* Theme Toggle */}
        <IconButton
          onClick={toggleDarkMode}
          sx={{
            color: 'var(--nav-text)',
            '&:hover': {
              backgroundColor: 'var(--nav-hover)',
            },
            '&:focus-visible': {
              outline: 'var(--focus-ring)',
              outlineOffset: '2px',
            },
          }}
        >
          {darkMode ? <LightModeIcon /> : <DarkModeIcon />}
        </IconButton>

        {/* User Profile/Auth */}
        {isAuthenticated ? (
          <Button
            onClick={(e) => setUserMenuAnchor(e.currentTarget)}
            startIcon={
              <Avatar sx={{ width: 32, height: 32 }}>
                {user?.email?.charAt(0).toUpperCase()}
              </Avatar>
            }
            sx={{
              textTransform: 'none',
              color: 'var(--nav-text)',
              '&:hover': {
                backgroundColor: 'var(--nav-hover)',
              },
              '&:focus-visible': {
                outline: 'var(--focus-ring)',
                outlineOffset: '2px',
              },
            }}
          >
            <Box sx={{ textAlign: 'left', display: { xs: 'none', sm: 'block' } }}>
              <Typography variant="body2" sx={{ fontWeight: 600, lineHeight: 1.2 }}>
                {user?.displayName || user?.email?.split('@')[0]}
              </Typography>
            </Box>
          </Button>
        ) : (
          <Button
            startIcon={<LoginIcon />}
            onClick={onOpenAuthDialog}
            sx={{
              textTransform: 'none',
              color: 'var(--nav-text)',
              '&:hover': {
                backgroundColor: 'var(--nav-hover)',
              },
              '&:focus-visible': {
                outline: 'var(--focus-ring)',
                outlineOffset: '2px',
              },
            }}
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
            <Avatar sx={{ mr: 1, width: 20, height: 20 }}>
              {user?.email?.charAt(0).toUpperCase()}
            </Avatar>
            Profile Settings
          </MenuItem>
          <MenuItem onClick={handleSignOut}>
            <LogoutIcon sx={{ mr: 1 }} />
            Sign Out
          </MenuItem>
        </Menu>
      </Box>
    </Box>
  );
};

export default GlobalHeader;
