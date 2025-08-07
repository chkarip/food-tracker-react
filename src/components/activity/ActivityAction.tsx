import React from 'react';
import {
  Button,
  alpha
} from '@mui/material';
import { useNavigate } from 'react-router-dom';

interface ActivityActionProps {
  label: string;
  route?: string;
  onClick?: () => void;
  primaryColor: string;
  disabled?: boolean;
  variant?: 'contained' | 'outlined' | 'text';
  size?: 'small' | 'medium' | 'large';
  fullWidth?: boolean;
  icon?: React.ReactNode;
}

const ActivityAction: React.FC<ActivityActionProps> = ({
  label,
  route,
  onClick,
  primaryColor,
  disabled = false,
  variant = 'contained',
  size = 'small',
  fullWidth = true,
  icon
}) => {
  const navigate = useNavigate();

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else if (route) {
      navigate(route);
    }
  };

  const getButtonStyles = () => {
    if (variant === 'contained') {
      return {
        background: `linear-gradient(135deg, ${primaryColor}, ${alpha(primaryColor, 0.8)})`,
        color: 'white',
        '&:hover': {
          background: `linear-gradient(135deg, ${alpha(primaryColor, 0.9)}, ${alpha(primaryColor, 0.7)})`,
        },
        '&:disabled': {
          background: alpha(primaryColor, 0.3),
          color: alpha('#ffffff', 0.5)
        }
      };
    } else if (variant === 'outlined') {
      return {
        borderColor: primaryColor,
        color: primaryColor,
        '&:hover': {
          backgroundColor: alpha(primaryColor, 0.1),
          borderColor: primaryColor,
        },
      };
    } else {
      return {
        color: primaryColor,
        '&:hover': {
          backgroundColor: alpha(primaryColor, 0.1),
        },
      };
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      fullWidth={fullWidth}
      onClick={handleClick}
      disabled={disabled}
      startIcon={icon}
      sx={getButtonStyles()}
    >
      {label}
    </Button>
  );
};

export default ActivityAction;
