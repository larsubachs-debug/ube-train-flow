-- Daily Check-in System

-- Table for check-in question library
CREATE TABLE public.checkin_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question_text text NOT NULL,
  question_type text NOT NULL DEFAULT 'text', -- text, scale, multiple_choice
  options jsonb, -- for multiple choice questions
  is_default boolean DEFAULT false, -- part of default question set
  display_order integer DEFAULT 0,
  created_by uuid,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Table for member-assigned questions
CREATE TABLE public.member_checkin_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  question_id uuid NOT NULL REFERENCES public.checkin_questions(id) ON DELETE CASCADE,
  assigned_by uuid,
  assigned_at timestamp with time zone DEFAULT now(),
  is_active boolean DEFAULT true,
  display_order integer DEFAULT 0,
  UNIQUE(member_id, question_id)
);

-- Table for daily check-in responses
CREATE TABLE public.daily_checkins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  checkin_date date NOT NULL DEFAULT CURRENT_DATE,
  responses jsonb NOT NULL, -- {"question_id": "answer"}
  completed_at timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(user_id, checkin_date)
);

-- Enable RLS
ALTER TABLE public.checkin_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.member_checkin_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_checkins ENABLE ROW LEVEL SECURITY;

-- RLS Policies for checkin_questions
CREATE POLICY "Anyone can view questions"
  ON public.checkin_questions FOR SELECT
  USING (true);

CREATE POLICY "Coaches can manage questions"
  ON public.checkin_questions FOR ALL
  USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'coach'));

-- RLS Policies for member_checkin_questions
CREATE POLICY "Members can view their assigned questions"
  ON public.member_checkin_questions FOR SELECT
  USING (
    member_id IN (
      SELECT id FROM public.profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Coaches can manage member questions"
  ON public.member_checkin_questions FOR ALL
  USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'coach'));

-- RLS Policies for daily_checkins
CREATE POLICY "Users can view own checkins"
  ON public.daily_checkins FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own checkins"
  ON public.daily_checkins FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Coaches can view their members checkins"
  ON public.daily_checkins FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE user_id = daily_checkins.user_id
      AND coach_id IN (
        SELECT id FROM public.profiles WHERE user_id = auth.uid()
      )
    )
  );

-- Triggers for updated_at
CREATE TRIGGER update_checkin_questions_updated_at
  BEFORE UPDATE ON public.checkin_questions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default questions
INSERT INTO public.checkin_questions (question_text, question_type, is_default, display_order) VALUES
  ('Hoe voel je je vandaag?', 'scale', true, 1),
  ('Hoe is je energieniveau?', 'scale', true, 2),
  ('Hoe goed heb je geslapen?', 'scale', true, 3),
  ('Heb je vandaag pijn of ongemak?', 'text', true, 4),
  ('Wat is je doel voor vandaag?', 'text', true, 5);