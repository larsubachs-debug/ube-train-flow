import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { 
  User, Dumbbell, CheckSquare, Activity, TrendingUp, 
  Calendar, Award, Save, UserPlus, MessageCircle, Apple, Target 
} from "lucide-react";
import { ProgramAssigner } from "./ProgramAssigner";
import { TaskAssignment } from "@/components/tasks/TaskAssignment";
import { AdminCheckinAssignment } from "@/components/checkin/AdminCheckinAssignment";
import { NutritionGoalsAssignment } from "./NutritionGoalsAssignment";
import { HabitAssignment } from "./HabitAssignment";
import { Link } from "react-router-dom";
import MemberScheduler from "./MemberScheduler";

interface MemberManagementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  memberId: string;
  memberUserId: string;
}

export const MemberManagementDialog = ({
  open,
  onOpenChange,
  memberId,
  memberUserId,
}: MemberManagementDialogProps) => {
  const { toast } = useToast();
  const [showProgramAssigner, setShowProgramAssigner] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [saving, setSaving] = useState(false);

  // Fetch member profile
  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ["member-profile", memberId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*, coach:coach_id(id, display_name)")
        .eq("id", memberId)
        .single();

      if (error) throw error;
      setDisplayName(data.display_name || "");
      setEmail(data.email || "");
      return data;
    },
    enabled: open,
  });

  // Fetch member stats
  const { data: stats } = useQuery({
    queryKey: ["member-stats", memberUserId],
    queryFn: async () => {
      const { data } = await supabase
        .from("user_stats")
        .select("*")
        .eq("user_id", memberUserId)
        .maybeSingle();

      return data || {
        total_workouts: 0,
        total_prs: 0,
        current_streak: 0,
        last_workout_date: null,
      };
    },
    enabled: open,
  });

  // Fetch member programs
  const { data: programs = [] } = useQuery({
    queryKey: ["member-programs", memberUserId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_program_progress")
        .select(`
          *,
          program:program_id (
            id,
            name,
            description
          )
        `)
        .eq("user_id", memberUserId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: open,
  });

  // Fetch member tasks
  const { data: tasks = [] } = useQuery({
    queryKey: ["member-tasks", memberId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("member_tasks")
        .select(`
          *,
          task:task_id (
            id,
            title,
            category
          )
        `)
        .eq("member_id", memberId)
        .eq("is_active", true)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: open,
  });

  // Fetch check-in questions
  const { data: questions = [] } = useQuery({
    queryKey: ["checkin-questions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("checkin_questions")
        .select("*")
        .order("display_order");

      if (error) throw error;
      return data || [];
    },
    enabled: open,
  });

  // Fetch available tasks
  const { data: availableTasks = [] } = useQuery({
    queryKey: ["tasks-library"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tasks_library")
        .select("*")
        .order("title");

      if (error) throw error;
      return data || [];
    },
    enabled: open,
  });

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          display_name: displayName,
          email: email,
        })
        .eq("id", memberId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Profiel bijgewerkt",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (profileLoading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <div className="space-y-4">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-64 w-full" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <>
      <Dialog open={open && !showProgramAssigner} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16">
                <AvatarImage src={profile?.avatar_url || undefined} />
                <AvatarFallback className="text-2xl">
                  {profile?.display_name?.[0]?.toUpperCase() || "M"}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <DialogTitle className="text-2xl">
                  {profile?.display_name || "Member"}
                </DialogTitle>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="outline">
                    {profile?.coach?.display_name || "Geen coach"}
                  </Badge>
                  <Link to={`/coach/chat/${memberId}`}>
                    <Button size="sm" variant="ghost">
                      <MessageCircle className="h-4 w-4 mr-1" />
                      Chat
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </DialogHeader>

          <Tabs defaultValue="agenda" className="mt-6">
            <TabsList className="grid w-full grid-cols-8">
              <TabsTrigger value="agenda">
                <Calendar className="h-4 w-4 mr-2" />
                Agenda
              </TabsTrigger>
              <TabsTrigger value="profile">
                <User className="h-4 w-4 mr-2" />
                Profiel
              </TabsTrigger>
              <TabsTrigger value="programs">
                <Dumbbell className="h-4 w-4 mr-2" />
                Programma's
              </TabsTrigger>
              <TabsTrigger value="nutrition">
                <Apple className="h-4 w-4 mr-2" />
                Voeding
              </TabsTrigger>
              <TabsTrigger value="habits">
                <Target className="h-4 w-4 mr-2" />
                Gewoontes
              </TabsTrigger>
              <TabsTrigger value="tasks">
                <CheckSquare className="h-4 w-4 mr-2" />
                Taken
              </TabsTrigger>
              <TabsTrigger value="checkins">
                <Activity className="h-4 w-4 mr-2" />
                Check-ins
              </TabsTrigger>
              <TabsTrigger value="stats">
                <TrendingUp className="h-4 w-4 mr-2" />
                Stats
              </TabsTrigger>
            </TabsList>

            <TabsContent value="agenda" className="space-y-4">
              <Card className="p-6">
                <MemberScheduler 
                  memberId={memberId} 
                  memberName={profile?.display_name || "Member"} 
                />
              </Card>
            </TabsContent>

            <TabsContent value="profile" className="space-y-4">
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">Profiel Informatie</h3>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="displayName">Naam</Label>
                    <Input
                      id="displayName"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                  <Button onClick={handleSaveProfile} disabled={saving}>
                    <Save className="h-4 w-4 mr-2" />
                    Opslaan
                  </Button>
                </div>
              </Card>
            </TabsContent>

            <TabsContent value="programs" className="space-y-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Toegewezen Programma's</h3>
                <Button onClick={() => setShowProgramAssigner(true)}>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Programma Toewijzen
                </Button>
              </div>
              
              {programs.length === 0 ? (
                <Card className="p-8 text-center">
                  <Dumbbell className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">
                    Nog geen programma's toegewezen
                  </p>
                </Card>
              ) : (
                <div className="space-y-3">
                  {programs.map((prog: any) => (
                    <Card key={prog.id} className="p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-semibold">{prog.program?.name}</h4>
                          <p className="text-sm text-muted-foreground">
                            Week {prog.current_week_number}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Gestart: {new Date(prog.start_date).toLocaleDateString("nl-NL")}
                          </p>
                        </div>
                        <Badge variant={prog.completed ? "default" : "secondary"}>
                          {prog.completed ? "Voltooid" : "Actief"}
                        </Badge>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="nutrition" className="space-y-4">
              <NutritionGoalsAssignment 
                memberId={memberId} 
                memberUserId={memberUserId} 
              />
            </TabsContent>

            <TabsContent value="habits" className="space-y-4">
              <HabitAssignment 
                memberId={memberId} 
                memberUserId={memberUserId} 
              />
            </TabsContent>

            <TabsContent value="tasks" className="space-y-4">
              <TaskAssignment tasks={availableTasks} />
            </TabsContent>

            <TabsContent value="checkins" className="space-y-4">
              <AdminCheckinAssignment questions={questions} />
            </TabsContent>

            <TabsContent value="stats" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Card className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="w-4 h-4 text-accent" />
                    <p className="text-sm text-muted-foreground">Totaal Workouts</p>
                  </div>
                  <p className="text-3xl font-bold">{stats?.total_workouts || 0}</p>
                </Card>

                <Card className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Award className="w-4 h-4 text-accent" />
                    <p className="text-sm text-muted-foreground">Personal Records</p>
                  </div>
                  <p className="text-3xl font-bold">{stats?.total_prs || 0}</p>
                </Card>

                <Card className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar className="w-4 h-4 text-accent" />
                    <p className="text-sm text-muted-foreground">Huidige Streak</p>
                  </div>
                  <p className="text-3xl font-bold">{stats?.current_streak || 0} dagen</p>
                </Card>

                <Card className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar className="w-4 h-4 text-accent" />
                    <p className="text-sm text-muted-foreground">Laatste Workout</p>
                  </div>
                  <p className="text-sm font-medium">
                    {stats?.last_workout_date
                      ? new Date(stats.last_workout_date).toLocaleDateString("nl-NL")
                      : "Nog niet"}
                  </p>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      {showProgramAssigner && (
        <ProgramAssigner
          open={showProgramAssigner}
          onOpenChange={setShowProgramAssigner}
          memberId={memberId}
          memberName={profile?.display_name || ""}
          memberUserId={memberUserId}
        />
      )}
    </>
  );
};
