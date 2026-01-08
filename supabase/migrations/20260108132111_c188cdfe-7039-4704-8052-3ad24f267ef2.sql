-- Create storage bucket for reports
INSERT INTO storage.buckets (id, name, public)
VALUES ('reports', 'reports', false)
ON CONFLICT (id) DO NOTHING;

-- Create user_reports table to track generated reports
CREATE TABLE public.user_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  report_type TEXT NOT NULL CHECK (report_type IN ('week', 'month', 'year', 'program')),
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  file_path TEXT,
  file_name TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'generating', 'completed', 'failed')),
  shared_with_coach BOOLEAN DEFAULT false,
  report_data JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  error_message TEXT
);

-- Enable RLS
ALTER TABLE public.user_reports ENABLE ROW LEVEL SECURITY;

-- Users can view their own reports
CREATE POLICY "Users can view own reports"
ON public.user_reports
FOR SELECT
USING (auth.uid() = user_id);

-- Users can create their own reports
CREATE POLICY "Users can create own reports"
ON public.user_reports
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own reports
CREATE POLICY "Users can update own reports"
ON public.user_reports
FOR UPDATE
USING (auth.uid() = user_id);

-- Users can delete their own reports
CREATE POLICY "Users can delete own reports"
ON public.user_reports
FOR DELETE
USING (auth.uid() = user_id);

-- Coaches can view reports shared with them
CREATE POLICY "Coaches can view shared reports"
ON public.user_reports
FOR SELECT
USING (
  shared_with_coach = true 
  AND public.is_coach_of_member(auth.uid(), user_id)
);

-- Storage policies for reports bucket
CREATE POLICY "Users can upload own reports"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'reports' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view own reports files"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'reports' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Coaches can view shared report files"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'reports'
  AND EXISTS (
    SELECT 1 FROM public.user_reports ur
    WHERE ur.file_path = name
    AND ur.shared_with_coach = true
    AND public.is_coach_of_member(auth.uid(), ur.user_id)
  )
);

CREATE POLICY "Users can delete own report files"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'reports' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Create index for faster queries
CREATE INDEX idx_user_reports_user_id ON public.user_reports(user_id);
CREATE INDEX idx_user_reports_type_date ON public.user_reports(report_type, period_start, period_end);