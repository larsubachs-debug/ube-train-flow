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

const Home = () => {
  const { user } = useAuth();
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
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 pb-20">
      {/* Hero Header with Gradient */}
      <div className="relative overflow-hidden bg-gradient-to-br from-primary via-primary to-accent/20 text-primary-foreground">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAxOGMzLjMxNCAwIDYgMi42ODYgNiA2cy0yLjY4NiA2LTYgNi02LTIuNjg2LTYtNiAyLjY4Ni02IDYtNnptMCAzNmMzLjMxNCAwIDYgMi42ODYgNiA2cy0yLjY4NiA2LTYgNi02LTIuNjg2LTYtNiAyLjY4Ni02IDYtNnoiIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iLjAyIi8+PC9nPjwvc3ZnPg==')] opacity-40" />
        
        <div className="relative px-6 py-8 animate-fade-in">
          {/* Logo Section */}
          <div className="flex flex-col items-center mb-6">
            <div className="relative">
              <div className="absolute inset-0 bg-primary-foreground/20 blur-xl rounded-full" />
              <img src={ubeLogo} alt="U.be" className="h-12 mb-3 relative z-10 drop-shadow-lg" />
            </div>
            <p className="text-sm font-semibold tracking-wide opacity-90">ALL ABOUT U</p>
          </div>

          {/* Weekly Progress Card */}
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

      <div className="px-6 mt-6 space-y-6">
        {/* Program Block Card - Dynamic Phase Info */}
        <Card className="p-0 shadow-xl bg-primary text-primary-foreground overflow-hidden">
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

          <div className="grid gap-3">
            {thisWeek?.workouts.slice(0, 3).map((workout, index) => (
              <Link 
                key={workout.id} 
                to={`/programs/${currentProgram.id}/workout/${workout.id}`}
                className="group"
                style={{ animationDelay: `${200 + index * 100}ms` }}
              >
                <Card className="p-4 hover:shadow-lg hover:scale-[1.02] transition-all duration-300 border-l-4 border-l-accent/50 hover:border-l-accent animate-fade-in">
                  <div className="flex items-center gap-4">
                    <div className="bg-gradient-to-br from-muted to-muted/50 rounded-xl w-12 h-12 flex items-center justify-center flex-shrink-0 group-hover:from-accent/20 group-hover:to-accent/10 transition-all duration-300">
                      <Play className="w-5 h-5 text-accent group-hover:scale-110 transition-transform" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-foreground group-hover:text-accent transition-colors truncate">
                        {workout.name}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {workout.duration} min • {workout.warmUp?.length + workout.mainLifts?.length + workout.accessories?.length || 0} oefeningen
                      </p>
                    </div>
                    {workout.completed && (
                      <CheckCircle2 className="w-5 h-5 text-accent flex-shrink-0 animate-scale-in" />
                    )}
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-2 gap-4 animate-fade-in" style={{ animationDelay: '300ms' }}>
          <Link to="/achievements">
            <Card className="p-5 hover:shadow-lg transition-all duration-300 group hover:scale-105 bg-gradient-to-br from-card to-muted/30">
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
            <Card className="p-5 hover:shadow-lg transition-all duration-300 group hover:scale-105 bg-gradient-to-br from-card to-muted/30">
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
        <Card className="p-6 bg-gradient-to-br from-primary/5 via-accent/5 to-transparent border-2 border-dashed border-muted-foreground/20 animate-fade-in" style={{ animationDelay: '400ms' }}>
          <div className="flex items-start gap-4">
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