import React from 'react';
import {
  Box,
  Typography,
} from '@mui/material';

interface ActivityHeaderProps {
  title: string;
  description?: string;
  icon: React.ReactNode;
  primaryColor: string;
  subtitle?: string;
  showIcon?: boolean;
  size?: 'small' | 'medium' | 'large';
}

const ActivityHeader: React.FC<ActivityHeaderProps> = ({
  title,
  description,
  icon,
  primaryColor,
  subtitle,
  showIcon = true,
  size = 'medium'
}) => {
  const iconSize = size === 'small' ? 32 : size === 'large' ? 56 : 40;
  const titleVariant = size === 'small' ? 'subtitle1' : size === 'large' ? 'h5' : 'h6';

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
      {showIcon && (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: iconSize,
            height: iconSize,
            borderRadius: size === 'small' ? 2 : 3,
            background: `linear-gradient(135deg, ${primaryColor}, rgba(${primaryColor.replace('#', '')}, 0.8))`,
            mr: 1.5,
            color: 'white',
            fontSize: size === 'small' ? '1rem' : size === 'large' ? '1.5rem' : '1.2rem'
          }}
        >
          {icon}
        </Box>
      )}
      <Box sx={{ flex: 1 }}>
        <Typography variant={titleVariant} sx={{ fontWeight: 600, mb: 0.1, lineHeight: 1.1 }}>
          {title}
        </Typography>
        {description && (
          <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.7rem', lineHeight: 1 }}>
            {description}
          </Typography>
        )}
        {subtitle && (
          <Typography variant="caption" color="text.secondary" display="block" sx={{ fontSize: '0.65rem' }}>
            {subtitle}
          </Typography>
        )}
      </Box>
    </Box>
  );
};

export default ActivityHeader;
