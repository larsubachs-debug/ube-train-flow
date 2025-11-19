import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Target, TrendingUp, Calendar, Dumbbell } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export const WeeklyTaskProgress = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    completedCount: 0,
    totalPossible: 0,
    percentage: 0,
    streak: 0
  });
  const [programStats, setProgramStats] = useState({
    currentWeek: 0,
    totalWeeks: 0,
    percentage: 0,
    programName: ""
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadWeeklyProgress();
      loadProgramProgress();
    }
  }, [user]);

  const loadProgramProgress = async () => {
    if (!user) return;

    // Get user's current program
    const { data: progress } = await supabase
      .from('user_program_progress')
      .select('program_id, current_week_number')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!progress) return;

    // Get program details
    const { data: program } = await supabase
      .from('programs')
      .select('name')
      .eq('id', progress.program_id)
      .single();

    // Get total weeks
    const { data: weeks } = await supabase
      .from('weeks')
      .select('id')
      .eq('program_id', progress.program_id);

    const totalWeeks = weeks?.length || 0;
    const currentWeek = progress.current_week_number || 1;
    const percentage = totalWeeks > 0 ? Math.round((currentWeek / totalWeeks) * 100) : 0;

    setProgramStats({
      currentWeek,
      totalWeeks,
      percentage,
      programName: program?.name || ""
    });
  };

  const loadWeeklyProgress = async () => {
    if (!user) return;

    setLoading(true);

    // Get start of week (Monday)
    const now = new Date();
    const dayOfWeek = now.getDay();
    const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // Adjust if Sunday (0) to go back to Monday
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() + diff);
    startOfWeek.setHours(0, 0, 0, 0);

    const startOfWeekStr = startOfWeek.toISOString().split('T')[0];
    const todayStr = now.toISOString().split('T')[0];

    // Get user's profile id
    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (!profile) {
      setLoading(false);
      return;
    }

    // Get active tasks for this week
    const { data: memberTasks } = await supabase
      .from('member_tasks')
      .select('id, start_date, end_date')
      .eq('member_id', profile.id)
      .eq('is_active', true)
      .lte('start_date', todayStr)
      .gte('end_date', startOfWeekStr);

    if (!memberTasks || memberTasks.length === 0) {
      setStats({
        completedCount: 0,
        totalPossible: 0,
        percentage: 0,
        streak: 0
      });
      setLoading(false);
      return;
    }

    // Calculate total possible completions
    // For each task, count how many days it was active this week
    const daysInWeek = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      if (date <= now) {
        daysInWeek.push(date.toISOString().split('T')[0]);
      }
    }

    let totalPossible = 0;
    memberTasks.forEach((task: any) => {
      daysInWeek.forEach(day => {
        if (day >= task.start_date && day <= task.end_date) {
          totalPossible++;
        }
      });
    });

    // Get completions for this week
    const memberTaskIds = memberTasks.map((mt: any) => mt.id);
    const { data: completions } = await supabase
      .from('task_completions')
      .select('id, completion_date')
      .in('member_task_id', memberTaskIds)
      .gte('completion_date', startOfWeekStr)
      .lte('completion_date', todayStr);

    const completedCount = completions?.length || 0;
    const percentage = totalPossible > 0 ? Math.round((completedCount / totalPossible) * 100) : 0;

    // Calculate streak (consecutive days with all tasks completed)
    let streak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < 30; i++) {
      const checkDate = new Date(today);
      checkDate.setDate(today.getDate() - i);
      const checkDateStr = checkDate.toISOString().split('T')[0];

      // Get tasks active on this date
      const { data: tasksForDay } = await supabase
        .from('member_tasks')
        .select('id')
        .eq('member_id', profile.id)
        .eq('is_active', true)
        .lte('start_date', checkDateStr)
        .gte('end_date', checkDateStr);

      if (!tasksForDay || tasksForDay.length === 0) continue;

      // Get completions for this date
      const taskIds = tasksForDay.map((t: any) => t.id);
      const { data: completionsForDay } = await supabase
        .from('task_completions')
        .select('member_task_id')
        .in('member_task_id', taskIds)
        .eq('completion_date', checkDateStr);

      const completedTaskIds = new Set(completionsForDay?.map((c: any) => c.member_task_id) || []);
      const allCompleted = tasksForDay.every((t: any) => completedTaskIds.has(t.id));

      if (allCompleted) {
        streak++;
      } else {
        break;
      }
    }

    setStats({
      completedCount,
      totalPossible,
      percentage,
      streak
    });
    setLoading(false);
  };

  if (loading) {
    return (
      <Card className="p-4">
        <Skeleton className="h-20 w-full" />
      </Card>
    );
  }

  if (stats.totalPossible === 0) {
    return null;
  }

  return (
    <Card className="p-5 bg-gradient-to-br from-primary/5 to-accent/5 border-primary/20">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-primary/10 p-2 rounded-lg">
              <Target className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">Wekelijkse Voortgang</h3>
              <p className="text-xs text-muted-foreground">
                {stats.completedCount} van {stats.totalPossible} taken voltooid
              </p>
            </div>
          </div>
          {stats.streak > 0 && (
            <div className="flex items-center gap-1 bg-orange-500/10 px-3 py-1 rounded-full">
              <TrendingUp className="h-4 w-4 text-orange-600" />
              <span className="text-sm font-bold text-orange-600">{stats.streak} dagen</span>
            </div>
          )}
        </div>

        <div className="space-y-3">
          {/* Task Progress */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground flex items-center gap-1">
                <Target className="h-3 w-3" />
                Taken
              </span>
              <span className="font-bold text-primary">{stats.percentage}%</span>
            </div>
            <Progress value={stats.percentage} className="h-2" />
          </div>

          {/* Program Progress */}
          {programStats.totalWeeks > 0 && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground flex items-center gap-1">
                  <Dumbbell className="h-3 w-3" />
                  Programma (Week {programStats.currentWeek}/{programStats.totalWeeks})
                </span>
                <span className="font-bold text-accent">{programStats.percentage}%</span>
              </div>
              <Progress value={programStats.percentage} className="h-2" />
            </div>
          )}
        </div>

        {stats.percentage === 100 && (
          <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3 flex items-center gap-2">
            <Calendar className="h-4 w-4 text-green-600" />
            <p className="text-sm font-medium text-green-700">
              Perfect! Alle taken deze week voltooid! 🎉
            </p>
          </div>
        )}

        {stats.percentage >= 70 && stats.percentage < 100 && (
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3 flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-blue-600" />
            <p className="text-sm font-medium text-blue-700">
              Super bezig! Nog {stats.totalPossible - stats.completedCount} taken te gaan!
            </p>
          </div>
        )}
      </div>
    </Card>
  );
};
