-- Create cardio_activities table for outdoor activities with route tracking
CREATE TABLE public.cardio_activities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  activity_type TEXT NOT NULL, -- running, cycling, walking, swimming, etc.
  name TEXT,
  duration_seconds INTEGER, -- total duration in seconds
  distance_meters NUMERIC, -- total distance in meters
  elevation_gain_meters NUMERIC, -- elevation gain in meters
  average_pace_seconds_per_km NUMERIC, -- average pace
  average_speed_kmh NUMERIC, -- average speed
  calories_burned INTEGER,
  start_location JSONB, -- {lat: number, lng: number}
  end_location JSONB, -- {lat: number, lng: number}
  route_coordinates JSONB, -- array of {lat: number, lng: number} for full route
  notes TEXT,
  completed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.cardio_activities ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own cardio activities" 
ON public.cardio_activities 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own cardio activities" 
ON public.cardio_activities 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own cardio activities" 
ON public.cardio_activities 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own cardio activities" 
ON public.cardio_activities 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_cardio_activities_updated_at
BEFORE UPDATE ON public.cardio_activities
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for cardio_activities table
ALTER PUBLICATION supabase_realtime ADD TABLE public.cardio_activities;