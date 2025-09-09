import React from 'react';
import { Box, Typography, Alert } from '@mui/material';
import { FitnessCenter as GymIcon } from '@mui/icons-material';

const GymProgressPage: React.FC = () => {
  return (
    <Box sx={{ width: '100%', minHeight: '100vh', px: 3, py: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 4, maxWidth: '1400px', mx: 'auto' }}>
        <Typography variant="h3" sx={{ fontWeight: 700, mb: 1, display: 'flex', alignItems: 'center', gap: 2 }}>
          <GymIcon fontSize="large" color="primary" />
          Progress Tracking
        </Typography>
        <Typography variant="h6" color="text.secondary">
          Track your strength gains and workout analytics
        </Typography>
      </Box>

      {/* Content Container */}
      <Box sx={{ maxWidth: '1400px', mx: 'auto', width: '100%' }}>
        <Alert severity="info" sx={{ borderRadius: 2 }}>
          <Typography variant="h6" gutterBottom>
            📊 Coming Soon: Progress Tracking
          </Typography>
          <Typography>
            Track your strength gains, personal records, and workout analytics here.
          </Typography>
        </Alert>
      </Box>
    </Box>
  );
};

export default GymProgressPage;
