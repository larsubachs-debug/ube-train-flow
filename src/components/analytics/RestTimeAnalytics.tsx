import { useState, useEffect, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { format, subDays, differenceInSeconds } from "date-fns";
import { nl } from "date-fns/locale";
import { Clock, TrendingUp, AlertTriangle } from "lucide-react";

interface RestTimeAnalyticsProps {
  daysToShow?: number;
}

export const RestTimeAnalytics = ({ daysToShow = 30 }: RestTimeAnalyticsProps) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [workoutData, setWorkoutData] = useState<any[]>([]);

  useEffect(() => {
    const fetchWorkoutData = async () => {
      if (!user) return;

      const startDate = format(subDays(new Date(), daysToShow), "yyyy-MM-dd");
      
      const { data, error } = await supabase
        .from("workout_sets")
        .select("exercise_name, completed_at, set_number")
        .eq("user_id", user.id)
        .gte("completed_at", startDate)
        .order("completed_at", { ascending: true });

      if (!error && data) {
        setWorkoutData(data);
      }
      setLoading(false);
    };

    fetchWorkoutData();
  }, [user, daysToShow]);

  const restTimeData = useMemo(() => {
    // Group sets by exercise
    const exerciseSets: Record<string, Date[]> = {};
    
    workoutData.forEach((set) => {
      const exercise = set.exercise_name;
      if (!exerciseSets[exercise]) {
        exerciseSets[exercise] = [];
      }
      exerciseSets[exercise].push(new Date(set.completed_at));
    });

    // Calculate rest times between consecutive sets
    const restTimes: number[] = [];
    const restTimesByExercise: Record<string, number[]> = {};

    Object.entries(exerciseSets).forEach(([exercise, sets]) => {
      sets.sort((a, b) => a.getTime() - b.getTime());
      restTimesByExercise[exercise] = [];
      
      for (let i = 1; i < sets.length; i++) {
        const restTime = differenceInSeconds(sets[i], sets[i - 1]);
        // Only count rest times between 30 seconds and 10 minutes (reasonable range)
        if (restTime >= 30 && restTime <= 600) {
          restTimes.push(restTime);
          restTimesByExercise[exercise].push(restTime);
        }
      }
    });

    // Create distribution chart data
    const distribution = [
      { range: "30-60s", count: 0, color: "#22c55e" },
      { range: "60-90s", count: 0, color: "#84cc16" },
      { range: "90-120s", count: 0, color: "#eab308" },
      { range: "120-180s", count: 0, color: "#f97316" },
      { range: "180s+", count: 0, color: "#ef4444" },
    ];

    restTimes.forEach((time) => {
      if (time < 60) distribution[0].count++;
      else if (time < 90) distribution[1].count++;
      else if (time < 120) distribution[2].count++;
      else if (time < 180) distribution[3].count++;
      else distribution[4].count++;
    });

    // Calculate averages per exercise
    const exerciseAverages = Object.entries(restTimesByExercise)
      .map(([exercise, times]) => ({
        exercise,
        avgRest: times.length > 0 
          ? Math.round(times.reduce((a, b) => a + b, 0) / times.length)
          : 0,
        count: times.length,
      }))
      .filter((e) => e.count >= 3) // Only show exercises with at least 3 rest periods
      .sort((a, b) => b.avgRest - a.avgRest)
      .slice(0, 5);

    // Overall stats
    const avgRestTime = restTimes.length > 0
      ? Math.round(restTimes.reduce((a, b) => a + b, 0) / restTimes.length)
      : 0;
    
    const consistency = restTimes.length > 0
      ? Math.round(
          100 - (Math.sqrt(
            restTimes.reduce((sum, time) => sum + Math.pow(time - avgRestTime, 2), 0) / restTimes.length
          ) / avgRestTime) * 100
        )
      : 0;

    return {
      distribution,
      exerciseAverages,
      avgRestTime,
      consistency: Math.max(0, Math.min(100, consistency)),
      totalSets: restTimes.length,
    };
  }, [workoutData]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
  };

  if (loading) {
    return (
      <Card className="p-6">
        <Skeleton className="h-8 w-48 mb-4" />
        <Skeleton className="h-[250px] w-full" />
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold">Rest Time Analytics</h3>
          <p className="text-sm text-muted-foreground">
            Analyse van rusttijden tussen sets
          </p>
        </div>
        <Badge variant="outline">Laatste {daysToShow} dagen</Badge>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-muted/30 rounded-lg p-4 text-center">
          <Clock className="h-5 w-5 mx-auto mb-2 text-primary" />
          <p className="text-2xl font-bold">{formatTime(restTimeData.avgRestTime)}</p>
          <p className="text-xs text-muted-foreground">Gemiddelde rust</p>
        </div>
        <div className="bg-muted/30 rounded-lg p-4 text-center">
          <TrendingUp className="h-5 w-5 mx-auto mb-2 text-emerald-500" />
          <p className="text-2xl font-bold">{restTimeData.consistency}%</p>
          <p className="text-xs text-muted-foreground">Consistentie</p>
        </div>
        <div className="bg-muted/30 rounded-lg p-4 text-center">
          <AlertTriangle className="h-5 w-5 mx-auto mb-2 text-amber-500" />
          <p className="text-2xl font-bold">{restTimeData.totalSets}</p>
          <p className="text-xs text-muted-foreground">Gemeten sets</p>
        </div>
      </div>

      {/* Distribution Chart */}
      <div className="mb-6">
        <h4 className="text-sm font-medium mb-3">Rusttijd Distributie</h4>
        <div className="h-[180px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={restTimeData.distribution}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis 
                dataKey="range" 
                tick={{ fontSize: 11 }}
                className="text-muted-foreground"
              />
              <YAxis 
                tick={{ fontSize: 11 }}
                className="text-muted-foreground"
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--background))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                }}
                formatter={(value: number) => [`${value} sets`, "Aantal"]}
              />
              <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                {restTimeData.distribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Per Exercise Breakdown */}
      {restTimeData.exerciseAverages.length > 0 && (
        <div>
          <h4 className="text-sm font-medium mb-3">Gemiddelde per oefening</h4>
          <div className="space-y-2">
            {restTimeData.exerciseAverages.map((exercise) => (
              <div
                key={exercise.exercise}
                className="flex items-center justify-between p-2 bg-muted/20 rounded-lg"
              >
                <span className="text-sm font-medium truncate max-w-[60%]">
                  {exercise.exercise}
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">
                    {exercise.count} sets
                  </span>
                  <Badge
                    variant="secondary"
                    className={`${
                      exercise.avgRest < 90
                        ? "bg-emerald-100 text-emerald-700"
                        : exercise.avgRest < 150
                        ? "bg-amber-100 text-amber-700"
                        : "bg-red-100 text-red-700"
                    }`}
                  >
                    {formatTime(exercise.avgRest)}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {restTimeData.totalSets === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <Clock className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <p>Nog geen rusttijd data beschikbaar</p>
          <p className="text-sm">Complete workouts om analytics te zien</p>
        </div>
      )}
    </Card>
  );
};
