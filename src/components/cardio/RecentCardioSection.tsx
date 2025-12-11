import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Activity, Clock, Ruler, ChevronRight, Flame } from "lucide-react";
import { useCardioActivities, useCardioStats } from "@/hooks/useCardioActivities";
import { CardioActivityCard } from "./CardioActivityCard";
import { Link } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";

export const RecentCardioSection = () => {
  const { data: activities = [], isLoading } = useCardioActivities(3);
  const { data: stats } = useCardioStats();

  const formatDistance = (meters: number) => {
    return (meters / 1000).toFixed(1);
  };

  const formatDuration = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    if (h > 0) {
      return `${h}u ${m}m`;
    }
    return `${m} min`;
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-40" />
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Activity className="h-5 w-5 text-accent" />
            Cardio Activiteiten
          </CardTitle>
          {activities.length > 0 && (
            <Button variant="ghost" size="sm" asChild>
              <Link to="/analytics" className="gap-1">
                Alles
                <ChevronRight className="h-4 w-4" />
              </Link>
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Weekly stats */}
        {stats && stats.weeklyActivities > 0 && (
          <div className="grid grid-cols-3 gap-2 p-3 bg-muted/50 rounded-lg">
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground">
                <Ruler className="h-3 w-3" />
                Week
              </div>
              <p className="text-sm font-semibold">
                {formatDistance(stats.weeklyDistance)} km
              </p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                Tijd
              </div>
              <p className="text-sm font-semibold">
                {formatDuration(stats.weeklyDuration)}
              </p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground">
                <Flame className="h-3 w-3" />
                kcal
              </div>
              <p className="text-sm font-semibold">
                {stats.monthlyCalories}
              </p>
            </div>
          </div>
        )}

        {/* Recent activities */}
        {activities.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Nog geen cardio activiteiten gelogd</p>
            <p className="text-xs mt-1">
              Log je eerste activiteit via de knop hierboven
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {activities.map((activity) => (
              <CardioActivityCard key={activity.id} activity={activity} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
