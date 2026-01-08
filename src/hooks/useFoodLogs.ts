import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { format } from "date-fns";

export type MealType = "breakfast" | "lunch" | "dinner" | "snacks";

export interface FoodLog {
  id: string;
  user_id: string;
  meal_type: MealType;
  name: string;
  calories: number;
  carbs: number;
  fat: number;
  protein: number;
  log_date: string;
  created_at: string;
  updated_at: string;
}

export interface CreateFoodLogInput {
  meal_type: MealType;
  name: string;
  calories: number;
  carbs: number;
  fat: number;
  protein: number;
  log_date: string;
}

export const useFoodLogs = (date: Date) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const dateStr = format(date, "yyyy-MM-dd");

  const { data: foodLogs = [], isLoading } = useQuery({
    queryKey: ["food-logs", dateStr],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from("food_logs")
        .select("*")
        .eq("log_date", dateStr)
        .order("created_at", { ascending: true });

      if (error) throw error;
      return data as FoodLog[];
    },
    enabled: !!user,
  });

  const addFoodLog = useMutation({
    mutationFn: async (input: CreateFoodLogInput) => {
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("food_logs")
        .insert({
          user_id: user.id,
          ...input,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["food-logs", dateStr] });
      toast.success("Voeding toegevoegd");
    },
    onError: (error) => {
      console.error("Error adding food log:", error);
      toast.error("Kon voeding niet toevoegen");
    },
  });

  const deleteFoodLog = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("food_logs")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["food-logs", dateStr] });
      toast.success("Voeding verwijderd");
    },
    onError: (error) => {
      console.error("Error deleting food log:", error);
      toast.error("Kon voeding niet verwijderen");
    },
  });

  // Group food logs by meal type
  const loggedMeals: Record<MealType, FoodLog[]> = {
    breakfast: foodLogs.filter((log) => log.meal_type === "breakfast"),
    lunch: foodLogs.filter((log) => log.meal_type === "lunch"),
    dinner: foodLogs.filter((log) => log.meal_type === "dinner"),
    snacks: foodLogs.filter((log) => log.meal_type === "snacks"),
  };

  // Calculate totals
  const totals = {
    calories: foodLogs.reduce((sum, log) => sum + log.calories, 0),
    carbs: foodLogs.reduce((sum, log) => sum + Number(log.carbs), 0),
    fat: foodLogs.reduce((sum, log) => sum + Number(log.fat), 0),
    protein: foodLogs.reduce((sum, log) => sum + Number(log.protein), 0),
  };

  return {
    foodLogs,
    loggedMeals,
    totals,
    isLoading,
    addFoodLog,
    deleteFoodLog,
  };
};
