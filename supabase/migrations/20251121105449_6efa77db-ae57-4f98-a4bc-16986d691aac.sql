-- Create table for custom workouts created by members
CREATE TABLE IF NOT EXISTS public.custom_workouts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NOT NULL,
  notes text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Create table for exercises in custom workouts
CREATE TABLE IF NOT EXISTS public.custom_workout_exercises (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workout_id uuid NOT NULL REFERENCES public.custom_workouts(id) ON DELETE CASCADE,
  name text NOT NULL,
  sets integer,
  reps text,
  weight numeric,
  distance text,
  time text,
  notes text,
  display_order integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.custom_workouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.custom_workout_exercises ENABLE ROW LEVEL SECURITY;

-- RLS Policies for custom_workouts
CREATE POLICY "Users can view own custom workouts"
ON public.custom_workouts
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create own custom workouts"
ON public.custom_workouts
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own custom workouts"
ON public.custom_workouts
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own custom workouts"
ON public.custom_workouts
FOR DELETE
USING (auth.uid() = user_id);

CREATE POLICY "Coaches can view members custom workouts"
ON public.custom_workouts
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.user_id = custom_workouts.user_id
    AND profiles.coach_id IN (
      SELECT id FROM profiles WHERE user_id = auth.uid()
    )
  )
);

-- RLS Policies for custom_workout_exercises
CREATE POLICY "Users can view exercises of their custom workouts"
ON public.custom_workout_exercises
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM custom_workouts
    WHERE custom_workouts.id = custom_workout_exercises.workout_id
    AND custom_workouts.user_id = auth.uid()
  )
);

CREATE POLICY "Users can create exercises for their custom workouts"
ON public.custom_workout_exercises
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM custom_workouts
    WHERE custom_workouts.id = custom_workout_exercises.workout_id
    AND custom_workouts.user_id = auth.uid()
  )
);

CREATE POLICY "Users can update exercises of their custom workouts"
ON public.custom_workout_exercises
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM custom_workouts
    WHERE custom_workouts.id = custom_workout_exercises.workout_id
    AND custom_workouts.user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete exercises of their custom workouts"
ON public.custom_workout_exercises
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM custom_workouts
    WHERE custom_workouts.id = custom_workout_exercises.workout_id
    AND custom_workouts.user_id = auth.uid()
  )
);

CREATE POLICY "Coaches can view exercises of members custom workouts"
ON public.custom_workout_exercises
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM custom_workouts cw
    JOIN profiles p ON p.user_id = cw.user_id
    WHERE cw.id = custom_workout_exercises.workout_id
    AND p.coach_id IN (
      SELECT id FROM profiles WHERE user_id = auth.uid()
    )
  )
);

-- Create trigger to update updated_at
CREATE TRIGGER update_custom_workouts_updated_at
BEFORE UPDATE ON public.custom_workouts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();