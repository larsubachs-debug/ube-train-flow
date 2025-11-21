-- Create body_metrics table for tracking user physical measurements
CREATE TABLE IF NOT EXISTS public.body_metrics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  recorded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  weight NUMERIC(5,2), -- in kg
  body_fat_percentage NUMERIC(4,2), -- percentage
  muscle_mass NUMERIC(5,2), -- in kg
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.body_metrics ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view own body metrics"
ON public.body_metrics
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own body metrics"
ON public.body_metrics
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own body metrics"
ON public.body_metrics
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own body metrics"
ON public.body_metrics
FOR DELETE
USING (auth.uid() = user_id);

CREATE POLICY "Coaches can view their members body metrics"
ON public.body_metrics
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM profiles
    WHERE profiles.user_id = body_metrics.user_id
    AND profiles.coach_id IN (
      SELECT id FROM profiles WHERE user_id = auth.uid()
    )
  )
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_body_metrics_user_recorded 
ON public.body_metrics(user_id, recorded_at DESC);

-- Add trigger for updated_at
CREATE TRIGGER update_body_metrics_updated_at
BEFORE UPDATE ON public.body_metrics
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();