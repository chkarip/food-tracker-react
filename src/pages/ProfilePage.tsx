import React from 'react';
import {
  Box,
  Paper,
  Stack,
  Divider
} from '@mui/material';
import UserProfileManager from '../components/food-management/UserProfileManager';
import NutritionGoalsManager from '../components/food-management/NutritionGoalsManager';

const ProfilePage: React.FC = () => {
  return (
    <Box sx={{ minHeight: '100vh', p: 2 }}>
      <Paper
        sx={{
          borderRadius: 4,
          overflow: 'hidden',
          backgroundColor: 'var(--card-bg)',
          border: '1px solid var(--border-color)',
          boxShadow: 'var(--elevation-1)',
          width: { xs: '100%', lg: '80%' },
          maxWidth: 1200,
          mx: 'auto'
        }}
      >
        {/* Content */}
        <Box sx={{
          backgroundColor: 'var(--surface-bg)',
          minHeight: 'calc(100vh - 200px)',
          p: 2
        }}>
          <Stack spacing={4} divider={<Divider />}>
            <UserProfileManager />
            <NutritionGoalsManager />
          </Stack>
        </Box>
      </Paper>
    </Box>
  );
};

export default ProfilePage;
