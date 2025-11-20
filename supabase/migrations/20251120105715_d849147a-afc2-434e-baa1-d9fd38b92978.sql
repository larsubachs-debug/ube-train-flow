-- Allow coaches to insert program progress for their members
CREATE POLICY "Coaches can assign programs to their members" 
ON public.user_program_progress 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 
    FROM public.profiles 
    WHERE profiles.user_id = user_program_progress.user_id 
    AND profiles.coach_id IN (
      SELECT id 
      FROM public.profiles 
      WHERE user_id = auth.uid()
    )
  )
  OR 
  has_role(auth.uid(), 'admin'::app_role) 
  OR 
  has_role(auth.uid(), 'coach'::app_role)
);