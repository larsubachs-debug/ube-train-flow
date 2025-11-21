-- Create table for storing workout set data including RPE
CREATE TABLE IF NOT EXISTS public.workout_sets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  workout_id TEXT NOT NULL,
  exercise_name TEXT NOT NULL,
  set_number INTEGER NOT NULL,
  weight NUMERIC,
  reps INTEGER,
  rpe NUMERIC,
  completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  CONSTRAINT workout_sets_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Enable RLS
ALTER TABLE public.workout_sets ENABLE ROW LEVEL SECURITY;

-- Users can view their own sets
CREATE POLICY "Users can view own workout sets"
ON public.workout_sets
FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own sets
CREATE POLICY "Users can insert own workout sets"
ON public.workout_sets
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own sets
CREATE POLICY "Users can update own workout sets"
ON public.workout_sets
FOR UPDATE
USING (auth.uid() = user_id);

-- Users can delete their own sets
CREATE POLICY "Users can delete own workout sets"
ON public.workout_sets
FOR DELETE
USING (auth.uid() = user_id);

-- Coaches can view their members' sets
CREATE POLICY "Coaches can view members workout sets"
ON public.workout_sets
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.user_id = workout_sets.user_id
    AND profiles.coach_id IN (
      SELECT id FROM profiles WHERE user_id = auth.uid()
    )
  )
);

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_workout_sets_user_exercise ON public.workout_sets(user_id, exercise_name, completed_at DESC);