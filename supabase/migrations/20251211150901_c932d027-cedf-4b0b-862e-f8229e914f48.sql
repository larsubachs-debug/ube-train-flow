-- Remove all potentially recursive SELECT policies on profiles
DROP POLICY IF EXISTS "Users can view profiles for social features" ON profiles;
DROP POLICY IF EXISTS "Members can view profiles in same coach group" ON profiles;
DROP POLICY IF EXISTS "Coaches and admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Coaches can view all profiles" ON profiles;

-- Create simple non-recursive policy: use has_role function which is already security definer
CREATE POLICY "Coaches and admins can view all profiles"
  ON profiles FOR SELECT
  USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'coach'));