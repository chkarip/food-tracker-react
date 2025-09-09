import React, { useState } from 'react';
import { Box, Typography, Tabs, Tab } from '@mui/material';
import { FitnessCenter as GymIcon } from '@mui/icons-material';
import WorkoutBuilder from '../workout/WorkoutBuilder';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`workout-tabpanel-${index}`}
      aria-labelledby={`workout-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ pt: 2 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const GymWorkoutsPage: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  return (
    <Box sx={{ width: '100%', minHeight: '100vh', px: 3, py: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 4, maxWidth: '1400px', mx: 'auto' }}>
        <Typography variant="h3" sx={{ fontWeight: 700, mb: 1, display: 'flex', alignItems: 'center', gap: 2 }}>
          <GymIcon fontSize="large" color="primary" />
          Gym Tracker
        </Typography>
        <Typography variant="h6" color="text.secondary">
          Build and manage your workout routines
        </Typography>
      </Box>

      {/* Secondary Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3, maxWidth: '1400px', mx: 'auto' }}>
        <Tabs value={tabValue} onChange={handleTabChange} aria-label="workout tabs">
          <Tab label="Builder" />
          <Tab label="My Workouts" />
        </Tabs>
      </Box>

      {/* Content Container */}
      <Box sx={{ maxWidth: '1400px', mx: 'auto', width: '100%' }}>
        {/* Tab 1: Builder */}
        <TabPanel value={tabValue} index={0}>
          <WorkoutBuilder />
        </TabPanel>

        {/* Tab 2: My Workouts */}
        <TabPanel value={tabValue} index={1}>
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <Typography variant="h5" gutterBottom>
              My Workouts
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Your saved workout routines will appear here.
            </Typography>
          </Box>
        </TabPanel>
      </Box>
    </Box>
  );
};

export default GymWorkoutsPage;
