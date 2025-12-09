import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { startOfWeek, endOfWeek, startOfMonth, endOfMonth, subMonths, format } from "date-fns";

export const useDashboardStats = (userId: string | undefined) => {
  return useQuery({
    queryKey: ['dashboard-stats', userId],
    queryFn: async () => {
      if (!userId) throw new Error("User ID required");

      // Get user stats
      const { data: stats } = await supabase
        .from('user_stats')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      // Get workout completions for the last 6 months
      const sixMonthsAgo = subMonths(new Date(), 6);
      const { data: completions } = await supabase
        .from('workout_completions')
        .select('completion_date, workout_id')
        .eq('user_id', userId)
        .gte('completion_date', format(sixMonthsAgo, 'yyyy-MM-dd'))
        .order('completion_date', { ascending: true });

      // Get workout sets for volume calculation
      const { data: sets } = await supabase
        .from('workout_sets')
        .select('weight, reps, completed_at')
        .eq('user_id', userId)
        .eq('completed', true)
        .gte('completed_at', sixMonthsAgo.toISOString())
        .order('completed_at', { ascending: true });

      // Calculate weekly volume
      const weeklyVolume: Record<string, number> = {};
      sets?.forEach(set => {
        if (set.weight && set.reps && set.completed_at) {
          const weekStart = startOfWeek(new Date(set.completed_at));
          const weekKey = format(weekStart, 'yyyy-MM-dd');
          const volume = Number(set.weight) * Number(set.reps);
          weeklyVolume[weekKey] = (weeklyVolume[weekKey] || 0) + volume;
        }
      });

      // Calculate monthly workout frequency
      const monthlyWorkouts: Record<string, number> = {};
      completions?.forEach(completion => {
        const monthKey = format(new Date(completion.completion_date), 'MMM yyyy');
        monthlyWorkouts[monthKey] = (monthlyWorkouts[monthKey] || 0) + 1;
      });

      // Get this week's stats
      const thisWeekStart = startOfWeek(new Date());
      const thisWeekEnd = endOfWeek(new Date());
      const { data: thisWeekWorkouts } = await supabase
        .from('workout_completions')
        .select('id')
        .eq('user_id', userId)
        .gte('completion_date', format(thisWeekStart, 'yyyy-MM-dd'))
        .lte('completion_date', format(thisWeekEnd, 'yyyy-MM-dd'));

      // Get this month's stats
      const thisMonthStart = startOfMonth(new Date());
      const thisMonthEnd = endOfMonth(new Date());
      const { data: thisMonthWorkouts } = await supabase
        .from('workout_completions')
        .select('id')
        .eq('user_id', userId)
        .gte('completion_date', format(thisMonthStart, 'yyyy-MM-dd'))
        .lte('completion_date', format(thisMonthEnd, 'yyyy-MM-dd'));

      // Get recent PRs
      const { data: recentPRs } = await supabase
        .from('workout_sets')
        .select('exercise_name, weight, reps, completed_at')
        .eq('user_id', userId)
        .eq('completed', true)
        .order('completed_at', { ascending: false })
        .limit(10);

      return {
        totalStats: stats || {
          total_workouts: 0,
          total_volume_kg: 0,
          current_streak: 0,
          longest_streak: 0,
          total_prs: 0,
        },
        weeklyVolumeData: Object.entries(weeklyVolume).map(([week, volume]) => ({
          week: format(new Date(week), 'dd MMM'),
          volume,
        })),
        monthlyWorkoutData: Object.entries(monthlyWorkouts).map(([month, count]) => ({
          month,
          workouts: count,
        })),
        thisWeekWorkouts: thisWeekWorkouts?.length || 0,
        thisMonthWorkouts: thisMonthWorkouts?.length || 0,
        recentPRs: recentPRs || [],
      };
    },
    enabled: !!userId,
  });
};
