import React from 'react';
import { Box, Typography, Alert } from '@mui/material';
import { FitnessCenter as GymIcon } from '@mui/icons-material';

const GymSchedulePage: React.FC = () => {
  return (
    <Box sx={{ width: '100%', minHeight: '100vh', px: 3, py: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 4, maxWidth: '1400px', mx: 'auto' }}>
        <Typography variant="h3" sx={{ fontWeight: 700, mb: 1, display: 'flex', alignItems: 'center', gap: 2 }}>
          <GymIcon fontSize="large" color="primary" />
          Workout Schedule
        </Typography>
        <Typography variant="h6" color="text.secondary">
          Plan and organize your workout schedule
        </Typography>
      </Box>

      {/* Content Container */}
      <Box sx={{ maxWidth: '1400px', mx: 'auto', width: '100%' }}>
        <Alert severity="info" sx={{ borderRadius: 2 }}>
          <Typography variant="h6" gutterBottom>
            🗓️ Coming Soon: Workout Scheduling
          </Typography>
          <Typography>
            Plan your workout routines by day, track your progress, and set reminders for your training sessions.
          </Typography>
        </Alert>
      </Box>
    </Box>
  );
};

export default GymSchedulePage;
