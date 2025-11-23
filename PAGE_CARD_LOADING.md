# PageCard Loading State Feature

## Overview

The `PageCard` component now supports a ghost/skeleton loading effect that displays while page content is loading. This creates a smooth, professional user experience with consistent card dimensions across page transitions.

## Key Features

- **Instant Card Display**: PageCard structure loads immediately
- **Ghost Loading Effect**: Animated skeleton with shimmer effect
- **Seamless Transitions**: Smooth fade-in when content loads
- **Consistent Dimensions**: Card maintains same size during loading
- **Zero Layout Shift**: No jumping or repositioning during load

## Usage

### Basic Example

```tsx
import PageCard from '../components/shared/PageCard';

const MyPage: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData().then(() => setIsLoading(false));
  }, []);

  return (
    <PageCard 
      title="My Page" 
      loading={isLoading}
      skeletonSections={3}
    >
      {/* Your content here */}
    </PageCard>
  );
};
```

### With React Query

```tsx
const MyPage: React.FC = () => {
  const { data, isLoading } = useMyData();

  return (
    <PageCard title="My Page" loading={isLoading}>
      {data && <MyContent data={data} />}
    </PageCard>
  );
};
```

### Custom Skeleton Sections

Control the number of skeleton sections based on your page complexity:

```tsx
<PageCard 
  title="Complex Page"
  loading={isLoading}
  skeletonSections={5}  // Show 5 skeleton sections
>
  {/* Complex content */}
</PageCard>
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `loading` | `boolean` | `false` | Shows skeleton when true |
| `skeletonSections` | `number` | `3` | Number of skeleton sections to display |
| `title` | `string` | - | Page title (always visible) |
| `headerSlot` | `ReactNode` | - | Custom header content |
| `minHeight` | `string \| number` | `'calc(100vh - 200px)'` | Minimum height of card |
| `padding` | `number` | `3` | Content padding |
| `backgroundColor` | `string` | `'var(--surface-bg)'` | Background color |

## Implementation Details

### 1. Card Structure
The PageCard maintains its structure during loading:
- Header/title remains visible
- Border and shadow persist
- Width and positioning unchanged

### 2. Skeleton Animation
- Wave animation for shimmer effect
- Responsive layout (mobile/desktop)
- Theme-aware colors using CSS variables

### 3. Content Transition
When loading completes:
- Smooth fade-in effect (300ms)
- Subtle slide-up animation
- No layout shift

## Examples in Codebase

### DashboardPage
```tsx
<PageCard 
  title="Dashboard" 
  loading={!isExpandedView && !selectedDay}
  skeletonSections={2}
>
  {/* Dashboard content */}
</PageCard>
```

### WaterTrackerPage
```tsx
<PageCard 
  title="Water Tracker" 
  loading={isLoading} 
  skeletonSections={2}
>
  {/* Water tracker content */}
</PageCard>
```

### FoodTrackerPage
```tsx
<PageCard 
  padding={0} 
  loading={isLoading} 
  skeletonSections={3}
>
  {/* Food tracker tabs */}
</PageCard>
```

### Static Pages (No Loading)
For pages with static content (AboutPage, ProfilePage), simply omit the `loading` prop:

```tsx
<PageCard title="About">
  {/* Static content */}
</PageCard>
```

## Best Practices

### 1. Set Loading State Early
Initialize loading state to `true` and set to `false` when ready:

```tsx
const [isLoading, setIsLoading] = useState(true);
```

### 2. Match Skeleton Sections to Content
- Simple pages: 1-2 sections
- Standard pages: 3 sections (default)
- Complex pages: 4-5 sections

### 3. Use with Async Data
Combine with React Query or useEffect:

```tsx
const { data, isLoading } = useQuery(['key'], fetchData);

return <PageCard loading={isLoading}>...</PageCard>;
```

### 4. Avoid Flickering
For fast operations (<100ms), consider a minimum loading time:

```tsx
useEffect(() => {
  const timer = setTimeout(() => setIsLoading(false), 100);
  return () => clearTimeout(timer);
}, []);
```

## Customization

### Custom Skeleton Component
If you need a different skeleton layout, you can create your own:

```tsx
import { PageCardSkeleton } from '../components/shared/PageCardSkeleton';

// Use in your custom component
<PageCardSkeleton 
  showTitle={false}
  sections={4}
  minHeight="600px"
/>
```

### Theme Integration
Skeleton uses CSS variables for theming:
- `--surface-bg`: Background color
- `--meal-row-bg`: Skeleton element color
- `--border-color`: Border color

## Performance Considerations

- **Lightweight**: Minimal performance impact
- **CSS Animations**: Hardware-accelerated
- **No Re-renders**: Skeleton doesn't cause content re-renders
- **Lazy Loading**: Content only renders when loaded

## Browser Support

- ✅ Chrome/Edge (latest)
- ✅ Firefox (latest)
- ✅ Safari (latest)
- ✅ Mobile browsers

## Accessibility

- Skeleton maintains proper heading hierarchy
- Content fade-in is smooth and non-disruptive
- No layout shift improves reading experience
- Works with screen readers (content announced when loaded)

## Troubleshooting

### Skeleton Not Showing
Ensure `loading` prop is set to `true` initially:
```tsx
const [isLoading, setIsLoading] = useState(true); // ✅ Correct
const [isLoading, setIsLoading] = useState(false); // ❌ Wrong
```

### Content Flashing
If content flashes, add a minimum loading delay:
```tsx
useEffect(() => {
  const timer = setTimeout(() => setIsLoading(false), 100);
  return () => clearTimeout(timer);
}, []);
```

### Layout Shift
Ensure `minHeight` matches your content's typical height:
```tsx
<PageCard loading={isLoading} minHeight="800px">
```

## Future Enhancements

- [ ] Skeleton variants (list, grid, form)
- [ ] Custom skeleton templates
- [ ] Progressive loading (sections load individually)
- [ ] Skeleton color customization
- [ ] Loading progress indicator

## Migration Guide

### Before
```tsx
<PageCard title="My Page">
  {isLoading ? <CircularProgress /> : <MyContent />}
</PageCard>
```

### After
```tsx
<PageCard title="My Page" loading={isLoading}>
  <MyContent />
</PageCard>
```

## Summary

The PageCard loading state feature provides:
1. ✅ Consistent card structure across all pages
2. ✅ Professional ghost loading effect
3. ✅ Smooth transitions without layout shift
4. ✅ Simple API with sensible defaults
5. ✅ Theme-aware and responsive
6. ✅ Zero performance impact

This improves perceived performance and creates a polished, professional user experience.
