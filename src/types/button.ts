export interface AccentButtonProps {
  children: React.ReactNode;
  onClick?: (event?: React.SyntheticEvent | React.FormEvent) => void | Promise<void>;
  variant?: 'primary' | 'secondary' | 'danger' | 'success';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  fullWidth?: boolean;
  loading?: boolean;
  className?: string;
  style?: React.CSSProperties; // ✅ Add this line
}
