/**
 * PageCard Component Usage Examples
 * 
 * This file demonstrates various ways to use the PageCard component
 */

import React from 'react';
import PageCard, { PageCardSection } from './PageCard';
import { Typography, Box } from '@mui/material';

// Example 1: Simple page with title
export const SimplePageExample = () => (
  <PageCard title="My Page Title">
    <Typography>This is a simple page with a title</Typography>
  </PageCard>
);

// Example 2: Page without title
export const NoTitlePageExample = () => (
  <PageCard>
    <Typography>This page has no title, just content</Typography>
  </PageCard>
);

// Example 3: Page with custom header slot
export const CustomHeaderExample = () => (
  <PageCard
    headerSlot={
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h5">Custom Header</Typography>
        <Typography variant="body2" color="text.secondary">
          Friday, November 22, 2025
        </Typography>
      </Box>
    }
  >
    <Typography>Content with custom header layout</Typography>
  </PageCard>
);

// Example 4: Two-column layout with sections (70/30 split)
export const TwoColumnLayoutExample = () => (
  <PageCard title="Split Layout">
    <Box sx={{ display: 'flex', gap: 3 }}>
      <PageCardSection flex="70%" minWidth={0}>
        <Typography variant="h6">Main Content (70%)</Typography>
        <Typography>This section takes 70% of the width</Typography>
      </PageCardSection>
      
      <PageCardSection flex="30%" minWidth={0}>
        <Typography variant="h6">Sidebar (30%)</Typography>
        <Typography>This section takes 30% of the width</Typography>
      </PageCardSection>
    </Box>
  </PageCard>
);

// Example 5: Three-column equal layout
export const ThreeColumnLayoutExample = () => (
  <PageCard title="Three Columns">
    <Box sx={{ display: 'flex', gap: 2 }}>
      <PageCardSection flex={1}>
        <Typography>Column 1</Typography>
      </PageCardSection>
      
      <PageCardSection flex={1}>
        <Typography>Column 2</Typography>
      </PageCardSection>
      
      <PageCardSection flex={1}>
        <Typography>Column 3</Typography>
      </PageCardSection>
    </Box>
  </PageCard>
);

// Example 6: Complex layout with sections and custom styling
export const ComplexLayoutExample = () => (
  <PageCard 
    title="Dashboard"
    minHeight="calc(100vh - 150px)"
    padding={3}
  >
    {/* Top section - full width */}
    <Box sx={{ mb: 3 }}>
      <Typography variant="h6">Header Section</Typography>
      <Typography color="text.secondary">Full width content area</Typography>
    </Box>

    {/* Main content - 60/40 split */}
    <Box sx={{ display: 'flex', gap: 3, mb: 3 }}>
      <PageCardSection flex="60%" minWidth={300}>
        <Box sx={{ 
          p: 2, 
          backgroundColor: 'var(--surface-bg)', 
          borderRadius: 2,
          border: '1px solid var(--border-color)'
        }}>
          <Typography variant="h6">Main Content Area (60%)</Typography>
          <Typography>Primary content goes here</Typography>
        </Box>
      </PageCardSection>
      
      <PageCardSection flex="40%" minWidth={200}>
        <Box sx={{ 
          p: 2, 
          backgroundColor: 'var(--surface-bg)', 
          borderRadius: 2,
          border: '1px solid var(--border-color)'
        }}>
          <Typography variant="h6">Sidebar (40%)</Typography>
          <Typography>Secondary content, stats, etc.</Typography>
        </Box>
      </PageCardSection>
    </Box>

    {/* Bottom section - full width */}
    <Box>
      <Typography variant="h6">Footer Section</Typography>
      <Typography color="text.secondary">Another full width area</Typography>
    </Box>
  </PageCard>
);

// Example 7: Responsive layout
export const ResponsiveLayoutExample = () => (
  <PageCard title="Responsive Layout">
    <Box sx={{ 
      display: 'grid', 
      gridTemplateColumns: { xs: '1fr', md: '2fr 1fr' }, 
      gap: 3 
    }}>
      <Box sx={{ p: 2, backgroundColor: 'var(--surface-bg)', borderRadius: 2 }}>
        <Typography>Main content (stacks on mobile, 2/3 on desktop)</Typography>
      </Box>
      
      <Box sx={{ p: 2, backgroundColor: 'var(--surface-bg)', borderRadius: 2 }}>
        <Typography>Sidebar (stacks on mobile, 1/3 on desktop)</Typography>
      </Box>
    </Box>
  </PageCard>
);
