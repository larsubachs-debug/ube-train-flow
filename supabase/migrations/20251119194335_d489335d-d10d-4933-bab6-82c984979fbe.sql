-- Create storage bucket for chat media
INSERT INTO storage.buckets (id, name, public)
VALUES ('chat-media', 'chat-media', true);

-- Add media columns to chat_messages
ALTER TABLE public.chat_messages
ADD COLUMN media_type text,
ADD COLUMN media_url text;

-- Create storage policies for chat media
CREATE POLICY "Users can upload chat media"
  ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'chat-media'
    AND auth.uid() IS NOT NULL
  );

CREATE POLICY "Users can view chat media"
  ON storage.objects
  FOR SELECT
  USING (
    bucket_id = 'chat-media'
  );

CREATE POLICY "Users can delete own chat media"
  ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'chat-media'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );