import React from 'react';
import { Box, Paper, Typography, Alert } from '@mui/material';

const GymSchedulePage: React.FC = () => {
  return (
    <Box sx={{ minHeight: '100vh', p: 2 }}>
      <Paper
        sx={{
          borderRadius: 4,
          overflow: 'hidden',
          backgroundColor: 'var(--card-bg)',
          border: '1px solid var(--border-color)',
          boxShadow: 'var(--elevation-1)'
        }}
      >
        <Box sx={{ p: 3, backgroundColor: 'var(--surface-bg)' }}>
          <Alert severity="info" sx={{ borderRadius: 2 }}>
            <Typography variant="h6" gutterBottom>
              🗓️ Coming Soon: Workout Scheduling
            </Typography>
            <Typography>
              Plan your workout routines by day, track your progress, and set reminders for your training sessions.
            </Typography>
          </Alert>
        </Box>
      </Paper>
    </Box>
  );
};

export default GymSchedulePage;
