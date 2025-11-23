import React from 'react';
import { Box, Skeleton } from '@mui/material';

interface PageCardSkeletonProps {
  /**
   * Show title skeleton
   * @default true
   */
  showTitle?: boolean;
  /**
   * Number of content sections to show
   * @default 3
   */
  sections?: number;
  /**
   * Minimum height for the skeleton
   * @default 'calc(100vh - 200px)'
   */
  minHeight?: string | number;
}

/**
 * PageCardSkeleton - Loading skeleton for PageCard component
 * 
 * Provides a ghost/shimmer loading effect while page content is loading.
 * Maintains the same dimensions and layout as PageCard for seamless transition.
 */
export const PageCardSkeleton: React.FC<PageCardSkeletonProps> = ({
  showTitle = true,
  sections = 3,
  minHeight = 'calc(100vh - 200px)'
}) => {
  return (
    <Box sx={{
      backgroundColor: 'var(--surface-bg)',
      minHeight,
      animation: 'fadeIn 0.3s ease-in',
      '@keyframes fadeIn': {
        from: { opacity: 0 },
        to: { opacity: 1 }
      }
    }}>
      {/* Title Skeleton */}
      {showTitle && (
        <Box sx={{ mb: 3 }}>
          <Skeleton
            variant="text"
            width="30%"
            height={40}
            animation="wave"
            sx={{
              backgroundColor: 'var(--meal-row-bg)',
              borderRadius: 2,
              transform: 'scale(1, 1)' // Fix skeleton stretching
            }}
          />
        </Box>
      )}

      {/* Content Sections Skeleton */}
      {Array.from({ length: sections }).map((_, index) => (
        <Box key={index} sx={{ mb: 3 }}>
          {/* Section Header */}
          <Skeleton
            variant="rectangular"
            width="100%"
            height={80}
            animation="wave"
            sx={{
              backgroundColor: 'var(--meal-row-bg)',
              borderRadius: 2,
              mb: 2,
              transform: 'scale(1, 1)' // Fix skeleton stretching
            }}
          />

          {/* Section Content - Multiple rows */}
          <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: { xs: 'wrap', md: 'nowrap' } }}>
            <Skeleton
              variant="rectangular"
              width="48%"
              height={120}
              animation="wave"
              sx={{
                backgroundColor: 'var(--meal-row-bg)',
                borderRadius: 2,
                minWidth: { xs: '100%', md: '48%' },
                transform: 'scale(1, 1)' // Fix skeleton stretching
              }}
            />
            <Skeleton
              variant="rectangular"
              width="48%"
              height={120}
              animation="wave"
              sx={{
                backgroundColor: 'var(--meal-row-bg)',
                borderRadius: 2,
                minWidth: { xs: '100%', md: '48%' },
                transform: 'scale(1, 1)' // Fix skeleton stretching
              }}
            />
          </Box>

          {/* Additional content rows */}
          <Skeleton
            variant="rectangular"
            width="100%"
            height={60}
            animation="wave"
            sx={{
              backgroundColor: 'var(--meal-row-bg)',
              borderRadius: 2,
              transform: 'scale(1, 1)' // Fix skeleton stretching
            }}
          />
        </Box>
      ))}
    </Box>
  );
};

export default PageCardSkeleton;
