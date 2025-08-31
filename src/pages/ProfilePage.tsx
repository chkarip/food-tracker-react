import React from 'react';
import {
  Box,
  Paper,
  Typography
} from '@mui/material';
import {
  Person as PersonIcon,
} from '@mui/icons-material';
import UserProfileManager from '../components/food-management/UserProfileManager';

const ProfilePage: React.FC = () => {
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
        {/* Header */}
        <Box sx={{
          p: 3,
          background: 'linear-gradient(135deg, var(--meal-bg-primary) 0%, var(--meal-bg-secondary) 100%)',
          borderRadius: '16px 16px 0 0',
          borderBottom: '2px solid var(--meal-border-primary)',
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          boxShadow: 'var(--meal-shadow-primary)'
        }}>
          <PersonIcon
            sx={{
              fontSize: 40,
              color: 'var(--meal-primary)',
              filter: 'drop-shadow(0 2px 4px rgba(59, 186, 117, 0.3))'
            }}
          />
          <Box>
            <Typography
              variant="h4"
              sx={{
                color: 'var(--meal-heading-color)',
                fontWeight: 700,
                textShadow: '0 1px 2px rgba(0,0,0,0.1)',
                mb: 0.5
              }}
            >
              User Profile
            </Typography>
            <Typography
              variant="body1"
              sx={{
                color: 'var(--meal-subheading-color)',
                fontWeight: 500
              }}
            >
              Manage your personal information and preferences
            </Typography>
          </Box>
        </Box>

        {/* Content */}
        <Box sx={{
          backgroundColor: 'var(--surface-bg)',
          minHeight: 'calc(100vh - 200px)',
          p: 2
        }}>
          <UserProfileManager />
        </Box>
      </Paper>
    </Box>
  );
};

export default ProfilePage;
