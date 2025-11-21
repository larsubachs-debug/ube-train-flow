export interface User {
  id: string;
  name: string;
  email: string;
  currentProgram?: string;
  membershipTier: 'trial' | 'program' | 'program-checkin';
  trialEndsAt?: Date;
}

export interface Program {
  id: string;
  name: string;
  description: string;
  weeks: Week[];
  icon: string;
}

export interface Week {
  id: string;
  weekNumber: number;
  name: string;
  workouts: Workout[];
}

export interface Workout {
  id: string;
  dayNumber: number;
  name: string;
  duration: number;
  warmUp: Exercise[];
  mainLifts: Exercise[];
  accessories: Exercise[];
  conditioning: Exercise[];
  completed?: boolean;
  completedAt?: Date;
}

export interface Exercise {
  id: string;
  name: string;
  sets?: number;
  reps?: string;
  weight?: number;
  time?: string;
  distance?: string;
  rpe?: number;
  notes?: string;
  videoUrl?: string;
}

export interface WorkoutProgress {
  id: string;
  workoutId: string;
  userId: string;
  date: Date;
  exercises: ExerciseProgress[];
  notes?: string;
}

export interface ExerciseProgress {
  exerciseId: string;
  sets: SetProgress[];
  notes?: string;
}

export interface SetProgress {
  setNumber: number;
  weight?: number;
  reps?: number;
  time?: string;
  distance?: string;
  rpe?: number;
  completed: boolean;
}

export interface PersonalRecord {
  id: string;
  userId: string;
  exerciseName: string;
  weight?: number;
  reps?: number;
  time?: string;
  distance?: string;
  date: Date;
}

export interface CheckIn {
  id: string;
  userId: string;
  week: number;
  date: Date;
  energy: number;
  stress: number;
  sleepQuality: number;
  averageSteps: number;
  weight?: number;
  measurements?: {
    chest?: number;
    waist?: number;
    hips?: number;
    arms?: number;
    legs?: number;
  };
  notes: string;
  photos?: string[];
}

export interface CommunityMessage {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  programId: string;
  message: string;
  imageUrl?: string;
  createdAt: Date;
}

export interface EducationModule {
  id: string;
  title: string;
  category: 'sleep' | 'stress' | 'training' | 'nutrition' | 'mindset' | 'hyrox' | 'lifestyle';
  videoUrl?: string;
  keyPoints: string[];
  duration?: number;
  content?: string;
  actionItems?: string[];
}
