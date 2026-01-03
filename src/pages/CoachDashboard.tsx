import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  ClipboardCheck, 
  Clock, 
  ChevronRight, 
  Smile, 
  Plus,
  ListTodo,
  Users
} from "lucide-react";
import { Link } from "react-router-dom";
import { format, formatDistanceToNow } from "date-fns";
import { nl } from "date-fns/locale";
import BottomNav from "@/components/BottomNav";
import { useQuery } from "@tanstack/react-query";

interface Member {
  id: string;
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
}

interface CoachTask {
  id: string;
  type: string;
  title: string;
  memberId: string;
  memberName: string;
  memberAvatar: string | null;
  createdAt: string;
  completed?: boolean;
}

const CoachDashboard = () => {
  const { user } = useAuth();
  const [coachName, setCoachName] = useState("");

  // Fetch coach profile
  const { data: coachProfile } = useQuery({
    queryKey: ["coach-profile", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await supabase
        .from("profiles")
        .select("id, display_name")
        .eq("user_id", user.id)
        .single();
      
      if (data) {
        setCoachName(data.display_name || "Coach");
      }
      return data;
    },
    enabled: !!user,
  });

  // Fetch members
  const { data: members = [], isLoading: membersLoading } = useQuery({
    queryKey: ["coach-members", coachProfile?.id],
    queryFn: async () => {
      if (!coachProfile) return [];
      const { data } = await supabase
        .from("profiles")
        .select("id, user_id, display_name, avatar_url")
        .eq("coach_id", coachProfile.id);
      return (data || []) as Member[];
    },
    enabled: !!coachProfile,
  });

  // Fetch pending check-ins count
  const { data: pendingCheckinsCount = 0 } = useQuery({
    queryKey: ["pending-checkins-count", members],
    queryFn: async () => {
      if (members.length === 0) return 0;
      
      const threeDaysAgo = new Date();
      threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
      
      const { data } = await supabase
        .from("daily_checkins")
        .select("id")
        .in("user_id", members.map(m => m.user_id))
        .gte("checkin_date", threeDaysAgo.toISOString().split("T")[0]);
      
      return data?.length || 0;
    },
    enabled: members.length > 0,
  });

  // Fetch tasks
  const { data: tasks = [], isLoading: tasksLoading } = useQuery({
    queryKey: ["coach-dashboard-tasks", coachProfile?.id, members],
    queryFn: async () => {
      if (!coachProfile || members.length === 0) return [];
      
      const allTasks: CoachTask[] = [];

      // Get unread messages
      const { data: unreadMessages } = await supabase
        .from("chat_messages")
        .select("id, member_id, created_at, message")
        .eq("coach_id", coachProfile.id)
        .neq("sender_id", coachProfile.id)
        .is("read_at", null)
        .order("created_at", { ascending: false })
        .limit(10);

      if (unreadMessages) {
        const seenMembers = new Set();
        unreadMessages.forEach((msg) => {
          if (!seenMembers.has(msg.member_id)) {
            seenMembers.add(msg.member_id);
            const member = members.find((m) => m.id === msg.member_id);
            if (member) {
              allTasks.push({
                id: `msg-${msg.id}`,
                type: "message",
                title: msg.message.length > 50 ? msg.message.substring(0, 50) + "..." : msg.message,
                memberId: member.id,
                memberName: member.display_name || "Naamloos",
                memberAvatar: member.avatar_url,
                createdAt: msg.created_at,
              });
            }
          }
        });
      }

      // Get recent check-ins to review
      const { data: recentCheckins } = await supabase
        .from("daily_checkins")
        .select("id, user_id, created_at")
        .in("user_id", members.map((m) => m.user_id))
        .gte("checkin_date", new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString().split("T")[0])
        .order("created_at", { ascending: false })
        .limit(5);

      if (recentCheckins) {
        const seenMembers = new Set();
        recentCheckins.forEach((checkin) => {
          if (!seenMembers.has(checkin.user_id)) {
            seenMembers.add(checkin.user_id);
            const member = members.find((m) => m.user_id === checkin.user_id);
            if (member) {
              allTasks.push({
                id: `checkin-${checkin.id}`,
                type: "checkin",
                title: "Nieuwe check-in ontvangen",
                memberId: member.id,
                memberName: member.display_name || "Naamloos",
                memberAvatar: member.avatar_url,
                createdAt: checkin.created_at,
              });
            }
          }
        });
      }

      // Sort by date
      allTasks.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      return allTasks.slice(0, 5);
    },
    enabled: !!coachProfile && members.length > 0,
  });

  // Calculate tasks remaining (unread messages count)
  const { data: tasksRemainingCount = 0 } = useQuery({
    queryKey: ["tasks-remaining-count", coachProfile?.id],
    queryFn: async () => {
      if (!coachProfile) return 0;
      
      const { data } = await supabase
        .from("chat_messages")
        .select("id")
        .eq("coach_id", coachProfile.id)
        .neq("sender_id", coachProfile.id)
        .is("read_at", null);
      
      return data?.length || 0;
    },
    enabled: !!coachProfile,
  });

  const isLoading = membersLoading || tasksLoading;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background pb-24">
        <div className="p-6 space-y-6">
          <div className="flex justify-between items-center">
            <Skeleton className="h-8 w-32" />
            <Skeleton className="h-6 w-24" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Skeleton className="h-24 rounded-xl" />
            <Skeleton className="h-24 rounded-xl" />
          </div>
          <Skeleton className="h-40 rounded-xl" />
          <Skeleton className="h-32 rounded-xl" />
        </div>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <h1 className="text-xl font-semibold">
            👋 Hi {coachName.split(" ")[0]}
          </h1>
          <span className="text-muted-foreground text-sm">
            {format(new Date(), "d MMM, yyyy", { locale: nl })}
          </span>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 gap-4">
          <Card className="p-4 bg-card border-0 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-2 rounded-lg bg-primary/10">
                <ClipboardCheck className="h-4 w-4 text-primary" />
              </div>
              <span className="text-sm text-muted-foreground">Check-Ins Pending</span>
            </div>
            <p className="text-3xl font-bold">{pendingCheckinsCount}</p>
          </Card>

          <Card className="p-4 bg-card border-0 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-2 rounded-lg bg-orange-500/10">
                <Clock className="h-4 w-4 text-orange-500" />
              </div>
              <span className="text-sm text-muted-foreground">Tasks Remaining</span>
            </div>
            <p className="text-3xl font-bold">{tasksRemainingCount}</p>
          </Card>
        </div>

        {/* Tasks Section */}
        <Card className="p-4 bg-card border-0 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-red-500/10">
                <ListTodo className="h-4 w-4 text-red-500" />
              </div>
              <span className="font-semibold">Tasks</span>
            </div>
            <Link to="/admin/members" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
              View All
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="border-t pt-4">
            {tasks.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">
                Geen openstaande taken
              </p>
            ) : (
              <div className="space-y-4">
                {tasks.map((task) => (
                  <Link 
                    key={task.id} 
                    to={`/coach/chat/${task.memberId}`}
                    className="flex items-center gap-3 group"
                  >
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={task.memberAvatar || undefined} />
                      <AvatarFallback>
                        {task.memberName[0]?.toUpperCase() || "M"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">
                        {task.title}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(task.createdAt), { 
                          addSuffix: true, 
                          locale: nl 
                        })}
                      </p>
                    </div>
                    <Checkbox className="h-5 w-5 rounded-full border-2" />
                  </Link>
                ))}
              </div>
            )}
          </div>
        </Card>

        {/* Community Section */}
        <Card className="p-4 bg-card border-0 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-orange-500/10">
                <Smile className="h-4 w-4 text-orange-500" />
              </div>
              <span className="font-semibold">Community</span>
            </div>
            <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground gap-1">
              New
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          <div className="border-t pt-4">
            <p className="text-muted-foreground text-center py-4">
              You haven't created any communities yet.
            </p>
          </div>
        </Card>

        {/* Members Quick Access */}
        <Card className="p-4 bg-card border-0 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <Users className="h-4 w-4 text-blue-500" />
              </div>
              <span className="font-semibold">Leden</span>
            </div>
            <Link to="/admin/members" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
              View All
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="border-t pt-4">
            {members.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">
                Nog geen leden toegewezen
              </p>
            ) : (
              <div className="flex -space-x-2 overflow-hidden">
                {members.slice(0, 8).map((member) => (
                  <Avatar key={member.id} className="h-10 w-10 border-2 border-background">
                    <AvatarImage src={member.avatar_url || undefined} />
                    <AvatarFallback className="text-xs">
                      {member.display_name?.[0]?.toUpperCase() || "M"}
                    </AvatarFallback>
                  </Avatar>
                ))}
                {members.length > 8 && (
                  <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center border-2 border-background">
                    <span className="text-xs font-medium">+{members.length - 8}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </Card>
      </div>

      <BottomNav />
    </div>
  );
};

export default CoachDashboard;
