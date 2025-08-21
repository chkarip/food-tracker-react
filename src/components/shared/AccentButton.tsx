import React from 'react';
import { AccentButtonProps } from '../../types/button';
import './AccentButton.css';

const AccentButton: React.FC<AccentButtonProps> = ({
  children,
  onClick,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  fullWidth = false,
  loading = false,
  className = '',
  style,
}) => {
  const buttonClass = [
    'accent-button',
    `accent-button--${variant}`,
    `accent-button--${size}`,
    fullWidth ? 'accent-button--full-width' : '',
    disabled ? 'accent-button--disabled' : '',
    loading ? 'accent-button--loading' : '',
    className
  ].filter(Boolean).join(' ');

  return (
    <button
      className={buttonClass}
      onClick={onClick}
      disabled={disabled || loading}
      type="button"
      style={style}
    >
      {loading && <span className="accent-button__spinner"></span>}
      <span className={loading ? 'accent-button__text--loading' : ''}>
        {children}
      </span>
    </button>
  );
};

export default AccentButton;
