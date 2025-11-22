import React from 'react';
import WorkoutBuilder from '../workout/WorkoutBuilder';
import PageCard from '../shared/PageCard';

const GymWorkoutsPage: React.FC = () => {
  return (
    <PageCard title="My Workouts">
      <WorkoutBuilder />
    </PageCard>
  );
};

export default GymWorkoutsPage;
