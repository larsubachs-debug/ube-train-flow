-- Exercise Library System

CREATE TABLE public.exercise_library (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  category text DEFAULT 'strength', -- strength, cardio, mobility, core
  equipment text[], -- array of equipment needed
  muscle_groups text[], -- array of muscle groups
  difficulty text DEFAULT 'intermediate', -- beginner, intermediate, advanced
  video_url text,
  instructions text,
  tips text,
  created_by uuid,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  is_public boolean DEFAULT true
);

-- Enable RLS
ALTER TABLE public.exercise_library ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Anyone can view public exercises"
  ON public.exercise_library FOR SELECT
  USING (is_public = true OR created_by = auth.uid());

CREATE POLICY "Coaches can create exercises"
  ON public.exercise_library FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'coach'));

CREATE POLICY "Coaches can update own exercises"
  ON public.exercise_library FOR UPDATE
  USING (created_by = auth.uid() OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Coaches can delete own exercises"
  ON public.exercise_library FOR DELETE
  USING (created_by = auth.uid() OR has_role(auth.uid(), 'admin'));

-- Trigger for updated_at
CREATE TRIGGER update_exercise_library_updated_at
  BEFORE UPDATE ON public.exercise_library
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default exercises
INSERT INTO public.exercise_library (name, description, category, equipment, muscle_groups, difficulty, instructions) VALUES
  ('Squat', 'Basis beenkracht oefening', 'strength', ARRAY['barbell'], ARRAY['quadriceps', 'glutes', 'hamstrings'], 'intermediate', 'Sta met voeten op schouderbreedte. Buig door knieën en heupen tot bovenbenen evenwijdig aan grond.'),
  ('Bench Press', 'Borst en triceps oefening', 'strength', ARRAY['barbell', 'bench'], ARRAY['chest', 'triceps', 'shoulders'], 'intermediate', 'Lig op bank met voeten plat op grond. Laat barbell gecontroleerd zakken tot borst, druk terug omhoog.'),
  ('Deadlift', 'Volledige posterior chain oefening', 'strength', ARRAY['barbell'], ARRAY['back', 'glutes', 'hamstrings'], 'advanced', 'Sta met voeten onder barbell. Buig voorover, pak barbell vast, til op door heupen naar voren te brengen.'),
  ('Pull-ups', 'Rugkracht oefening', 'strength', ARRAY['pull-up bar'], ARRAY['back', 'biceps'], 'intermediate', 'Hang aan bar met handpalmen naar voren. Trek jezelf op tot kin boven bar komt.'),
  ('Push-ups', 'Bodyweight borst oefening', 'strength', ARRAY['none'], ARRAY['chest', 'triceps', 'shoulders'], 'beginner', 'Start in plank positie. Laat jezelf zakken tot borst bijna grond raakt, druk terug omhoog.'),
  ('Plank', 'Core stabiliteit oefening', 'core', ARRAY['none'], ARRAY['core', 'shoulders'], 'beginner', 'Hou plank positie op onderarmen. Houd rug recht en core aangespannen.'),
  ('Running', 'Cardio oefening', 'cardio', ARRAY['none'], ARRAY['legs', 'cardio'], 'beginner', 'Loop in steady pace of doe interval training.'),
  ('Lunges', 'Eenzijdige beenkracht', 'strength', ARRAY['dumbbells'], ARRAY['quadriceps', 'glutes'], 'beginner', 'Stap vooruit en laat achterste knie zakken. Duw terug naar startpositie.');
