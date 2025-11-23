# Mobile Breakpoint System

## Material-UI Standard Breakpoints

This app uses Material-UI's standard breakpoint system for consistent responsive design across all components.

### Breakpoint Values

| Breakpoint | Size Range | Device Types | Usage |
|------------|------------|--------------|-------|
| **xs** (extra-small) | 0-599px | Mobile portrait | Phone screens in portrait mode |
| **sm** (small) | 600-959px | Mobile landscape / Tablet portrait | Phones in landscape, small tablets |
| **md** (medium) | 960-1279px | Tablet landscape / Small desktop | Tablets in landscape, small laptops |
| **lg** (large) | 1280-1919px | Desktop | Standard desktop monitors |
| **xl** (extra-large) | 1920px+ | Large desktop | Large monitors, 4K displays |

## Usage in Components

### Material-UI sx Prop

Use breakpoint keys in the `sx` prop for responsive styling:

```tsx
<Box sx={{
  padding: { xs: 1, sm: 2, md: 3 },        // Padding scales up with screen size
  flexDirection: { xs: 'column', md: 'row' }, // Stack vertically on mobile
  width: { xs: '100%', lg: '80%' },        // Full width on mobile, 80% on desktop
}}>
```

### CSS Media Queries

Use these media queries in CSS files to match Material-UI breakpoints:

```css
/* Mobile only (xs: 0-599px) */
@media (max-width: 599px) {
  /* Mobile-specific styles */
}

/* Tablet and below (sm and xs: 0-959px) */
@media (max-width: 959px) {
  /* Tablet and mobile styles */
}

/* Tablet landscape and below (md and below: 0-1279px) */
@media (max-width: 1279px) {
  /* Medium screens and below */
}

/* Desktop (lg and up: 1280px+) */
@media (min-width: 1280px) {
  /* Desktop-specific styles */
}
```

## Current Mobile Optimizations

### Dashboard Layout
- **Mobile (xs)**: Vertical stack, water tracker below food program
- **Desktop (md+)**: Side-by-side layout available

### Typography Scaling
- **xs (0-599px)**: Reduced font sizes (h1: 1.75rem → 1.5rem on very small)
- **sm (600-959px)**: Standard mobile font sizes
- **md+ (960px+)**: Full desktop typography

### Spacing & Padding
- **xs**: Minimal padding (8-12px), compact spacing
- **sm**: Moderate padding (12-16px)
- **md+**: Full padding (16-24px)

### Touch Targets
- Minimum 44x44px touch targets on mobile (xs, sm)
- Buttons scale up on larger screens

## Component-Specific Breakpoints

### Page Container Width
```tsx
// Standard pattern for page containers
width: { xs: '100%', lg: '80%' }
```

### Grid Layouts
```tsx
// 1 column on mobile, 2 on tablet+
gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }
```

### Stack Direction
```tsx
// Vertical on mobile, horizontal on tablet+
direction={{ xs: 'column', sm: 'row' }}
```

## CSS Variables for Responsive Design

```css
:root {
  /* Card padding adjusts per breakpoint */
  --card-padding: 16px; /* Default */
}

@media (max-width: 599px) {
  :root {
    --card-padding: 12px;
    --spacing-section: 16px;
  }
}

@media (max-width: 374px) {
  :root {
    --card-padding: 8px;
    --spacing-section: 12px;
  }
}
```

## Testing Breakpoints

### Chrome DevTools
1. Open DevTools (F12)
2. Click device toolbar icon (Ctrl+Shift+M)
3. Test these device presets:
   - **iPhone SE** (375px) - xs
   - **iPhone 12/13/14** (390px) - xs
   - **iPad Mini** (768px) - sm
   - **iPad Air** (820px) - sm
   - **iPad Pro** (1024px) - md
   - **Laptop** (1280px) - lg
   - **Desktop** (1920px) - xl

### Responsive Design Mode in Firefox
1. Press Ctrl+Shift+M
2. Test custom dimensions or device presets

## Best Practices

1. **Mobile First**: Start with mobile (xs) styles, then add larger breakpoints
2. **Test All Breakpoints**: Ensure layouts work at 375px, 768px, 1024px, 1280px, 1920px
3. **Touch-Friendly**: Maintain 44px minimum touch targets on mobile
4. **Performance**: Use CSS for simple responsive changes, React for complex logic
5. **Consistency**: Use the same breakpoint keys throughout the app

## Common Patterns

### Responsive Padding
```tsx
p: { xs: 1, sm: 2, md: 3 }  // 8px → 16px → 24px
```

### Responsive Flex Direction
```tsx
flexDirection: { xs: 'column', md: 'row' }
```

### Responsive Grid Columns
```tsx
gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' }
```

### Responsive Font Sizes
```tsx
fontSize: { xs: '0.875rem', md: '1rem', lg: '1.125rem' }
```

### Responsive Visibility
```tsx
display: { xs: 'none', md: 'block' }  // Hide on mobile, show on desktop
```

## Notes

- All breakpoint values are defined in `src/AppRoot.tsx` theme configuration
- CSS media queries are in `src/index.css` and `src/styles/layout.css`
- Material-UI's `useMediaQuery` hook available for JavaScript breakpoint detection
- Viewport meta tag configured to prevent unwanted scaling on mobile
