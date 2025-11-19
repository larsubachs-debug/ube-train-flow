-- Create storage buckets for different media types
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('program-images', 'program-images', true, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp']),
  ('exercise-media', 'exercise-media', true, 52428800, ARRAY['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/webm']),
  ('coach-videos', 'coach-videos', true, 104857600, ARRAY['video/mp4', 'video/webm']),
  ('community-uploads', 'community-uploads', true, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp', 'video/mp4']),
  ('checkin-photos', 'checkin-photos', true, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp']);

-- Create profiles table for user information
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  display_name TEXT,
  avatar_url TEXT,
  role TEXT DEFAULT 'user' CHECK (role IN ('user', 'coach', 'admin')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all profiles"
  ON public.profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create media metadata table
CREATE TABLE IF NOT EXISTS public.media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  bucket_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size INTEGER,
  mime_type TEXT,
  width INTEGER,
  height INTEGER,
  duration REAL,
  thumbnail_url TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.media ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all media"
  ON public.media FOR SELECT
  USING (true);

CREATE POLICY "Users can upload media"
  ON public.media FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own media"
  ON public.media FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own media"
  ON public.media FOR DELETE
  USING (auth.uid() = user_id);

-- Create program media table
CREATE TABLE IF NOT EXISTS public.program_media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id TEXT NOT NULL,
  media_id UUID REFERENCES public.media(id) ON DELETE CASCADE,
  media_type TEXT NOT NULL CHECK (media_type IN ('header', 'tile', 'coaching', 'banner')),
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.program_media ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view program media"
  ON public.program_media FOR SELECT
  USING (true);

CREATE POLICY "Coaches can manage program media"
  ON public.program_media FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.user_id = auth.uid() 
      AND profiles.role IN ('coach', 'admin')
    )
  );

-- Create exercise media table
CREATE TABLE IF NOT EXISTS public.exercise_media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exercise_id TEXT NOT NULL,
  media_id UUID REFERENCES public.media(id) ON DELETE CASCADE,
  media_type TEXT NOT NULL CHECK (media_type IN ('video', 'image', 'thumbnail')),
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.exercise_media ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view exercise media"
  ON public.exercise_media FOR SELECT
  USING (true);

CREATE POLICY "Coaches can manage exercise media"
  ON public.exercise_media FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.user_id = auth.uid() 
      AND profiles.role IN ('coach', 'admin')
    )
  );

-- Create coach videos table (weekly opening videos)
CREATE TABLE IF NOT EXISTS public.coach_videos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id TEXT NOT NULL,
  week_number INTEGER NOT NULL,
  media_id UUID REFERENCES public.media(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.coach_videos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view coach videos"
  ON public.coach_videos FOR SELECT
  USING (true);

CREATE POLICY "Coaches can manage coach videos"
  ON public.coach_videos FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.user_id = auth.uid() 
      AND profiles.role IN ('coach', 'admin')
    )
  );

-- Create community posts table
CREATE TABLE IF NOT EXISTS public.community_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  program_id TEXT,
  content TEXT,
  media_id UUID REFERENCES public.media(id) ON DELETE SET NULL,
  post_type TEXT DEFAULT 'image' CHECK (post_type IN ('text', 'image', 'video')),
  likes_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.community_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view community posts"
  ON public.community_posts FOR SELECT
  USING (true);

CREATE POLICY "Users can create posts"
  ON public.community_posts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own posts"
  ON public.community_posts FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own posts"
  ON public.community_posts FOR DELETE
  USING (auth.uid() = user_id);

-- Create checkin photos table
CREATE TABLE IF NOT EXISTS public.checkin_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  checkin_week INTEGER NOT NULL,
  media_id UUID REFERENCES public.media(id) ON DELETE CASCADE,
  photo_type TEXT DEFAULT 'progress' CHECK (photo_type IN ('progress', 'front', 'back', 'side')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.checkin_photos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own checkin photos"
  ON public.checkin_photos FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create checkin photos"
  ON public.checkin_photos FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own checkin photos"
  ON public.checkin_photos FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own checkin photos"
  ON public.checkin_photos FOR DELETE
  USING (auth.uid() = user_id);

-- Storage policies for program-images bucket
CREATE POLICY "Anyone can view program images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'program-images');

CREATE POLICY "Coaches can upload program images"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'program-images' AND
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.user_id = auth.uid() 
      AND profiles.role IN ('coach', 'admin')
    )
  );

CREATE POLICY "Coaches can update program images"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'program-images' AND
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.user_id = auth.uid() 
      AND profiles.role IN ('coach', 'admin')
    )
  );

CREATE POLICY "Coaches can delete program images"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'program-images' AND
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.user_id = auth.uid() 
      AND profiles.role IN ('coach', 'admin')
    )
  );

-- Storage policies for exercise-media bucket
CREATE POLICY "Anyone can view exercise media"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'exercise-media');

CREATE POLICY "Coaches can upload exercise media"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'exercise-media' AND
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.user_id = auth.uid() 
      AND profiles.role IN ('coach', 'admin')
    )
  );

CREATE POLICY "Coaches can update exercise media"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'exercise-media' AND
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.user_id = auth.uid() 
      AND profiles.role IN ('coach', 'admin')
    )
  );

CREATE POLICY "Coaches can delete exercise media"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'exercise-media' AND
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.user_id = auth.uid() 
      AND profiles.role IN ('coach', 'admin')
    )
  );

-- Storage policies for coach-videos bucket
CREATE POLICY "Anyone can view coach videos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'coach-videos');

CREATE POLICY "Coaches can upload coach videos"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'coach-videos' AND
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.user_id = auth.uid() 
      AND profiles.role IN ('coach', 'admin')
    )
  );

CREATE POLICY "Coaches can update coach videos"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'coach-videos' AND
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.user_id = auth.uid() 
      AND profiles.role IN ('coach', 'admin')
    )
  );

CREATE POLICY "Coaches can delete coach videos"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'coach-videos' AND
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.user_id = auth.uid() 
      AND profiles.role IN ('coach', 'admin')
    )
  );

-- Storage policies for community-uploads bucket
CREATE POLICY "Anyone can view community uploads"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'community-uploads');

CREATE POLICY "Users can upload community content"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'community-uploads' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update own community uploads"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'community-uploads' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete own community uploads"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'community-uploads' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Storage policies for checkin-photos bucket
CREATE POLICY "Users can view own checkin photos storage"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'checkin-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can upload checkin photos"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'checkin-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update own checkin photos storage"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'checkin-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete own checkin photos storage"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'checkin-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Create indexes for better performance
CREATE INDEX idx_media_user_id ON public.media(user_id);
CREATE INDEX idx_media_bucket_name ON public.media(bucket_name);
CREATE INDEX idx_program_media_program_id ON public.program_media(program_id);
CREATE INDEX idx_exercise_media_exercise_id ON public.exercise_media(exercise_id);
CREATE INDEX idx_coach_videos_program_week ON public.coach_videos(program_id, week_number);
CREATE INDEX idx_community_posts_user_id ON public.community_posts(user_id);
CREATE INDEX idx_community_posts_program_id ON public.community_posts(program_id);
CREATE INDEX idx_checkin_photos_user_week ON public.checkin_photos(user_id, checkin_week);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_media_updated_at
  BEFORE UPDATE ON public.media
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_community_posts_updated_at
  BEFORE UPDATE ON public.community_posts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();