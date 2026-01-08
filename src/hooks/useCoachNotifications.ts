import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export type NotificationType = 
  | "checkin" 
  | "message" 
  | "workout" 
  | "pr" 
  | "stagnation" 
  | "streak_broken" 
  | "milestone";

export interface CoachNotification {
  id: string;
  type: NotificationType;
  member_id: string;
  member_user_id: string;
  member_name: string;
  member_avatar: string | null;
  message: string;
  created_at: string;
  is_read: boolean;
  data?: Record<string, unknown>;
}

export const useCoachNotifications = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<CoachNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [coachProfileId, setCoachProfileId] = useState<string | null>(null);

  const fetchNotifications = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    try {
      // Get coach profile
      const { data: coachProfile } = await supabase
        .from("profiles")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (!coachProfile) {
        setLoading(false);
        return;
      }

      setCoachProfileId(coachProfile.id);

      // Get all members assigned to this coach
      const { data: members } = await supabase
        .from("profiles")
        .select("id, user_id, display_name, avatar_url")
        .eq("coach_id", coachProfile.id);

      if (!members || members.length === 0) {
        setNotifications([]);
        setLoading(false);
        return;
      }

      const memberUserIds = members.map((m) => m.user_id);
      const memberMap = new Map(members.map((m) => [m.user_id, m]));
      const memberIdMap = new Map(members.map((m) => [m.id, m]));

      const allNotifications: CoachNotification[] = [];
      const threeDaysAgo = new Date();
      threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      // 1. Fetch recent check-ins
      const { data: checkins } = await supabase
        .from("daily_checkins")
        .select("id, user_id, checkin_date, created_at")
        .in("user_id", memberUserIds)
        .gte("checkin_date", threeDaysAgo.toISOString().split("T")[0])
        .order("created_at", { ascending: false });

      checkins?.forEach((checkin) => {
        const member = memberMap.get(checkin.user_id);
        if (member) {
          allNotifications.push({
            id: `checkin-${checkin.id}`,
            type: "checkin",
            member_id: member.id,
            member_user_id: member.user_id,
            member_name: member.display_name || "Onbekend",
            member_avatar: member.avatar_url,
            message: "Heeft een check-in ingevuld",
            created_at: checkin.created_at || checkin.checkin_date,
            is_read: false,
          });
        }
      });

      // 2. Fetch unread messages
      const { data: messages } = await supabase
        .from("chat_messages")
        .select("id, member_id, message, created_at")
        .eq("coach_id", coachProfile.id)
        .neq("sender_id", user.id)
        .is("read_at", null)
        .order("created_at", { ascending: false })
        .limit(20);

      messages?.forEach((msg) => {
        const member = memberIdMap.get(msg.member_id);
        if (member) {
          allNotifications.push({
            id: `message-${msg.id}`,
            type: "message",
            member_id: member.id,
            member_user_id: member.user_id,
            member_name: member.display_name || "Onbekend",
            member_avatar: member.avatar_url,
            message: msg.message.length > 50 ? msg.message.slice(0, 50) + "..." : msg.message,
            created_at: msg.created_at || new Date().toISOString(),
            is_read: false,
            data: { message_id: msg.id },
          });
        }
      });

      // 3. Fetch recent workout completions
      const { data: workouts } = await supabase
        .from("workout_completions")
        .select("id, user_id, workout_id, completion_date, completed_at")
        .in("user_id", memberUserIds)
        .gte("completion_date", threeDaysAgo.toISOString().split("T")[0])
        .order("completed_at", { ascending: false });

      workouts?.forEach((workout) => {
        const member = memberMap.get(workout.user_id);
        if (member) {
          allNotifications.push({
            id: `workout-${workout.id}`,
            type: "workout",
            member_id: member.id,
            member_user_id: member.user_id,
            member_name: member.display_name || "Onbekend",
            member_avatar: member.avatar_url,
            message: "Heeft een workout afgerond",
            created_at: workout.completed_at || workout.completion_date,
            is_read: false,
          });
        }
      });

      // 4. Generate progress alerts
      const { data: statsData } = await supabase
        .from("user_stats")
        .select("*")
        .in("user_id", memberUserIds);

      const statsMap = new Map(statsData?.map((s) => [s.user_id, s]) || []);

      // Check for recent PRs (workout sets in last 7 days)
      const { data: recentSets } = await supabase
        .from("workout_sets")
        .select("user_id, exercise_name, weight, completed_at")
        .in("user_id", memberUserIds)
        .eq("completed", true)
        .gte("completed_at", sevenDaysAgo.toISOString())
        .order("completed_at", { ascending: false });

      // Group PR detection
      const userPRs: Record<string, number> = {};
      recentSets?.forEach((set) => {
        userPRs[set.user_id] = (userPRs[set.user_id] || 0) + 1;
      });

      members.forEach((member) => {
        const stats = statsMap.get(member.user_id);
        const prCount = userPRs[member.user_id] || 0;

        // PR notification
        if (prCount > 0 && stats?.total_prs && stats.total_prs > 0) {
          allNotifications.push({
            id: `pr-${member.user_id}`,
            type: "pr",
            member_id: member.id,
            member_user_id: member.user_id,
            member_name: member.display_name || "Onbekend",
            member_avatar: member.avatar_url,
            message: `Heeft ${prCount} nieuwe PR${prCount > 1 ? "'s" : ""} gezet deze week! 💪`,
            created_at: new Date().toISOString(),
            is_read: false,
          });
        }

        // Stagnation notification
        if (stats?.last_workout_date) {
          const lastWorkout = new Date(stats.last_workout_date);
          const daysSince = Math.floor((Date.now() - lastWorkout.getTime()) / (1000 * 60 * 60 * 24));

          if (daysSince >= 7) {
            allNotifications.push({
              id: `stagnation-${member.user_id}`,
              type: "stagnation",
              member_id: member.id,
              member_user_id: member.user_id,
              member_name: member.display_name || "Onbekend",
              member_avatar: member.avatar_url,
              message: `Geen workout in ${daysSince} dagen`,
              created_at: new Date().toISOString(),
              is_read: false,
            });
          }
        }

        // Streak broken notification
        if (stats?.current_streak === 0 && stats?.longest_streak && stats.longest_streak > 3) {
          allNotifications.push({
            id: `streak-${member.user_id}`,
            type: "streak_broken",
            member_id: member.id,
            member_user_id: member.user_id,
            member_name: member.display_name || "Onbekend",
            member_avatar: member.avatar_url,
            message: `Streak verloren (was ${stats.longest_streak} dagen)`,
            created_at: new Date().toISOString(),
            is_read: false,
          });
        }

        // Milestone notification
        if (stats?.total_workouts) {
          const milestones = [10, 25, 50, 100, 250, 500];
          const reachedMilestone = milestones.find(
            (m) => stats.total_workouts >= m && stats.total_workouts < m + 5
          );

          if (reachedMilestone) {
            allNotifications.push({
              id: `milestone-${member.user_id}`,
              type: "milestone",
              member_id: member.id,
              member_user_id: member.user_id,
              member_name: member.display_name || "Onbekend",
              member_avatar: member.avatar_url,
              message: `${reachedMilestone}+ workouts bereikt! 🎉`,
              created_at: new Date().toISOString(),
              is_read: false,
            });
          }
        }
      });

      // Sort all notifications by created_at (newest first)
      allNotifications.sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

      setNotifications(allNotifications);
    } catch (error) {
      console.error("Error fetching notifications:", error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const markAsRead = (notificationId: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === notificationId ? { ...n, is_read: true } : n))
    );
  };

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
  };

  return {
    notifications,
    loading,
    coachProfileId,
    unreadCount: notifications.filter((n) => !n.is_read).length,
    refetch: fetchNotifications,
    markAsRead,
    markAllAsRead,
  };
};
