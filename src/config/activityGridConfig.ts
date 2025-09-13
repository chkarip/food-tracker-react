// Configuration for ActivityGrid component
// This file allows easy customization of activity grid appearance

export interface ActivityGridConfig {
  // Cube sizing
  cubeSize: {
    small: number;
    medium: number;
    large: number;
  };
  
  // Gap between cubes
  gap: {
    small: number;
    medium: number;
    large: number;
  };
  
  // Grid layout
  columns: number;
  dayCount: number;
  
  // Visual effects
  borderRadius: number;
  todayBorderWidth: number;
  hoverScale: number;
  
  // Animation
  transitionDuration: string;
}

// Default configuration - modify these values to change appearance globally
export const DEFAULT_ACTIVITY_GRID_CONFIG: ActivityGridConfig = {
  cubeSize: {
    small: 8,
    medium: 12,     // Increased from 10 to 12 for better visibility
    large: 16       // Increased from 14 to 16 for better visibility
  },
  
  gap: {
    small: 1,
    medium: 2,
    large: 3
  },
  
  columns: 20,
  dayCount: 100,
  
  borderRadius: 2,        // Slightly more rounded
  todayBorderWidth: 2,
  hoverScale: 1.3,        // Increased hover scale
  
  transitionDuration: '0.2s'
};

// Preset configurations for different use cases
export const ACTIVITY_GRID_PRESETS = {
  // Compact view for smaller cards
  compact: {
    ...DEFAULT_ACTIVITY_GRID_CONFIG,
    cubeSize: { small: 12, medium: 16, large: 20 },
    gap: { small: 0.5, medium: 1, large: 1.5 },
    hoverScale: 1.2,
    columns: 20
  },
  
  // Enhanced view for main dashboard
  enhanced: {
    ...DEFAULT_ACTIVITY_GRID_CONFIG,
    cubeSize: { small: 10, medium: 14, large: 18 },
    gap: { small: 2, medium: 3, large: 4 },
    hoverScale: 1.4,
    borderRadius: 3,
    columns: 20
  },
  
  // Minimal view with no hover effects
  minimal: {
    ...DEFAULT_ACTIVITY_GRID_CONFIG,
    cubeSize: { small: 6, medium: 8, large: 10 },
    gap: { small: 1, medium: 1, large: 1 },
    hoverScale: 1.0,
    borderRadius: 1,
    columns: 20
  }
};

// Utility function to get configuration for a specific size
export const getActivityGridConfig = (
  size: 'small' | 'medium' | 'large' = 'medium',
  preset: keyof typeof ACTIVITY_GRID_PRESETS | 'default' = 'default'
) => {
  const config = preset === 'default' ? DEFAULT_ACTIVITY_GRID_CONFIG : ACTIVITY_GRID_PRESETS[preset];
  
  return {
    cubeSize: config.cubeSize[size],
    gap: config.gap[size],
    columns: config.columns,
    dayCount: config.dayCount,
    borderRadius: config.borderRadius,
    todayBorderWidth: config.todayBorderWidth,
    hoverScale: config.hoverScale,
    transitionDuration: config.transitionDuration
  };
};

export default DEFAULT_ACTIVITY_GRID_CONFIG;
