-- Create achievements table
CREATE TABLE public.achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('pr', 'streak', 'milestone', 'special')),
  badge_icon TEXT NOT NULL,
  badge_color TEXT NOT NULL,
  requirement_value INTEGER,
  requirement_type TEXT,
  points INTEGER DEFAULT 0,
  rarity TEXT DEFAULT 'common' CHECK (rarity IN ('common', 'rare', 'epic', 'legendary')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create user_achievements table
CREATE TABLE public.user_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  achievement_id UUID NOT NULL REFERENCES public.achievements(id) ON DELETE CASCADE,
  unlocked_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  progress INTEGER DEFAULT 0,
  is_unlocked BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, achievement_id)
);

-- Create user_stats table for tracking
CREATE TABLE public.user_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  total_workouts INTEGER DEFAULT 0,
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  total_prs INTEGER DEFAULT 0,
  total_volume_kg INTEGER DEFAULT 0,
  last_workout_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_stats ENABLE ROW LEVEL SECURITY;

-- Achievements policies (everyone can view)
CREATE POLICY "Anyone can view achievements"
ON public.achievements FOR SELECT
USING (true);

-- User achievements policies
CREATE POLICY "Users can view own achievements"
ON public.user_achievements FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own achievements"
ON public.user_achievements FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own achievements"
ON public.user_achievements FOR UPDATE
USING (auth.uid() = user_id);

-- User stats policies
CREATE POLICY "Users can view own stats"
ON public.user_stats FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own stats"
ON public.user_stats FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own stats"
ON public.user_stats FOR UPDATE
USING (auth.uid() = user_id);

-- Create updated_at trigger for user_stats
CREATE TRIGGER update_user_stats_updated_at
BEFORE UPDATE ON public.user_stats
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default achievements
INSERT INTO public.achievements (name, description, category, badge_icon, badge_color, requirement_value, requirement_type, points, rarity) VALUES
-- PR Achievements
('First PR', 'Hit your first personal record', 'pr', '🏆', 'hsl(var(--ube-orange))', 1, 'prs', 10, 'common'),
('PR Collector', 'Achieve 5 personal records', 'pr', '💪', 'hsl(var(--ube-orange))', 5, 'prs', 25, 'rare'),
('PR Master', 'Achieve 10 personal records', 'pr', '👑', 'hsl(var(--ube-orange))', 10, 'prs', 50, 'epic'),
('PR Legend', 'Achieve 25 personal records', 'pr', '⭐', 'hsl(var(--ube-orange))', 25, 'prs', 100, 'legendary'),

-- Streak Achievements
('Getting Started', 'Complete 3 workouts in a row', 'streak', '🔥', 'hsl(var(--ube-green))', 3, 'streak', 15, 'common'),
('On Fire', 'Maintain a 7-day workout streak', 'streak', '🔥', 'hsl(var(--ube-green))', 7, 'streak', 30, 'rare'),
('Unstoppable', 'Maintain a 14-day workout streak', 'streak', '⚡', 'hsl(var(--ube-green))', 14, 'streak', 60, 'epic'),
('Iron Will', 'Maintain a 30-day workout streak', 'streak', '💎', 'hsl(var(--ube-green))', 30, 'streak', 150, 'legendary'),

-- Milestone Achievements
('First Steps', 'Complete your first workout', 'milestone', '👟', 'hsl(var(--primary))', 1, 'workouts', 5, 'common'),
('Dedicated', 'Complete 10 workouts', 'milestone', '🎯', 'hsl(var(--primary))', 10, 'workouts', 20, 'common'),
('Committed', 'Complete 25 workouts', 'milestone', '🚀', 'hsl(var(--primary))', 25, 'workouts', 40, 'rare'),
('Athlete', 'Complete 50 workouts', 'milestone', '🏋️', 'hsl(var(--primary))', 50, 'workouts', 80, 'epic'),
('Champion', 'Complete 100 workouts', 'milestone', '🥇', 'hsl(var(--primary))', 100, 'workouts', 200, 'legendary'),

-- Special Achievements
('Early Bird', 'Complete a workout before 6 AM', 'special', '🌅', 'hsl(var(--accent))', 1, 'early_workout', 25, 'rare'),
('Night Owl', 'Complete a workout after 10 PM', 'special', '🦉', 'hsl(var(--accent))', 1, 'late_workout', 25, 'rare'),
('Volume King', 'Lift 10,000kg in total volume', 'special', '💪', 'hsl(var(--accent))', 10000, 'volume', 75, 'epic');