import React from 'react';
import { Box, Typography, Alert } from '@mui/material';

const GymSchedulePage: React.FC = () => {
  return (
    <Box sx={{ width: '100%', minHeight: '100vh', px: 3, py: 2 }}>
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
