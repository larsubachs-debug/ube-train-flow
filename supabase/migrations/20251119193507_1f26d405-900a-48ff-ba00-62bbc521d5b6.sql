-- Add coach_id to profiles table to link members to coaches
ALTER TABLE public.profiles
ADD COLUMN coach_id uuid REFERENCES public.profiles(id);

-- Create coach_members view for easy querying
CREATE OR REPLACE VIEW public.coach_members AS
SELECT 
  p.id as member_id,
  p.user_id as member_user_id,
  p.display_name as member_name,
  p.avatar_url as member_avatar,
  p.coach_id,
  c.display_name as coach_name,
  ur.role as member_role
FROM public.profiles p
LEFT JOIN public.profiles c ON p.coach_id = c.id
LEFT JOIN public.user_roles ur ON p.user_id = ur.user_id
WHERE ur.role = 'member';

-- Create function to check if user is coach of member
CREATE OR REPLACE FUNCTION public.is_coach_of_member(_coach_id uuid, _member_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = _member_id
      AND coach_id = _coach_id
  );
$$;

-- Update checkin_photos RLS to allow coaches to view their members' check-ins
CREATE POLICY "Coaches can view their members checkin photos"
  ON public.checkin_photos
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.user_id = checkin_photos.user_id
        AND profiles.coach_id IN (
          SELECT id FROM public.profiles WHERE user_id = auth.uid()
        )
    )
  );

-- Update user_stats RLS to allow coaches to view their members' stats
CREATE POLICY "Coaches can view their members stats"
  ON public.user_stats
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.user_id = user_stats.user_id
        AND profiles.coach_id IN (
          SELECT id FROM public.profiles WHERE user_id = auth.uid()
        )
    )
  );

-- Update community_posts RLS to allow coaches to view their members' posts
CREATE POLICY "Coaches can view their members posts"
  ON public.community_posts
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.user_id = community_posts.user_id
        AND profiles.coach_id IN (
          SELECT id FROM public.profiles WHERE user_id = auth.uid()
        )
    )
  );