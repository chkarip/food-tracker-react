import React from 'react';
import { Box } from '@mui/material';
import WorkoutBuilder from '../workout/WorkoutBuilder';

const GymWorkoutsPage: React.FC = () => {
  return (
    <Box sx={{ width: '100%', minHeight: '100vh', px: 3, py: 2 }}>
      {/* Content Container */}
      <Box sx={{ maxWidth: '1400px', mx: 'auto', width: '100%' }}>
        <WorkoutBuilder />
      </Box>
    </Box>
  );
};

export default GymWorkoutsPage;
