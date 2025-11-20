import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export const useWorkoutCompletion = () => {
  const { user } = useAuth();
  const [isCompleting, setIsCompleting] = useState(false);

  const completeWorkout = async (workoutId: string, notes?: string) => {
    if (!user) {
      toast.error("You must be logged in to complete a workout");
      return false;
    }

    setIsCompleting(true);
    try {
      // Check if workout was already completed today
      const today = new Date().toISOString().split('T')[0];
      const { data: existingCompletion } = await supabase
        .from("workout_completions")
        .select("id")
        .eq("user_id", user.id)
        .eq("workout_id", workoutId)
        .eq("completion_date", today)
        .single();

      if (existingCompletion) {
        toast.info("You've already completed this workout today");
        return true;
      }

      // Insert workout completion
      const { error } = await supabase
        .from("workout_completions")
        .insert({
          user_id: user.id,
          workout_id: workoutId,
          completion_date: today,
          notes: notes || null,
        });

      if (error) {
        console.error("Error completing workout:", error);
        toast.error("Failed to complete workout");
        return false;
      }

      toast.success("Workout completed! 💪");
      return true;
    } catch (error) {
      console.error("Error in completeWorkout:", error);
      toast.error("Failed to complete workout");
      return false;
    } finally {
      setIsCompleting(false);
    }
  };

  const checkIfCompleted = async (workoutId: string): Promise<boolean> => {
    if (!user) return false;

    try {
      const today = new Date().toISOString().split('T')[0];
      const { data } = await supabase
        .from("workout_completions")
        .select("id")
        .eq("user_id", user.id)
        .eq("workout_id", workoutId)
        .eq("completion_date", today)
        .single();

      return !!data;
    } catch (error) {
      return false;
    }
  };

  return {
    completeWorkout,
    checkIfCompleted,
    isCompleting,
  };
};
