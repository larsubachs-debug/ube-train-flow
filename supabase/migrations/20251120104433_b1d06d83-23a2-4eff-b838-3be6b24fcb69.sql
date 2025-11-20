-- Add superset/tri-set/giant-set support to exercises table
ALTER TABLE public.exercises 
ADD COLUMN IF NOT EXISTS group_id text,
ADD COLUMN IF NOT EXISTS group_type text CHECK (group_type IN ('superset', 'tri-set', 'giant-set'));

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_exercises_group_id ON public.exercises(group_id) WHERE group_id IS NOT NULL;

-- Add comment for clarity
COMMENT ON COLUMN public.exercises.group_id IS 'Links exercises together in supersets, tri-sets, or giant-sets';
COMMENT ON COLUMN public.exercises.group_type IS 'Type of exercise group: superset (2), tri-set (3), or giant-set (4+)';