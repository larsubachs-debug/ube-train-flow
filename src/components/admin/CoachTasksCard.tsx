import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  MessageCircle, 
  ClipboardCheck, 
  AlertTriangle, 
  ChevronRight,
  Calendar,
  Apple
} from "lucide-react";
import { Link } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { nl } from "date-fns/locale";

interface CoachTask {
  id: string;
  type: "unread_message" | "pending_checkin" | "inactive_member" | "no_nutrition_goals";
  priority: "high" | "medium" | "low";
  title: string;
  description: string;
  memberId: string;
  memberName: string;
  memberAvatar: string | null;
  actionUrl?: string;
  createdAt?: string;
}

export const CoachTasksCard = () => {
  const { user } = useAuth();

  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ["coach-tasks", user?.id],
    queryFn: async () => {
      if (!user) return [];

      // Get coach's profile id
      const { data: coachProfile } = await supabase
        .from("profiles")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (!coachProfile) return [];

      // Get all members assigned to this coach
      const { data: members } = await supabase
        .from("profiles")
        .select("id, user_id, display_name, avatar_url")
        .eq("coach_id", coachProfile.id);

      if (!members || members.length === 0) return [];

      const allTasks: CoachTask[] = [];

      // 1. Check for unread messages
      const { data: unreadMessages } = await supabase
        .from("chat_messages")
        .select("id, member_id, created_at, message")
        .eq("coach_id", coachProfile.id)
        .neq("sender_id", coachProfile.id)
        .is("read_at", null)
        .order("created_at", { ascending: false });

      if (unreadMessages) {
        const uniqueMembers = new Map();
        unreadMessages.forEach((msg) => {
          if (!uniqueMembers.has(msg.member_id)) {
            const member = members.find((m) => m.id === msg.member_id);
            if (member) {
              uniqueMembers.set(msg.member_id, {
                id: `unread-${msg.member_id}`,
                type: "unread_message" as const,
                priority: "high" as const,
                title: "Ongelezen bericht",
                description: msg.message.substring(0, 50) + (msg.message.length > 50 ? "..." : ""),
                memberId: member.id,
                memberName: member.display_name || "Naamloos",
                memberAvatar: member.avatar_url,
                actionUrl: `/coach/chat/${member.id}`,
                createdAt: msg.created_at,
              });
            }
          }
        });
        allTasks.push(...Array.from(uniqueMembers.values()));
      }

      // 2. Check for pending daily check-ins to review
      const today = new Date().toISOString().split("T")[0];
      const { data: recentCheckins } = await supabase
        .from("daily_checkins")
        .select("id, user_id, checkin_date, created_at")
        .in("user_id", members.map((m) => m.user_id))
        .gte("checkin_date", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0])
        .order("created_at", { ascending: false });

      if (recentCheckins) {
        // Get unique recent check-ins per member (last 3 days)
        const recentMemberCheckins = new Map();
        recentCheckins.forEach((checkin) => {
          const member = members.find((m) => m.user_id === checkin.user_id);
          if (member && !recentMemberCheckins.has(member.id)) {
            const checkinDate = new Date(checkin.checkin_date);
            const daysDiff = Math.floor((Date.now() - checkinDate.getTime()) / (1000 * 60 * 60 * 24));
            if (daysDiff <= 2) {
              recentMemberCheckins.set(member.id, {
                id: `checkin-${checkin.id}`,
                type: "pending_checkin" as const,
                priority: "medium" as const,
                title: "Nieuwe check-in",
                description: `Check-in van ${checkinDate.toLocaleDateString("nl-NL")}`,
                memberId: member.id,
                memberName: member.display_name || "Naamloos",
                memberAvatar: member.avatar_url,
                createdAt: checkin.created_at,
              });
            }
          }
        });
        allTasks.push(...Array.from(recentMemberCheckins.values()));
      }

      // 3. Check for inactive members (no workout in 5+ days)
      const { data: memberStats } = await supabase
        .from("user_stats")
        .select("user_id, last_workout_date")
        .in("user_id", members.map((m) => m.user_id));

      if (memberStats) {
        memberStats.forEach((stat) => {
          if (stat.last_workout_date) {
            const lastWorkout = new Date(stat.last_workout_date);
            const daysSince = Math.floor((Date.now() - lastWorkout.getTime()) / (1000 * 60 * 60 * 24));
            if (daysSince >= 5) {
              const member = members.find((m) => m.user_id === stat.user_id);
              if (member) {
                allTasks.push({
                  id: `inactive-${member.id}`,
                  type: "inactive_member",
                  priority: daysSince >= 7 ? "high" : "medium",
                  title: "Inactief lid",
                  description: `Laatste workout ${daysSince} dagen geleden`,
                  memberId: member.id,
                  memberName: member.display_name || "Naamloos",
                  memberAvatar: member.avatar_url,
                  actionUrl: `/coach/chat/${member.id}`,
                });
              }
            }
          }
        });
      }

      // 4. Check for members without nutrition goals
      const { data: nutritionGoals } = await supabase
        .from("nutrition_goals")
        .select("user_id")
        .in("user_id", members.map((m) => m.user_id))
        .eq("is_active", true);

      const membersWithGoals = new Set(nutritionGoals?.map((g) => g.user_id) || []);
      members.forEach((member) => {
        if (!membersWithGoals.has(member.user_id)) {
          allTasks.push({
            id: `nutrition-${member.id}`,
            type: "no_nutrition_goals",
            priority: "low",
            title: "Geen voedingsdoelen",
            description: "Stel voedingsdoelen in voor dit lid",
            memberId: member.id,
            memberName: member.display_name || "Naamloos",
            memberAvatar: member.avatar_url,
          });
        }
      });

      // Sort by priority and date
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      allTasks.sort((a, b) => {
        if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
          return priorityOrder[a.priority] - priorityOrder[b.priority];
        }
        if (a.createdAt && b.createdAt) {
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        }
        return 0;
      });

      return allTasks;
    },
    enabled: !!user,
  });

  const getTaskIcon = (type: CoachTask["type"]) => {
    switch (type) {
      case "unread_message":
        return <MessageCircle className="h-4 w-4" />;
      case "pending_checkin":
        return <ClipboardCheck className="h-4 w-4" />;
      case "inactive_member":
        return <AlertTriangle className="h-4 w-4" />;
      case "no_nutrition_goals":
        return <Apple className="h-4 w-4" />;
      default:
        return <Calendar className="h-4 w-4" />;
    }
  };

  const getPriorityColor = (priority: CoachTask["priority"]) => {
    switch (priority) {
      case "high":
        return "bg-red-500/10 text-red-500 border-red-500/20";
      case "medium":
        return "bg-yellow-500/10 text-yellow-500 border-yellow-500/20";
      case "low":
        return "bg-blue-500/10 text-blue-500 border-blue-500/20";
    }
  };

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-6 w-6 rounded-full" />
        </div>
        <div className="space-y-3">
          <Skeleton className="h-16" />
          <Skeleton className="h-16" />
          <Skeleton className="h-16" />
        </div>
      </Card>
    );
  }

  const highPriorityCount = tasks.filter((t) => t.priority === "high").length;

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-semibold">Openstaande Taken</h3>
          {highPriorityCount > 0 && (
            <Badge variant="destructive" className="rounded-full">
              {highPriorityCount}
            </Badge>
          )}
        </div>
        <Badge variant="outline">{tasks.length} totaal</Badge>
      </div>

      {tasks.length === 0 ? (
        <div className="text-center py-8">
          <ClipboardCheck className="h-12 w-12 mx-auto mb-4 text-green-500" />
          <p className="text-muted-foreground">Geen openstaande taken!</p>
          <p className="text-sm text-muted-foreground mt-1">
            Je bent helemaal bij 🎉
          </p>
        </div>
      ) : (
        <div className="space-y-3 max-h-[400px] overflow-y-auto">
          {tasks.slice(0, 10).map((task) => (
            <div
              key={task.id}
              className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
            >
              <Avatar className="h-10 w-10">
                <AvatarImage src={task.memberAvatar || undefined} />
                <AvatarFallback>
                  {task.memberName[0]?.toUpperCase() || "M"}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`p-1 rounded ${getPriorityColor(task.priority)}`}>
                    {getTaskIcon(task.type)}
                  </span>
                  <span className="font-medium text-sm truncate">
                    {task.memberName}
                  </span>
                </div>
                <p className="text-sm font-medium">{task.title}</p>
                <p className="text-xs text-muted-foreground truncate">
                  {task.description}
                </p>
                {task.createdAt && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatDistanceToNow(new Date(task.createdAt), { 
                      addSuffix: true, 
                      locale: nl 
                    })}
                  </p>
                )}
              </div>

              {task.actionUrl && (
                <Link to={task.actionUrl}>
                  <Button size="sm" variant="ghost">
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </Link>
              )}
            </div>
          ))}

          {tasks.length > 10 && (
            <p className="text-sm text-muted-foreground text-center pt-2">
              En {tasks.length - 10} meer...
            </p>
          )}
        </div>
      )}
    </Card>
  );
};
