// Workout-related types
export type WorkoutType = 'Lower A' | 'Lower B' | 'Upper A' | 'Upper B';

export interface WorkoutExercise {
  id: string;
  exerciseId: string; // Reference to the exercise from exercise library
  name: string;
  primaryMuscle: string;
  equipment: string;
  kg: number;
  sets: number;
  reps: number;
  rest: number; // rest time in seconds
  notes: string;
  order: number; // for drag and drop ordering
}

export interface Workout {
  id?: string;
  name: WorkoutType;
  exercises: WorkoutExercise[];
  lastModified: Date;
  isActive: boolean;
}
