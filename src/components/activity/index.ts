// Activity Component System
// Modular components for building flexible activity tracking cards

// Main Components
export { default as ActivityCard } from './ActivityCard';
export { default as ActivityHeader } from './ActivityHeader';
export { default as ActivityGridSection } from './ActivityGridSection';
export { default as ActivityStats } from './ActivityStats';
export { default as ActivityAction } from './ActivityAction';

// Re-export ActivityGrid and related types for convenience
export { default as ActivityGrid } from './ActivityGrid';
export type { ActivityGridDay, ActivityGridProps } from './ActivityGrid';

// Example usage:
/*
// Simple card with all defaults
<ActivityCard stats={stats} activityData={data} />

// Customized card
<ActivityCard 
  stats={stats}
  activityData={data}
  size="large"
  preset="enhanced"
  showStats={false}
  customStats={[
    { label: 'Goals Met', value: 15, color: '#4CAF50' },
    { label: 'Streak', value: '7 days', color: '#FF9800' }
  ]}
  actionLabel="View Details"
  onActionClick={() => console.log('Custom action')}
/>

// Individual components for custom layouts
<Card>
  <ActivityHeader title="Custom Layout" icon={<Icon />} primaryColor="#2196F3" />
  <ActivityGridSection activityData={data} primaryColor="#2196F3" />
  <ActivityStats {...statsProps} />
  <ActivityAction label="Custom Action" primaryColor="#2196F3" />
</Card>
*/
