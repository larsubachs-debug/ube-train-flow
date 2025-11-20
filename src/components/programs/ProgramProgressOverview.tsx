import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useUserProgress } from "@/hooks/useUserProgress";
import { useAuth } from "@/contexts/AuthContext";
import { Program } from "@/types/training";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Link } from "react-router-dom";
import { 
  TrendingUp, 
  Target, 
  Calendar, 
  CheckCircle2, 
  Flame,
  Dumbbell,
  ArrowRight
} from "lucide-react";

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
  const [completedWorkoutsThisWeek, setCompletedWorkoutsThisWeek] = useState(0);

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
        const today = new Date().toISOString().split('T')[0];
        
        // Get completed workouts this week
        const { data: completions } = await supabase
          .from("workout_completions")
          .select("workout_id")
          .eq("user_id", user.id)
          .gte("completion_date", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);

        const completedIds = new Set(completions?.map(c => c.workout_id) || []);
        setCompletedWorkoutsThisWeek(completedIds.size);

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
          console.log('User stats updated:', payload);
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

  // Calculate improvement suggestions
  const getImprovementSuggestions = () => {
    const suggestions = [];
    
    if (!userStats) return [];
    
    // Streak suggestions
    if (userStats.current_streak === 0) {
      suggestions.push({
        icon: Flame,
        title: "Start je streak vandaag",
        description: "Complete een workout om je streak te starten",
        priority: "high"
      });
    } else if (userStats.current_streak < 7) {
      suggestions.push({
        icon: Flame,
        title: `Bouw je streak op naar 7 dagen`,
        description: `Je zit nu op ${userStats.current_streak} dagen - blijf consistent!`,
        priority: "medium"
      });
    }

    // Workout frequency
    if (completedWorkoutsThisWeek < 3) {
      suggestions.push({
        icon: Dumbbell,
        title: "Train minimaal 3x deze week",
        description: `${completedWorkoutsThisWeek}/3 workouts voltooid`,
        priority: "high"
      });
    }

    // Total workouts milestone
    if (userStats.total_workouts < 10) {
      suggestions.push({
        icon: Target,
        title: "Bereik je eerste 10 workouts",
        description: `${userStats.total_workouts}/10 workouts voltooid`,
        priority: "medium"
      });
    }

    return suggestions.slice(0, 3); // Max 3 suggestions
  };

  const improvements = getImprovementSuggestions();

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Hero Section */}
      <div className="relative h-[250px] overflow-hidden">
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
        
        {/* Floating stats */}
        <div className="absolute top-6 right-6 flex gap-2">
          <Badge className="bg-white/20 text-white border-0 backdrop-blur-sm">
            <Flame className="w-3 h-3 mr-1" />
            {userStats?.current_streak || 0} dag streak
          </Badge>
        </div>
      </div>

      <div className="px-6 -mt-16 relative z-10">
        {/* Next Workout Card - Most Important */}
        <Card className="bg-card border-border mb-4 p-6 shadow-lg">
          <div className="flex items-start justify-between mb-3">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Volgende Workout</p>
              <h2 className="text-2xl font-bold text-foreground">
                {nextWorkout?.name || "Geen workout gevonden"}
              </h2>
            </div>
            <Badge variant="outline" className="bg-accent/10">
              Week {currentWeekNumber}
            </Badge>
          </div>

          <div className="flex items-center gap-4 mb-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              <span>{nextWorkout?.duration || 0} min</span>
            </div>
            <div className="flex items-center gap-1">
              <CheckCircle2 className="w-4 h-4" />
              <span>{completedWorkoutsThisWeek} workouts deze week</span>
            </div>
          </div>

          {nextWorkout && (
            <Link to={`/programs/${program.id}/workout/${nextWorkout.id}`}>
              <Button className="w-full bg-accent hover:bg-accent/90 text-accent-foreground font-semibold">
                Start Workout Nu
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          )}
        </Card>

        {/* To Improve Section */}
        {improvements.length > 0 && (
          <Card className="bg-card border-border mb-4 p-6">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-5 h-5 text-accent" />
              <h3 className="text-lg font-semibold text-foreground">Om Te Verbeteren</h3>
            </div>
            
            <div className="space-y-3">
              {improvements.map((improvement, index) => {
                const Icon = improvement.icon;
                return (
                  <div 
                    key={index}
                    className={`flex gap-3 p-3 rounded-lg ${
                      improvement.priority === 'high' 
                        ? 'bg-accent/5 border border-accent/20' 
                        : 'bg-muted/30'
                    }`}
                  >
                    <div className={`p-2 rounded-lg ${
                      improvement.priority === 'high'
                        ? 'bg-accent/10 text-accent'
                        : 'bg-muted text-muted-foreground'
                    }`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-sm text-foreground mb-0.5">
                        {improvement.title}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {improvement.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        )}

        {/* Current Stats Card */}
        <Card className="bg-card border-border mb-4 p-6">
          <h3 className="text-lg font-semibold mb-4 text-foreground">Jouw Progress</h3>
          
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-foreground">
                {userStats?.total_workouts || 0}
              </p>
              <p className="text-xs text-muted-foreground mt-1">Workouts</p>
            </div>
            
            <div className="text-center">
              <p className="text-3xl font-bold text-foreground">
                {userStats?.current_streak || 0}
              </p>
              <p className="text-xs text-muted-foreground mt-1">Dag Streak</p>
            </div>
            
            <div className="text-center">
              <p className="text-3xl font-bold text-foreground">
                {Math.round((userStats?.total_volume_kg || 0) / 1000)}k
              </p>
              <p className="text-xs text-muted-foreground mt-1">Volume (kg)</p>
            </div>
          </div>

          {/* Week Progress */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <p className="text-sm text-muted-foreground">Week {currentWeekNumber} van {totalWeeks}</p>
              <p className="text-sm font-semibold text-foreground">{Math.round(progressPercentage)}%</p>
            </div>
            <Progress value={progressPercentage} className="h-2" />
          </div>
        </Card>

        {/* Training Block Overview */}
        <Card className="bg-card border-border p-6">
          <h3 className="text-lg font-semibold mb-3 text-foreground">
            {program.name}
          </h3>
          <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
            {program.description}
          </p>

          <div className="flex gap-2 mb-4">
            {Array.from({ length: Math.min(totalWeeks, 10) }).map((_, index) => (
              <div
                key={index}
                className={`h-1.5 flex-1 rounded-full transition-all ${
                  index < currentWeekNumber
                    ? "bg-accent"
                    : "bg-muted"
                }`}
              />
            ))}
          </div>

          <div className="flex items-center gap-2">
            <div className="flex -space-x-2">
              {[1, 2, 3].map((i) => (
                <Avatar key={i} className="w-7 h-7 border-2 border-background">
                  <AvatarFallback className="bg-muted text-xs">M</AvatarFallback>
                </Avatar>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              {memberCount.toLocaleString()} members trainen mee
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
};
