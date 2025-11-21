import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface WorkoutSet {
  id: string;
  user_id: string;
  workout_id: string;
  exercise_name: string;
  set_number: number;
  weight: number | null;
  reps: number | null;
  rpe: number | null;
  completed: boolean;
  completed_at: string;
  created_at: string;
}

export const useWorkoutSets = (workoutId: string, exerciseName?: string) => {
  const { user } = useAuth();
  const [sets, setSets] = useState<WorkoutSet[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchSets = async () => {
    if (!user || !workoutId) return;

    setLoading(true);
    try {
      let query = supabase
        .from("workout_sets")
        .select("*")
        .eq("user_id", user.id)
        .eq("workout_id", workoutId)
        .order("completed_at", { ascending: false });

      if (exerciseName) {
        query = query.eq("exercise_name", exerciseName);
      }

      const { data, error } = await query;

      if (error) {
        console.error("Error fetching workout sets:", error);
        return;
      }

      setSets(data || []);
    } catch (error) {
      console.error("Error in fetchSets:", error);
    } finally {
      setLoading(false);
    }
  };

  const saveSet = async (
    exerciseName: string,
    setNumber: number,
    weight: number | null,
    reps: number | null,
    rpe: number | null
  ) => {
    if (!user) {
      toast.error("You must be logged in");
      return false;
    }

    try {
      const { error } = await supabase.from("workout_sets").insert({
        user_id: user.id,
        workout_id: workoutId,
        exercise_name: exerciseName,
        set_number: setNumber,
        weight,
        reps,
        rpe,
        completed: true,
      });

      if (error) {
        console.error("Error saving set:", error);
        toast.error("Failed to save set");
        return false;
      }

      await fetchSets();
      return true;
    } catch (error) {
      console.error("Error in saveSet:", error);
      toast.error("Failed to save set");
      return false;
    }
  };

  const getHistoricalRPE = async (exerciseName: string, limit = 10) => {
    if (!user) return [];

    try {
      const { data, error } = await supabase
        .from("workout_sets")
        .select("*")
        .eq("user_id", user.id)
        .eq("exercise_name", exerciseName)
        .not("rpe", "is", null)
        .order("completed_at", { ascending: false })
        .limit(limit);

      if (error) {
        console.error("Error fetching historical RPE:", error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error("Error in getHistoricalRPE:", error);
      return [];
    }
  };

  useEffect(() => {
    fetchSets();
  }, [user, workoutId, exerciseName]);

  return {
    sets,
    loading,
    saveSet,
    getHistoricalRPE,
    refetch: fetchSets,
  };
};
