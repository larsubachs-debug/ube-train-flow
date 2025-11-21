-- Create body composition photos bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('body-composition', 'body-composition', false)
ON CONFLICT (id) DO NOTHING;

-- Create RLS policies for body composition photos
CREATE POLICY "Users can upload their own body composition photos"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'body-composition' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view their own body composition photos"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'body-composition' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update their own body composition photos"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'body-composition' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own body composition photos"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'body-composition' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Coaches can view their members body composition photos"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'body-composition' 
  AND EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.user_id::text = (storage.foldername(name))[1]
    AND profiles.coach_id IN (
      SELECT id FROM profiles WHERE user_id = auth.uid()
    )
  )
);

-- Add photo references to body_metrics table
ALTER TABLE public.body_metrics 
ADD COLUMN IF NOT EXISTS front_photo_url TEXT,
ADD COLUMN IF NOT EXISTS side_photo_url TEXT,
ADD COLUMN IF NOT EXISTS back_photo_url TEXT;

-- Create user_goals table for tracking fitness goals
CREATE TABLE IF NOT EXISTS public.user_goals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  goal_type TEXT NOT NULL CHECK (goal_type IN ('weight', 'body_fat', 'muscle_mass')),
  target_value NUMERIC(6,2) NOT NULL,
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  target_date DATE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Enable RLS on user_goals
ALTER TABLE public.user_goals ENABLE ROW LEVEL SECURITY;

-- Create policies for user_goals
CREATE POLICY "Users can view own goals"
ON public.user_goals
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own goals"
ON public.user_goals
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own goals"
ON public.user_goals
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own goals"
ON public.user_goals
FOR DELETE
USING (auth.uid() = user_id);

CREATE POLICY "Coaches can view their members goals"
ON public.user_goals
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM profiles
    WHERE profiles.user_id = user_goals.user_id
    AND profiles.coach_id IN (
      SELECT id FROM profiles WHERE user_id = auth.uid()
    )
  )
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_user_goals_user_active 
ON public.user_goals(user_id, is_active, goal_type);

-- Add trigger for updated_at
CREATE TRIGGER update_user_goals_updated_at
BEFORE UPDATE ON public.user_goals
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();