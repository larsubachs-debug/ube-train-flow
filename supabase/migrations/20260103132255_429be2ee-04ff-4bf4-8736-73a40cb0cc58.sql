-- Create nutrition_goals table for storing member nutrition targets
CREATE TABLE public.nutrition_goals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  calories_target INTEGER,
  protein_target INTEGER,
  carbs_target INTEGER,
  fat_target INTEGER,
  notes TEXT,
  set_by UUID,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.nutrition_goals ENABLE ROW LEVEL SECURITY;

-- Users can view their own nutrition goals
CREATE POLICY "Users can view their own nutrition goals"
ON public.nutrition_goals
FOR SELECT
USING (auth.uid() = user_id);

-- Coaches can view their members nutrition goals
CREATE POLICY "Coaches can view members nutrition goals"
ON public.nutrition_goals
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.user_id = nutrition_goals.user_id
    AND profiles.coach_id IN (
      SELECT profiles.id FROM profiles WHERE profiles.user_id = auth.uid()
    )
  )
);

-- Coaches can insert nutrition goals for their members
CREATE POLICY "Coaches can insert members nutrition goals"
ON public.nutrition_goals
FOR INSERT
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'coach'::app_role)
);

-- Coaches can update their members nutrition goals
CREATE POLICY "Coaches can update members nutrition goals"
ON public.nutrition_goals
FOR UPDATE
USING (
  has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'coach'::app_role)
);

-- Coaches can delete their members nutrition goals
CREATE POLICY "Coaches can delete members nutrition goals"
ON public.nutrition_goals
FOR DELETE
USING (
  has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'coach'::app_role)
);

-- Create trigger for updated_at
CREATE TRIGGER update_nutrition_goals_updated_at
BEFORE UPDATE ON public.nutrition_goals
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();