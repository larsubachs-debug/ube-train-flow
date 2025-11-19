-- Create chat_messages table
CREATE TABLE public.chat_messages (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  member_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  coach_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL,
  message text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  read_at timestamp with time zone
);

-- Enable RLS
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- Members can view messages in their conversations
CREATE POLICY "Members can view their own chat messages"
  ON public.chat_messages
  FOR SELECT
  USING (
    member_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
    OR coach_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
  );

-- Members can send messages to their coach
CREATE POLICY "Members can send messages to their coach"
  ON public.chat_messages
  FOR INSERT
  WITH CHECK (
    sender_id = auth.uid()
    AND member_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
  );

-- Coaches can send messages to their members
CREATE POLICY "Coaches can send messages to their members"
  ON public.chat_messages
  FOR INSERT
  WITH CHECK (
    sender_id = auth.uid()
    AND coach_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
  );

-- Users can mark their messages as read
CREATE POLICY "Users can mark messages as read"
  ON public.chat_messages
  FOR UPDATE
  USING (
    member_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
    OR coach_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
  );

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;