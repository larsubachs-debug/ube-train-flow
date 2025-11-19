-- Add fields to programs table for ownership and visibility
ALTER TABLE public.programs
ADD COLUMN created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
ADD COLUMN is_public boolean DEFAULT true;

-- Update existing programs to be public
UPDATE public.programs SET is_public = true WHERE is_public IS NULL;

-- Drop existing RLS policies on programs
DROP POLICY IF EXISTS "Anyone can view programs" ON public.programs;
DROP POLICY IF EXISTS "Coaches can manage programs" ON public.programs;

-- Create new RLS policies for programs with visibility control
CREATE POLICY "Public programs are viewable by everyone"
ON public.programs
FOR SELECT
USING (is_public = true);

CREATE POLICY "Users can view assigned private programs"
ON public.programs
FOR SELECT
USING (
  is_public = false AND
  EXISTS (
    SELECT 1 FROM public.user_program_progress upp
    WHERE upp.program_id = programs.id
    AND upp.user_id = auth.uid()
  )
);

CREATE POLICY "Coaches can view their own programs"
ON public.programs
FOR SELECT
USING (
  created_by IN (
    SELECT user_id FROM public.profiles
    WHERE id IN (
      SELECT id FROM public.profiles WHERE user_id = auth.uid()
    )
  )
);

CREATE POLICY "Coaches can create programs"
ON public.programs
FOR INSERT
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'coach'::app_role)
);

CREATE POLICY "Coaches can update their own programs or public ones"
ON public.programs
FOR UPDATE
USING (
  (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'coach'::app_role))
  AND (is_public = true OR created_by IN (
    SELECT user_id FROM public.profiles WHERE id IN (
      SELECT id FROM public.profiles WHERE user_id = auth.uid()
    )
  ))
);

CREATE POLICY "Coaches can delete their own programs or admins can delete any"
ON public.programs
FOR DELETE
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  (has_role(auth.uid(), 'coach'::app_role) AND created_by IN (
    SELECT user_id FROM public.profiles WHERE id IN (
      SELECT id FROM public.profiles WHERE user_id = auth.uid()
    )
  ))
);