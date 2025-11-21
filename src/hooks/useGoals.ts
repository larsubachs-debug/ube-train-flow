import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface Goal {
  id: string;
  user_id: string;
  goal_type: 'weight' | 'body_fat' | 'muscle_mass';
  target_value: number;
  start_date: string;
  target_date: string | null;
  is_active: boolean;
  notes: string | null;
}

export const useGoals = (userId: string | undefined) => {
  const queryClient = useQueryClient();

  const { data: goals, isLoading } = useQuery({
    queryKey: ['user-goals', userId],
    queryFn: async () => {
      if (!userId) throw new Error("User ID required");

      const { data, error } = await supabase
        .from('user_goals')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Goal[];
    },
    enabled: !!userId,
  });

  const addGoal = useMutation({
    mutationFn: async (goal: Omit<Goal, 'id' | 'user_id'>) => {
      if (!userId) throw new Error("User ID required");

      const { data, error } = await supabase
        .from('user_goals')
        .insert({
          user_id: userId,
          ...goal,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-goals', userId] });
      toast.success('Doel toegevoegd!');
    },
    onError: (error) => {
      toast.error('Fout bij opslaan: ' + error.message);
    },
  });

  const updateGoal = useMutation({
    mutationFn: async ({ id, ...goal }: Partial<Goal> & { id: string }) => {
      const { data, error } = await supabase
        .from('user_goals')
        .update(goal)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-goals', userId] });
      toast.success('Doel bijgewerkt!');
    },
    onError: (error) => {
      toast.error('Fout bij bijwerken: ' + error.message);
    },
  });

  const weightGoal = goals?.find(g => g.goal_type === 'weight');

  return {
    goals,
    weightGoal,
    isLoading,
    addGoal,
    updateGoal,
  };
};
