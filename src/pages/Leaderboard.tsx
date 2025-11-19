import { Trophy, TrendingUp } from "lucide-react";
import { LeaderboardList } from "@/components/leaderboard/LeaderboardList";
import { useLeaderboard } from "@/hooks/useLeaderboard";
import { Card } from "@/components/ui/card";

const Leaderboard = () => {
  const { leaderboard, currentUserRank } = useLeaderboard();

  const totalPoints = leaderboard.reduce((sum, entry) => sum + entry.total_points, 0);
  const avgPoints = leaderboard.length > 0 ? Math.round(totalPoints / leaderboard.length) : 0;

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <Trophy className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Leaderboard</h1>
              <p className="text-sm text-muted-foreground">
                See who's crushing their fitness goals
              </p>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-3">
          <Card className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Trophy className="h-4 w-4" />
              <span className="text-sm">Your Rank</span>
            </div>
            <p className="mt-2 text-2xl font-bold text-foreground">
              {currentUserRank ? `#${currentUserRank.rank}` : "-"}
            </p>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground">
              <TrendingUp className="h-4 w-4" />
              <span className="text-sm">Your Points</span>
            </div>
            <p className="mt-2 text-2xl font-bold text-foreground">
              {currentUserRank?.total_points || 0}
            </p>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground">
              <TrendingUp className="h-4 w-4" />
              <span className="text-sm">Avg Points</span>
            </div>
            <p className="mt-2 text-2xl font-bold text-foreground">{avgPoints}</p>
          </Card>
        </div>

        {/* Leaderboard List */}
        <LeaderboardList />
      </div>
    </div>
  );
};

export default Leaderboard;