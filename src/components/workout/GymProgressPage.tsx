import React from 'react';
import { Box, Paper } from '@mui/material';
import ProgressTab from './ProgressTab';

const GymProgressPage: React.FC = () => {
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
          <ProgressTab />
        </Box>
      </Paper>
    </Box>
  );
};

export default GymProgressPage;
