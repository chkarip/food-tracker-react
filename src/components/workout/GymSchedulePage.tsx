import React from 'react';
import { Typography, Alert } from '@mui/material';
import PageCard from '../shared/PageCard';

const GymSchedulePage: React.FC = () => {
  return (
    <PageCard title="Workout Schedule">
      <Alert severity="info" sx={{ 
        borderRadius: 2
      }}>
        <Typography variant="h6" gutterBottom>
          🗓️ Coming Soon: Workout Scheduling
        </Typography>
        <Typography>
          Plan your workout routines by day, track your progress, and set reminders for your training sessions.
        </Typography>
      </Alert>
    </PageCard>
  );
};

export default GymSchedulePage;
