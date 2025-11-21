import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface ExerciseMax {
  exercise_name: string;
  max_weight: number;
  max_reps: number;
  estimated_1rm: number;
  recorded_at: string;
}

const calculate1RM = (weight: number, reps: number): number => {
  // Epley formula: 1RM = weight × (1 + reps/30)
  return Math.round(weight * (1 + reps / 30));
};

export const use1RMCalculations = (userId: string | undefined) => {
  return useQuery({
    queryKey: ['1rm-calculations', userId],
    queryFn: async () => {
      if (!userId) throw new Error("User ID required");

      // Get all completed sets grouped by exercise
      const { data: sets, error } = await supabase
        .from('workout_sets')
        .select('exercise_name, weight, reps, completed_at')
        .eq('user_id', userId)
        .eq('completed', true)
        .not('weight', 'is', null)
        .not('reps', 'is', null)
        .order('completed_at', { ascending: false });

      if (error) throw error;

      // Group by exercise and calculate max 1RM for each
      const exerciseMaxes = new Map<string, ExerciseMax>();

      sets?.forEach((set) => {
        const weight = Number(set.weight);
        const reps = Number(set.reps);
        const estimated_1rm = calculate1RM(weight, reps);

        const existing = exerciseMaxes.get(set.exercise_name);
        
        if (!existing || estimated_1rm > existing.estimated_1rm) {
          exerciseMaxes.set(set.exercise_name, {
            exercise_name: set.exercise_name,
            max_weight: weight,
            max_reps: reps,
            estimated_1rm,
            recorded_at: set.completed_at,
          });
        }
      });

      return Array.from(exerciseMaxes.values())
        .sort((a, b) => b.estimated_1rm - a.estimated_1rm)
        .slice(0, 10); // Top 10 exercises
    },
    enabled: !!userId,
  });
};
