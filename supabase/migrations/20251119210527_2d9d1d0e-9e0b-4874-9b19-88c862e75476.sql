-- Daily Tasks System

-- Table for task library
CREATE TABLE public.tasks_library (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  category text DEFAULT 'general', -- nutrition, training, lifestyle, other
  default_duration_days integer DEFAULT 7,
  is_daily boolean DEFAULT true, -- if true, can be checked off daily
  icon text DEFAULT 'CheckSquare',
  created_by uuid,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Table for member-assigned tasks
CREATE TABLE public.member_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  task_id uuid NOT NULL REFERENCES public.tasks_library(id) ON DELETE CASCADE,
  assigned_by uuid,
  start_date date NOT NULL DEFAULT CURRENT_DATE,
  end_date date NOT NULL,
  is_active boolean DEFAULT true,
  notes text, -- custom notes from coach
  assigned_at timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone DEFAULT now()
);

-- Table for daily task completion tracking
CREATE TABLE public.task_completions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  member_task_id uuid NOT NULL REFERENCES public.member_tasks(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  completion_date date NOT NULL DEFAULT CURRENT_DATE,
  notes text, -- member notes
  completed_at timestamp with time zone DEFAULT now(),
  UNIQUE(member_task_id, completion_date)
);

-- Enable RLS
ALTER TABLE public.tasks_library ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.member_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_completions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for tasks_library
CREATE POLICY "Anyone can view tasks"
  ON public.tasks_library FOR SELECT
  USING (true);

CREATE POLICY "Coaches can manage tasks"
  ON public.tasks_library FOR ALL
  USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'coach'));

-- RLS Policies for member_tasks
CREATE POLICY "Members can view their assigned tasks"
  ON public.member_tasks FOR SELECT
  USING (
    member_id IN (
      SELECT id FROM public.profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Coaches can manage member tasks"
  ON public.member_tasks FOR ALL
  USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'coach'));

-- RLS Policies for task_completions
CREATE POLICY "Users can view own completions"
  ON public.task_completions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own completions"
  ON public.task_completions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own completions"
  ON public.task_completions FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Coaches can view their members completions"
  ON public.task_completions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE user_id = task_completions.user_id
      AND coach_id IN (
        SELECT id FROM public.profiles WHERE user_id = auth.uid()
      )
    )
  );

-- Triggers for updated_at
CREATE TRIGGER update_tasks_library_updated_at
  BEFORE UPDATE ON public.tasks_library
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default tasks
INSERT INTO public.tasks_library (title, description, category, default_duration_days, is_daily, icon) VALUES
  ('Maak foto''s van je maaltijden', 'Fotografeer alles wat je eet vandaag', 'nutrition', 7, true, 'Camera'),
  ('Eet 400 gram groente', 'Consumeer minimaal 400 gram groente vandaag', 'nutrition', 7, true, 'Salad'),
  ('Drink 2 liter water', 'Drink minimaal 2 liter water verspreid over de dag', 'nutrition', 7, true, 'Droplet'),
  ('10.000 stappen', 'Loop minimaal 10.000 stappen vandaag', 'training', 7, true, 'Footprints'),
  ('Slaap 8 uur', 'Zorg voor minimaal 8 uur slaap', 'lifestyle', 7, true, 'Moon'),
  ('Geen alcohol', 'Drink geen alcohol vandaag', 'lifestyle', 7, true, 'Wine'),
  ('Mobiel 1 uur voor bed weg', 'Stop met schermtijd 1 uur voor het slapen', 'lifestyle', 7, true, 'Smartphone');