import React, { useState, useRef, useEffect, forwardRef } from 'react';
import { Box, IconButton, Typography } from '@mui/material';
import { ExpandMore, ExpandLess } from '@mui/icons-material';
import { CollapsiblePanelProps } from '../../types/collapsible';
import './CollapsiblePanel.css';

const CollapsiblePanel = forwardRef<HTMLDivElement, CollapsiblePanelProps>(
  ({
    title,
    children,
    defaultExpanded = false,
    expanded, // Add controlled expansion prop
    variant = 'default',
    size = 'medium',
    icon,
    onToggle,
    className = '',
    disabled = false,
    sx = {}, // Add sx prop
  },
  ref) => {
  // Use controlled expansion if provided, otherwise use internal state
  const [internalExpanded, setInternalExpanded] = useState(defaultExpanded);
  const isExpanded = expanded !== undefined ? expanded : internalExpanded;
  const [height, setHeight] = useState<string>('0px');
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (contentRef.current && isExpanded) {
      // Use a more reliable height measurement
      const measureHeight = () => {
        if (contentRef.current) {
          // Temporarily set height to auto to measure natural height
          const originalHeight = contentRef.current.style.height;
          contentRef.current.style.height = 'auto';
          const measuredHeight = contentRef.current.scrollHeight;
          contentRef.current.style.height = originalHeight;
          
          const newHeight = `${measuredHeight}px`;
          setHeight(newHeight);
        }
      };
      
      // Use setTimeout to ensure DOM is fully updated
      setTimeout(measureHeight, 0);
    } else if (!isExpanded) {
      setHeight('0px');
    }
  }, [isExpanded, children]); // Keep children dependency to react to content changes

  const toggleExpanded = () => {
    if (disabled) return;
    
    if (expanded !== undefined) {
      // Controlled mode - call onToggle callback
      onToggle?.(!expanded);
    } else {
      // Uncontrolled mode - update internal state
      setInternalExpanded(!internalExpanded);
    }
  };

  const panelClasses = [
    'collapsible-panel',
    `collapsible-panel--${variant}`,
    `collapsible-panel--${size}`,
    isExpanded ? 'collapsible-panel--expanded' : 'collapsible-panel--collapsed',
    disabled ? 'collapsible-panel--disabled' : '',
    className,
  ].filter(Boolean).join(' ');

  return (
    <Box className={panelClasses} sx={sx}>
      {/* Header */}
      <Box
        ref={ref}
        className="collapsible-panel__header"
        onClick={toggleExpanded}
        role="button"
        tabIndex={disabled ? -1 : 0}
        onKeyPress={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            toggleExpanded();
          }
        }}
      >
        {icon && (
          <Box className="collapsible-panel__icon">
            {icon}
          </Box>
        )}
        
        <Typography
          variant="h6"
          className="collapsible-panel__title"
          sx={{
            fontSize: size === 'small' ? '0.875rem' : size === 'large' ? '1.25rem' : size === 'compact' ? '0.875rem' : '1rem',
          }}
        >
          {title}
        </Typography>

        <IconButton
          className="collapsible-panel__toggle"
          size="small"
          disabled={disabled}
        >
          {isExpanded ? <ExpandLess /> : <ExpandMore />}
        </IconButton>
      </Box>

      {/* Content */}
      <Box
        className="collapsible-panel__content"
        style={{ height }}
        ref={contentRef}
      >
        <Box className="collapsible-panel__inner">
          {children}
        </Box>
      </Box>
    </Box>
  );
});

CollapsiblePanel.displayName = 'CollapsiblePanel';

export default CollapsiblePanel;
