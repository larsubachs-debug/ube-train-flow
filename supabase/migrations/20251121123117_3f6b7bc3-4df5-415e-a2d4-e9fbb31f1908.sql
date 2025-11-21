-- Drop the existing view
DROP VIEW IF EXISTS coach_members;

-- Recreate the view with SECURITY INVOKER to respect RLS policies of underlying tables
CREATE VIEW coach_members 
WITH (security_invoker = true)
AS
SELECT 
  p.id AS member_id,
  p.user_id AS member_user_id,
  p.display_name AS member_name,
  p.avatar_url AS member_avatar,
  p.coach_id,
  coach.display_name AS coach_name,
  ur.role AS member_role
FROM profiles p
LEFT JOIN profiles coach ON p.coach_id = coach.id
LEFT JOIN user_roles ur ON p.user_id = ur.user_id
WHERE p.role = 'member';