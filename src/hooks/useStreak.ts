import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface StreakData {
  currentStreak: number;
  longestStreak: number;
  lastActivityDate: string | null;
  isActiveToday: boolean;
}

export const useStreak = () => {
  const { user } = useAuth();
  const [streak, setStreak] = useState<StreakData>({
    currentStreak: 0,
    longestStreak: 0,
    lastActivityDate: null,
    isActiveToday: false,
  });
  const [loading, setLoading] = useState(true);

  const calculateStreak = async () => {
    if (!user) return;

    try {
      setLoading(true);

      // Fetch workout completions
      const { data: workoutCompletions } = await supabase
        .from("workout_completions")
        .select("completion_date")
        .eq("user_id", user.id)
        .order("completion_date", { ascending: false });

      // Fetch task completions
      const { data: taskCompletions } = await supabase
        .from("task_completions")
        .select("completion_date")
        .eq("user_id", user.id)
        .order("completion_date", { ascending: false });

      // Combine and deduplicate dates
      const allDates = new Set<string>();
      
      workoutCompletions?.forEach((completion) => {
        allDates.add(completion.completion_date);
      });
      
      taskCompletions?.forEach((completion) => {
        allDates.add(completion.completion_date);
      });

      // Sort dates descending
      const sortedDates = Array.from(allDates).sort((a, b) => 
        new Date(b).getTime() - new Date(a).getTime()
      );

      if (sortedDates.length === 0) {
        setStreak({
          currentStreak: 0,
          longestStreak: 0,
          lastActivityDate: null,
          isActiveToday: false,
        });
        return;
      }

      // Calculate current streak
      let currentStreak = 0;
      let longestStreak = 0;
      let tempStreak = 0;
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayStr = today.toISOString().split('T')[0];
      
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];

      // Check if active today
      const isActiveToday = sortedDates[0] === todayStr;
      
      // Start from today or yesterday to count current streak
      let streakStartDate = isActiveToday ? todayStr : yesterdayStr;
      
      for (let i = 0; i < sortedDates.length; i++) {
        const currentDate = new Date(sortedDates[i]);
        currentDate.setHours(0, 0, 0, 0);
        
        const expectedDate = new Date(today);
        expectedDate.setDate(expectedDate.getDate() - i);
        expectedDate.setHours(0, 0, 0, 0);
        
        if (sortedDates[i] === expectedDate.toISOString().split('T')[0]) {
          currentStreak++;
          tempStreak++;
        } else {
          break;
        }
      }

      // Calculate longest streak
      tempStreak = 1;
      longestStreak = 1;
      
      for (let i = 0; i < sortedDates.length - 1; i++) {
        const current = new Date(sortedDates[i]);
        const next = new Date(sortedDates[i + 1]);
        
        const diffTime = Math.abs(current.getTime() - next.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays === 1) {
          tempStreak++;
          longestStreak = Math.max(longestStreak, tempStreak);
        } else {
          tempStreak = 1;
        }
      }

      setStreak({
        currentStreak,
        longestStreak: Math.max(longestStreak, currentStreak),
        lastActivityDate: sortedDates[0] || null,
        isActiveToday,
      });
    } catch (error) {
      console.error("Error calculating streak:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      calculateStreak();
    }
  }, [user]);

  return { ...streak, loading, refetch: calculateStreak };
};
