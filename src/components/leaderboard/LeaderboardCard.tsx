import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { Trophy, Medal, Award, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import type { LeaderboardEntry } from "@/hooks/useLeaderboard";

interface LeaderboardCardProps {
  entry: LeaderboardEntry;
  isCurrentUser?: boolean;
}

const getRankIcon = (rank: number) => {
  switch (rank) {
    case 1:
      return <Trophy className="h-6 w-6 text-amber-500" />;
    case 2:
      return <Medal className="h-6 w-6 text-slate-400" />;
    case 3:
      return <Award className="h-6 w-6 text-orange-600" />;
    default:
      return null;
  }
};

const getRankColor = (rank: number) => {
  switch (rank) {
    case 1:
      return "from-amber-500/20 to-yellow-500/20 border-amber-500/50";
    case 2:
      return "from-slate-400/20 to-gray-400/20 border-slate-400/50";
    case 3:
      return "from-orange-600/20 to-amber-600/20 border-orange-600/50";
    default:
      return "";
  }
};

export const LeaderboardCard = ({ entry, isCurrentUser }: LeaderboardCardProps) => {
  const rankIcon = getRankIcon(entry.rank);
  const rankColor = getRankColor(entry.rank);

  return (
    <Card
      className={cn(
        "p-4 transition-all hover:shadow-lg",
        isCurrentUser && "border-2 border-primary shadow-md",
        entry.rank <= 3 && `bg-gradient-to-r ${rankColor}`
      )}
    >
      <div className="flex items-center gap-4">
        {/* Rank */}
        <div className="flex w-12 flex-col items-center">
          {rankIcon ? (
            rankIcon
          ) : (
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-sm font-bold text-muted-foreground">
              {entry.rank}
            </div>
          )}
        </div>

        {/* Avatar */}
        <Avatar className="h-12 w-12">
          <AvatarImage src={entry.avatar_url || undefined} alt={entry.display_name || "User"} />
          <AvatarFallback className="bg-primary/10 text-primary">
            {(entry.display_name || "?").charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>

        {/* User Info */}
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-foreground">
              {entry.display_name || "Anonymous"}
            </h3>
            {isCurrentUser && (
              <span className="rounded-full bg-primary px-2 py-0.5 text-xs font-medium text-primary-foreground">
                You
              </span>
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            {entry.unlocked_count} achievement{entry.unlocked_count !== 1 ? "s" : ""} unlocked
          </p>
        </div>

        {/* Points */}
        <div className="flex flex-col items-end gap-1">
          <div className="flex items-center gap-1">
            <Star className="h-4 w-4 text-amber-500" />
            <span className="text-xl font-bold text-foreground">{entry.total_points}</span>
          </div>
          <span className="text-xs text-muted-foreground">points</span>
        </div>
      </div>
    </Card>
  );
};