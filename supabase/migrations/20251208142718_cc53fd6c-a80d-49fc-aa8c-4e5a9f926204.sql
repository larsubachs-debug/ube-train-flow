-- Create scheduled events table for member agendas
CREATE TABLE public.scheduled_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  member_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  coach_id UUID NOT NULL REFERENCES public.profiles(id),
  event_type TEXT NOT NULL CHECK (event_type IN ('workout', 'task', 'custom')),
  title TEXT NOT NULL,
  description TEXT,
  scheduled_date DATE NOT NULL,
  scheduled_time TIME,
  duration_minutes INTEGER,
  -- Reference to existing workout or task (optional)
  workout_id TEXT,
  task_id UUID REFERENCES public.tasks_library(id),
  -- Status tracking
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'cancelled', 'missed')),
  completed_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.scheduled_events ENABLE ROW LEVEL SECURITY;

-- Members can view their own scheduled events
CREATE POLICY "Members can view own scheduled events"
ON public.scheduled_events
FOR SELECT
USING (member_id IN (
  SELECT id FROM public.profiles WHERE user_id = auth.uid()
));

-- Members can update status of their own events (mark complete)
CREATE POLICY "Members can update own scheduled events"
ON public.scheduled_events
FOR UPDATE
USING (member_id IN (
  SELECT id FROM public.profiles WHERE user_id = auth.uid()
));

-- Coaches can view their members' scheduled events
CREATE POLICY "Coaches can view members scheduled events"
ON public.scheduled_events
FOR SELECT
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'coach'::app_role)
);

-- Coaches can create events for their members
CREATE POLICY "Coaches can create scheduled events"
ON public.scheduled_events
FOR INSERT
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'coach'::app_role)
);

-- Coaches can update events they created
CREATE POLICY "Coaches can update scheduled events"
ON public.scheduled_events
FOR UPDATE
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'coach'::app_role)
);

-- Coaches can delete events they created
CREATE POLICY "Coaches can delete scheduled events"
ON public.scheduled_events
FOR DELETE
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'coach'::app_role)
);

-- Create index for faster queries
CREATE INDEX idx_scheduled_events_member_date ON public.scheduled_events(member_id, scheduled_date);
CREATE INDEX idx_scheduled_events_coach ON public.scheduled_events(coach_id);

-- Add trigger for updated_at
CREATE TRIGGER update_scheduled_events_updated_at
BEFORE UPDATE ON public.scheduled_events
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();