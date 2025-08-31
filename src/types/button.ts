export interface AccentButtonProps {
  children: React.ReactNode;
  onClick?: (event?: React.SyntheticEvent | React.FormEvent) => void | Promise<void>;
  variant?: 'primary' | 'secondary' | 'danger' | 'success';
  size?: 'small' | 'medium' | 'large' | 'compact';
  disabled?: boolean;
  fullWidth?: boolean;
  loading?: boolean;
  className?: string;
  style?: React.CSSProperties;
  startIcon?: React.ReactNode;
  endIcon?: React.ReactNode;
}
