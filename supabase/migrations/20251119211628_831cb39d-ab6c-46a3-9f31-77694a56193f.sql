-- Branding Settings System

CREATE TABLE public.app_branding (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  app_name text DEFAULT 'U.be',
  tagline text DEFAULT 'ALL ABOUT U',
  hero_title text DEFAULT 'Welkom',
  hero_subtitle text,
  logo_url text,
  primary_color text DEFAULT '#1a1a1a', -- hex color
  accent_color text DEFAULT '#ff6b00', -- hex color
  font_family text DEFAULT 'system', -- system, inter, roboto, playfair, etc
  show_weekly_progress boolean DEFAULT true,
  show_stats_cards boolean DEFAULT true,
  updated_by uuid,
  updated_at timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.app_branding ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Anyone can view branding"
  ON public.app_branding FOR SELECT
  USING (true);

CREATE POLICY "Coaches can update branding"
  ON public.app_branding FOR UPDATE
  USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'coach'));

CREATE POLICY "Coaches can insert branding"
  ON public.app_branding FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'coach'));

-- Trigger for updated_at
CREATE TRIGGER update_app_branding_updated_at
  BEFORE UPDATE ON public.app_branding
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default branding (single row)
INSERT INTO public.app_branding (id, app_name, tagline) 
VALUES ('00000000-0000-0000-0000-000000000001', 'U.be', 'ALL ABOUT U');