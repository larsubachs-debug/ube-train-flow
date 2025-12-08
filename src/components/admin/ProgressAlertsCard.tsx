import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Bell, TrendingUp, TrendingDown, Trophy, AlertTriangle, Send } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { nl } from "date-fns/locale";

interface ProgressAlert {
  id: string;
  user_id: string;
  user_name: string;
  user_avatar: string | null;
  alert_type: "pr" | "stagnation" | "streak_broken" | "milestone";
  message: string;
  created_at: string;
  is_read: boolean;
}

interface ProgressAlertsCardProps {
  members: Array<{
    member_id: string;
    member_user_id: string;
    member_name: string | null;
    member_avatar: string | null;
  }>;
}

export const ProgressAlertsCard = ({ members }: ProgressAlertsCardProps) => {
  const { user } = useAuth();
  const [alerts, setAlerts] = useState<ProgressAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [autoAlerts, setAutoAlerts] = useState(true);

  useEffect(() => {
    if (members.length > 0) {
      checkForAlerts();
    }
  }, [members]);

  const checkForAlerts = async () => {
    setLoading(true);
    try {
      const memberUserIds = members.map((m) => m.member_user_id);
      const generatedAlerts: ProgressAlert[] = [];

      // Get member stats
      const { data: statsData } = await supabase
        .from("user_stats")
        .select("*")
        .in("user_id", memberUserIds);

      // Get recent workout sets to detect PRs
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

      const { data: recentSets } = await supabase
        .from("workout_sets")
        .select("*")
        .in("user_id", memberUserIds)
        .eq("completed", true)
        .gte("completed_at", oneWeekAgo.toISOString())
        .order("completed_at", { ascending: false });

      // Get profiles for names
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, display_name, avatar_url")
        .in("user_id", memberUserIds);

      const profilesMap = new Map(profiles?.map((p) => [p.user_id, p]) || []);
      const statsMap = new Map(statsData?.map((s) => [s.user_id, s]) || []);

      // Group sets by user and exercise to find potential PRs
      const userExerciseMax: Record<string, Record<string, number>> = {};
      recentSets?.forEach((set) => {
        if (!userExerciseMax[set.user_id]) {
          userExerciseMax[set.user_id] = {};
        }
        const currentMax = userExerciseMax[set.user_id][set.exercise_name] || 0;
        if (set.weight > currentMax) {
          userExerciseMax[set.user_id][set.exercise_name] = set.weight;
        }
      });

      members.forEach((member) => {
        const profile = profilesMap.get(member.member_user_id);
        const stats = statsMap.get(member.member_user_id);
        const memberName = profile?.display_name || member.member_name || "Onbekend";
        const memberAvatar = profile?.avatar_url || member.member_avatar;

        // Check for PRs
        if (stats?.total_prs && stats.total_prs > 0) {
          const recentPRs = recentSets?.filter(
            (s) => s.user_id === member.member_user_id
          ).length;
          
          if (recentPRs && recentPRs > 0) {
            generatedAlerts.push({
              id: `pr-${member.member_user_id}`,
              user_id: member.member_user_id,
              user_name: memberName,
              user_avatar: memberAvatar,
              alert_type: "pr",
              message: `Heeft ${recentPRs} nieuwe PR${recentPRs > 1 ? "'s" : ""} gezet deze week!`,
              created_at: new Date().toISOString(),
              is_read: false,
            });
          }
        }

        // Check for stagnation (no workouts in last 7 days)
        if (stats?.last_workout_date) {
          const lastWorkout = new Date(stats.last_workout_date);
          const daysSince = Math.floor(
            (Date.now() - lastWorkout.getTime()) / (1000 * 60 * 60 * 24)
          );

          if (daysSince >= 7) {
            generatedAlerts.push({
              id: `stagnation-${member.member_user_id}`,
              user_id: member.member_user_id,
              user_name: memberName,
              user_avatar: memberAvatar,
              alert_type: "stagnation",
              message: `Geen workout in ${daysSince} dagen. Tijd voor een check-in?`,
              created_at: new Date().toISOString(),
              is_read: false,
            });
          }
        }

        // Check for broken streak
        if (stats?.current_streak === 0 && stats?.longest_streak && stats.longest_streak > 3) {
          generatedAlerts.push({
            id: `streak-${member.member_user_id}`,
            user_id: member.member_user_id,
            user_name: memberName,
            user_avatar: memberAvatar,
            alert_type: "streak_broken",
            message: `Streak verloren (was ${stats.longest_streak} dagen). Motivatie nodig?`,
            created_at: new Date().toISOString(),
            is_read: false,
          });
        }

        // Check for milestones
        if (stats?.total_workouts) {
          const milestones = [10, 25, 50, 100, 250, 500];
          const reachedMilestone = milestones.find(
            (m) => stats.total_workouts >= m && stats.total_workouts < m + 5
          );
          
          if (reachedMilestone) {
            generatedAlerts.push({
              id: `milestone-${member.member_user_id}`,
              user_id: member.member_user_id,
              user_name: memberName,
              user_avatar: memberAvatar,
              alert_type: "milestone",
              message: `${reachedMilestone}+ workouts bereikt! 🎉`,
              created_at: new Date().toISOString(),
              is_read: false,
            });
          }
        }
      });

      // Sort by priority (stagnation first, then PRs, then milestones)
      generatedAlerts.sort((a, b) => {
        const priority = { stagnation: 0, streak_broken: 1, pr: 2, milestone: 3 };
        return priority[a.alert_type] - priority[b.alert_type];
      });

      setAlerts(generatedAlerts);
    } catch (error) {
      console.error("Error checking for alerts:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (alert: ProgressAlert) => {
    try {
      // Get coach profile id
      const { data: coachProfile } = await supabase
        .from("profiles")
        .select("id")
        .eq("user_id", user!.id)
        .single();

      if (!coachProfile) throw new Error("Coach not found");

      // Find member profile id
      const member = members.find((m) => m.member_user_id === alert.user_id);
      if (!member) throw new Error("Member not found");

      let message = "";
      switch (alert.alert_type) {
        case "pr":
          message = `Hey ${alert.user_name.split(" ")[0]}! Gefeliciteerd met je nieuwe PR! 💪 Keep pushing!`;
          break;
        case "stagnation":
          message = `Hey ${alert.user_name.split(" ")[0]}! Ik mis je in de gym. Alles goed? Laat me weten als ik kan helpen! 🙏`;
          break;
        case "streak_broken":
          message = `Hey ${alert.user_name.split(" ")[0]}! Geen zorgen over je streak - elke dag is een nieuwe kans. Wat kan ik doen om je te helpen terug te komen? 💪`;
          break;
        case "milestone":
          message = `Wauw ${alert.user_name.split(" ")[0]}! ${alert.message} Ongelooflijke prestatie! 🏆`;
          break;
      }

      const { error } = await supabase.from("chat_messages").insert({
        coach_id: coachProfile.id,
        member_id: member.member_id,
        sender_id: user!.id,
        message,
      });

      if (error) throw error;

      // Mark as read
      setAlerts(alerts.map((a) => 
        a.id === alert.id ? { ...a, is_read: true } : a
      ));

      toast.success("Bericht verzonden!");
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Kon bericht niet verzenden");
    }
  };

  const getAlertIcon = (type: ProgressAlert["alert_type"]) => {
    switch (type) {
      case "pr":
        return <Trophy className="w-4 h-4 text-yellow-500" />;
      case "stagnation":
        return <AlertTriangle className="w-4 h-4 text-orange-500" />;
      case "streak_broken":
        return <TrendingDown className="w-4 h-4 text-red-500" />;
      case "milestone":
        return <TrendingUp className="w-4 h-4 text-green-500" />;
    }
  };

  const getAlertBadge = (type: ProgressAlert["alert_type"]) => {
    switch (type) {
      case "pr":
        return <Badge className="bg-yellow-500/20 text-yellow-600">PR</Badge>;
      case "stagnation":
        return <Badge className="bg-orange-500/20 text-orange-600">Inactief</Badge>;
      case "streak_broken":
        return <Badge className="bg-red-500/20 text-red-600">Streak</Badge>;
      case "milestone":
        return <Badge className="bg-green-500/20 text-green-600">Milestone</Badge>;
    }
  };

  const getInitials = (name: string) => {
    return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
  };

  const unreadCount = alerts.filter((a) => !a.is_read).length;

  if (loading) {
    return (
      <Card className="p-4">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-muted rounded w-1/3" />
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-muted rounded" />
            ))}
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Bell className="w-5 h-5" />
          <h3 className="font-semibold">Progress Alerts</h3>
          {unreadCount > 0 && (
            <Badge variant="destructive" className="text-xs">
              {unreadCount}
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Label htmlFor="auto-alerts" className="text-sm text-muted-foreground">
            Auto
          </Label>
          <Switch
            id="auto-alerts"
            checked={autoAlerts}
            onCheckedChange={setAutoAlerts}
          />
        </div>
      </div>

      {alerts.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <Bell className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p>Geen alerts</p>
          <p className="text-sm">Alle leden zijn op schema! 🎉</p>
        </div>
      ) : (
        <div className="space-y-2">
          {alerts.map((alert) => (
            <div
              key={alert.id}
              className={`flex items-center gap-3 p-3 rounded-lg border ${
                alert.is_read ? "bg-muted/30" : "bg-background"
              }`}
            >
              <Avatar className="w-10 h-10">
                {alert.user_avatar && <AvatarImage src={alert.user_avatar} />}
                <AvatarFallback className="text-xs">
                  {getInitials(alert.user_name)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  {getAlertIcon(alert.alert_type)}
                  <span className="font-medium text-sm truncate">
                    {alert.user_name}
                  </span>
                  {getAlertBadge(alert.alert_type)}
                </div>
                <p className="text-sm text-muted-foreground truncate">
                  {alert.message}
                </p>
              </div>
              <Button
                size="sm"
                variant={alert.is_read ? "outline" : "default"}
                className="gap-1 shrink-0"
                onClick={() => handleSendMessage(alert)}
                disabled={alert.is_read}
              >
                <Send className="w-3 h-3" />
                {alert.is_read ? "Verzonden" : "Bericht"}
              </Button>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
};
