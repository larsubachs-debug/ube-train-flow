import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface LeaderboardEntry {
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
  total_points: number;
  unlocked_count: number;
  rank: number;
}

export const useLeaderboard = () => {
  const { data: leaderboard = [], isLoading } = useQuery({
    queryKey: ["leaderboard"],
    queryFn: async () => {
      // Get all users with their achievements
      const { data: userAchievements, error } = await supabase
        .from("user_achievements")
        .select(`
          user_id,
          is_unlocked,
          achievements (
            points
          )
        `);

      if (error) throw error;

      // Get all profiles
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("user_id, display_name, avatar_url");

      if (profilesError) throw profilesError;

      // Group by user and calculate total points
      const userPoints = new Map<string, { points: number; count: number }>();

      userAchievements?.forEach((ua: any) => {
        if (ua.is_unlocked) {
          const current = userPoints.get(ua.user_id) || { points: 0, count: 0 };
          userPoints.set(ua.user_id, {
            points: current.points + (ua.achievements?.points || 0),
            count: current.count + 1,
          });
        }
      });

      // Create leaderboard entries
      const entries: Omit<LeaderboardEntry, "rank">[] = [];

      userPoints.forEach((data, userId) => {
        const profile = profiles?.find((p) => p.user_id === userId);
        entries.push({
          user_id: userId,
          display_name: profile?.display_name || "Anonymous",
          avatar_url: profile?.avatar_url || null,
          total_points: data.points,
          unlocked_count: data.count,
        });
      });

      // Sort by points and add rank
      entries.sort((a, b) => b.total_points - a.total_points);

      const leaderboard: LeaderboardEntry[] = entries.map((entry, index) => ({
        ...entry,
        rank: index + 1,
      }));

      return leaderboard;
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const { data: currentUserRank } = useQuery({
    queryKey: ["currentUserRank", leaderboard],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const userEntry = leaderboard.find((entry) => entry.user_id === user.id);
      return userEntry || null;
    },
    enabled: leaderboard.length > 0,
  });

  return {
    leaderboard,
    currentUserRank,
    isLoading,
  };
};