-- Create food_logs table for storing meal entries
CREATE TABLE public.food_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  meal_type TEXT NOT NULL CHECK (meal_type IN ('breakfast', 'lunch', 'dinner', 'snacks')),
  name TEXT NOT NULL,
  calories INTEGER NOT NULL DEFAULT 0,
  carbs NUMERIC NOT NULL DEFAULT 0,
  fat NUMERIC NOT NULL DEFAULT 0,
  protein NUMERIC NOT NULL DEFAULT 0,
  log_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.food_logs ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own food logs" 
ON public.food_logs 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own food logs" 
ON public.food_logs 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own food logs" 
ON public.food_logs 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own food logs" 
ON public.food_logs 
FOR DELETE 
USING (auth.uid() = user_id);

-- Coaches can view their members food logs
CREATE POLICY "Coaches can view their members food logs" 
ON public.food_logs 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.user_id = food_logs.user_id
    AND profiles.coach_id IN (
      SELECT profiles.id FROM profiles WHERE profiles.user_id = auth.uid()
    )
  )
);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_food_logs_updated_at
BEFORE UPDATE ON public.food_logs
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();