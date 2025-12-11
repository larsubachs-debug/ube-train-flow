import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trophy, Ruler, Clock, Flame, Medal } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface LeaderboardEntry {
  user_id: string;
  display_name: string;
  avatar_url: string | null;
  total_distance: number;
  total_duration: number;
  total_activities: number;
}

export const CardioLeaderboard = () => {
  const { user } = useAuth();

  // Fetch leaderboard data
  const { data: leaderboard = [], isLoading } = useQuery({
    queryKey: ["cardio-leaderboard"],
    queryFn: async () => {
      // Get public cardio activities with user profiles
      const { data: activities, error } = await supabase
        .from("cardio_activities" as any)
        .select("user_id, distance_meters, duration_seconds")
        .eq("is_public", true);

      if (error) throw error;

      // Get unique user IDs
      const userIds = [...new Set((activities || []).map((a: any) => a.user_id))];

      if (userIds.length === 0) return [];

      // Get profiles for these users
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, display_name, avatar_url")
        .in("user_id", userIds);

      // Aggregate by user
      const aggregated: Record<string, LeaderboardEntry> = {};

      (activities || []).forEach((activity: any) => {
        if (!aggregated[activity.user_id]) {
          const profile = profiles?.find((p) => p.user_id === activity.user_id);
          aggregated[activity.user_id] = {
            user_id: activity.user_id,
            display_name: profile?.display_name || "Anoniem",
            avatar_url: profile?.avatar_url || null,
            total_distance: 0,
            total_duration: 0,
            total_activities: 0,
          };
        }
        aggregated[activity.user_id].total_distance += activity.distance_meters || 0;
        aggregated[activity.user_id].total_duration += activity.duration_seconds || 0;
        aggregated[activity.user_id].total_activities += 1;
      });

      return Object.values(aggregated);
    },
  });

  const formatDistance = (meters: number) => {
    return (meters / 1000).toFixed(1);
  };

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    if (hours > 0) return `${hours}u ${mins}m`;
    return `${mins} min`;
  };

  const getMedalColor = (index: number) => {
    if (index === 0) return "text-yellow-500";
    if (index === 1) return "text-gray-400";
    if (index === 2) return "text-amber-600";
    return "text-muted-foreground";
  };

  const renderLeaderboard = (
    sortedData: LeaderboardEntry[],
    getValue: (entry: LeaderboardEntry) => string,
    unit: string
  ) => {
    if (isLoading) {
      return (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-14 w-full" />
          ))}
        </div>
      );
    }

    if (sortedData.length === 0) {
      return (
        <div className="text-center py-6 text-muted-foreground">
          <Trophy className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">Nog geen publieke activiteiten</p>
          <p className="text-xs mt-1">
            Deel je activiteiten om op het leaderboard te verschijnen
          </p>
        </div>
      );
    }

    return (
      <div className="space-y-2">
        {sortedData.slice(0, 10).map((entry, index) => (
          <div
            key={entry.user_id}
            className={`flex items-center gap-3 p-3 rounded-lg ${
              entry.user_id === user?.id ? "bg-accent/10 border border-accent/20" : "bg-muted/50"
            }`}
          >
            <div className="w-6 text-center">
              {index < 3 ? (
                <Medal className={`h-5 w-5 ${getMedalColor(index)}`} />
              ) : (
                <span className="text-sm text-muted-foreground">{index + 1}</span>
              )}
            </div>
            <Avatar className="h-8 w-8">
              <AvatarImage src={entry.avatar_url || undefined} />
              <AvatarFallback className="text-xs">
                {entry.display_name?.charAt(0).toUpperCase() || "?"}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">
                {entry.display_name}
                {entry.user_id === user?.id && (
                  <Badge variant="secondary" className="ml-2 text-xs">
                    Jij
                  </Badge>
                )}
              </p>
              <p className="text-xs text-muted-foreground">
                {entry.total_activities} activiteiten
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm font-bold">{getValue(entry)}</p>
              <p className="text-xs text-muted-foreground">{unit}</p>
            </div>
          </div>
        ))}
      </div>
    );
  };

  const byDistance = [...leaderboard].sort((a, b) => b.total_distance - a.total_distance);
  const byDuration = [...leaderboard].sort((a, b) => b.total_duration - a.total_duration);
  const byActivities = [...leaderboard].sort((a, b) => b.total_activities - a.total_activities);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Trophy className="h-5 w-5 text-accent" />
          Cardio Leaderboard
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="distance" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-4">
            <TabsTrigger value="distance" className="text-xs gap-1">
              <Ruler className="h-3 w-3" />
              Afstand
            </TabsTrigger>
            <TabsTrigger value="duration" className="text-xs gap-1">
              <Clock className="h-3 w-3" />
              Tijd
            </TabsTrigger>
            <TabsTrigger value="activities" className="text-xs gap-1">
              <Flame className="h-3 w-3" />
              Aantal
            </TabsTrigger>
          </TabsList>

          <TabsContent value="distance">
            {renderLeaderboard(byDistance, (e) => formatDistance(e.total_distance), "km")}
          </TabsContent>

          <TabsContent value="duration">
            {renderLeaderboard(byDuration, (e) => formatDuration(e.total_duration), "")}
          </TabsContent>

          <TabsContent value="activities">
            {renderLeaderboard(byActivities, (e) => e.total_activities.toString(), "activiteiten")}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};
