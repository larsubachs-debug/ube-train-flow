-- Drop oude policies
DROP POLICY IF EXISTS "Coaches can upload program images" ON storage.objects;
DROP POLICY IF EXISTS "Coaches can update program images" ON storage.objects;
DROP POLICY IF EXISTS "Coaches can delete program images" ON storage.objects;

-- Nieuwe policies met correcte user_roles check
CREATE POLICY "Coaches can upload program images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'program-images' 
  AND (
    has_role(auth.uid(), 'admin'::app_role) 
    OR has_role(auth.uid(), 'coach'::app_role)
  )
);

CREATE POLICY "Coaches can update program images"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'program-images' 
  AND (
    has_role(auth.uid(), 'admin'::app_role) 
    OR has_role(auth.uid(), 'coach'::app_role)
  )
);

CREATE POLICY "Coaches can delete program images"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'program-images' 
  AND (
    has_role(auth.uid(), 'admin'::app_role) 
    OR has_role(auth.uid(), 'coach'::app_role)
  )
);