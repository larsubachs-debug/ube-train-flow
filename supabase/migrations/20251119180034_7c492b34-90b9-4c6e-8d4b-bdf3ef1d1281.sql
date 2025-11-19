-- Create enum for roles
CREATE TYPE public.app_role AS ENUM ('admin', 'coach', 'member');

-- Create user_roles table (separate from profiles for security)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL DEFAULT 'member',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles (prevents infinite recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  );
$$;

-- Create function to get user's highest role
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id UUID)
RETURNS public.app_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role
  FROM public.user_roles
  WHERE user_id = _user_id
  ORDER BY CASE role
    WHEN 'admin' THEN 1
    WHEN 'coach' THEN 2
    WHEN 'member' THEN 3
  END
  LIMIT 1;
$$;

-- RLS Policies for user_roles
CREATE POLICY "Users can view their own roles"
  ON public.user_roles
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all roles"
  ON public.user_roles
  FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage all roles"
  ON public.user_roles
  FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- Trigger function to assign default member role on signup
CREATE OR REPLACE FUNCTION public.handle_new_user_role()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'member');
  RETURN NEW;
END;
$$;

-- Trigger to automatically assign member role on user creation
CREATE TRIGGER on_auth_user_created_assign_role
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user_role();

-- Update existing RLS policies to use has_role function
-- Programs
DROP POLICY IF EXISTS "Coaches can manage programs" ON public.programs;
CREATE POLICY "Coaches can manage programs"
  ON public.programs
  FOR ALL
  USING (
    public.has_role(auth.uid(), 'admin') OR 
    public.has_role(auth.uid(), 'coach')
  );

-- Weeks
DROP POLICY IF EXISTS "Coaches can manage weeks" ON public.weeks;
CREATE POLICY "Coaches can manage weeks"
  ON public.weeks
  FOR ALL
  USING (
    public.has_role(auth.uid(), 'admin') OR 
    public.has_role(auth.uid(), 'coach')
  );

-- Workouts
DROP POLICY IF EXISTS "Coaches can manage workouts" ON public.workouts;
CREATE POLICY "Coaches can manage workouts"
  ON public.workouts
  FOR ALL
  USING (
    public.has_role(auth.uid(), 'admin') OR 
    public.has_role(auth.uid(), 'coach')
  );

-- Exercises
DROP POLICY IF EXISTS "Coaches can manage exercises" ON public.exercises;
CREATE POLICY "Coaches can manage exercises"
  ON public.exercises
  FOR ALL
  USING (
    public.has_role(auth.uid(), 'admin') OR 
    public.has_role(auth.uid(), 'coach')
  );

-- Exercise Media
DROP POLICY IF EXISTS "Coaches can manage exercise media" ON public.exercise_media;
CREATE POLICY "Coaches can manage exercise media"
  ON public.exercise_media
  FOR ALL
  USING (
    public.has_role(auth.uid(), 'admin') OR 
    public.has_role(auth.uid(), 'coach')
  );

-- Coach Videos
DROP POLICY IF EXISTS "Coaches can manage coach videos" ON public.coach_videos;
CREATE POLICY "Coaches can manage coach videos"
  ON public.coach_videos
  FOR ALL
  USING (
    public.has_role(auth.uid(), 'admin') OR 
    public.has_role(auth.uid(), 'coach')
  );

-- Program Media
DROP POLICY IF EXISTS "Coaches can manage program media" ON public.program_media;
CREATE POLICY "Coaches can manage program media"
  ON public.program_media
  FOR ALL
  USING (
    public.has_role(auth.uid(), 'admin') OR 
    public.has_role(auth.uid(), 'coach')
  );

-- Add trigger for updated_at on user_roles
CREATE TRIGGER update_user_roles_updated_at
  BEFORE UPDATE ON public.user_roles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();