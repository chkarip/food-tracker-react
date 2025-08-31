# GenericCard System

A reusable, theme-aware card component system for the Food Tracker app.

## Overview

The GenericCard system provides a consistent, flexible way to display content across the application. It integrates seamlessly with the existing theme system from `AppRoot.tsx` and uses CSS variables for consistent styling.

## Architecture

```
src/components/shared/cards/
├── GenericCard.tsx      # Main card component
├── types.ts            # TypeScript interfaces
├── variants.ts         # Style presets
└── index.ts            # Barrel exports

src/components/gym/ExerciseCard.tsx      # Gym domain wrapper
src/components/recipes/RecipeCard.tsx    # Recipe domain wrapper
src/components/summary/SummaryCard.tsx   # Summary domain wrapper
```

## Features

- **Theme Integration**: Uses existing CSS variables from `AppRoot.tsx`
- **Variant System**: Predefined styles for different use cases
- **Slot-based Architecture**: Flexible content placement
- **Action System**: Built-in action buttons with consistent styling
- **Responsive Design**: Adapts to different screen sizes
- **Accessibility**: Proper ARIA labels and keyboard navigation

## Variants

### Default
Basic card with neutral styling for general content.

### Recipe
Green accent border, optimized for recipe display with macro information.

### Summary
Compact layout for dashboard metrics and statistics.

### Exercise
Orange accent border, designed for workout and exercise information.

## Usage

### Basic GenericCard

```tsx
import GenericCard from '../shared/cards/GenericCard';

<GenericCard
  variant="default"
  title="Card Title"
  subtitle="Card subtitle"
  content="Card content here"
  actions={[
    {
      id: 'action1',
      label: 'Action',
      icon: '⭐',
      onClick: () => console.log('Action clicked'),
      color: 'primary',
      variant: 'contained',
    }
  ]}
/>
```

### Domain-Specific Cards

```tsx
import ExerciseCard from '../gym/ExerciseCard';
import RecipeCard from '../recipes/RecipeCard';
import SummaryCard from '../summary/SummaryCard';

// Exercise Card
<ExerciseCard
  exerciseName="Bench Press"
  sets={4}
  reps={10}
  weight={80}
  onStartWorkout={() => startWorkout()}
/>

// Recipe Card
<RecipeCard
  recipeName="Chicken Salad"
  calories={450}
  protein={35}
  onViewRecipe={() => viewRecipe()}
/>

// Summary Card
<SummaryCard
  metricName="Daily Calories"
  value={1850}
  target={2000}
  trend="up"
/>
```

## CSS Variables

The system uses these CSS variables (defined in `index.css`):

```css
/* Light theme */
--surface-bg: #ffffff;
--card-bg: #ffffff;
--card-hover-bg: #f5f5f5;
--card-border: rgba(0,0,0,0.12);
--text-primary: #000000;
--text-secondary: #666666;
--accent-green: #10b981;
--accent-orange: #ff9800;

/* Dark theme */
[data-theme="dark"] {
  --surface-bg: #161616;
  --card-bg: #1e1e1e;
  --card-hover-bg: #2a2a2a;
  --text-primary: #EAEAEA;
  --text-secondary: #A9A9A9;
}
```

## Props API

### GenericCardProps

| Prop | Type | Description |
|------|------|-------------|
| `title` | `string` | Main card title |
| `subtitle` | `string` | Secondary title |
| `content` | `ReactNode` | Main content |
| `actions` | `CardAction[]` | Action buttons |
| `variant` | `GenericCardVariant` | Visual variant |
| `size` | `GenericCardSize` | Size preset |
| `imageUrl` | `string` | Media image URL |
| `selectable` | `boolean` | Enable selection state |
| `loading` | `boolean` | Show loading skeleton |
| `sx` | `object` | MUI sx overrides |

### CardAction

| Prop | Type | Description |
|------|------|-------------|
| `id` | `string` | Unique action ID |
| `label` | `string` | Button text |
| `icon` | `ReactNode` | Button icon |
| `onClick` | `function` | Click handler |
| `color` | `string` | MUI color |
| `variant` | `string` | MUI variant |

## Customization

### Adding New Variants

1. Add variant to `GenericCardVariant` type in `types.ts`
2. Add styles to `getCardVariantStyles` in `variants.ts`
3. Use the variant in your component

### Custom Actions

Override the default action rendering:

```tsx
<GenericCard
  actions={actions}
  onRenderAction={(action) => (
    <CustomButton key={action.id} onClick={action.onClick}>
      {action.label}
    </CustomButton>
  )}
/>
```

## Examples

See `src/components/examples/CardExamples.tsx` for comprehensive usage examples.
