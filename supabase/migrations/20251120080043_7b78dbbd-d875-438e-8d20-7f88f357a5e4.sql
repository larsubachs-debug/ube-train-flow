-- Create workout_completions table to track completed workouts
CREATE TABLE public.workout_completions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  workout_id text NOT NULL,
  completed_at timestamp with time zone DEFAULT now(),
  completion_date date NOT NULL DEFAULT CURRENT_DATE,
  notes text,
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(user_id, workout_id, completion_date)
);

-- Enable RLS
ALTER TABLE public.workout_completions ENABLE ROW LEVEL SECURITY;

-- Users can insert their own completions
CREATE POLICY "Users can insert own workout completions"
ON public.workout_completions
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Users can view their own completions
CREATE POLICY "Users can view own workout completions"
ON public.workout_completions
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Users can update their own completions
CREATE POLICY "Users can update own workout completions"
ON public.workout_completions
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

-- Coaches can view their members' completions
CREATE POLICY "Coaches can view members workout completions"
ON public.workout_completions
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.user_id = workout_completions.user_id
    AND profiles.coach_id IN (
      SELECT id FROM profiles WHERE user_id = auth.uid()
    )
  )
);

-- Create index for performance
CREATE INDEX idx_workout_completions_user_date ON public.workout_completions(user_id, completion_date DESC);