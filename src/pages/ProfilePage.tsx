import React from 'react';
import {
  Box,
  Stack,
  Divider
} from '@mui/material';
import UserProfileManager from '../components/food-management/UserProfileManager';
import NutritionGoalsManager from '../components/food-management/NutritionGoalsManager';
import PageCard from '../components/shared/PageCard';

const ProfilePage: React.FC = () => {
  return (
    <Box sx={{ minHeight: '100vh', pt: 1, px: 2, pb: 2 }}>
      {/* Placeholder for tab navigation to match Food pages */}
      <Box sx={{ 
        width: { xs: '100%', lg: '80%' },
        maxWidth: 1200,
        mx: 'auto',
        mt: 2,
        mb: 2,
        height: 20,
        visibility: 'hidden'
      }} />

      <PageCard title="Profile" padding={2}>
      <Stack spacing={4} divider={<Divider />}>
        <UserProfileManager />
        <NutritionGoalsManager />
      </Stack>
    </PageCard>
    </Box>
  );
};

export default ProfilePage;
