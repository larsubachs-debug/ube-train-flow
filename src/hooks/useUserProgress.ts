import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface UserProgress {
  id: string;
  user_id: string;
  program_id: string;
  current_week_number: number;
  start_date: string;
  completed: boolean;
}

export interface WeekWithPhase {
  id: string;
  name: string;
  week_number: number;
  description: string | null;
  phase_name: string | null;
}

export const useUserProgress = (programId?: string) => {
  const { user } = useAuth();
  const [progress, setProgress] = useState<UserProgress | null>(null);
  const [currentWeek, setCurrentWeek] = useState<WeekWithPhase | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !programId) {
      setLoading(false);
      return;
    }

    const fetchProgress = async () => {
      try {
        // Check if user has progress for this program
        const { data: existingProgress, error: progressError } = await supabase
          .from("user_program_progress")
          .select("*")
          .eq("user_id", user.id)
          .eq("program_id", programId)
          .single();

        if (progressError && progressError.code !== "PGRST116") {
          console.error("Error fetching progress:", progressError);
          setLoading(false);
          return;
        }

        let userProgress = existingProgress;

        // If no progress exists, create initial progress
        if (!existingProgress) {
          const { data: newProgress, error: insertError } = await supabase
            .from("user_program_progress")
            .insert({
              user_id: user.id,
              program_id: programId,
              current_week_number: 1,
              start_date: new Date().toISOString().split('T')[0],
            })
            .select()
            .single();

          if (insertError) {
            console.error("Error creating progress:", insertError);
            setLoading(false);
            return;
          }

          userProgress = newProgress;
        }

        setProgress(userProgress);

        // Fetch current week details
        const { data: weekData, error: weekError } = await supabase
          .from("weeks")
          .select("id, name, week_number, description, phase_name")
          .eq("program_id", programId)
          .eq("week_number", userProgress.current_week_number)
          .single();

        if (weekError) {
          console.error("Error fetching week:", weekError);
        } else {
          setCurrentWeek(weekData);
        }
      } catch (error) {
        console.error("Error in fetchProgress:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProgress();
  }, [user, programId]);

  const updateProgress = async (weekNumber: number) => {
    if (!user || !programId || !progress) return;

    const { error } = await supabase
      .from("user_program_progress")
      .update({ current_week_number: weekNumber })
      .eq("id", progress.id);

    if (error) {
      console.error("Error updating progress:", error);
      return;
    }

    // Refresh progress
    const { data: updatedProgress } = await supabase
      .from("user_program_progress")
      .select("*")
      .eq("id", progress.id)
      .single();

    if (updatedProgress) {
      setProgress(updatedProgress);

      // Fetch updated week details
      const { data: weekData } = await supabase
        .from("weeks")
        .select("id, name, week_number, description, phase_name")
        .eq("program_id", programId)
        .eq("week_number", weekNumber)
        .single();

      if (weekData) {
        setCurrentWeek(weekData);
      }
    }
  };

  return {
    progress,
    currentWeek,
    loading,
    updateProgress,
  };
};
