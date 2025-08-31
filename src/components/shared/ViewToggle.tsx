/**
 * FILE: ViewToggle.tsx
 * ------------------------------------------------------------------
 * PURPOSE
 * • A reusable toggle component for switching between two views
 * • Pill-shaped design with sliding background animation
 * • Clickable anywhere on the component
 * • Customizable labels
 *
 * USAGE
 * • Use for switching between different views or modes
 * • Fully accessible with proper ARIA attributes
 */

import React from 'react';
import { Box, Typography } from '@mui/material';

interface ViewToggleProps {
  /** Current active view */
  activeView: 'available' | 'selected';
  /** Callback when view changes */
  onViewChange: (view: 'available' | 'selected') => void;
  /** Custom labels for the views */
  labels?: {
    available: string;
    selected: string;
  };
  /** Size variant */
  size?: 'small' | 'medium' | 'large';
  /** Custom className */
  className?: string;
  /** Custom styles */
  sx?: any;
}

const ViewToggle: React.FC<ViewToggleProps> = ({
  activeView,
  onViewChange,
  labels = { available: 'Available', selected: 'Selected' },
  size = 'medium',
  className,
  sx
}) => {
  // Size configurations
  const sizeConfig = {
    small: {
      padding: '2px',
      buttonPadding: '4px 8px',
      fontSize: '0.7rem',
      minWidth: '70px',
      height: '32px'
    },
    medium: {
      padding: '3px',
      buttonPadding: '6px 10px',
      fontSize: '0.75rem',
      minWidth: '90px',
      height: '40px'
    },
    large: {
      padding: '4px',
      buttonPadding: '8px 12px',
      fontSize: '0.85rem',
      minWidth: '110px',
      height: '48px'
    }
  };

  const config = sizeConfig[size];

  const handleToggle = () => {
    onViewChange(activeView === 'available' ? 'selected' : 'available');
  };

  const handleButtonClick = (view: 'available' | 'selected', e: React.MouseEvent) => {
    e.stopPropagation();
    onViewChange(view);
  };

  return (
    <Box
      onClick={handleToggle}
      className={className}
      sx={{
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        backgroundColor: 'var(--surface-bg)',
        borderRadius: '50px',
        border: '2px solid var(--border-color)',
        padding: config.padding,
        boxShadow: 'var(--elevation-1)',
        transition: 'all 0.3s ease',
        cursor: 'pointer',
        height: config.height,
        '&:hover': {
          boxShadow: 'var(--elevation-2)',
          borderColor: 'var(--accent-green)',
        },
        ...sx
      }}
      role="switch"
      aria-checked={activeView === 'selected'}
      aria-label={`Toggle between ${labels.available} and ${labels.selected} views`}
    >
      {/* Toggle Background */}
      <Box
        sx={{
          position: 'absolute',
          top: config.padding,
          left: activeView === 'available' ? config.padding : `calc(50% + ${parseInt(config.padding)}px)`,
          width: `calc(50% - ${parseInt(config.padding)}px)`,
          height: `calc(100% - ${parseInt(config.padding) * 2}px)`,
          backgroundColor: 'var(--accent-green)',
          borderRadius: '47px',
          transition: 'left 0.3s ease',
          zIndex: 1,
        }}
      />

      {/* Available Button */}
      <Box
        onClick={(e) => handleButtonClick('available', e)}
        sx={{
          position: 'relative',
          zIndex: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minWidth: config.minWidth,
          padding: config.buttonPadding,
          fontSize: config.fontSize,
          fontWeight: 600,
          color: activeView === 'available' ? 'white' : 'var(--text-secondary)',
          backgroundColor: 'transparent',
          border: 'none',
          borderRadius: '47px',
          transition: 'color 0.3s ease',
          cursor: 'pointer',
          flex: 1,
          '&:hover': {
            color: 'white',
          }
        }}
      >
        <Typography
          variant="body2"
          sx={{
            fontSize: 'inherit',
            fontWeight: 'inherit',
            lineHeight: 1,
            whiteSpace: 'nowrap'
          }}
        >
          {labels.available}
        </Typography>
      </Box>

      {/* Selected Button */}
      <Box
        onClick={(e) => handleButtonClick('selected', e)}
        sx={{
          position: 'relative',
          zIndex: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minWidth: config.minWidth,
          padding: config.buttonPadding,
          fontSize: config.fontSize,
          fontWeight: 600,
          color: activeView === 'selected' ? 'white' : 'var(--text-secondary)',
          backgroundColor: 'transparent',
          border: 'none',
          borderRadius: '47px',
          transition: 'color 0.3s ease',
          cursor: 'pointer',
          flex: 1,
          '&:hover': {
            color: 'white',
          }
        }}
      >
        <Typography
          variant="body2"
          sx={{
            fontSize: 'inherit',
            fontWeight: 'inherit',
            lineHeight: 1,
            whiteSpace: 'nowrap'
          }}
        >
          {labels.selected}
        </Typography>
      </Box>
    </Box>
  );
};

export default ViewToggle;
