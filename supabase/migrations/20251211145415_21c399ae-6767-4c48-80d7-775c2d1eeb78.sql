-- Fix: Restrict profile SELECT access to prevent data harvesting

-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Users can view all profiles" ON profiles;

-- Users can view their own profile
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = user_id);

-- Members can view basic profile info of users they interact with (shared workouts, community)
CREATE POLICY "Users can view profiles for social features"
  ON profiles FOR SELECT
  USING (
    -- Allow viewing profiles of users who shared workouts publicly
    id IN (SELECT user_id FROM shared_workouts)
    OR
    -- Allow viewing profiles of community post authors
    id IN (SELECT user_id FROM community_posts)
    OR
    -- Allow viewing profiles of comment authors
    id IN (SELECT user_id FROM post_comments)
  );