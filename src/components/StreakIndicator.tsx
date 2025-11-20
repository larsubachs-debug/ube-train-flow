import { Flame } from "lucide-react";
import { Card } from "@/components/ui/card";
import { useStreak } from "@/hooks/useStreak";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";

export const StreakIndicator = () => {
  const { currentStreak, longestStreak, isActiveToday, todayProgress, loading } = useStreak();

  if (loading) {
    return (
      <Card className="p-4 bg-gradient-to-br from-ube-orange/10 to-ube-orange/5 border-ube-orange/20">
        <div className="flex items-center gap-4">
          <Skeleton className="w-16 h-16 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-6 w-20" />
          </div>
        </div>
      </Card>
    );
  }

  const progressPercentage = todayProgress.total > 0 
    ? (todayProgress.completed / todayProgress.total) * 100 
    : 0;

  return (
    <Card className="p-4 bg-gradient-to-br from-ube-orange/10 to-ube-orange/5 border-ube-orange/20 relative overflow-hidden">
      {/* Background flame effect */}
      <div className="absolute -right-6 -top-6 opacity-5">
        <Flame className="w-32 h-32" />
      </div>

      <div className="flex items-center gap-4 relative z-10">
        {/* Streak flame icon */}
        <div className={`relative ${currentStreak > 0 ? 'animate-pulse' : ''}`}>
          <div className="absolute inset-0 bg-ube-orange/20 blur-xl rounded-full" />
          <div className="relative w-16 h-16 rounded-full bg-gradient-to-br from-ube-orange to-ube-orange/70 flex items-center justify-center">
            <Flame className={`w-8 h-8 text-white ${currentStreak > 0 ? 'animate-pulse' : ''}`} />
          </div>
        </div>

        {/* Streak info */}
        <div className="flex-1">
          <div className="flex items-baseline gap-2">
            <h3 className="text-3xl font-bold text-ube-orange drop-shadow-sm">
              {currentStreak}
            </h3>
            <span className="text-sm text-muted-foreground">
              {currentStreak === 1 ? 'dag' : 'dagen'}
            </span>
          </div>
          
          {/* Today's progress */}
          {todayProgress.total > 0 && (
            <div className="mt-2">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-muted-foreground">Vandaag</span>
                <span className="font-medium text-foreground">
                  {todayProgress.completed}/{todayProgress.total}
                </span>
              </div>
              <Progress 
                value={progressPercentage} 
                className="h-1.5"
              />
            </div>
          )}
          
          {todayProgress.total === 0 && (
            <p className="text-sm text-muted-foreground mt-1">
              {currentStreak > 0 ? (
                <span className="text-ube-orange/80">Rusdag - streak blijft staan</span>
              ) : (
                <span>Geen planning vandaag</span>
              )}
            </p>
          )}
        </div>

        {/* Longest streak badge */}
        {longestStreak > 0 && (
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Beste</p>
            <p className="text-lg font-bold text-ube-orange/60">
              {longestStreak}
            </p>
          </div>
        )}
      </div>

      {/* Motivational messages */}
      {todayProgress.total > 0 && !isActiveToday && (
        <div className="mt-3 pt-3 border-t border-ube-orange/10">
          <p className="text-xs text-muted-foreground">
            💪 Voltooi alle {todayProgress.total} geplande items om je streak te behouden
          </p>
        </div>
      )}

      {isActiveToday && currentStreak % 7 === 0 && currentStreak > 0 && (
        <div className="mt-3 pt-3 border-t border-ube-orange/10">
          <p className="text-xs font-medium text-ube-orange">
            🎉 {currentStreak} dagen perfecte streak - ongelooflijk!
          </p>
        </div>
      )}
      
      {currentStreak === 0 && todayProgress.total > 0 && (
        <div className="mt-3 pt-3 border-t border-ube-orange/10">
          <p className="text-xs text-muted-foreground">
            🔥 Voltooi alles vandaag om je streak te starten
          </p>
        </div>
      )}
    </Card>
  );
};
