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
      {/* Gradient Background Overlay - spans entire page */}
      <div className="fixed inset-0 -z-10 bg-gradient-to-b from-primary via-primary/40 to-background" />
      
      {/* Hero Header with Enhanced Gradient */}
      <div className="relative overflow-hidden text-primary-foreground">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAxOGMzLjMxNCAwIDYgMi42ODYgNiA2cy0yLjY4NiA2LTYgNi02LTIuNjg2LTYtNiAyLjY4Ni02IDYtNnptMCAzNmMzLjMxNCAwIDYgMi42ODYgNiA2cy0yLjY4NiA2LTYgNi02LTIuNjg2LTYtNiAyLjY4Ni02IDYtNnoiIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iLjAyIi8+PC9nPjwvc3ZnPg==')] opacity-40" />
        
        <div className="relative px-6 py-8 animate-fade-in">
          {/* Logo Section */}
          <div className="flex flex-col items-center mb-6">
            <div className="relative">
              <div className="absolute inset-0 bg-primary-foreground/20 blur-xl rounded-full" />
              <img 
                src={branding?.logo_url || ubeLogo} 
                alt={branding?.app_name || "U.be"} 
                className="h-12 mb-3 relative z-10 drop-shadow-lg" 
              />
            </div>
            <p className="text-sm font-semibold tracking-wide text-primary">
              {branding?.tagline || "ALL ABOUT U"}
            </p>
          </div>

          {/* Weekly Progress Card */}
          {branding?.show_weekly_progress !== false && (
            <div className="bg-primary-foreground/10 backdrop-blur-md rounded-3xl p-5 border border-primary-foreground/20 shadow-xl">
            <div className="flex justify-between items-center mb-3">
              <div>
                <p className="text-xs font-medium opacity-80 uppercase tracking-wider">Weekly Progress</p>
                <p className="text-2xl font-bold mt-1">{completedWorkouts}/{totalWorkouts}</p>
              </div>
              <div className="bg-primary-foreground/20 rounded-full p-3">
                <TrendingUp className="w-6 h-6" />
              </div>
            </div>
            
            {/* Animated Progress Bar */}
            <div className="relative h-2 bg-primary-foreground/20 rounded-full overflow-hidden">
              <div 
                className="absolute inset-y-0 left-0 bg-gradient-to-r from-accent to-accent-foreground rounded-full transition-all duration-1000 ease-out shadow-glow"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>

            <div className="flex gap-2 mt-4">
              {Array.from({ length: totalWorkouts }).map((_, i) => (
                <div
                  key={i}
                  className={`flex-1 h-1.5 rounded-full transition-all duration-500 ${
                    i < completedWorkouts
                      ? 'bg-accent shadow-glow-green scale-105'
                      : 'bg-primary-foreground/20'
                  }`}
                  style={{ transitionDelay: `${i * 100}ms` }}
                />
              ))}
            </div>
          </div>
          )}

          {/* Quick Actions */}
          <div className="grid grid-cols-3 gap-3 mt-6">
            <Link to="/community" className="group">
              <div className="bg-primary-foreground/10 backdrop-blur-sm hover:bg-primary-foreground/20 border border-primary-foreground/20 rounded-2xl p-4 flex flex-col items-center gap-2 transition-all duration-300 hover:scale-105 hover:shadow-lg">
                <Users className="w-5 h-5 group-hover:scale-110 transition-transform" />
                <span className="text-xs font-medium">Community</span>
              </div>
            </Link>
            <Link to="/education" className="group">
              <div className="bg-primary-foreground/10 backdrop-blur-sm hover:bg-primary-foreground/20 border border-primary-foreground/20 rounded-2xl p-4 flex flex-col items-center gap-2 transition-all duration-300 hover:scale-105 hover:shadow-lg">
                <BookOpen className="w-5 h-5 group-hover:scale-110 transition-transform" />
                <span className="text-xs font-medium">Guides</span>
              </div>
            </Link>
            <Link to="/programs" className="group">
              <div className="bg-primary-foreground/10 backdrop-blur-sm hover:bg-primary-foreground/20 border border-primary-foreground/20 rounded-2xl p-4 flex flex-col items-center gap-2 transition-all duration-300 hover:scale-105 hover:shadow-lg">
                <Calendar className="w-5 h-5 group-hover:scale-110 transition-transform" />
                <span className="text-xs font-medium">Program</span>
              </div>
            </Link>
          </div>
        </div>
      </div>

      <div className="px-6 mt-6 space-y-6 relative z-10">
        {/* Program Block Card - Dynamic Phase Info */}
        <Card className="p-0 shadow-xl bg-primary/95 backdrop-blur-md text-primary-foreground overflow-hidden border-2 border-primary-foreground/20">
          <div className="p-6">
            {loading ? (
              <div className="flex items-start gap-4 mb-3">
                <Skeleton className="w-12 h-12 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-4 w-full" />
                </div>
              </div>
            ) : (
              <div className="flex items-start gap-4 mb-3">
                <div className="w-12 h-12 rounded-full bg-primary-foreground/20 flex items-center justify-center">
                  <span className="text-xl font-bold">{progress?.current_week_number || 1}</span>
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold mb-1">
                    {currentWeek?.phase_name || `Week ${progress?.current_week_number || 1}`}
                  </h3>
                  <p className="text-sm opacity-90">
                    {currentWeek?.description || "Volg je training programma en bereik je doelen stap voor stap."}
                  </p>
                </div>
              </div>
            )}
          </div>
        </Card>

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
                <Card className="relative overflow-hidden hover:shadow-xl transition-all duration-500 animate-fade-in bg-background/90 backdrop-blur-md border-2 group-hover:border-accent/50">
                  {/* Gradient accent bar on top */}
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-accent via-accent-foreground to-accent transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-500" />
                  
                  <div className="p-5">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <div className="absolute inset-0 bg-accent/20 blur-sm rounded-full group-hover:blur-md transition-all" />
                          <div className="relative bg-gradient-to-br from-accent to-accent-foreground rounded-xl w-10 h-10 flex items-center justify-center shadow-sm">
                            <Play className="w-4 h-4 text-white fill-white" />
                          </div>
                        </div>
                        
                        <div>
                          <h3 className="font-bold text-lg text-foreground group-hover:text-accent transition-colors">
                            {workout.name}
                          </h3>
                          <p className="text-sm text-muted-foreground">
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
                    <div className="flex items-center gap-6 pt-3 border-t border-border/50">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-muted/50 flex items-center justify-center">
                          <Calendar className="w-4 h-4 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Duur</p>
                          <p className="text-sm font-semibold">{workout.duration} min</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-muted/50 flex items-center justify-center">
                          <TrendingUp className="w-4 h-4 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Oefeningen</p>
                          <p className="text-sm font-semibold">{workout.warmUp?.length + workout.mainLifts?.length + workout.accessories?.length || 0}</p>
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
        <div className="grid grid-cols-2 gap-4 animate-fade-in" style={{ animationDelay: '300ms' }}>
          <Link to="/achievements">
            <Card className="p-5 hover:shadow-lg transition-all duration-300 group hover:scale-105 bg-background/80 backdrop-blur-sm border-2">
              <div className="flex flex-col items-center text-center gap-3">
                <div className="bg-gradient-to-br from-accent/20 to-accent/10 rounded-2xl p-3 group-hover:scale-110 transition-transform duration-300">
                  <Award className="w-6 h-6 text-accent" />
                </div>
                <div>
                  <p className="text-2xl font-bold">12</p>
                  <p className="text-xs text-muted-foreground font-medium">Achievements</p>
                </div>
              </div>
            </Card>
          </Link>

          <Link to="/leaderboard">
            <Card className="p-5 hover:shadow-lg transition-all duration-300 group hover:scale-105 bg-background/80 backdrop-blur-sm border-2">
              <div className="flex flex-col items-center text-center gap-3">
                <div className="bg-gradient-to-br from-primary/20 to-primary/10 rounded-2xl p-3 group-hover:scale-110 transition-transform duration-300">
                  <TrendingUp className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">#5</p>
                  <p className="text-xs text-muted-foreground font-medium">Leaderboard</p>
                </div>
              </div>
            </Card>
          </Link>
        </div>

        {/* Motivational Quote Card */}
        <Card className="p-6 bg-background/60 backdrop-blur-md border-2 border-dashed border-accent/20 animate-fade-in relative overflow-hidden" style={{ animationDelay: '400ms' }}>
          <div className="absolute inset-0 bg-gradient-to-br from-accent/5 via-transparent to-primary/5" />
          <div className="flex items-start gap-4 relative z-10">
            <div className="text-4xl">💪</div>
            <div className="flex-1">
              <p className="font-semibold text-foreground mb-1">Keep Going!</p>
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