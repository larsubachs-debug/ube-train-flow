import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Calendar, TrendingUp, Award, Play } from "lucide-react";
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
        <div className="text-center">
          <p className="text-muted-foreground">Geen programma toegewezen</p>
        </div>
      </div>
    );
  }
  return <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="bg-background border-b border-border px-6 py-4">
        <div className="flex flex-col items-center mb-4">
          <img src={ubeLogo} alt="U.be" className="h-8 mb-2" />
          <p className="text-sm font-medium text-muted-foreground">All About U</p>
        </div>
        
        {/* Program Tabs */}
        <div className="flex gap-3 mb-4">
          
          
        </div>

        {/* Weekly Progress */}
        <div className="mb-4">
          <div className="flex justify-between items-center mb-2">
            <p className="text-sm font-medium">Weekly progress</p>
            <p className="text-sm text-muted-foreground">3/5 sessions</p>
          </div>
          <div className="flex gap-1">
            <div className="h-1 flex-1 bg-primary rounded-full" />
            <div className="h-1 flex-1 bg-primary rounded-full" />
            <div className="h-1 flex-1 bg-primary rounded-full" />
            <div className="h-1 flex-1 bg-muted rounded-full" />
            <div className="h-1 flex-1 bg-muted rounded-full" />
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex gap-3">
          <Link to="/community" className="flex-1 bg-muted/50 rounded-2xl p-3 flex flex-col items-center gap-1">
            <Calendar className="w-5 h-5" />
            <span className="text-xs">Locker room</span>
          </Link>
          <Link to="/education" className="flex-1 bg-muted/50 rounded-2xl p-3 flex flex-col items-center gap-1">
            <Calendar className="w-5 h-5" />
            <span className="text-xs">Guides</span>
          </Link>
          <button className="flex-1 bg-muted/50 rounded-2xl p-3 flex flex-col items-center gap-1">
            <Calendar className="w-5 h-5" />
            <span className="text-xs">Rearrange</span>
          </button>
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

        {/* Training Plan */}
        <div>
          <div className="mb-4">
            <h3 className="text-lg font-bold mb-1">Your training plan</h3>
            <p className="text-sm text-muted-foreground">Next week's workouts drop Sunday</p>
          </div>

          {/* Workouts */}
          <div className="space-y-3">
            {thisWeek.workouts.map(workout => <Link key={workout.id} to={`/workout/${workout.id}`}>
                <Card className="p-4 shadow-md hover:shadow-lg transition-shadow">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-xs text-muted-foreground mb-1">
                        {workout.completed ? "Completed" : "Thurs 7th"}
                      </p>
                      <h4 className="font-bold mb-1">{workout.name}</h4>
                      <div className="flex gap-4 text-xs text-muted-foreground">
                        <span>Time<br /><span className="text-foreground font-medium">52:16</span></span>
                        <span>Weight<br /><span className="text-foreground font-medium">1068kg</span></span>
                        <span>Sets<br /><span className="text-foreground font-medium">24</span></span>
                        <span>PB<br /><span className="text-foreground font-medium">2</span></span>
                      </div>
                    </div>
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${workout.completed ? 'border-ube-green bg-ube-green/10' : 'border-border'}`}>
                      {workout.completed ? <Award className="w-5 h-5 text-ube-green" /> : <span className="text-sm">→</span>}
                    </div>
                  </div>
                </Card>
              </Link>)}
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-4">
          <Card className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-accent" />
              <p className="text-sm text-muted-foreground">This Month</p>
            </div>
            <p className="text-2xl font-bold">12</p>
            <p className="text-xs text-muted-foreground">Workouts completed</p>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Award className="w-4 h-4 text-accent" />
              <p className="text-sm text-muted-foreground">PR's</p>
            </div>
            <p className="text-2xl font-bold">5</p>
            <p className="text-xs text-muted-foreground">Personal records</p>
          </Card>
        </div>
      </div>
    </div>;
};
export default Home;