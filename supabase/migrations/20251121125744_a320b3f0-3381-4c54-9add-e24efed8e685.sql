-- Drop existing policies for exercise-media bucket
DROP POLICY IF EXISTS "Coaches can upload exercise media" ON storage.objects;
DROP POLICY IF EXISTS "Coaches can update exercise media" ON storage.objects;
DROP POLICY IF EXISTS "Coaches can delete exercise media" ON storage.objects;

-- Create new simplified policies for exercise-media bucket
-- Allow authenticated users with admin or coach role to upload
CREATE POLICY "Coaches can upload exercise media"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'exercise-media' 
  AND EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'coach')
  )
);

-- Allow authenticated users with admin or coach role to update
CREATE POLICY "Coaches can update exercise media"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'exercise-media'
  AND EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'coach')
  )
);

-- Allow authenticated users with admin or coach role to delete
CREATE POLICY "Coaches can delete exercise media"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'exercise-media'
  AND EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'coach')
  )
);