-- Create habits library table (for predefined habits that coaches can assign)
CREATE TABLE public.habits_library (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  description text,
  category text DEFAULT 'general',
  icon text DEFAULT 'Target',
  frequency text DEFAULT 'daily', -- daily, weekly
  created_by uuid,
  is_public boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Create member_habits table (assigned habits to members)
CREATE TABLE public.member_habits (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  member_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  habit_id uuid REFERENCES public.habits_library(id) ON DELETE SET NULL,
  -- Allow custom habits (when habit_id is null)
  custom_title text,
  custom_description text,
  custom_icon text DEFAULT 'Target',
  frequency text DEFAULT 'daily',
  assigned_by uuid, -- null if self-assigned
  is_active boolean DEFAULT true,
  start_date date DEFAULT CURRENT_DATE,
  end_date date,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  -- Ensure either habit_id or custom_title is provided
  CONSTRAINT habit_or_custom CHECK (habit_id IS NOT NULL OR custom_title IS NOT NULL)
);

-- Create habit_completions table (track daily/weekly completions)
CREATE TABLE public.habit_completions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  member_habit_id uuid NOT NULL REFERENCES public.member_habits(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  completion_date date NOT NULL DEFAULT CURRENT_DATE,
  completed_at timestamp with time zone DEFAULT now(),
  notes text,
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(member_habit_id, completion_date)
);

-- Enable RLS on all tables
ALTER TABLE public.habits_library ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.member_habits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.habit_completions ENABLE ROW LEVEL SECURITY;

-- RLS policies for habits_library
CREATE POLICY "Anyone can view public habits"
ON public.habits_library FOR SELECT
USING (is_public = true);

CREATE POLICY "Users can view own habits"
ON public.habits_library FOR SELECT
USING (created_by = auth.uid());

CREATE POLICY "Coaches can manage habits"
ON public.habits_library FOR ALL
USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'coach'));

-- RLS policies for member_habits
CREATE POLICY "Members can view their own habits"
ON public.member_habits FOR SELECT
USING (member_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

CREATE POLICY "Members can create their own habits"
ON public.member_habits FOR INSERT
WITH CHECK (
  member_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()) 
  AND assigned_by IS NULL
);

CREATE POLICY "Members can update their own self-assigned habits"
ON public.member_habits FOR UPDATE
USING (
  member_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()) 
  AND assigned_by IS NULL
);

CREATE POLICY "Members can delete their own self-assigned habits"
ON public.member_habits FOR DELETE
USING (
  member_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()) 
  AND assigned_by IS NULL
);

CREATE POLICY "Coaches can view their members habits"
ON public.member_habits FOR SELECT
USING (
  member_id IN (
    SELECT id FROM profiles 
    WHERE coach_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
  )
);

CREATE POLICY "Coaches can manage member habits"
ON public.member_habits FOR ALL
USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'coach'));

-- RLS policies for habit_completions
CREATE POLICY "Users can view own completions"
ON public.habit_completions FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Users can insert own completions"
ON public.habit_completions FOR INSERT
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own completions"
ON public.habit_completions FOR DELETE
USING (user_id = auth.uid());

CREATE POLICY "Coaches can view their members completions"
ON public.habit_completions FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM member_habits mh
    JOIN profiles p ON p.id = mh.member_id
    WHERE mh.id = habit_completions.member_habit_id
    AND p.coach_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
  )
);

-- Add updated_at trigger for habits_library
CREATE TRIGGER update_habits_library_updated_at
BEFORE UPDATE ON public.habits_library
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add updated_at trigger for member_habits
CREATE TRIGGER update_member_habits_updated_at
BEFORE UPDATE ON public.member_habits
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();