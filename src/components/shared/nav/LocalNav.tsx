import React from 'react';
import { Box, Button, useTheme, useMediaQuery } from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import { getLocalItems, getCurrentModule } from '../../../config/navConfig';
import { setLastUsedTab } from '../../../utils/lastTab';

interface LocalNavProps {
  currentModule?: string;
}

const LocalNav: React.FC<LocalNavProps> = ({ currentModule = 'dashboard' }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const navigate = useNavigate();
  const location = useLocation();
  const localItems = getLocalItems(currentModule);

  const handleLocalNavClick = (path: string) => {
    // Save the last used tab if rememberLastTab is enabled for this item
    const item = localItems.find(item => item.path === path);
    if (item?.rememberLastTab) {
      setLastUsedTab(currentModule, path);
    }
    navigate(path);
  };

  const handleKeyDown = (event: React.KeyboardEvent, currentIndex: number) => {
    if (event.key === 'ArrowLeft' && currentIndex > 0) {
      event.preventDefault();
      const prevItem = localItems[currentIndex - 1];
      handleLocalNavClick(prevItem.path);
    } else if (event.key === 'ArrowRight' && currentIndex < localItems.length - 1) {
      event.preventDefault();
      const nextItem = localItems[currentIndex + 1];
      handleLocalNavClick(nextItem.path);
    } else if (event.key === 'Home') {
      event.preventDefault();
      const firstItem = localItems[0];
      handleLocalNavClick(firstItem.path);
    } else if (event.key === 'End') {
      event.preventDefault();
      const lastItem = localItems[localItems.length - 1];
      handleLocalNavClick(lastItem.path);
    }
  };

  // Only show local nav for modules that have local items
  if (localItems.length === 0) {
    return null;
  }

  return (
    <Box
      sx={{
        position: 'sticky',
        top: isMobile ? 0 : 'var(--nav-height)',
        height: 'var(--local-nav-height, 40px)',
        backgroundColor: 'var(--local-nav-bg)',
        borderBottom: '1px solid var(--local-nav-border)',
        color: 'var(--local-nav-text)',
        zIndex: 'calc(var(--nav-z) - 1)',
        display: 'flex',
        alignItems: 'center',
        px: isMobile ? 2 : 3,
        gap: 1,
        overflowX: 'auto',
        overflowY: 'hidden',
        scrollbarWidth: 'thin',
        scrollbarColor: 'var(--border-color) transparent',
        '&::-webkit-scrollbar': {
          height: '4px',
        },
        '&::-webkit-scrollbar-track': {
          backgroundColor: 'transparent',
        },
        '&::-webkit-scrollbar-thumb': {
          backgroundColor: 'var(--border-color)',
          borderRadius: '2px',
          '&:hover': {
            backgroundColor: 'var(--text-secondary)',
          },
        },
        // Ensure minimum touch targets on mobile
        '& button': {
          minWidth: isMobile ? '70px' : '80px',
          justifyContent: 'center',
        },
      }}
      role="tablist"
      aria-label={`${currentModule} local navigation`}
    >
      {localItems.map((item, index) => {
        const isActive = location.pathname === item.path;

        return (
          <Button
            key={item.key}
            onClick={() => handleLocalNavClick(item.path)}
            onKeyDown={(event) => handleKeyDown(event, index)}
            role="tab"
            aria-selected={isActive}
            aria-controls={`panel-${item.key}`}
            id={`tab-${item.key}`}
            tabIndex={isActive ? 0 : -1}
            sx={{
              color: 'var(--local-nav-text)',
              textTransform: 'none',
              fontSize: isMobile ? '0.8rem' : '0.875rem',
              fontWeight: isActive ? 600 : 400,
              borderBottom: isActive ? '2px solid var(--nav-active)' : '2px solid transparent',
              borderRadius: 0,
              px: isMobile ? 1.5 : 2,
              py: 1,
              minHeight: 'var(--local-nav-height, 40px)',
              whiteSpace: 'nowrap',
              flexShrink: 0,
              backgroundColor: isActive ? 'var(--local-nav-active)' : 'transparent',
              transition: 'all 0.2s ease-in-out',
              '&:hover': {
                backgroundColor: 'var(--local-nav-hover)',
                borderBottomColor: isActive ? 'var(--nav-active)' : 'var(--local-nav-hover)',
                color: 'var(--nav-text)',
              },
              '&:focus-visible': {
                outline: 'var(--focus-ring)',
                outlineOffset: '2px',
                backgroundColor: 'var(--local-nav-hover)',
              },
              '&:active': {
                transform: 'scale(0.98)',
              },
            }}
          >
            {item.label}
          </Button>
        );
      })}
    </Box>
  );
};

export default LocalNav;
