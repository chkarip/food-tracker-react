import React from 'react';
import {
  Box,
  Paper,
  Typography,
  Card,
  CardContent,
  Alert,
  Button,
  Stack
} from '@mui/material';
import {
  FitnessCenter as GymIcon,
  Construction as ConstructionIcon,
  Timeline as ProgressIcon,
  Schedule as ScheduleIcon
} from '@mui/icons-material';

const GymPage: React.FC = () => {
  return (
    <Box sx={{ height: '100vh', overflow: 'auto', p: 2 }}>
      {/* Header */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
          <GymIcon sx={{ fontSize: 40, color: 'secondary.main' }} />
          <Box>
            <Typography variant="h4" gutterBottom>
              Gym & Workout Planner
            </Typography>
            <Typography variant="h6" color="primary.main">
              {new Date().toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </Typography>
          </Box>
        </Box>
        <Typography variant="subtitle1" color="text.secondary">
          Plan your workouts, track your progress, and schedule your gym sessions.
        </Typography>
      </Paper>

      {/* Under Construction Alert */}
      <Alert 
        severity="info" 
        icon={<ConstructionIcon />}
        sx={{ mb: 3 }}
      >
        <Typography variant="h6" gutterBottom>
          🚧 Under Construction
        </Typography>
        <Typography>
          This section is currently being developed. Soon you'll be able to:
        </Typography>
      </Alert>

      {/* Coming Soon Features */}
      <Stack spacing={3}>
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
              <ScheduleIcon color="secondary" />
              <Typography variant="h6">
                Workout Scheduling
              </Typography>
            </Box>
            <Typography color="text.secondary">
              • Create and manage workout schedules
              • Set recurring gym sessions
              • Plan weekly workout routines
              • Integration with daily calendar
            </Typography>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
              <GymIcon color="secondary" />
              <Typography variant="h6">
                Exercise Database
              </Typography>
            </Box>
            <Typography color="text.secondary">
              • Comprehensive exercise library
              • Custom workout creation
              • Exercise instructions and videos
              • Muscle group targeting
            </Typography>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
              <ProgressIcon color="secondary" />
              <Typography variant="h6">
                Progress Tracking
              </Typography>
            </Box>
            <Typography color="text.secondary">
              • Weight and rep tracking
              • Progress charts and analytics
              • Personal records (PRs)
              • Body measurements tracking
            </Typography>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
              <Typography variant="h6">
                📱 Mobile-Friendly Interface
              </Typography>
            </Box>
            <Typography color="text.secondary">
              • Responsive design for gym use
              • Quick workout logging
              • Timer and rest periods
              • Offline capability
            </Typography>
          </CardContent>
        </Card>
      </Stack>

      {/* Call to Action */}
      <Box sx={{ textAlign: 'center', mt: 4, p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Stay tuned for updates!
        </Typography>
        <Typography color="text.secondary" sx={{ mb: 2 }}>
          In the meantime, you can use the Daily Schedule to plan your gym sessions.
        </Typography>
        <Button 
          variant="contained" 
          color="secondary"
          disabled
          sx={{ mr: 2 }}
        >
          Coming Soon
        </Button>
        <Button 
          variant="outlined" 
          onClick={() => window.history.back()}
        >
          Go Back
        </Button>
      </Box>
    </Box>
  );
};

export default GymPage;
