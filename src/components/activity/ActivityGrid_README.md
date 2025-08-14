# ActivityGrid Component System

A unified, highly customizable activity grid component for displaying 100-day activity history with circles/cubes.

## 🎯 Problem Solved

Previously, activity grids were scattered across multiple components with hardcoded sizes and styles. This new system provides:

- **One Reusable Component**: Single ActivityGrid for all use cases
- **Easy Customization**: Change appearance globally via config file
- **Multiple Presets**: Pre-configured styles for different contexts
- **Size Responsiveness**: Small/medium/large sizes for different cards
- **Consistent Look**: All activity grids use the same visual language

## 📁 File Structure

```
src/
├── components/
│   └── ActivityGrid.tsx           # Main reusable component
├── config/
│   └── activityGridConfig.ts      # Global configuration & presets
└── modules/shared/components/
    └── ActivityCubeCard.tsx       # Updated to use ActivityGrid
```

## 🚀 Quick Start

### Basic Usage

```tsx
import ActivityGrid from '../components/activity/ActivityGrid';

<ActivityGrid 
  activityData={myActivityData}
  size="medium"
  preset="default"
  primaryColor="#2196F3"
/>
```

### With Custom Configuration

```tsx
<ActivityGrid 
  activityData={myActivityData}
  size="large"
  preset="enhanced"
  cubeSize={16}          // Override preset size
  gap={4}                // Override preset gap
  primaryColor="#FF5722"
/>
```

## ⚙️ Configuration System

### Global Configuration

Edit `src/config/activityGridConfig.ts` to change defaults globally:

```typescript
export const DEFAULT_ACTIVITY_GRID_CONFIG = {
  cubeSize: {
    small: 8,
    medium: 12,     // Increased from 10 for better visibility
    large: 16       // Increased from 14 for better visibility
  },
  
  gap: {
    small: 1,
    medium: 2,
    large: 3
  },
  
  borderRadius: 2,        // Slightly more rounded
  hoverScale: 1.3,        // Increased hover scale
  // ... more options
};
```

### Available Presets

| Preset | Description | Best For |
|--------|-------------|----------|
| `default` | Standard appearance | General use, dashboard cards |
| `enhanced` | Larger cubes, more hover effect | Main dashboard, featured areas |
| `compact` | Smaller, space-efficient | Sidebar, mobile, dense layouts |
| `minimal` | Clean, no hover effects | Reports, print views |

### Size Options

| Size | Description | Cube Size (default preset) |
|------|-------------|----------------------------|
| `small` | Compact view | 8px |
| `medium` | Standard view | 12px |
| `large` | Featured view | 16px |

## 🎨 Customization Examples

### Example 1: Finance Card (Enhanced)
```tsx
<ActivityGrid 
  activityData={financeData}
  size="large"
  preset="enhanced"
  primaryColor="#4CAF50"
/>
```

### Example 2: Sidebar Widget (Compact)
```tsx
<ActivityGrid 
  activityData={workoutData}
  size="small"
  preset="compact"
  primaryColor="#FF9800"
/>
```

### Example 3: Custom Override
```tsx
<ActivityGrid 
  activityData={customData}
  size="medium"
  preset="default"
  cubeSize={20}          // Extra large cubes
  gap={6}                // Extra spacing
  borderRadius={8}       // Very rounded
  primaryColor="#9C27B0"
/>
```

## 📊 Props Reference

### Core Props
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `activityData` | `ActivityDay[]` | `[]` | Array of activity data |
| `size` | `'small' \| 'medium' \| 'large'` | `'medium'` | Size preset |
| `preset` | `'default' \| 'enhanced' \| 'compact' \| 'minimal'` | `'default'` | Configuration preset |
| `primaryColor` | `string` | `'#4CAF50'` | Color for completed activities |

### Override Props
| Prop | Type | Description |
|------|------|-------------|
| `cubeSize` | `number` | Override cube size (px) |
| `gap` | `number` | Override gap between cubes (px) |
| `columns` | `number` | Override grid columns |
| `dayCount` | `number` | Override number of days |
| `borderRadius` | `number` | Override cube border radius |
| `todayBorderWidth` | `number` | Override today's border width |

### Behavior Props
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `showHover` | `boolean` | `true` | Enable hover effects |
| `showTooltips` | `boolean` | `true` | Enable hover tooltips |
| `renderTooltip` | `(day: ActivityDay) => ReactNode` | - | Custom tooltip renderer |

## 🔧 Data Format

```typescript
interface ActivityDay {
  date: string;           // ISO date string (YYYY-MM-DD)
  dateObj: Date;          // Date object
  completed: boolean;     // Whether day was completed
  value: number;          // Progress value (0-maxValue)
  maxValue: number;       // Maximum possible value
  isToday: boolean;       // Whether this is today
  isWeekend: boolean;     // Whether this is weekend
}
```

## 🎯 Migration Guide

### From Old ActivityTrackerCard

**Before:**
```tsx
// Multiple hardcoded grid implementations
<Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(10, 1fr)', gap: '2px' }}>
  {data.map(day => (
    <Box sx={{ width: 6, height: 6, /* ... hardcoded styles */ }} />
  ))}
</Box>
```

**After:**
```tsx
<ActivityGrid 
  activityData={data}
  size="medium"
  preset="enhanced"
  primaryColor={stats.gradient}
/>
```

### From Old ActivityCubeCard

**Before:**
```tsx
// Complex inline grid with manual calculations
const cubeSize = size === 'small' ? 8 : size === 'large' ? 12 : 10;
// ... lots of styling code
```

**After:**
```tsx
<ActivityGrid 
  activityData={gridActivityData}
  size={size}
  preset="enhanced"
  primaryColor={stats.gradient}
/>
```

## 🚀 Performance Benefits

- **Reduced Bundle Size**: Single component instead of multiple implementations
- **Consistent Rendering**: Same render logic across all activity grids
- **Easy Theming**: Global configuration reduces style duplication
- **Type Safety**: Full TypeScript support with proper interfaces

## 🔮 Future Enhancements

Possible future additions:
- Animation presets (fade-in, scale-up, etc.)
- Custom color schemes for different activity types
- Export to image functionality
- Accessibility improvements (keyboard navigation)
- Different grid layouts (hexagonal, circular, etc.)

## 📝 Examples

Check the configuration file and this documentation for examples of all presets and customization options.

---

**Need help?** Check the configuration file for examples!
