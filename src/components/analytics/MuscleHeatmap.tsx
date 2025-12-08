import { useState, useEffect, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Skeleton } from "@/components/ui/skeleton";
import { format, startOfWeek, endOfWeek, subWeeks } from "date-fns";
import { nl } from "date-fns/locale";

// Muscle group mapping for common exercises
const EXERCISE_MUSCLE_MAP: Record<string, string[]> = {
  // Chest
  "bench press": ["chest", "triceps", "shoulders"],
  "incline bench press": ["chest", "triceps", "shoulders"],
  "dumbbell press": ["chest", "triceps", "shoulders"],
  "chest fly": ["chest"],
  "push-up": ["chest", "triceps", "shoulders"],
  
  // Back
  "deadlift": ["back", "glutes", "hamstrings"],
  "pull-up": ["back", "biceps"],
  "lat pulldown": ["back", "biceps"],
  "barbell row": ["back", "biceps"],
  "dumbbell row": ["back", "biceps"],
  "cable row": ["back", "biceps"],
  
  // Shoulders
  "overhead press": ["shoulders", "triceps"],
  "military press": ["shoulders", "triceps"],
  "lateral raise": ["shoulders"],
  "front raise": ["shoulders"],
  "face pull": ["shoulders", "back"],
  
  // Arms
  "bicep curl": ["biceps"],
  "hammer curl": ["biceps"],
  "tricep extension": ["triceps"],
  "tricep pushdown": ["triceps"],
  "skull crusher": ["triceps"],
  
  // Legs
  "squat": ["quads", "glutes", "hamstrings"],
  "back squat": ["quads", "glutes", "hamstrings"],
  "front squat": ["quads", "core"],
  "leg press": ["quads", "glutes"],
  "leg extension": ["quads"],
  "leg curl": ["hamstrings"],
  "romanian deadlift": ["hamstrings", "glutes", "back"],
  "hip thrust": ["glutes", "hamstrings"],
  "lunge": ["quads", "glutes"],
  "calf raise": ["calves"],
  
  // Core
  "plank": ["core"],
  "crunch": ["core"],
  "russian twist": ["core"],
  "ab wheel": ["core"],
};

const MUSCLE_GROUPS = [
  { id: "chest", label: "Borst", color: "bg-red-500" },
  { id: "back", label: "Rug", color: "bg-blue-500" },
  { id: "shoulders", label: "Schouders", color: "bg-purple-500" },
  { id: "biceps", label: "Biceps", color: "bg-green-500" },
  { id: "triceps", label: "Triceps", color: "bg-yellow-500" },
  { id: "quads", label: "Quadriceps", color: "bg-orange-500" },
  { id: "hamstrings", label: "Hamstrings", color: "bg-pink-500" },
  { id: "glutes", label: "Bilspieren", color: "bg-indigo-500" },
  { id: "calves", label: "Kuiten", color: "bg-teal-500" },
  { id: "core", label: "Core", color: "bg-cyan-500" },
];

interface MuscleHeatmapProps {
  weeksToShow?: number;
}

