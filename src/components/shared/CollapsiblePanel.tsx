import React, { useState, useRef, useEffect } from 'react';
import { Box, IconButton, Typography } from '@mui/material';
import { ExpandMore, ExpandLess } from '@mui/icons-material';
import { CollapsiblePanelProps } from '../../types/collapsible';
import { scrollIntoViewSafe } from '../../utils/scrollIntoViewSafe';
import './CollapsiblePanel.css';

interface ExtendedCollapsiblePanelProps extends CollapsiblePanelProps {
  headerRef?: (el: HTMLDivElement | null) => void;
}

const CollapsiblePanel: React.FC<ExtendedCollapsiblePanelProps> = ({
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
  headerRef,
}) => {
  // Use controlled expansion if provided, otherwise use internal state
  const [internalExpanded, setInternalExpanded] = useState(defaultExpanded);
  const isExpanded = expanded !== undefined ? expanded : internalExpanded;
  const [height, setHeight] = useState<string>('0px');
  const contentRef = useRef<HTMLDivElement>(null);
  const internalHeaderRef = useRef<HTMLDivElement>(null);
  
  // Store mouse position for scroll anchoring
  const [mousePosition, setMousePosition] = useState<{ x: number; y: number } | null>(null);

  // Auto-scroll when panel expands with mouse position anchoring
  useEffect(() => {
    if (isExpanded && internalHeaderRef.current && mousePosition) {
      console.log('[CP] expanding collapsible panel, triggering scroll');
      
      // Use double requestAnimationFrame for reliable scroll behavior
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          if (internalHeaderRef.current) {
            console.log('[CP] invoking scrollIntoViewSafe for collapsible panel');
            scrollIntoViewSafe(internalHeaderRef.current, { 
              forceWindow: true,
              topOffset: 72 
            });
            
            // Additional nudge after CSS transition completes (250ms)
            setTimeout(() => {
              if (internalHeaderRef.current) {
                console.log('[CP] 250ms nudge scroll for collapsible panel');
                scrollIntoViewSafe(internalHeaderRef.current, { 
                  forceWindow: true,
                  topOffset: 72,
                  behavior: 'auto'
                });
              }
            }, 250);
          }
        });
      });
    }
  }, [isExpanded, mousePosition]);

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

  const toggleExpanded = (event?: React.MouseEvent) => {
    if (disabled) return;
    
    // Capture mouse position for scroll anchoring
    if (event) {
      setMousePosition({ x: event.clientX, y: event.clientY });
    }
    
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
        ref={(el: HTMLDivElement | null) => {
          internalHeaderRef.current = el;
          if (headerRef) {
            console.log('[CP] headerRef attached', el?.tagName, el?.className);
            headerRef(el);
          }
        }}
        className="collapsible-panel__header"
        onClick={(event) => toggleExpanded(event)}
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
};

export default CollapsiblePanel;
