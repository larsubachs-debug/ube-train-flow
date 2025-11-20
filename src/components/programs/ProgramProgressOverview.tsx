import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useUserProgress } from "@/hooks/useUserProgress";
import { useAuth } from "@/contexts/AuthContext";
import { Program } from "@/types/training";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface ProgramProgressOverviewProps {
  program: Program;
  programImage?: string;
}

interface UserStats {
  total_workouts: number;
  current_streak: number;
  total_volume_kg: number;
}

export const ProgramProgressOverview = ({ program, programImage }: ProgramProgressOverviewProps) => {
  const { user } = useAuth();
  const { progress, currentWeek, loading } = useUserProgress(program.id);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [memberCount, setMemberCount] = useState(0);

  const totalWeeks = program.weeks.length;
  const currentWeekNumber = progress?.current_week_number || 1;
  const progressPercentage = (currentWeekNumber / totalWeeks) * 100;

  useEffect(() => {
    const fetchStats = async () => {
      if (!user) return;

      // Fetch user stats
      const { data: stats } = await supabase
        .from("user_stats")
        .select("total_workouts, current_streak, total_volume_kg")
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
          console.log('User stats updated:', payload);
          setUserStats(payload.new as UserStats);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, program.id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Hero Section with Coach */}
      <div className="relative h-[300px] overflow-hidden">
        {programImage ? (
          <img 
            src={programImage} 
            alt={program.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-b from-muted to-background" />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-background" />
      </div>

      <div className="px-6 -mt-20 relative z-10">
        {/* Program Title */}
        <h1 className="text-3xl font-bold text-foreground mb-2">
          {currentWeek?.name || program.name}
        </h1>
        <p className="text-muted-foreground mb-6 leading-relaxed">
          {program.description}
        </p>

        {/* Training Block Progress Card */}
        <Card className="bg-card border-border mb-4 p-6">
          <h2 className="text-lg font-semibold mb-4 text-foreground">Training block progress</h2>
          
          <div className="mb-4">
            <p className="text-sm text-muted-foreground mb-2">{currentWeek?.phase_name || "Current Phase"}</p>
            
            {/* Week Progress Dots */}
            <div className="flex gap-2 mb-3">
              {Array.from({ length: totalWeeks }).map((_, index) => (
                <div
                  key={index}
                  className={`h-2 flex-1 rounded-full transition-all ${
                    index < currentWeekNumber
                      ? "bg-primary"
                      : "bg-muted"
                  }`}
                />
              ))}
            </div>
            
            <p className="text-sm font-semibold text-foreground">
              Total: <span className="text-muted-foreground">{totalWeeks} weeks</span>
            </p>
          </div>

          <p className="text-sm text-muted-foreground leading-relaxed">
            Blocks are run in real-time. After completing your first week you'll be ready to join your coach and community on the current block.
          </p>

          {/* Member Count */}
          <div className="flex items-center gap-2 mt-4">
            <div className="flex -space-x-2">
              {[1, 2, 3].map((i) => (
                <Avatar key={i} className="w-8 h-8 border-2 border-background">
                  <AvatarFallback className="bg-muted text-xs">M</AvatarFallback>
                </Avatar>
              ))}
            </div>
            <p className="text-sm text-muted-foreground">
              {memberCount.toLocaleString()} members on {program.name.split(" ")[0]}
            </p>
          </div>
        </Card>

        {/* KPIs Card */}
        <Card className="bg-card border-border p-6">
          <h2 className="text-lg font-semibold mb-4 text-foreground">
            {program.name.split(" ")[0]} Block KPIs
          </h2>
          
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-2xl font-bold text-foreground">
                {userStats?.total_workouts || 0}
              </p>
              <p className="text-sm text-muted-foreground">Workouts</p>
            </div>
            
            <div>
              <p className="text-2xl font-bold text-foreground">
                {userStats?.current_streak || 0}
              </p>
              <p className="text-sm text-muted-foreground">Day Streak</p>
            </div>
            
            <div>
              <p className="text-2xl font-bold text-foreground">
                {Math.round((userStats?.total_volume_kg || 0) / 1000)}k
              </p>
              <p className="text-sm text-muted-foreground">Total Volume</p>
            </div>
          </div>

          {/* Progress Bar for Current Week */}
          <div className="mt-6">
            <div className="flex justify-between items-center mb-2">
              <p className="text-sm text-muted-foreground">Week {currentWeekNumber} of {totalWeeks}</p>
              <p className="text-sm font-semibold text-foreground">{Math.round(progressPercentage)}%</p>
            </div>
            <Progress value={progressPercentage} className="h-2" />
          </div>
        </Card>
      </div>
    </div>
  );
};
