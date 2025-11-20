import { Flame } from "lucide-react";
import { Card } from "@/components/ui/card";
import { useStreak } from "@/hooks/useStreak";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";

export const StreakIndicator = () => {
  const { currentStreak, longestStreak, isActiveToday, todayProgress, loading } = useStreak();

  if (loading) {
    return (
      <Card className="p-3 bg-muted/30 border-border/40">
        <div className="flex items-center gap-3">
          <Skeleton className="w-10 h-10 rounded-full" />
          <div className="flex-1 space-y-1.5">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-3 w-32" />
          </div>
        </div>
      </Card>
    );
  }

  const progressPercentage = todayProgress.total > 0 
    ? (todayProgress.completed / todayProgress.total) * 100 
    : 0;

  return (
    <Card className="p-3 bg-muted/30 border-border/40">
      <div className="flex items-center gap-3">
        {/* Streak flame icon - smaller */}
        <div className="relative">
          <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
            <Flame className={`w-5 h-5 text-muted-foreground ${currentStreak > 0 ? 'text-orange-500' : ''}`} />
          </div>
        </div>

        {/* Streak info */}
        <div className="flex-1">
          <div className="flex items-baseline gap-1.5">
            <h3 className="text-xl font-bold text-foreground">
              {currentStreak}
            </h3>
            <span className="text-xs text-muted-foreground">
              {currentStreak === 1 ? 'dag' : 'dagen'} streak
            </span>
          </div>
          
          {/* Today's progress */}
          {todayProgress.total > 0 && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
              <span>Vandaag: {todayProgress.completed}/{todayProgress.total}</span>
              <Progress 
                value={progressPercentage} 
                className="h-1 flex-1 max-w-[60px]"
              />
            </div>
          )}
        </div>

        {/* Longest streak badge - smaller */}
        {longestStreak > 0 && (
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Beste</p>
            <p className="text-sm font-semibold text-foreground/60">
              {longestStreak}
            </p>
          </div>
        )}
      </div>
    </Card>
  );
};
