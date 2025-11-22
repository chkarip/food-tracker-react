import React from 'react';
import ProgressTab from './ProgressTab';
import PageCard from '../shared/PageCard';

const GymProgressPage: React.FC = () => {
  return (
    <PageCard title="Workout Progress">
      <ProgressTab />
    </PageCard>
  );
};

export default GymProgressPage;
