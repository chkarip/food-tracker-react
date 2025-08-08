/**
 * Gym/Workout TypeScript definitions
 * Defines the structure for exercises, workouts, and split programs
 */

// ===== EXERCISE TYPES =====

export interface Exercise {
  id?: string;
  name: string;
  primaryMuscle: string;
  secondaryMuscles: string[];
  category: 'Compound' | 'Isolation' | 'Isometric';
  equipment: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  instructions?: string;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ExerciseInWorkout {
  exerciseId?: string;
  exerciseName: string;
  sets: number;
  reps: string; // Can be "8-10", "10", "30 seconds", etc.
  weight?: number; // in kg
  restSeconds: number;
  notes?: string;
  completed?: boolean;
}

// ===== WORKOUT TYPES =====

export interface WorkoutSet {
  setNumber: number;
  reps?: number;
  weight?: number; // in kg
  duration?: number; // in seconds for timed exercises
  distance?: number; // in km for cardio
  completed: boolean;
  rpe?: number; // Rate of Perceived Exertion (1-10)
  notes?: string;
}

export interface WorkoutExercise {
  exerciseId?: string;
  exercise: Exercise;
  plannedSets: number;
  actualSets: WorkoutSet[];
  restSeconds: number;
  notes?: string;
  completed: boolean;
}

export interface Workout {
  id?: string;
  userId: string;
  name: string;
  date: string; // ISO date string
  exercises: WorkoutExercise[];
  duration?: number; // actual duration in minutes
  plannedDuration?: number; // planned duration in minutes
  completed: boolean;
  notes?: string;
  splitId?: string; // Reference to workout split
  workoutDay?: string; // e.g., "Push Day", "Upper Body"
  createdAt?: Date;
  updatedAt?: Date;
}

// ===== WORKOUT SPLIT TYPES =====

export interface SplitExercise {
  exerciseName: string;
  exerciseId?: string;
  sets: number;
  reps: string;
  restSeconds: number;
  notes?: string;
}

export interface SplitWorkout {
  day: string; // e.g., "Push Day", "Pull Day", "Legs"
  exercises: SplitExercise[];
  estimatedDuration?: number; // in minutes
}

export interface WorkoutSplit {
  id?: string;
  name: string;
  description: string;
  frequency: string; // e.g., "6 days/week", "3 days/week"
  workouts: SplitWorkout[];
  isTemplate: boolean;
  isActive: boolean;
  userId?: string; // For custom splits
  createdAt?: Date;
  updatedAt?: Date;
}

// ===== PROGRESS TRACKING TYPES =====

export interface ExerciseProgress {
  exerciseId: string;
  exerciseName: string;
  records: ProgressRecord[];
}

export interface ProgressRecord {
  date: string; // ISO date
  weight?: number;
  reps?: number;
  volume?: number; // weight * reps * sets
  oneRepMax?: number; // calculated 1RM
  notes?: string;
}

export interface PersonalRecord {
  id?: string;
  userId: string;
  exerciseId: string;
  exerciseName: string;
  recordType: 'weight' | 'reps' | 'volume' | '1rm' | 'endurance';
  value: number;
  unit: string; // 'kg', 'lbs', 'reps', 'seconds', 'minutes'
  date: string; // ISO date
  workoutId?: string;
  notes?: string;
  createdAt?: Date;
}

// ===== BODY MEASUREMENTS =====

export interface BodyMeasurement {
  id?: string;
  userId: string;
  date: string; // ISO date
  weight?: number; // in kg
  bodyFatPercentage?: number;
  measurements: {
    chest?: number; // in cm
    waist?: number;
    hips?: number;
    bicep?: number;
    thigh?: number;
    neck?: number;
    [key: string]: number | undefined;
  };
  photos?: string[]; // URLs to progress photos
  notes?: string;
  createdAt?: Date;
}

// ===== GYM STATS & ANALYTICS =====

export interface WorkoutStats {
  totalWorkouts: number;
  totalDuration: number; // in minutes
  averageWorkoutDuration: number; // in minutes
  totalVolume: number; // total weight lifted (kg)
  workoutsThisWeek: number;
  workoutsThisMonth: number;
  currentStreak: number; // consecutive workout days
  longestStreak: number;
  favoriteExercises: string[];
  progressTrend: 'improving' | 'maintaining' | 'declining';
}

export interface MuscleGroupStats {
  muscleGroup: string;
  workoutFrequency: number; // times per week
  totalVolume: number;
  progressPercentage: number;
  lastWorked: string; // ISO date
}

// ===== API/SERVICE TYPES =====

export interface CreateWorkoutRequest {
  name: string;
  date: string;
  exercises: ExerciseInWorkout[];
  splitId?: string;
  notes?: string;
}

export interface UpdateWorkoutRequest extends Partial<CreateWorkoutRequest> {
  id: string;
  completed?: boolean;
  duration?: number;
}

export interface WorkoutFilters {
  startDate?: string;
  endDate?: string;
  muscleGroup?: string;
  splitId?: string;
  completed?: boolean;
}

// ===== UTILITY TYPES =====

export type MuscleGroup = 
  | 'Chest' | 'Back' | 'Shoulders' | 'Biceps' | 'Triceps' | 'Forearms'
  | 'Core' | 'Obliques' | 'Lower Back' | 'Glutes' | 'Quadriceps' 
  | 'Hamstrings' | 'Calves' | 'Cardio';

export type ExerciseCategory = 'Compound' | 'Isolation' | 'Isometric' | 'Cardio';

export type DifficultyLevel = 'Beginner' | 'Intermediate' | 'Advanced';

export type EquipmentType = 
  | 'Barbell' | 'Dumbbells' | 'Cable Machine' | 'Pull-up Bar' 
  | 'Bodyweight' | 'Machine' | 'Resistance Bands' | 'Kettlebells'
  | 'Other';

// ===== CONSTANTS =====

export const MUSCLE_GROUPS: MuscleGroup[] = [
  'Chest', 'Back', 'Shoulders', 'Biceps', 'Triceps', 'Forearms',
  'Core', 'Obliques', 'Lower Back', 'Glutes', 'Quadriceps',
  'Hamstrings', 'Calves', 'Cardio'
];

export const EQUIPMENT_TYPES: EquipmentType[] = [
  'Barbell', 'Dumbbells', 'Cable Machine', 'Pull-up Bar',
  'Bodyweight', 'Machine', 'Resistance Bands', 'Kettlebells', 'Other'
];

export const DIFFICULTY_LEVELS: DifficultyLevel[] = [
  'Beginner', 'Intermediate', 'Advanced'
];

// ===== FIREBASE COLLECTION NAMES =====

export const GYM_COLLECTIONS = {
  EXERCISES: 'exercises',
  WORKOUTS: 'workouts', 
  WORKOUT_SPLITS: 'workoutSplits',
  PERSONAL_RECORDS: 'personalRecords',
  BODY_MEASUREMENTS: 'bodyMeasurements',
  EXERCISE_PROGRESS: 'exerciseProgress'
} as const;

export type GymCollectionName = typeof GYM_COLLECTIONS[keyof typeof GYM_COLLECTIONS];
