import { WorkoutExercise, WorkoutType } from './workout';

export interface WorkoutTemplate {
  id?: string;
  userId: string;
  name: string;
  workoutType: WorkoutType;
  exercises: WorkoutExercise[];
  createdAt: Date;
  lastUsed: Date;
  description?: string;
  // isPublic and tags removed for private-only templates
}

export interface WorkoutTemplateDocument extends Omit<WorkoutTemplate, 'createdAt' | 'lastUsed'> {
  id: string;
  createdAt: string; // ISO string for Firebase storage
  lastUsed: string;
}

export interface SaveTemplateInput extends Omit<WorkoutTemplate, 'id' | 'userId' | 'createdAt' | 'lastUsed'> {
  // Input from UI layer - no computed fields
}
