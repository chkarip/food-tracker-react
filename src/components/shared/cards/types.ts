import React from 'react';

export type CardAction = {
  id: string;
  label?: string;
  icon?: React.ReactNode;
  onClick?: (e: React.MouseEvent) => void;
  color?: 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'error';
  variant?: 'text' | 'outlined' | 'contained' | 'icon';
  disabled?: boolean;
  visible?: boolean;
  tooltip?: string;
  edge?: 'start' | 'end';
  'aria-label'?: string;
};

export type GenericCardVariant = 'default' | 'recipe' | 'summary' | 'exercise';
export type GenericCardSize = 'sm' | 'md' | 'lg';

export interface GenericCardProps {
  title?: string;
  subtitle?: string;
  icon?: React.ReactNode;
  imageUrl?: string;
  mediaAspect?: '16:9' | '4:3' | '1:1' | 'auto';

  content?: React.ReactNode;
  footer?: React.ReactNode;

  actions?: CardAction[];
  overflowActions?: CardAction[];
  onRenderAction?: (action: CardAction) => React.ReactNode;

  selectable?: boolean;
  selected?: boolean;
  disabled?: boolean;
  loading?: boolean;
  href?: string;
  onClick?: () => void;

  variant?: GenericCardVariant;
  size?: GenericCardSize;
  elevation?: number;
  compact?: boolean;

  headerSlot?: React.ReactNode;
  mediaSlot?: React.ReactNode;
  bodySlot?: React.ReactNode;
  footerSlot?: React.ReactNode;

  colorTone?: 'neutral' | 'success' | 'warning' | 'info' | 'danger';
  highlight?: boolean;

  sx?: any; // allow local overrides while relying on theme variables
}
