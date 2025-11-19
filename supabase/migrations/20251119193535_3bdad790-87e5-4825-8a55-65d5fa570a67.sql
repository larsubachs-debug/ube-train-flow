-- Drop the security definer view and recreate without it
DROP VIEW IF EXISTS public.coach_members;

-- Recreate view without security definer (uses invoker's permissions)
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

-- Grant SELECT permission on the view
GRANT SELECT ON public.coach_members TO authenticated;