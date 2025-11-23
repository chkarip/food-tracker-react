import React, { useEffect, useRef, useState } from 'react';
import {
  Box,
  Stack,
  Divider
} from '@mui/material';
import { useLocation } from 'react-router-dom';
import UserProfileManager from '../components/food-management/UserProfileManager';
import { TimeslotSettings } from '../components/profile/TimeslotSettings';
import { MacroSettings } from '../components/profile/MacroSettings';
import { WaterSettings } from '../components/profile/WaterSettings';
import PageCard from '../components/shared/PageCard';
import CollapsiblePanel from '../components/shared/CollapsiblePanel';

const ProfilePage: React.FC = () => {
  const location = useLocation();
  const timeslotsRef = useRef<HTMLDivElement>(null);
  const macrosRef = useRef<HTMLDivElement>(null);
  const waterRef = useRef<HTMLDivElement>(null);
  
  // Check if we're navigating to a specific section
  const hash = location.hash.replace('#', '');
  const [timeslotsExpanded, setTimeslotsExpanded] = useState(hash === 'timeslots');
  const [macrosExpanded, setMacrosExpanded] = useState(hash === 'macros');
  const [waterExpanded, setWaterExpanded] = useState(hash === 'water');

  // Handle focus navigation from Food page
  useEffect(() => {
    const currentHash = location.hash.replace('#', '');
    
    if (currentHash === 'timeslots') {
      // Expand the timeslots panel
      setTimeslotsExpanded(true);
      // Scroll after a delay to ensure panel is expanded and rendered
      setTimeout(() => {
        if (timeslotsRef.current) {
          const elementTop = timeslotsRef.current.getBoundingClientRect().top + window.scrollY;
          const offset = 100; // Offset from top of viewport
          window.scrollTo({ top: elementTop - offset, behavior: 'smooth' });
        }
      }, 600);
    } else if (currentHash === 'macros') {
      // Expand the macros panel
      setMacrosExpanded(true);
      // Scroll after a delay to ensure panel is expanded and rendered
      setTimeout(() => {
        if (macrosRef.current) {
          const elementTop = macrosRef.current.getBoundingClientRect().top + window.scrollY;
          const offset = 100; // Offset from top of viewport
          window.scrollTo({ top: elementTop - offset, behavior: 'smooth' });
        }
      }, 600);
    } else if (currentHash === 'water') {
      // Expand the water panel
      setWaterExpanded(true);
      // Scroll after a delay to ensure panel is expanded and rendered
      setTimeout(() => {
        if (waterRef.current) {
          const elementTop = waterRef.current.getBoundingClientRect().top + window.scrollY;
          const offset = 100; // Offset from top of viewport
          window.scrollTo({ top: elementTop - offset, behavior: 'smooth' });
        }
      }, 600);
    }
  }, [location.hash]);

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
          {/* User Profile Section */}
          <UserProfileManager />

          {/* Timeslot Configuration Section */}
          <Box ref={timeslotsRef}>
            <CollapsiblePanel
              title="⏰ Meal Timeslots"
              variant="primary"
              size="large"
              expanded={timeslotsExpanded}
              onToggle={() => setTimeslotsExpanded(!timeslotsExpanded)}
            >
              <TimeslotSettings />
            </CollapsiblePanel>
          </Box>

          {/* Macro Targets Section */}
          <Box ref={macrosRef}>
            <CollapsiblePanel
              title="🎯 Macro Targets"
              variant="secondary"
              size="large"
              expanded={macrosExpanded}
              onToggle={() => setMacrosExpanded(!macrosExpanded)}
            >
              <MacroSettings />
            </CollapsiblePanel>
          </Box>

          {/* Water Intake Section */}
          <Box ref={waterRef}>
            <CollapsiblePanel
              title="💧 Daily Water Intake"
              variant="primary"
              size="large"
              expanded={waterExpanded}
              onToggle={() => setWaterExpanded(!waterExpanded)}
            >
              <WaterSettings />
            </CollapsiblePanel>
          </Box>
        </Stack>
      </PageCard>
    </Box>
  );
};

export default ProfilePage;
