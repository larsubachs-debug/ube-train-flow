-- Fix security definer view by recreating coach_members view without security definer
DROP VIEW IF EXISTS coach_members;

CREATE VIEW coach_members AS
SELECT 
  p.id as member_id,
  p.user_id as member_user_id,
  p.display_name as member_name,
  p.avatar_url as member_avatar,
  p.coach_id,
  coach.display_name as coach_name,
  ur.role as member_role
FROM profiles p
LEFT JOIN profiles coach ON p.coach_id = coach.id
LEFT JOIN user_roles ur ON p.user_id = ur.user_id
WHERE p.role = 'member';