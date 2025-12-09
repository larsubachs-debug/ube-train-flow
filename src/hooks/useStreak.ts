import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface StreakData {
  currentStreak: number;
  longestStreak: number;
  lastActivityDate: string | null;
  isActiveToday: boolean;
  todayProgress: {
    completed: number;
    total: number;
  };
}

export const useStreak = () => {
  const { user } = useAuth();
  const [streak, setStreak] = useState<StreakData>({
    currentStreak: 0,
    longestStreak: 0,
    lastActivityDate: null,
    isActiveToday: false,
    todayProgress: { completed: 0, total: 0 },
  });
  const [loading, setLoading] = useState(true);

  const calculateStreak = async () => {
    if (!user) return;

    try {
      setLoading(true);

      // Get user's program
      const { data: userProgress } = await supabase
        .from("user_program_progress")
        .select("program_id, current_week_number, start_date")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!userProgress) {
        setStreak({
          currentStreak: 0,
          longestStreak: 0,
          lastActivityDate: null,
          isActiveToday: false,
          todayProgress: { completed: 0, total: 0 },
        });
        return;
      }

      // Get user's profile to find their member_id
      const { data: profile } = await supabase
        .from("profiles")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (!profile) return;

      // Get program with weeks and workouts
      const { data: program } = await supabase
        .from("programs")
        .select(`
          id,
          weeks:weeks(
            id,
            week_number,
            workouts:workouts(id, day_number)
          )
        `)
        .eq("id", userProgress.program_id)
        .maybeSingle();

      if (!program) {
        setStreak({
          currentStreak: 0,
          longestStreak: 0,
          lastActivityDate: null,
          isActiveToday: false,
          todayProgress: { completed: 0, total: 0 },
        });
        return;
      }

      // Get member's assigned tasks
      const { data: memberTasks } = await supabase
        .from("member_tasks")
        .select("id, task_id, start_date, end_date, tasks_library(is_daily)")
        .eq("member_id", profile.id)
        .eq("is_active", true);

      // Get all workout completions
      const { data: workoutCompletions } = await supabase
        .from("workout_completions")
        .select("workout_id, completion_date")
        .eq("user_id", user.id);

      // Get all task completions
      const { data: taskCompletions } = await supabase
        .from("task_completions")
        .select("member_task_id, completion_date")
        .eq("user_id", user.id);

      // Calculate which days were fully completed
      const startDate = new Date(userProgress.start_date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const fullyCompletedDates: string[] = [];
      
      // Check each day from start date until today
      for (let d = new Date(startDate); d <= today; d.setDate(d.getDate() + 1)) {
        const dateStr = d.toISOString().split('T')[0];
        const daysSinceStart = Math.floor((d.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
        
        // Determine week number (1-indexed) based on program start
        const weekNumber = Math.floor(daysSinceStart / 7) + 1;
        
        // Determine day of week (1-7, where 1 is the first day of the program week)
        const dayOfWeek = (daysSinceStart % 7) + 1;

        // Find workouts scheduled for this day
        const currentWeek = program?.weeks?.find((w: any) => w.week_number === weekNumber);
        const scheduledWorkouts = currentWeek?.workouts?.filter((w: any) => w.day_number === dayOfWeek) || [];
        
        // Find tasks scheduled for this day
        const scheduledTasks = memberTasks?.filter((mt: any) => {
          const taskStart = new Date(mt.start_date);
          const taskEnd = new Date(mt.end_date);
          taskStart.setHours(0, 0, 0, 0);
          taskEnd.setHours(0, 0, 0, 0);
          
          return d >= taskStart && d <= taskEnd;
        }) || [];

        const totalScheduled = scheduledWorkouts.length + scheduledTasks.length;
        
        // If nothing scheduled, skip this day (don't count it for or against streak)
        if (totalScheduled === 0) continue;

        // Count completions for this day
        const completedWorkouts = scheduledWorkouts.filter((w: any) => 
          workoutCompletions?.some(wc => 
            wc.workout_id === w.id && wc.completion_date === dateStr
          )
        ).length;

        const completedTasks = scheduledTasks.filter((mt: any) =>
          taskCompletions?.some(tc =>
            tc.member_task_id === mt.id && tc.completion_date === dateStr
          )
        ).length;

        const totalCompleted = completedWorkouts + completedTasks;

        // Day is fully completed only if ALL scheduled items are done
        if (totalCompleted === totalScheduled) {
          fullyCompletedDates.push(dateStr);
        }

        // Track today's progress
        if (dateStr === today.toISOString().split('T')[0]) {
          setStreak(prev => ({
            ...prev,
            todayProgress: { completed: totalCompleted, total: totalScheduled },
            isActiveToday: totalCompleted === totalScheduled,
          }));
        }
      }

      // Calculate current streak
      let currentStreak = 0;
      const todayStr = today.toISOString().split('T')[0];
      const sortedDates = fullyCompletedDates.sort((a, b) => 
        new Date(b).getTime() - new Date(a).getTime()
      );

      // Count backwards from today/yesterday
      for (let i = 0; i < sortedDates.length; i++) {
        const checkDate = new Date(today);
        checkDate.setDate(checkDate.getDate() - i);
        const checkStr = checkDate.toISOString().split('T')[0];
        
        if (sortedDates.includes(checkStr)) {
          currentStreak++;
        } else {
          break;
        }
      }

      // Calculate longest streak
      let longestStreak = 0;
      let tempStreak = 0;
      
      const allDatesOrdered = fullyCompletedDates.sort((a, b) => 
        new Date(a).getTime() - new Date(b).getTime()
      );

      for (let i = 0; i < allDatesOrdered.length; i++) {
        if (i === 0) {
          tempStreak = 1;
        } else {
          const current = new Date(allDatesOrdered[i]);
          const prev = new Date(allDatesOrdered[i - 1]);
          const diffDays = Math.floor((current.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24));
          
          if (diffDays === 1) {
            tempStreak++;
          } else {
            longestStreak = Math.max(longestStreak, tempStreak);
            tempStreak = 1;
          }
        }
      }
      longestStreak = Math.max(longestStreak, tempStreak);

      setStreak(prev => ({
        ...prev,
        currentStreak,
        longestStreak: Math.max(longestStreak, currentStreak),
        lastActivityDate: sortedDates[0] || null,
      }));
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
