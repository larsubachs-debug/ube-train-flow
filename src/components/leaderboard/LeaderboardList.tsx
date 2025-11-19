import { useLeaderboard } from "@/hooks/useLeaderboard";
import { LeaderboardCard } from "./LeaderboardCard";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";

export const LeaderboardList = () => {
  const { leaderboard, currentUserRank, isLoading } = useLeaderboard();
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    const getCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUserId(user?.id || null);
    };
    getCurrentUser();
  }, []);

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(10)].map((_, i) => (
          <Skeleton key={i} className="h-20 w-full" />
        ))}
      </div>
    );
  }

  if (leaderboard.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-8 text-center">
        <p className="text-muted-foreground">
          No achievements unlocked yet. Be the first to earn points!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Current User Highlight (if not in top 10) */}
      {currentUserRank && currentUserRank.rank > 10 && (
        <div className="mb-6">
          <h3 className="mb-3 text-sm font-medium text-muted-foreground">Your Rank</h3>
          <LeaderboardCard entry={currentUserRank} isCurrentUser />
        </div>
      )}

      {/* Top Rankings */}
      <div className="space-y-3">
        {leaderboard.slice(0, 50).map((entry) => (
          <LeaderboardCard
            key={entry.user_id}
            entry={entry}
            isCurrentUser={entry.user_id === currentUserId}
          />
        ))}
      </div>
    </div>
  );
};