-- Create cardio_goals table
CREATE TABLE public.cardio_goals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  activity_type TEXT, -- null means all activities, or specific like 'running'
  goal_type TEXT NOT NULL, -- 'distance', 'duration', 'activities'
  target_value NUMERIC NOT NULL, -- km for distance, minutes for duration, count for activities
  period TEXT NOT NULL DEFAULT 'weekly', -- 'weekly' or 'monthly'
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.cardio_goals ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their own cardio goals" 
ON public.cardio_goals FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own cardio goals" 
ON public.cardio_goals FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own cardio goals" 
ON public.cardio_goals FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own cardio goals" 
ON public.cardio_goals FOR DELETE USING (auth.uid() = user_id);

-- Create trigger for timestamps
CREATE TRIGGER update_cardio_goals_updated_at
BEFORE UPDATE ON public.cardio_goals
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add is_public column to cardio_activities for leaderboard
ALTER TABLE public.cardio_activities ADD COLUMN is_public BOOLEAN DEFAULT false;

-- Add policy for viewing public activities
CREATE POLICY "Anyone can view public cardio activities" 
ON public.cardio_activities FOR SELECT USING (is_public = true);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.cardio_goals;