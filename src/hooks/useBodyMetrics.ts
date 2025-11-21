import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface BodyMetric {
  id: string;
  user_id: string;
  recorded_at: string;
  weight: number | null;
  body_fat_percentage: number | null;
  muscle_mass: number | null;
  notes: string | null;
}

export const useBodyMetrics = (userId: string | undefined) => {
  const queryClient = useQueryClient();

  const { data: metrics, isLoading } = useQuery({
    queryKey: ['body-metrics', userId],
    queryFn: async () => {
      if (!userId) throw new Error("User ID required");

      const { data, error } = await supabase
        .from('body_metrics')
        .select('*')
        .eq('user_id', userId)
        .order('recorded_at', { ascending: false });

      if (error) throw error;
      return data as BodyMetric[];
    },
    enabled: !!userId,
  });

  const addMetric = useMutation({
    mutationFn: async (metric: Omit<BodyMetric, 'id' | 'user_id'>) => {
      if (!userId) throw new Error("User ID required");

      const { data, error } = await supabase
        .from('body_metrics')
        .insert({
          user_id: userId,
          ...metric,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['body-metrics', userId] });
      toast.success('Body metrics toegevoegd!');
    },
    onError: (error) => {
      toast.error('Fout bij opslaan: ' + error.message);
    },
  });

  const updateMetric = useMutation({
    mutationFn: async ({ id, ...metric }: Partial<BodyMetric> & { id: string }) => {
      const { data, error } = await supabase
        .from('body_metrics')
        .update(metric)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['body-metrics', userId] });
      toast.success('Body metrics bijgewerkt!');
    },
    onError: (error) => {
      toast.error('Fout bij bijwerken: ' + error.message);
    },
  });

  const latestMetric = metrics?.[0];

  return {
    metrics,
    latestMetric,
    isLoading,
    addMetric,
    updateMetric,
  };
};
