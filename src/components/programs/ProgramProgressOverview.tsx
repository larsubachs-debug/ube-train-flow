import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { useUserProgress } from "@/hooks/useUserProgress";
import { useAuth } from "@/contexts/AuthContext";
import { Program } from "@/types/training";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Link } from "react-router-dom";
import coachMaxime from "@/assets/coach-maxime.jpg";

interface ProgramProgressOverviewProps {
  program: Program;
  programImage?: string;
}

interface UserStats {
  total_workouts: number;
  current_streak: number;
  total_volume_kg: number;
  last_workout_date: string | null;
}

export const ProgramProgressOverview = ({ program, programImage }: ProgramProgressOverviewProps) => {
  const { user } = useAuth();
  const { progress, currentWeek, loading } = useUserProgress(program.id);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [memberCount, setMemberCount] = useState(0);
  const [nextWorkout, setNextWorkout] = useState<any>(null);

  const totalWeeks = program.weeks.length;
  const currentWeekNumber = progress?.current_week_number || 1;
  const progressPercentage = (currentWeekNumber / totalWeeks) * 100;

  useEffect(() => {
    const fetchStats = async () => {
      if (!user) return;

      // Fetch user stats
      const { data: stats } = await supabase
        .from("user_stats")
        .select("total_workouts, current_streak, total_volume_kg, last_workout_date")
        .eq("user_id", user.id)
        .single();

      if (stats) {
        setUserStats(stats);
      }

      // Fetch member count for this program
      const { count } = await supabase
        .from("user_program_progress")
        .select("*", { count: "exact", head: true })
        .eq("program_id", program.id);

      setMemberCount(count || 0);

      // Find next uncompleted workout
      const currentWeekData = program.weeks.find(w => w.weekNumber === currentWeekNumber);
      if (currentWeekData) {
        // Get completed workouts this week
        const { data: completions } = await supabase
          .from("workout_completions")
          .select("workout_id")
          .eq("user_id", user.id)
          .gte("completion_date", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);

        const completedIds = new Set(completions?.map(c => c.workout_id) || []);

        // Find first uncompleted workout in current week
        const uncompletedWorkout = currentWeekData.workouts.find(w => !completedIds.has(w.id));
        setNextWorkout(uncompletedWorkout || currentWeekData.workouts[0]);
      }
    };

    fetchStats();

    // Set up real-time subscription for user stats updates
    const channel = supabase
      .channel('user-stats-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'user_stats',
          filter: `user_id=eq.${user?.id}`,
        },
        (payload) => {
          setUserStats(payload.new as UserStats);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, program.id, currentWeekNumber]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Hero Section with Coach Image */}
      <div className="relative h-[60vh] md:h-[65vh] lg:h-[70vh] min-h-[450px] md:min-h-[500px] lg:min-h-[600px] overflow-hidden">
        <img 
          src={coachMaxime}
          alt="Coach Maxime"
          className="w-full h-full object-cover object-top"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/30 to-background" />
        
        {/* Program Title Overlay */}
        <div className="absolute bottom-0 left-0 right-0 px-4 pb-6 md:px-6 md:pb-8 lg:px-8 lg:pb-10">
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-2 md:mb-3">
            {currentWeek?.name || program.name}
          </h1>
          <p className="text-sm md:text-base lg:text-lg text-white/90 leading-relaxed max-w-2xl">
            {currentWeek?.description || program.description}
          </p>
        </div>
      </div>

      <div className="px-4 md:px-6 -mt-6 md:-mt-8 relative z-10 space-y-4 md:space-y-6">
        {/* Training Block Progress Card */}
        <Card className="bg-card/95 backdrop-blur-sm border-border p-4 md:p-6">
          <h2 className="text-lg md:text-xl font-semibold text-foreground mb-3 md:mb-4">
            Training block progress
          </h2>
          
          {/* Current Phase/Week Name */}
          <div className="mb-3 md:mb-4">
            <p className="text-base md:text-lg font-medium text-foreground mb-2 md:mb-3">
              {currentWeek?.phase_name || currentWeek?.name || `Week ${currentWeekNumber}`}
            </p>
            
            {/* Progress Bar */}
            <div className="space-y-2">
              <Progress value={progressPercentage} className="h-2 bg-muted" />
              <div className="flex justify-between items-center text-xs md:text-sm">
                <span className="text-muted-foreground">
                  <span className="font-semibold text-foreground">Total:</span> {totalWeeks} weeks
                </span>
                <span className="text-foreground font-medium">
                  Week {currentWeekNumber}/{totalWeeks}
                </span>
              </div>
            </div>
          </div>

          <p className="text-xs md:text-sm text-muted-foreground leading-relaxed mb-3 md:mb-4">
            Blocks are run in real-time. After completing your first week you'll be ready to join your coach and community on the current block.
          </p>

          {/* Member Count */}
          <div className="flex items-center gap-2">
            <div className="flex -space-x-2">
              {[1, 2, 3].map((i) => (
                <Avatar key={i} className="w-7 h-7 md:w-8 md:h-8 border-2 border-background">
                  <AvatarFallback className="bg-muted text-xs">
                    {i === 1 ? 'M' : i === 2 ? 'J' : 'S'}
                  </AvatarFallback>
                </Avatar>
              ))}
            </div>
            <p className="text-xs md:text-sm text-muted-foreground">
              {memberCount.toLocaleString()} members on {program.name.split(' ')[0]}
            </p>
          </div>
        </Card>

        {/* Block KPIs */}
        <Card className="bg-card border-border p-4 md:p-6">
          <h2 className="text-lg md:text-xl font-semibold text-foreground mb-3 md:mb-4">
            {program.name.split(' ')[0]} Block KPIs
          </h2>
          
          <div className="grid grid-cols-3 gap-3 md:gap-4">
            <div className="text-center p-3 md:p-4 rounded-lg bg-muted/30">
              <p className="text-2xl md:text-3xl font-bold text-foreground mb-1">
                {userStats?.total_workouts || 0}
              </p>
              <p className="text-[10px] md:text-xs text-muted-foreground leading-tight">
                Workouts<br/>Completed
              </p>
            </div>
            
            <div className="text-center p-3 md:p-4 rounded-lg bg-muted/30">
              <p className="text-2xl md:text-3xl font-bold text-foreground mb-1">
                {userStats?.current_streak || 0}
              </p>
              <p className="text-[10px] md:text-xs text-muted-foreground leading-tight">
                Day<br/>Streak
              </p>
            </div>
            
            <div className="text-center p-3 md:p-4 rounded-lg bg-muted/30">
              <p className="text-2xl md:text-3xl font-bold text-foreground mb-1">
                {Math.round((userStats?.total_volume_kg || 0) / 1000)}k
              </p>
              <p className="text-[10px] md:text-xs text-muted-foreground leading-tight">
                Total Volume<br/>(kg)
              </p>
            </div>
          </div>
        </Card>

        {/* Next Workout CTA */}
        {nextWorkout && (
          <Link to={`/workout/${nextWorkout.id}`}>
            <Button className="w-full py-5 md:py-6 text-base md:text-lg bg-accent hover:bg-accent/90 text-accent-foreground font-semibold">
              Start {nextWorkout.name}
            </Button>
          </Link>
        )}
      </div>
    </div>
  );
};
