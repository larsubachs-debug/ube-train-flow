-- Add description field to weeks table for phase explanations
ALTER TABLE public.weeks
ADD COLUMN description text,
ADD COLUMN phase_name text;

-- Create user_program_progress table to track where users are in their programs
CREATE TABLE public.user_program_progress (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  program_id text NOT NULL,
  current_week_number integer NOT NULL DEFAULT 1,
  start_date date NOT NULL DEFAULT CURRENT_DATE,
  completed boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_program_progress ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_program_progress
CREATE POLICY "Users can view own progress"
  ON public.user_program_progress
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own progress"
  ON public.user_program_progress
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own progress"
  ON public.user_program_progress
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Coaches can view all progress
CREATE POLICY "Coaches can view all progress"
  ON public.user_program_progress
  FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'coach'::app_role));

-- Add trigger for updated_at
CREATE TRIGGER update_user_program_progress_updated_at
  BEFORE UPDATE ON public.user_program_progress
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();