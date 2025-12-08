import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Trophy, Medal, Award, TrendingUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface LeaderboardEntry {
  user_id: string;
  display_name: string;
  avatar_url: string | null;
  max_weight: number;
  max_reps: number;
  latest_date: string;
}

interface ExerciseLeaderboardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  exerciseName: string;
}

export const ExerciseLeaderboard = ({
  open,
  onOpenChange,
  exerciseName,
}: ExerciseLeaderboardProps) => {
  const { user } = useAuth();
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && exerciseName) {
      fetchLeaderboard();
    }
  }, [open, exerciseName]);

  const fetchLeaderboard = async () => {
    setLoading(true);
    try {
      // Fetch workout sets for this exercise from all users
      const { data: setsData, error: setsError } = await supabase
        .from("workout_sets")
        .select("user_id, weight, reps, completed_at")
        .eq("exercise_name", exerciseName)
        .eq("completed", true)
        .not("weight", "is", null)
        .order("weight", { ascending: false });

      if (setsError) {
        console.error("Error fetching leaderboard:", setsError);
        return;
      }

      if (!setsData || setsData.length === 0) {
        setEntries([]);
        return;
      }

      // Get unique user IDs
      const userIds = [...new Set(setsData.map((s) => s.user_id))];

      // Fetch profiles for these users
      const { data: profilesData, error: profilesError } = await supabase
        .from("profiles")
        .select("user_id, display_name, avatar_url")
        .in("user_id", userIds);

      if (profilesError) {
        console.error("Error fetching profiles:", profilesError);
        return;
      }

      // Create a map for quick profile lookup
      const profileMap = new Map(
        profilesData?.map((p) => [p.user_id, p]) || []
      );

      // Aggregate data per user - find max weight for each user
      const userBests = new Map<string, LeaderboardEntry>();

      setsData.forEach((set) => {
        const existing = userBests.get(set.user_id);
        const profile = profileMap.get(set.user_id);

        if (!existing || (set.weight && set.weight > existing.max_weight)) {
          userBests.set(set.user_id, {
            user_id: set.user_id,
            display_name: profile?.display_name || "Anoniem",
            avatar_url: profile?.avatar_url || null,
            max_weight: set.weight || 0,
            max_reps: set.reps || 0,
            latest_date: set.completed_at || "",
          });
        }
      });

      // Convert to array and sort by max weight
      const sortedEntries = Array.from(userBests.values()).sort(
        (a, b) => b.max_weight - a.max_weight
      );

      setEntries(sortedEntries);
    } catch (error) {
      console.error("Error in fetchLeaderboard:", error);
    } finally {
      setLoading(false);
    }
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="h-5 w-5 text-yellow-500" />;
      case 2:
        return <Medal className="h-5 w-5 text-gray-400" />;
      case 3:
        return <Award className="h-5 w-5 text-amber-600" />;
      default:
        return (
          <span className="w-5 h-5 flex items-center justify-center text-sm font-medium text-muted-foreground">
            {rank}
          </span>
        );
    }
  };

  const getRankBadge = (rank: number) => {
    switch (rank) {
      case 1:
        return "bg-yellow-100 dark:bg-yellow-900/30 border-yellow-500";
      case 2:
        return "bg-gray-100 dark:bg-gray-800/30 border-gray-400";
      case 3:
        return "bg-amber-100 dark:bg-amber-900/30 border-amber-600";
      default:
        return "bg-muted/30 border-border";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Leaderboard: {exerciseName}
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="py-8 text-center text-muted-foreground">
            Laden...
          </div>
        ) : entries.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground">
            Nog geen data voor deze oefening
          </div>
        ) : (
          <div className="space-y-3 mt-4">
            {entries.map((entry, index) => {
              const rank = index + 1;
              const isCurrentUser = entry.user_id === user?.id;

              return (
                <div
                  key={entry.user_id}
                  className={`flex items-center gap-3 p-3 rounded-xl border transition-colors ${getRankBadge(rank)} ${
                    isCurrentUser ? "ring-2 ring-primary" : ""
                  }`}
                >
                  <div className="flex items-center justify-center w-8">
                    {getRankIcon(rank)}
                  </div>

                  <Avatar className="h-10 w-10">
                    <AvatarImage src={entry.avatar_url || undefined} />
                    <AvatarFallback>
                      {entry.display_name?.charAt(0).toUpperCase() || "?"}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1 min-w-0">
                    <p className="font-semibold truncate">
                      {entry.display_name}
                      {isCurrentUser && (
                        <Badge variant="outline" className="ml-2 text-xs">
                          Jij
                        </Badge>
                      )}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {entry.max_reps} reps
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="font-bold text-lg">{entry.max_weight} kg</p>
                    {rank === 1 && (
                      <Badge className="bg-yellow-500 text-white text-xs">
                        PR
                      </Badge>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
