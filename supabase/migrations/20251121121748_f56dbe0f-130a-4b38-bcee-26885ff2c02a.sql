-- Update the RLS policy to allow admins and coaches to assign programs to themselves
DROP POLICY IF EXISTS "Coaches can assign programs to their members" ON public.user_program_progress;

CREATE POLICY "Coaches and admins can assign programs"
ON public.user_program_progress
FOR INSERT
TO authenticated
WITH CHECK (
  -- Users can assign to themselves
  (auth.uid() = user_id)
  OR
  -- Coaches can assign to their members
  (
    has_role(auth.uid(), 'coach'::app_role) 
    AND EXISTS (
      SELECT 1
      FROM profiles
      WHERE profiles.user_id = user_program_progress.user_id
      AND profiles.coach_id IN (
        SELECT profiles.id
        FROM profiles
        WHERE profiles.user_id = auth.uid()
      )
    )
  )
  OR
  -- Admins can assign to anyone
  has_role(auth.uid(), 'admin'::app_role)
);