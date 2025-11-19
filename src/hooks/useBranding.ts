import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useBranding = () => {
  return useQuery({
    queryKey: ['app-branding'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('app_branding')
        .select('*')
        .single();
      
      if (error && error.code !== 'PGRST116') throw error;
      
      // Return default branding if none exists
      return data || {
        app_name: 'U.be',
        tagline: 'ALL ABOUT U',
        hero_title: 'Welkom',
        hero_subtitle: null,
        logo_url: null,
        primary_color: '#1a1a1a',
        accent_color: '#ff6b00',
        font_family: 'system',
        show_weekly_progress: true,
        show_stats_cards: true
      };
    },
    staleTime: 1000 * 60 * 5 // Cache for 5 minutes
  });
};
