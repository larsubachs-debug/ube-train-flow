
-- Create table for week templates
CREATE TABLE public.week_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  coach_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  events JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.week_templates ENABLE ROW LEVEL SECURITY;

-- Coaches can manage their own templates
CREATE POLICY "Coaches can view own templates"
ON public.week_templates
FOR SELECT
USING (coach_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

CREATE POLICY "Coaches can create templates"
ON public.week_templates
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'coach'::app_role));

CREATE POLICY "Coaches can update own templates"
ON public.week_templates
FOR UPDATE
USING (coach_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

CREATE POLICY "Coaches can delete own templates"
ON public.week_templates
FOR DELETE
USING (coach_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

-- Add trigger for updated_at
CREATE TRIGGER update_week_templates_updated_at
BEFORE UPDATE ON public.week_templates
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
