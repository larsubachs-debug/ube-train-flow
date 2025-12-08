-- Create shared_workouts table for workout sharing
CREATE TABLE public.shared_workouts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  workout_id UUID NOT NULL,
  workout_name TEXT NOT NULL,
  total_sets INTEGER DEFAULT 0,
  total_volume NUMERIC DEFAULT 0,
  duration_minutes INTEGER DEFAULT 0,
  exercises_completed INTEGER DEFAULT 0,
  personal_records INTEGER DEFAULT 0,
  caption TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create kudos table for high-fives on shared workouts
CREATE TABLE public.kudos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  shared_workout_id UUID NOT NULL REFERENCES public.shared_workouts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  kudos_type TEXT NOT NULL DEFAULT '💪',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(shared_workout_id, user_id)
);

-- Create challenges table
CREATE TABLE public.challenges (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  challenge_type TEXT NOT NULL DEFAULT 'workouts', -- workouts, volume, streak
  target_value INTEGER NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  created_by UUID NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create challenge_participants table
CREATE TABLE public.challenge_participants (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  challenge_id UUID NOT NULL REFERENCES public.challenges(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  current_progress INTEGER DEFAULT 0,
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(challenge_id, user_id)
);

-- Create buddy_profiles for matching
CREATE TABLE public.buddy_profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  gym_name TEXT,
  goals TEXT[],
  preferred_workout_times TEXT[],
  experience_level TEXT DEFAULT 'intermediate',
  looking_for_buddy BOOLEAN DEFAULT true,
  bio TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create buddy_matches table
CREATE TABLE public.buddy_matches (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  requester_id UUID NOT NULL,
  receiver_id UUID NOT NULL,
  status TEXT DEFAULT 'pending', -- pending, accepted, rejected
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(requester_id, receiver_id)
);

-- Enable RLS on all tables
ALTER TABLE public.shared_workouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kudos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.challenge_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.buddy_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.buddy_matches ENABLE ROW LEVEL SECURITY;

-- RLS policies for shared_workouts (public read, authenticated write own)
CREATE POLICY "Shared workouts are viewable by everyone" ON public.shared_workouts FOR SELECT USING (true);
CREATE POLICY "Users can share their own workouts" ON public.shared_workouts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own shared workouts" ON public.shared_workouts FOR DELETE USING (auth.uid() = user_id);

-- RLS policies for kudos
CREATE POLICY "Kudos are viewable by everyone" ON public.kudos FOR SELECT USING (true);
CREATE POLICY "Authenticated users can give kudos" ON public.kudos FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can remove their own kudos" ON public.kudos FOR DELETE USING (auth.uid() = user_id);

-- RLS policies for challenges
CREATE POLICY "Challenges are viewable by everyone" ON public.challenges FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create challenges" ON public.challenges FOR INSERT WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Challenge creators can update their challenges" ON public.challenges FOR UPDATE USING (auth.uid() = created_by);

-- RLS policies for challenge_participants
CREATE POLICY "Challenge participants are viewable by everyone" ON public.challenge_participants FOR SELECT USING (true);
CREATE POLICY "Users can join challenges" ON public.challenge_participants FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own progress" ON public.challenge_participants FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can leave challenges" ON public.challenge_participants FOR DELETE USING (auth.uid() = user_id);

-- RLS policies for buddy_profiles
CREATE POLICY "Buddy profiles are viewable by authenticated users" ON public.buddy_profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can create their own buddy profile" ON public.buddy_profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own buddy profile" ON public.buddy_profiles FOR UPDATE USING (auth.uid() = user_id);

-- RLS policies for buddy_matches
CREATE POLICY "Users can view their own matches" ON public.buddy_matches FOR SELECT USING (auth.uid() = requester_id OR auth.uid() = receiver_id);
CREATE POLICY "Users can create match requests" ON public.buddy_matches FOR INSERT WITH CHECK (auth.uid() = requester_id);
CREATE POLICY "Users can update matches they're part of" ON public.buddy_matches FOR UPDATE USING (auth.uid() = requester_id OR auth.uid() = receiver_id);

-- Enable realtime for shared_workouts and kudos
ALTER PUBLICATION supabase_realtime ADD TABLE public.shared_workouts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.kudos;