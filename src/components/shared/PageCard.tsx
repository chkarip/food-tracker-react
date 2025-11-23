import React from 'react';
import { Box, Paper, Typography } from '@mui/material';
import { PageCardSkeleton } from './PageCardSkeleton';

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
  /**
   * Loading state - shows skeleton while content loads
   * @default false
   */
  loading?: boolean;
  /**
   * Number of skeleton sections to show when loading
   * @default 3
   */
  skeletonSections?: number;
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
  headerSlot,
  loading = false,
  skeletonSections = 3
}) => {
  const hasHeader = title || headerSlot;

  return (
    <Box sx={{ minHeight: '100vh', pt: { xs: 0, md: 1 }, px: { xs: 0, md: 2 }, pb: { xs: 0, md: 2 } }}>
      <Paper
        sx={{
          borderRadius: { xs: 0, md: 4 },
          overflow: 'hidden',
          backgroundColor: 'var(--card-bg)',
          border: { xs: 'none', md: '1px solid var(--border-color)' },
          boxShadow: { xs: 'none', md: 'var(--elevation-1)' },
          width: { xs: '100%', lg: '80%' },
          maxWidth: 1200,
          mx: 'auto',
          mt: { xs: 0, md: 2 }
        }}
      >
        {/* Optional Header - Hidden on mobile */}
        {hasHeader && (
          <Box sx={{
            display: { xs: 'none', md: 'block' },
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

        {/* Content - Show skeleton or actual content */}
        <Box sx={{
          p: { xs: 1, md: padding },
          backgroundColor,
          minHeight: { xs: 'auto', md: minHeight },
          position: 'relative',
          transition: 'opacity 0.3s ease-in-out'
        }}>
          {loading ? (
            <PageCardSkeleton 
              showTitle={false} 
              sections={skeletonSections} 
              minHeight={minHeight}
            />
          ) : (
            <Box sx={{
              animation: 'contentFadeIn 0.3s ease-in',
              '@keyframes contentFadeIn': {
                from: { opacity: 0, transform: 'translateY(10px)' },
                to: { opacity: 1, transform: 'translateY(0)' }
              }
            }}>
              {children}
            </Box>
          )}
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
