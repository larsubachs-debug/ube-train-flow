-- Create table for custom workout templates
CREATE TABLE public.workout_templates (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  description text,
  category text DEFAULT 'Strength',
  exercises jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_by uuid REFERENCES auth.users(id),
  is_public boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.workout_templates ENABLE ROW LEVEL SECURITY;

-- Policy: Coaches can create templates
CREATE POLICY "Coaches can create templates"
ON public.workout_templates
FOR INSERT
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'coach'::app_role)
);

-- Policy: Anyone can view public templates
CREATE POLICY "Anyone can view public templates"
ON public.workout_templates
FOR SELECT
USING (is_public = true);

-- Policy: Users can view their own templates
CREATE POLICY "Users can view own templates"
ON public.workout_templates
FOR SELECT
USING (created_by = auth.uid());

-- Policy: Users can update their own templates
CREATE POLICY "Users can update own templates"
ON public.workout_templates
FOR UPDATE
USING (created_by = auth.uid());

-- Policy: Users can delete their own templates
CREATE POLICY "Users can delete own templates"
ON public.workout_templates
FOR DELETE
USING (created_by = auth.uid());

-- Policy: Admins can manage all templates
CREATE POLICY "Admins can manage all templates"
ON public.workout_templates
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Add trigger for updated_at
CREATE TRIGGER update_workout_templates_updated_at
  BEFORE UPDATE ON public.workout_templates
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();