export const MuscleHeatmap = ({ weeksToShow = 4 }: MuscleHeatmapProps) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [workoutData, setWorkoutData] = useState<any[]>([]);

  useEffect(() => {
    const fetchWorkoutData = async () => {
      if (!user) return;

      const startDate = format(subWeeks(new Date(), weeksToShow), "yyyy-MM-dd");
      
      const { data, error } = await supabase
        .from("workout_sets")
        .select("exercise_name, weight, reps, completed_at")
        .eq("user_id", user.id)
        .gte("completed_at", startDate)
        .order("completed_at", { ascending: false });

      if (!error && data) {
        setWorkoutData(data);
      }
      setLoading(false);
    };

    fetchWorkoutData();
  }, [user, weeksToShow]);

  // Calculate volume per muscle group per week
  const heatmapData = useMemo(() => {
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

    const muscleVolume: Record<string, Record<string, number>> = {};
    
    MUSCLE_GROUPS.forEach((mg) => {
      muscleVolume[mg.id] = {};
      weeks.forEach((week) => {
        muscleVolume[mg.id][week.label] = 0;
      });
    });

    workoutData.forEach((set) => {
      const exerciseName = set.exercise_name?.toLowerCase() || "";
      const completedAt = new Date(set.completed_at);
      const volume = (set.weight || 0) * (set.reps || 0);

      // Find which muscles this exercise targets
      let targetMuscles: string[] = [];
      for (const [exercise, muscles] of Object.entries(EXERCISE_MUSCLE_MAP)) {
        if (exerciseName.includes(exercise)) {
          targetMuscles = muscles;
          break;
        }
      }

      // Find which week this set belongs to
      const weekLabel = weeks.find(
        (w) => completedAt >= w.start && completedAt <= w.end
      )?.label;

      if (weekLabel && targetMuscles.length > 0) {
        targetMuscles.forEach((muscle) => {
          if (muscleVolume[muscle]) {
            muscleVolume[muscle][weekLabel] += volume;
          }
        });
      }
    });

    return { weeks, muscleVolume };
  }, [workoutData, weeksToShow]);

  // Calculate max volume for color intensity
  const maxVolume = useMemo(() => {
    let max = 0;
    Object.values(heatmapData.muscleVolume).forEach((weekData) => {
      Object.values(weekData).forEach((vol) => {
        if (vol > max) max = vol;
      });
    });
    return max || 1;
  }, [heatmapData]);

  const getIntensityClass = (volume: number) => {
    const intensity = volume / maxVolume;
    if (intensity === 0) return "bg-muted/30";
    if (intensity < 0.25) return "bg-primary/20";
    if (intensity < 0.5) return "bg-primary/40";
    if (intensity < 0.75) return "bg-primary/60";
    return "bg-primary/90";
  };

  if (loading) {
    return (
      <Card className="p-6">
        <Skeleton className="h-8 w-48 mb-4" />
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-8 w-full" />
          ))}
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold">Spiergroep Heatmap</h3>
          <p className="text-sm text-muted-foreground">
            Volume per spiergroep per week
          </p>
        </div>
        <Badge variant="outline">Laatste {weeksToShow} weken</Badge>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr>
              <th className="text-left text-sm font-medium text-muted-foreground pb-3 pr-4">
                Spiergroep
              </th>
              {heatmapData.weeks.map((week) => (
                <th
                  key={week.label}
                  className="text-center text-xs font-medium text-muted-foreground pb-3 px-2"
                >
                  {week.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {MUSCLE_GROUPS.map((muscle) => (
              <tr key={muscle.id}>
                <td className="py-1 pr-4">
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${muscle.color}`} />
                    <span className="text-sm font-medium">{muscle.label}</span>
                  </div>
                </td>
                {heatmapData.weeks.map((week) => {
                  const volume = heatmapData.muscleVolume[muscle.id]?.[week.label] || 0;
                  return (
                    <td key={week.label} className="py-1 px-1">
                      <div
                        className={`w-full h-8 rounded flex items-center justify-center text-xs font-medium transition-colors ${getIntensityClass(
                          volume
                        )} ${volume > 0 ? "text-primary-foreground" : "text-muted-foreground"}`}
                        title={`${muscle.label}: ${Math.round(volume).toLocaleString()}kg`}
                      >
                        {volume > 0 ? `${Math.round(volume / 1000)}k` : "-"}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Legend */}
      <div className="mt-6 flex items-center justify-center gap-2">
        <span className="text-xs text-muted-foreground">Minder</span>
        <div className="flex gap-1">
          <div className="w-6 h-4 rounded bg-muted/30" />
          <div className="w-6 h-4 rounded bg-primary/20" />
          <div className="w-6 h-4 rounded bg-primary/40" />
          <div className="w-6 h-4 rounded bg-primary/60" />
          <div className="w-6 h-4 rounded bg-primary/90" />
        </div>
        <span className="text-xs text-muted-foreground">Meer</span>
      </div>
    </Card>
  );
};
