import { useState, useEffect, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { format, subWeeks, startOfWeek, endOfWeek } from "date-fns";
import { nl } from "date-fns/locale";
import { TrendingUp, TrendingDown } from "lucide-react";

// Same mapping as MuscleHeatmap
const EXERCISE_MUSCLE_MAP: Record<string, string[]> = {
  "bench press": ["chest", "triceps", "shoulders"],
  "incline bench press": ["chest", "triceps", "shoulders"],
  "dumbbell press": ["chest", "triceps", "shoulders"],
  "deadlift": ["back", "glutes", "hamstrings"],
  "pull-up": ["back", "biceps"],
  "lat pulldown": ["back", "biceps"],
  "barbell row": ["back", "biceps"],
  "overhead press": ["shoulders", "triceps"],
  "squat": ["quads", "glutes", "hamstrings"],
  "back squat": ["quads", "glutes", "hamstrings"],
  "front squat": ["quads", "core"],
  "leg press": ["quads", "glutes"],
  "romanian deadlift": ["hamstrings", "glutes", "back"],
  "hip thrust": ["glutes", "hamstrings"],
  "bicep curl": ["biceps"],
  "tricep extension": ["triceps"],
};

const MUSCLE_COLORS: Record<string, string> = {
  chest: "#ef4444",
  back: "#3b82f6",
  shoulders: "#a855f7",
  biceps: "#22c55e",
  triceps: "#eab308",
  quads: "#f97316",
  hamstrings: "#ec4899",
  glutes: "#6366f1",
  calves: "#14b8a6",
  core: "#06b6d4",
};

const MUSCLE_OPTIONS = [
  { value: "all", label: "Alle spiergroepen" },
  { value: "chest", label: "Borst" },
  { value: "back", label: "Rug" },
  { value: "shoulders", label: "Schouders" },
  { value: "biceps", label: "Biceps" },
  { value: "triceps", label: "Triceps" },
  { value: "quads", label: "Quadriceps" },
  { value: "hamstrings", label: "Hamstrings" },
  { value: "glutes", label: "Bilspieren" },
];

interface VolumeTrackingChartProps {
  weeksToShow?: number;
}

export const VolumeTrackingChart = ({ weeksToShow = 8 }: VolumeTrackingChartProps) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [workoutData, setWorkoutData] = useState<any[]>([]);
  const [selectedMuscle, setSelectedMuscle] = useState("all");

  useEffect(() => {
    const fetchWorkoutData = async () => {
      if (!user) return;

      const startDate = format(subWeeks(new Date(), weeksToShow), "yyyy-MM-dd");
      
      const { data, error } = await supabase
        .from("workout_sets")
        .select("exercise_name, weight, reps, completed_at")
        .eq("user_id", user.id)
        .gte("completed_at", startDate)
        .order("completed_at", { ascending: true });

      if (!error && data) {
        setWorkoutData(data);
      }
      setLoading(false);
    };

    fetchWorkoutData();
  }, [user, weeksToShow]);

  const chartData = useMemo(() => {
    const weeks: { start: Date; end: Date; label: string }[] = [];
    for (let i = weeksToShow - 1; i >= 0; i--) {
      const weekStart = startOfWeek(subWeeks(new Date(), i), { weekStartsOn: 1 });
      const weekEnd = endOfWeek(subWeeks(new Date(), i), { weekStartsOn: 1 });
      weeks.push({
        start: weekStart,
        end: weekEnd,
        label: format(weekStart, "d MMM", { locale: nl }),
      });
    }

    const data = weeks.map((week) => {
      const weekData: Record<string, any> = { week: week.label };
      
      Object.keys(MUSCLE_COLORS).forEach((muscle) => {
        weekData[muscle] = 0;
      });

      workoutData.forEach((set) => {
        const completedAt = new Date(set.completed_at);
        if (completedAt >= week.start && completedAt <= week.end) {
          const exerciseName = set.exercise_name?.toLowerCase() || "";
          const volume = (set.weight || 0) * (set.reps || 0);

          for (const [exercise, muscles] of Object.entries(EXERCISE_MUSCLE_MAP)) {
            if (exerciseName.includes(exercise)) {
              muscles.forEach((muscle) => {
                weekData[muscle] = (weekData[muscle] || 0) + volume;
              });
              break;
            }
          }
        }
      });

      // Calculate total
      weekData.total = Object.keys(MUSCLE_COLORS).reduce(
        (sum, muscle) => sum + (weekData[muscle] || 0),
        0
      );

      return weekData;
    });

    return data;
  }, [workoutData, weeksToShow]);

  // Calculate trend
  const trend = useMemo(() => {
    if (chartData.length < 2) return { value: 0, isPositive: true };
    
    const key = selectedMuscle === "all" ? "total" : selectedMuscle;
    const lastWeek = chartData[chartData.length - 1]?.[key] || 0;
    const previousWeek = chartData[chartData.length - 2]?.[key] || 0;
    
    if (previousWeek === 0) return { value: 0, isPositive: true };
    
    const change = ((lastWeek - previousWeek) / previousWeek) * 100;
    return { value: Math.abs(change), isPositive: change >= 0 };
  }, [chartData, selectedMuscle]);

  if (loading) {
    return (
      <Card className="p-6">
        <Skeleton className="h-8 w-48 mb-4" />
        <Skeleton className="h-[300px] w-full" />
      </Card>
    );
  }

  const displayMuscles = selectedMuscle === "all" 
    ? Object.keys(MUSCLE_COLORS).slice(0, 5) // Show top 5 for readability
    : [selectedMuscle];

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold">Volume Tracking</h3>
          <p className="text-sm text-muted-foreground">
            Totaal volume per spiergroep over tijd
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={selectedMuscle} onValueChange={setSelectedMuscle}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {MUSCLE_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Badge
            variant={trend.isPositive ? "default" : "destructive"}
            className={`flex items-center gap-1 ${
              trend.isPositive 
                ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300" 
                : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300"
            }`}
          >
            {trend.isPositive ? (
              <TrendingUp className="h-3 w-3" />
            ) : (
              <TrendingDown className="h-3 w-3" />
            )}
            {trend.value.toFixed(1)}%
          </Badge>
        </div>
      </div>

      <div className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData}>
            <defs>
              {displayMuscles.map((muscle) => (
                <linearGradient key={muscle} id={`color${muscle}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={MUSCLE_COLORS[muscle]} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={MUSCLE_COLORS[muscle]} stopOpacity={0} />
                </linearGradient>
              ))}
            </defs>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis 
              dataKey="week" 
              tick={{ fontSize: 12 }}
              className="text-muted-foreground"
            />
            <YAxis 
              tick={{ fontSize: 12 }}
              tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
              className="text-muted-foreground"
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--background))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "8px",
              }}
              formatter={(value: number, name: string) => [
                `${Math.round(value).toLocaleString()} kg`,
                MUSCLE_OPTIONS.find((m) => m.value === name)?.label || name,
              ]}
            />
            <Legend />
            {displayMuscles.map((muscle) => (
              <Area
                key={muscle}
                type="monotone"
                dataKey={muscle}
                name={MUSCLE_OPTIONS.find((m) => m.value === muscle)?.label || muscle}
                stroke={MUSCLE_COLORS[muscle]}
                fillOpacity={1}
                fill={`url(#color${muscle})`}
                strokeWidth={2}
              />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
};
