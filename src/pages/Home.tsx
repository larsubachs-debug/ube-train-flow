import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Calendar, TrendingUp, Award, Play, Zap, Users, BookOpen, ArrowRight, CheckCircle2 } from "lucide-react";
import ubeLogo from "@/assets/ube-logo.png";
import defaultCoach from "@/assets/default-coach.jpg";
import { useUserProgress } from "@/hooks/useUserProgress";
import { Skeleton } from "@/components/ui/skeleton";
import { usePrograms } from "@/hooks/usePrograms";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { DailyCheckinCard } from "@/components/checkin/DailyCheckinCard";
import { DailyTasksCard } from "@/components/tasks/DailyTasksCard";
import { WeeklyTaskProgress } from "@/components/tasks/WeeklyTaskProgress";
import { useBranding } from "@/hooks/useBranding";
import { StreakIndicator } from "@/components/StreakIndicator";
import { PushNotificationPrompt } from "@/components/PushNotificationPrompt";

const Home = () => {
  const { user } = useAuth();
  const { data: branding } = useBranding();
  const [userProgramId, setUserProgramId] = useState<string | null>(null);
  const [coachAvatar, setCoachAvatar] = useState<string | null>(null);
  const { data: programs = [] } = usePrograms();
  
  // Get user's assigned program
  useEffect(() => {
    if (!user) return;
    
    const fetchUserProgram = async () => {
      const { data } = await supabase
        .from("user_program_progress")
        .select("program_id")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      
      setUserProgramId(data?.program_id || null);
    };
    
    fetchUserProgram();
  }, [user]);

  // Get coach's avatar
  useEffect(() => {
    if (!user) return;
    
    const fetchCoachAvatar = async () => {
      // Get user's profile to find their coach
      const { data: profile } = await supabase
        .from("profiles")
        .select("coach_id")
        .eq("user_id", user.id)
        .maybeSingle();
      
      if (profile?.coach_id) {
        // Get coach's profile with avatar
        const { data: coachProfile } = await supabase
          .from("profiles")
          .select("avatar_url")
          .eq("id", profile.coach_id)
          .maybeSingle();
        
        setCoachAvatar(coachProfile?.avatar_url || null);
      }
    };
    
    fetchCoachAvatar();
  }, [user]);
  
  // Use assigned program or fallback to first available
  const currentProgram = programs.find(p => p.id === userProgramId) || programs[0];
  const { progress, currentWeek, loading } = useUserProgress(currentProgram?.id);
  
  // Find the actual week from the program data based on progress
  const thisWeek = currentProgram?.weeks.find(
    w => w.weekNumber === (progress?.current_week_number || 1)
  ) || currentProgram?.weeks[0];
  
  if (!currentProgram) {
    return (
      <div className="min-h-screen bg-background pb-20 flex items-center justify-center">
        <div className="text-center animate-fade-in">
          <p className="text-muted-foreground">Geen programma toegewezen</p>
        </div>
      </div>
    );
  }

  const completedWorkouts = 3;
  const totalWorkouts = 5;
  const progressPercentage = (completedWorkouts / totalWorkouts) * 100;

  return (
    <div className="min-h-screen pb-20 bg-background">
      {/* Header with centered logo */}
      <div className="relative flex items-center px-6 pt-6 pb-4">
        <h1 className="text-2xl font-bold text-foreground">Today</h1>
        <img 
          src={branding?.logo_url || ubeLogo} 
          alt={branding?.app_name || "U.be"} 
          className="h-7 object-contain absolute left-1/2 -translate-x-1/2" 
        />
      </div>

      <div className="px-6 space-y-6">
        {/* Weekly Progress */}
        {branding?.show_weekly_progress !== false && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-foreground">Weekly progress</h2>
              <span className="text-sm text-muted-foreground">{completedWorkouts}/{totalWorkouts} sessions</span>
            </div>
            
            <div className="flex gap-2">
              {Array.from({ length: totalWorkouts }).map((_, i) => (
                <div
                  key={i}
                  className={`flex-1 h-1.5 rounded-full transition-all duration-500 ${
                    i < completedWorkouts
                      ? 'bg-foreground'
                      : 'bg-muted'
                  }`}
                />
              ))}
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-4 gap-3">
          <Link to="/community" className="group">
            <div className="bg-muted rounded-2xl p-4 flex flex-col items-center gap-2 transition-colors hover:bg-muted/80">
              <Users className="w-6 h-6 text-muted-foreground" />
              <span className="text-xs font-medium text-foreground text-center">Locker room</span>
            </div>
          </Link>
          <Link to="/education" className="group">
            <div className="bg-muted rounded-2xl p-4 flex flex-col items-center gap-2 transition-colors hover:bg-muted/80">
              <BookOpen className="w-6 h-6 text-muted-foreground" />
              <span className="text-xs font-medium text-foreground text-center">Guides</span>
            </div>
          </Link>
          <Link to="/programs" className="group">
            <div className="bg-muted rounded-2xl p-4 flex flex-col items-center gap-2 transition-colors hover:bg-muted/80">
              <Calendar className="w-6 h-6 text-muted-foreground" />
              <span className="text-xs font-medium text-foreground text-center">Rearrange</span>
            </div>
          </Link>
          <Link to="/programs" className="group">
            <div className="bg-muted rounded-2xl p-4 flex flex-col items-center gap-2 transition-colors hover:bg-muted/80">
              <Zap className="w-6 h-6 text-muted-foreground" />
              <span className="text-xs font-medium text-foreground text-center">Program details</span>
            </div>
          </Link>
        </div>

        {/* Program Phase Card */}
        {loading ? (
          <Card className="p-4 bg-foreground text-background">
            <div className="flex items-start gap-4">
              <Skeleton className="w-12 h-12 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-full" />
              </div>
            </div>
          </Card>
        ) : (
          <Card className="p-4 bg-foreground text-background">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-background/10 flex items-center justify-center flex-shrink-0 overflow-hidden">
                <img 
                  src={coachAvatar || defaultCoach} 
                  alt="Coach" 
                  className="w-full h-full object-cover scale-[2.2] object-[center_35%]"
                />
              </div>
              <div className="flex-1">
                <h3 className="text-base font-bold mb-1">
                  {currentWeek?.phase_name || `Weeks ${progress?.current_week_number || 1}-4, Accumulation`}
                </h3>
                <p className="text-sm opacity-90 leading-relaxed">
                  {currentWeek?.description || "You'll gradually increase the volume of work, like adding sets or reps. This..."}
                </p>
              </div>
            </div>
          </Card>
        )}

        {/* Streak Indicator */}
        <StreakIndicator />

        {/* Daily Check-in */}
        <DailyCheckinCard />

        {/* Weekly Task Progress */}
        <WeeklyTaskProgress />

        {/* Daily Tasks */}
        <DailyTasksCard />

        {/* Your Training Plan */}
        <div className="space-y-4">
          <div>
            <h2 className="text-xl font-bold text-foreground">Your training plan</h2>
            <p className="text-sm text-muted-foreground mt-1">Next week's workouts drop Sunday</p>
          </div>

          <div className="space-y-3">
            {thisWeek?.workouts.slice(0, 3).map((workout, index) => {
              const totalExercises = (workout.warmUp?.length || 0) + (workout.mainLifts?.length || 0) + (workout.accessories?.length || 0);
              
              return (
                <Link 
                  key={workout.id} 
                  to={`/programs/${currentProgram.id}/workout/${workout.id}`}
                  className="block"
                >
                  <Card className="p-4 hover:shadow-md transition-shadow bg-card border border-border">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <p className="text-xs text-muted-foreground mb-1">Thurs 7th</p>
                        <h3 className="text-lg font-bold text-foreground">{workout.name}</h3>
                      </div>
                      {workout.completed ? (
                        <div className="w-10 h-10 rounded-full border-2 border-foreground flex items-center justify-center flex-shrink-0">
                          <CheckCircle2 className="w-6 h-6 text-foreground" />
                        </div>
                      ) : (
                        <div className="w-10 h-10 rounded-full border-2 border-muted flex items-center justify-center flex-shrink-0">
                          <Play className="w-5 h-5 text-muted-foreground" />
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-4 gap-3">
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Time</p>
                        <p className="text-sm font-bold text-foreground">{workout.duration}:00</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Weight</p>
                        <p className="text-sm font-bold text-foreground">-</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Sets</p>
                        <p className="text-sm font-bold text-foreground">{totalExercises}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">PB</p>
                        <p className="text-sm font-bold text-foreground">-</p>
                      </div>
                    </div>
                  </Card>
                </Link>
              );
            })}
          </div>

          <Link to={`/programs/${currentProgram.id}`}>
            <Button variant="outline" className="w-full">
              View All Workouts
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </div>
      </div>

      {/* Push Notification Prompt */}
      <PushNotificationPrompt />
    </div>
  );
};

export default Home;