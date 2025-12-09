-- Create beta feedback table
CREATE TABLE public.beta_feedback (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  message TEXT NOT NULL,
  page_url TEXT,
  status TEXT DEFAULT 'new',
  admin_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.beta_feedback ENABLE ROW LEVEL SECURITY;

-- Users can insert their own feedback
CREATE POLICY "Users can insert own feedback"
ON public.beta_feedback
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can view their own feedback
CREATE POLICY "Users can view own feedback"
ON public.beta_feedback
FOR SELECT
USING (auth.uid() = user_id);

-- Coaches and admins can view all feedback
CREATE POLICY "Coaches can view all feedback"
ON public.beta_feedback
FOR SELECT
USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'coach'));

-- Coaches and admins can update feedback (status, notes)
CREATE POLICY "Coaches can update feedback"
ON public.beta_feedback
FOR UPDATE
USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'coach'));