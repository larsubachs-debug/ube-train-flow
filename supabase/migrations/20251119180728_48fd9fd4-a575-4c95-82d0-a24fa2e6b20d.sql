-- Add approval status to profiles
CREATE TYPE public.approval_status AS ENUM ('pending', 'approved', 'rejected');

ALTER TABLE public.profiles
  ADD COLUMN approval_status public.approval_status DEFAULT 'pending',
  ADD COLUMN approved_by UUID REFERENCES auth.users(id),
  ADD COLUMN approved_at TIMESTAMPTZ,
  ADD COLUMN rejection_reason TEXT;

-- Create index for filtering pending users
CREATE INDEX idx_profiles_approval_status ON public.profiles(approval_status);

-- Update RLS policies for profiles
-- Coaches and admins can view all profiles
CREATE POLICY "Coaches can view all profiles"
  ON public.profiles
  FOR SELECT
  USING (
    public.has_role(auth.uid(), 'admin') OR 
    public.has_role(auth.uid(), 'coach')
  );

-- Coaches and admins can update approval status
CREATE POLICY "Coaches can update profiles"
  ON public.profiles
  FOR UPDATE
  USING (
    public.has_role(auth.uid(), 'admin') OR 
    public.has_role(auth.uid(), 'coach')
  );

-- Function to check if user is approved
CREATE OR REPLACE FUNCTION public.is_user_approved(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT approval_status = 'approved'
  FROM public.profiles
  WHERE user_id = _user_id;
$$;

-- Update existing profiles to be approved
UPDATE public.profiles SET approval_status = 'approved' WHERE approval_status = 'pending';