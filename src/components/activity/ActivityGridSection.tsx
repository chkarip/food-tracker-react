import React, { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  CircularProgress,
  Alert
} from '@mui/material';
import ActivityGrid, { ActivityGridDay } from '../ActivityGrid';

interface ActivityGridSectionProps {
  activityData: ActivityGridDay[];
  size?: 'small' | 'medium' | 'large';
  preset?: 'default' | 'enhanced' | 'compact' | 'minimal';
  primaryColor: string;
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  title?: string;
  showTitle?: boolean;
  dayCount?: number;
  customMessage?: string;
}

const ActivityGridSection: React.FC<ActivityGridSectionProps> = ({
  activityData,
  size = 'medium',
  preset = 'enhanced',
  primaryColor,
  loading = false,
  error = null,
  onRetry,
  title = 'Last 100 Days',
  showTitle = true,
  dayCount = 100,
  customMessage
}) => {
  const [retrying, setRetrying] = useState(false);

  const handleRetry = async () => {
    if (!onRetry) return;
    
    setRetrying(true);
    try {
      await onRetry();
    } finally {
      setRetrying(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ mb: 3 }}>
        {showTitle && (
          <Typography variant="caption" sx={{ 
            fontSize: '0.6rem',
            textAlign: 'center',
            opacity: 0.8,
            display: 'block',
            mb: 1
          }}>
            {title}
          </Typography>
        )}
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center',
          height: 60
        }}>
          <CircularProgress size={24} sx={{ color: primaryColor }} />
          <Typography variant="caption" sx={{ opacity: 0.7, ml: 1 }}>
            Loading...
          </Typography>
        </Box>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ mb: 3 }}>
        {showTitle && (
          <Typography variant="caption" sx={{ 
            fontSize: '0.6rem',
            textAlign: 'center',
            opacity: 0.8,
            display: 'block',
            mb: 1
          }}>
            {title}
          </Typography>
        )}
        <Box sx={{ 
          display: 'flex', 
          flexDirection: 'column',
          justifyContent: 'center', 
          alignItems: 'center',
          minHeight: 80,
          textAlign: 'center',
          p: 2
        }}>
          <Alert 
            severity="warning" 
            sx={{ 
              mb: 2, 
              '& .MuiAlert-message': { 
                fontSize: '0.7rem' 
              } 
            }}
          >
            {error}
          </Alert>
          {onRetry && (
            <Button 
              size="small" 
              variant="outlined" 
              onClick={handleRetry}
              disabled={retrying}
              sx={{ 
                color: primaryColor, 
                borderColor: primaryColor,
                fontSize: '0.6rem',
                py: 0.5,
                px: 1,
                '&:hover': {
                  borderColor: primaryColor,
                  bgcolor: `${primaryColor}10`
                }
              }}
            >
              {retrying ? 'Retrying...' : 'Retry'}
            </Button>
          )}
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ mb: 1.5 }}>
      {showTitle && (
        <Typography variant="caption" sx={{ 
          fontSize: '0.6rem',
          textAlign: 'center',
          opacity: 0.8,
          display: 'block',
          mb: 0.5
        }}>
          {title}
        </Typography>
      )}
      
      <ActivityGrid 
        activityData={activityData}
        size={size}
        preset={preset}
        primaryColor={primaryColor}
        dayCount={dayCount}
        showHover={true}
        showTooltips={true}
      />
      
      {customMessage && (
        <Typography variant="caption" sx={{ 
          opacity: 0.8, 
          fontSize: '0.65rem',
          textAlign: 'center',
          display: 'block',
          mt: 0.5
        }}>
          {customMessage}
        </Typography>
      )}
    </Box>
  );
};

export default ActivityGridSection;
