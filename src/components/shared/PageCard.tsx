import React from 'react';
import { Box, Paper, Typography } from '@mui/material';

interface PageCardProps {
  children: React.ReactNode;
  /**
   * Optional title displayed at the top of the card
   */
  title?: string;
  /**
   * Optional minimum height for the card
   * @default 'calc(100vh - 200px)'
   */
  minHeight?: string | number;
  /**
   * Optional padding inside the card
   * @default 3
   */
  padding?: number;
  /**
   * Optional background color override
   */
  backgroundColor?: string;
  /**
   * Optional header slot for custom header content (overrides title)
   */
  headerSlot?: React.ReactNode;
}

/**
 * PageCard - Reusable card component for consistent page layout
 * 
 * Provides consistent 80% width layout with responsive behavior:
 * - 100% width on mobile (xs)
 * - 80% width on large screens (lg+)
 * - Maximum width of 1200px
 * - Centered with auto margins
 * - Consistent border, shadow, and theme support
 * - Optional title header
 * - Flexible content sections
 */
export const PageCard: React.FC<PageCardProps> = ({ 
  children, 
  title,
  minHeight = 'calc(100vh - 200px)',
  padding = 3,
  backgroundColor = 'var(--surface-bg)',
  headerSlot
}) => {
  const hasHeader = title || headerSlot;

  return (
    <Box sx={{ minHeight: '100vh', p: 2 }}>
      <Paper
        sx={{
          borderRadius: 4,
          overflow: 'hidden',
          backgroundColor: 'var(--card-bg)',
          border: '1px solid var(--border-color)',
          boxShadow: 'var(--elevation-1)',
          width: { xs: '100%', lg: '80%' },
          maxWidth: 1200,
          mx: 'auto'
        }}
      >
        {/* Optional Header */}
        {hasHeader && (
          <Box sx={{
            p: 2,
            borderBottom: '1px solid var(--border-color)',
            backgroundColor: 'var(--card-bg)'
          }}>
            {headerSlot || (
              <Typography variant="h5" sx={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                {title}
              </Typography>
            )}
          </Box>
        )}

        {/* Content */}
        <Box sx={{
          p: padding,
          backgroundColor,
          minHeight
        }}>
          {children}
        </Box>
      </Paper>
    </Box>
  );
};

/**
 * PageCardSection - Flexible section component for PageCard content
 * 
 * Use this to create sections with different width ratios within PageCard
 */
interface PageCardSectionProps {
  children: React.ReactNode;
  /**
   * Flex ratio for this section (e.g., '70%', '30%', '1', '2')
   * @default '1'
   */
  flex?: string | number;
  /**
   * Optional minimum width to prevent section from being too narrow
   */
  minWidth?: string | number;
  /**
   * Optional padding
   */
  padding?: number;
  /**
   * Optional background color
   */
  backgroundColor?: string;
}

export const PageCardSection: React.FC<PageCardSectionProps> = ({
  children,
  flex = 1,
  minWidth = 0,
  padding = 0,
  backgroundColor
}) => {
  return (
    <Box sx={{
      flex,
      minWidth,
      p: padding,
      backgroundColor
    }}>
      {children}
    </Box>
  );
};

export default PageCard;
