import React from 'react';
import {
  Stack,
  Divider
} from '@mui/material';
import UserProfileManager from '../components/food-management/UserProfileManager';
import NutritionGoalsManager from '../components/food-management/NutritionGoalsManager';
import PageCard from '../components/shared/PageCard';

const ProfilePage: React.FC = () => {
  return (
    <PageCard title="Profile" padding={2}>
      <Stack spacing={4} divider={<Divider />}>
        <UserProfileManager />
        <NutritionGoalsManager />
      </Stack>
    </PageCard>
  );
};

export default ProfilePage;
