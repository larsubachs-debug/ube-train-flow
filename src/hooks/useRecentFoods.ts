import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface RecentFood {
  name: string;
  calories: number;
  carbs: number;
  fat: number;
  protein: number;
  lastUsed: string;
}

export const useRecentFoods = (limit: number = 5) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["recent-foods", user?.id],
    queryFn: async () => {
      if (!user) return [];

      // Get recent unique food items from food_logs
      const { data, error } = await supabase
        .from("food_logs")
        .select("name, calories, carbs, fat, protein, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;

      // Deduplicate by name, keeping the most recent entry
      const uniqueFoods = new Map<string, RecentFood>();
      
      data.forEach((item) => {
        if (!uniqueFoods.has(item.name)) {
          uniqueFoods.set(item.name, {
            name: item.name,
            calories: item.calories,
            carbs: item.carbs,
            fat: item.fat,
            protein: item.protein,
            lastUsed: item.created_at,
          });
        }
      });

      return Array.from(uniqueFoods.values()).slice(0, limit);
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
};

