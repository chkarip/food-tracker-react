import React, { useState, useRef, useEffect } from 'react';
import { Box, IconButton, Typography } from '@mui/material';
import { ExpandMore, ExpandLess } from '@mui/icons-material';
import { CollapsiblePanelProps } from '../../types/collapsible';
import './CollapsiblePanel.css';

const CollapsiblePanel: React.FC<CollapsiblePanelProps> = ({
  title,
  children,
  defaultExpanded = false,
  variant = 'default',
  size = 'medium',
  icon,
  onToggle,
  className = '',
  disabled = false,
}) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const [height, setHeight] = useState<string>('0px');
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (contentRef.current) {
      setHeight(isExpanded ? `${contentRef.current.scrollHeight}px` : '0px');
    }
  }, [isExpanded, children]);

  const toggleExpanded = () => {
    if (disabled) return;
    
    const newExpanded = !isExpanded;
    setIsExpanded(newExpanded);
    onToggle?.(newExpanded);
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
    <Box className={panelClasses}>
      {/* Header */}
      <Box
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
            fontSize: size === 'small' ? '0.875rem' : size === 'large' ? '1.25rem' : '1rem',
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
};

export default CollapsiblePanel;
