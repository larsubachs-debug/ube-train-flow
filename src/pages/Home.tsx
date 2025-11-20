import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Calendar, TrendingUp, Award, Play, Zap, Users, BookOpen, ArrowRight, CheckCircle2 } from "lucide-react";
import ubeLogo from "@/assets/ube-logo.png";
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

const Home = () => {
  const { user } = useAuth();
  const { data: branding } = useBranding();
  const [userProgramId, setUserProgramId] = useState<string | null>(null);
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
    <div className="min-h-screen pb-20 relative">
      {/* Enhanced Gradient Background with subtle pattern */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary/30 to-background" />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAxOGMzLjMxNCAwIDYgMi42ODYgNiA2cy0yLjY4NiA2LTYgNi02LTIuNjg2LTYtNiAyLjY4Ni02IDYtNnptMCAzNmMzLjMxNCAwIDYgMi42ODYgNiA2cy0yLjY4NiA2LTYgNi02LTIuNjg2LTYtNiAyLjY4Ni02IDYtNnoiIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iLjAzIi8+PC9nPjwvc3ZnPg==')] opacity-30" />
      </div>
      
      {/* Hero Header with Glass Effect */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/95 via-primary/80 to-transparent backdrop-blur-sm" />
        
        <div className="relative px-6 py-10 animate-fade-in">
          {/* Logo Section with Glow */}
          <div className="flex flex-col items-center mb-8">
            <div className="relative mb-4 animate-scale-in">
              <div className="absolute inset-0 bg-primary-foreground/30 blur-2xl rounded-full animate-pulse" />
              <img 
                src={branding?.logo_url || ubeLogo} 
                alt={branding?.app_name || "U.be"} 
                className="h-16 relative z-10 drop-shadow-2xl" 
              />
            </div>
            <p className="text-sm font-bold tracking-widest text-primary-foreground/90 uppercase">
              {branding?.tagline || "ALL ABOUT U"}
            </p>
          </div>

          {/* Weekly Progress Card */}
          {branding?.show_weekly_progress !== false && (
            <div className="bg-primary-foreground/5 backdrop-blur-md rounded-2xl p-3 border border-primary-foreground/10 shadow-lg">
            <div className="flex justify-between items-center mb-2">
              <div>
                <p className="text-xs font-medium opacity-90 uppercase tracking-wider drop-shadow-sm">Weekly Progress</p>
                <p className="text-xl font-bold mt-0.5 drop-shadow-sm">{completedWorkouts}/{totalWorkouts}</p>
              </div>
              <div className="bg-primary-foreground/15 rounded-full p-2">
                <TrendingUp className="w-5 h-5" />
              </div>
            </div>
            
            {/* Animated Progress Bar */}
            <div className="relative h-1.5 bg-primary-foreground/15 rounded-full overflow-hidden">
              <div 
                className="absolute inset-y-0 left-0 bg-gradient-to-r from-accent to-accent-foreground rounded-full transition-all duration-1000 ease-out shadow-glow"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>

            <div className="flex gap-1.5 mt-3">
              {Array.from({ length: totalWorkouts }).map((_, i) => (
                <div
                  key={i}
                  className={`flex-1 h-1 rounded-full transition-all duration-500 ${
                    i < completedWorkouts
                      ? 'bg-accent shadow-glow-green scale-105'
                      : 'bg-primary-foreground/15'
                  }`}
                  style={{ transitionDelay: `${i * 100}ms` }}
                />
              ))}
            </div>
          </div>
          )}

          {/* Quick Actions */}
          <div className="grid grid-cols-3 gap-2 mt-4">
            <Link to="/community" className="group">
              <div className="bg-primary-foreground/5 backdrop-blur-sm hover:bg-primary-foreground/15 border border-primary-foreground/10 rounded-xl p-3 flex flex-col items-center gap-1.5 transition-all duration-300 hover:scale-105 hover:shadow-lg">
                <Users className="w-4 h-4 group-hover:scale-110 transition-transform drop-shadow-sm" />
                <span className="text-xs font-medium drop-shadow-sm">Community</span>
              </div>
            </Link>
            <Link to="/education" className="group">
              <div className="bg-primary-foreground/5 backdrop-blur-sm hover:bg-primary-foreground/15 border border-primary-foreground/10 rounded-xl p-3 flex flex-col items-center gap-1.5 transition-all duration-300 hover:scale-105 hover:shadow-lg">
                <BookOpen className="w-4 h-4 group-hover:scale-110 transition-transform drop-shadow-sm" />
                <span className="text-xs font-medium drop-shadow-sm">Guides</span>
              </div>
            </Link>
            <Link to="/programs" className="group">
              <div className="bg-primary-foreground/5 backdrop-blur-sm hover:bg-primary-foreground/15 border border-primary-foreground/10 rounded-xl p-3 flex flex-col items-center gap-1.5 transition-all duration-300 hover:scale-105 hover:shadow-lg">
                <Calendar className="w-4 h-4 group-hover:scale-110 transition-transform drop-shadow-sm" />
                <span className="text-xs font-medium drop-shadow-sm">Program</span>
              </div>
            </Link>
          </div>
        </div>
      </div>

      <div className="px-6 mt-6 space-y-6 relative z-10">
        {/* Program Block Card - Dynamic Phase Info */}
        <Card className="p-0 shadow-lg bg-primary/70 backdrop-blur-md text-primary-foreground overflow-hidden border border-primary-foreground/10">
          <div className="p-4">
            {loading ? (
              <div className="flex items-start gap-4 mb-3">
                <Skeleton className="w-12 h-12 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-4 w-full" />
                </div>
              </div>
            ) : (
              <div className="flex items-start gap-3 mb-2">
                <div className="w-10 h-10 rounded-full bg-primary-foreground/20 flex items-center justify-center">
                  <span className="text-lg font-bold drop-shadow-sm">{progress?.current_week_number || 1}</span>
                </div>
                <div className="flex-1">
                  <h3 className="text-base font-bold mb-0.5 drop-shadow-sm">
                    {currentWeek?.phase_name || `Week ${progress?.current_week_number || 1}`}
                  </h3>
                  <p className="text-sm opacity-90 drop-shadow-sm">
                    {currentWeek?.description || "Volg je training programma en bereik je doelen stap voor stap."}
                  </p>
                </div>
              </div>
            )}
          </div>
        </Card>

        {/* Streak Indicator */}
        <div className="animate-fade-in" style={{ animationDelay: '90ms' }}>
          <StreakIndicator />
        </div>

        {/* Daily Check-in Card */}
        <div className="px-6 -mt-2 animate-fade-in" style={{ animationDelay: '100ms' }}>
          <DailyCheckinCard />
        </div>

        {/* Weekly Task Progress */}
        <div className="px-6 mt-4 animate-fade-in" style={{ animationDelay: '110ms' }}>
          <WeeklyTaskProgress />
        </div>

        {/* Daily Tasks */}
        <div className="px-6 mt-4 space-y-3 animate-fade-in" style={{ animationDelay: '120ms' }}>
          <DailyTasksCard />
        </div>

        {/* This Week's Workouts */}
        <div className="space-y-4 animate-fade-in" style={{ animationDelay: '150ms' }}>
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <div className="w-1 h-6 bg-gradient-to-b from-accent to-accent-foreground rounded-full" />
              Deze Week
            </h2>
            <Link to={`/programs/${currentProgram.id}`} className="text-sm text-accent hover:text-accent-foreground transition-colors font-medium flex items-center gap-1">
              Alles bekijken
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="space-y-4">
            {thisWeek?.workouts.slice(0, 3).map((workout, index) => (
              <Link 
                key={workout.id} 
                to={`/programs/${currentProgram.id}/workout/${workout.id}`}
                className="group block"
                style={{ animationDelay: `${200 + index * 100}ms` }}
              >
                <Card className="relative overflow-hidden hover:shadow-xl transition-all duration-500 animate-fade-in bg-background/60 backdrop-blur-md border border-border/30 group-hover:border-accent/50">
                  {/* Gradient accent bar on top */}
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-accent via-accent-foreground to-accent transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-500" />
                  
                  <div className="p-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="relative">
                          <div className="absolute inset-0 bg-accent/20 blur-sm rounded-full group-hover:blur-md transition-all" />
                          <div className="relative bg-gradient-to-br from-accent to-accent-foreground rounded-lg w-8 h-8 flex items-center justify-center shadow-sm">
                            <Play className="w-3 h-3 text-white fill-white" />
                          </div>
                        </div>
                        
                        <div>
                          <h3 className="font-bold text-base text-foreground group-hover:text-accent transition-colors drop-shadow-sm">
                            {workout.name}
                          </h3>
                          <p className="text-xs text-muted-foreground drop-shadow-sm">
                            Dag {index + 1}
                          </p>
                        </div>
                      </div>

                      {workout.completed && (
                        <div className="bg-accent/10 rounded-full p-2 animate-scale-in">
                          <CheckCircle2 className="w-6 h-6 text-accent" />
                        </div>
                      )}
                    </div>

                    {/* Stats row */}
                    <div className="flex items-center gap-4 pt-2 border-t border-border/30">
                      <div className="flex items-center gap-1.5">
                        <div className="w-7 h-7 rounded-lg bg-muted/30 flex items-center justify-center">
                          <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground drop-shadow-sm">Duur</p>
                          <p className="text-sm font-semibold drop-shadow-sm">{workout.duration} min</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <div className="w-7 h-7 rounded-lg bg-muted/30 flex items-center justify-center">
                          <TrendingUp className="w-3.5 h-3.5 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground drop-shadow-sm">Oefeningen</p>
                          <p className="text-sm font-semibold drop-shadow-sm">{workout.warmUp?.length + workout.mainLifts?.length + workout.accessories?.length || 0}</p>
                        </div>
                      </div>

                      <div className="ml-auto">
                        <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-accent group-hover:translate-x-1 transition-all" />
                      </div>
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-2 gap-3 animate-fade-in" style={{ animationDelay: '300ms' }}>
          <Link to="/achievements">
            <Card className="p-3 hover:shadow-lg transition-all duration-300 group hover:scale-105 bg-background/50 backdrop-blur-sm border border-border/30">
              <div className="flex flex-col items-center text-center gap-2">
                <div className="bg-gradient-to-br from-accent/15 to-accent/5 rounded-xl p-2 group-hover:scale-110 transition-transform duration-300">
                  <Award className="w-5 h-5 text-accent" />
                </div>
                <div>
                  <p className="text-xl font-bold drop-shadow-sm">12</p>
                  <p className="text-xs text-muted-foreground font-medium drop-shadow-sm">Achievements</p>
                </div>
              </div>
            </Card>
          </Link>

          <Link to="/leaderboard">
            <Card className="p-3 hover:shadow-lg transition-all duration-300 group hover:scale-105 bg-background/50 backdrop-blur-sm border border-border/30">
              <div className="flex flex-col items-center text-center gap-2">
                <div className="bg-gradient-to-br from-primary/15 to-primary/5 rounded-xl p-2 group-hover:scale-110 transition-transform duration-300">
                  <TrendingUp className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-xl font-bold drop-shadow-sm">#5</p>
                  <p className="text-xs text-muted-foreground font-medium drop-shadow-sm">Leaderboard</p>
                </div>
              </div>
            </Card>
          </Link>
        </div>

        {/* Motivational Quote Card */}
        <Card className="p-4 bg-background/40 backdrop-blur-md border border-dashed border-accent/10 animate-fade-in relative overflow-hidden" style={{ animationDelay: '400ms' }}>
          <div className="absolute inset-0 bg-gradient-to-br from-accent/5 via-transparent to-primary/5" />
          <div className="flex items-start gap-3 relative z-10">
            <div className="text-3xl">💪</div>
            <div className="flex-1">
              <p className="font-semibold text-foreground mb-0.5 text-sm drop-shadow-sm">Keep Going!</p>
              <p className="text-sm text-muted-foreground leading-relaxed">
                "Je bent sterker dan je denkt. Elke workout brengt je dichter bij je doel."
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Home;