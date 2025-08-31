export interface CollapsiblePanelProps {
  title: string;
  children: React.ReactNode;
  defaultExpanded?: boolean;
  expanded?: boolean; // Add controlled expansion prop
  variant?: 'default' | 'primary' | 'secondary';
  size?: 'small' | 'medium' | 'large' | 'compact';
  icon?: React.ReactNode;
  onToggle?: (expanded: boolean) => void;
  className?: string;
  disabled?: boolean;
  sx?: any; // Add sx prop for additional styling
  headerRef?: (el: HTMLDivElement | null) => void; // ADD THIS
}
