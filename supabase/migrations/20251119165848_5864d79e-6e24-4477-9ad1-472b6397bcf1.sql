-- Create programs table
CREATE TABLE IF NOT EXISTS public.programs (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT NOT NULL DEFAULT 'Dumbbell',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create weeks table
CREATE TABLE IF NOT EXISTS public.weeks (
  id TEXT PRIMARY KEY,
  program_id TEXT NOT NULL REFERENCES public.programs(id) ON DELETE CASCADE,
  week_number INTEGER NOT NULL,
  name TEXT NOT NULL,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(program_id, week_number)
);

-- Create workouts table
CREATE TABLE IF NOT EXISTS public.workouts (
  id TEXT PRIMARY KEY,
  week_id TEXT NOT NULL REFERENCES public.weeks(id) ON DELETE CASCADE,
  day_number INTEGER NOT NULL,
  name TEXT NOT NULL,
  duration INTEGER NOT NULL DEFAULT 60,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(week_id, day_number)
);

-- Create exercises table
CREATE TABLE IF NOT EXISTS public.exercises (
  id TEXT PRIMARY KEY,
  workout_id TEXT NOT NULL REFERENCES public.workouts(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('warmup', 'mainlift', 'accessory', 'conditioning')),
  sets INTEGER,
  reps TEXT,
  weight DECIMAL,
  time TEXT,
  distance TEXT,
  rpe INTEGER CHECK (rpe >= 1 AND rpe <= 10),
  notes TEXT,
  video_url TEXT,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weeks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exercises ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Anyone can view programs
CREATE POLICY "Anyone can view programs" ON public.programs FOR SELECT USING (true);
CREATE POLICY "Anyone can view weeks" ON public.weeks FOR SELECT USING (true);
CREATE POLICY "Anyone can view workouts" ON public.workouts FOR SELECT USING (true);
CREATE POLICY "Anyone can view exercises" ON public.exercises FOR SELECT USING (true);

-- RLS Policies: Only coaches/admins can manage
CREATE POLICY "Coaches can manage programs" ON public.programs FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.role IN ('coach', 'admin')
  )
);

CREATE POLICY "Coaches can manage weeks" ON public.weeks FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.role IN ('coach', 'admin')
  )
);

CREATE POLICY "Coaches can manage workouts" ON public.workouts FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.role IN ('coach', 'admin')
  )
);

CREATE POLICY "Coaches can manage exercises" ON public.exercises FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.role IN ('coach', 'admin')
  )
);

-- Create indexes for performance
CREATE INDEX idx_weeks_program_id ON public.weeks(program_id);
CREATE INDEX idx_workouts_week_id ON public.workouts(week_id);
CREATE INDEX idx_exercises_workout_id ON public.exercises(workout_id);
CREATE INDEX idx_exercises_category ON public.exercises(category);