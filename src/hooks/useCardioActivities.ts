import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface CardioActivity {
  id: string;
  user_id: string;
  activity_type: string;
  name: string | null;
  duration_seconds: number | null;
  distance_meters: number | null;
  elevation_gain_meters: number | null;
  average_pace_seconds_per_km: number | null;
  average_speed_kmh: number | null;
  calories_burned: number | null;
  start_location: { lat: number; lng: number } | null;
  end_location: { lat: number; lng: number } | null;
  route_coordinates: { lat: number; lng: number }[] | null;
  notes: string | null;
  completed_at: string;
  created_at: string;
}

export const useCardioActivities = (limit?: number) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["cardio-activities", user?.id, limit],
    queryFn: async () => {
      if (!user) return [];

      let query = supabase
        .from("cardio_activities" as any)
        .select("*")
        .eq("user_id", user.id)
        .order("completed_at", { ascending: false });

      if (limit) {
        query = query.limit(limit);
      }

      const { data, error } = await query;

      if (error) throw error;
      return (data || []) as unknown as CardioActivity[];
    },
    enabled: !!user,
  });
};

export const useCardioStats = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["cardio-stats", user?.id],
    queryFn: async () => {
      if (!user) return null;

      const now = new Date();
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - now.getDay() + 1);
      startOfWeek.setHours(0, 0, 0, 0);

      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      // Get all activities for this month
      const { data: activities, error } = await supabase
        .from("cardio_activities" as any)
        .select("*")
        .eq("user_id", user.id)
        .gte("completed_at", startOfMonth.toISOString());

      if (error) throw error;

      const typedActivities = (activities || []) as unknown as CardioActivity[];

      // Calculate stats
      const thisWeek = typedActivities.filter(
        (a) => new Date(a.completed_at) >= startOfWeek
      );
      const thisMonth = typedActivities;

      return {
        weeklyDistance: thisWeek.reduce(
          (sum, a) => sum + (a.distance_meters || 0),
          0
        ),
        weeklyDuration: thisWeek.reduce(
          (sum, a) => sum + (a.duration_seconds || 0),
          0
        ),
        weeklyActivities: thisWeek.length,
        monthlyDistance: thisMonth.reduce(
          (sum, a) => sum + (a.distance_meters || 0),
          0
        ),
        monthlyDuration: thisMonth.reduce(
          (sum, a) => sum + (a.duration_seconds || 0),
          0
        ),
        monthlyActivities: thisMonth.length,
        monthlyCalories: thisMonth.reduce(
          (sum, a) => sum + (a.calories_burned || 0),
          0
        ),
      };
    },
    enabled: !!user,
  });
};
