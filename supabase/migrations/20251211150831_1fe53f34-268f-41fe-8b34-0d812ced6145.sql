-- Fix: Remove recursive policies and create simple ones

-- Drop the problematic policies
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can view profiles for social features" ON profiles;

-- Simple policy: Users can view their own profile
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = user_id);

-- Allow coaches and admins to view all profiles (they need this for member management)
CREATE POLICY "Coaches and admins can view all profiles"
  ON profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_roles.user_id = auth.uid() 
      AND role IN ('admin', 'coach')
    )
  );

-- Allow viewing profiles of users with the same coach (members in same group)
CREATE POLICY "Members can view profiles in same coach group"
  ON profiles FOR SELECT
  USING (
    coach_id IS NOT NULL 
    AND coach_id = (
      SELECT p.coach_id FROM profiles p WHERE p.user_id = auth.uid()
    )
  );