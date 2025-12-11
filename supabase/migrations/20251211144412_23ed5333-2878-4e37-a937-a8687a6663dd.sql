-- Create invitations table for coach invites
CREATE TABLE public.invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  email text NOT NULL,
  token text NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired')),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  expires_at timestamp with time zone NOT NULL DEFAULT (now() + interval '7 days')
);

-- Enable RLS
ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;

-- Coaches can view and manage their own invitations
CREATE POLICY "Coaches can view own invitations"
ON public.invitations FOR SELECT
USING (coach_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

CREATE POLICY "Coaches can create invitations"
ON public.invitations FOR INSERT
WITH CHECK (
  coach_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()) 
  AND (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'coach'))
);

CREATE POLICY "Coaches can update own invitations"
ON public.invitations FOR UPDATE
USING (coach_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

CREATE POLICY "Coaches can delete own invitations"
ON public.invitations FOR DELETE
USING (coach_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

-- Allow public access to verify tokens (for signup flow)
CREATE POLICY "Anyone can verify invitation tokens"
ON public.invitations FOR SELECT
USING (true);

-- Function to handle invited user signup - auto-approve and assign coach
CREATE OR REPLACE FUNCTION public.handle_invited_user_signup()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  invitation_record RECORD;
BEGIN
  -- Check if there's a pending invitation for this email
  SELECT * INTO invitation_record
  FROM public.invitations
  WHERE email = NEW.email
    AND status = 'pending'
    AND expires_at > now()
  ORDER BY created_at DESC
  LIMIT 1;

  -- If invitation exists, auto-approve the user
  IF FOUND THEN
    -- Update the user's profile to be approved and assign coach
    UPDATE public.profiles
    SET 
      approval_status = 'approved',
      approved_at = now(),
      approved_by = invitation_record.coach_id,
      coach_id = invitation_record.coach_id
    WHERE user_id = NEW.id;

    -- Mark invitation as accepted
    UPDATE public.invitations
    SET status = 'accepted'
    WHERE id = invitation_record.id;
  END IF;

  RETURN NEW;
END;
$$;

-- Create trigger to run after user is created (after handle_new_user)
CREATE TRIGGER on_auth_user_created_check_invitation
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_invited_user_signup();