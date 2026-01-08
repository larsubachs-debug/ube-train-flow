import { useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useLocalStorage } from './useLocalStorage';
import { useNetworkStatus } from './useNetworkStatus';
import { useOfflineSync } from './useOfflineSync';
import { toast } from "sonner";
import { format } from "date-fns";
import type { MealType, FoodLog, CreateFoodLogInput } from './useFoodLogs';

const CACHE_KEY_PREFIX = 'offline-food-logs';

export const useOfflineFoodLogs = (date: Date) => {
  const { user } = useAuth();
  const { isOnline } = useNetworkStatus();
  const { queueAction, hasPendingActions } = useOfflineSync();
  const queryClient = useQueryClient();
  const dateStr = format(date, "yyyy-MM-dd");

  const [cachedLogs, setCachedLogs] = useLocalStorage<Record<string, FoodLog[]>>(`${CACHE_KEY_PREFIX}`, {});

  const { data: foodLogs = [], isLoading } = useQuery({
    queryKey: ["food-logs", dateStr],
    queryFn: async () => {
      if (!user) return [];
      
      // If offline, return cached data
      if (!isOnline) {
        return cachedLogs[dateStr] || [];
      }

      const { data, error } = await supabase
        .from("food_logs")
        .select("*")
        .eq("log_date", dateStr)
        .order("created_at", { ascending: true });

      if (error) throw error;
      
      // Update cache
      const logs = data as FoodLog[];
      setCachedLogs(prev => ({
        ...prev,
        [dateStr]: logs,
      }));
      
      return logs;
    },
    enabled: !!user,
    staleTime: isOnline ? 30000 : Infinity, // Never stale when offline
    gcTime: 1000 * 60 * 60, // Keep in memory for 1 hour
  });

  const addFoodLog = useMutation({
    mutationFn: async (input: CreateFoodLogInput) => {
      if (!user) throw new Error("Not authenticated");

      const newLog: FoodLog = {
        id: `temp-${Date.now()}`,
        user_id: user.id,
        ...input,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      // Optimistic update to cache
      setCachedLogs(prev => ({
        ...prev,
        [dateStr]: [...(prev[dateStr] || []), newLog],
      }));

      if (!isOnline) {
        // Queue for sync
        queueAction({
          type: 'create',
          table: 'food_logs',
          data: {
            user_id: user.id,
            ...input,
          },
        });
        return newLog;
      }

      const { data, error } = await supabase
        .from("food_logs")
        .insert({
          user_id: user.id,
          ...input,
        })
        .select()
        .single();

      if (error) throw error;
      
      // Update cache with real data
      setCachedLogs(prev => ({
        ...prev,
        [dateStr]: (prev[dateStr]?.map(log => 
          log.id === newLog.id ? (data as FoodLog) : log
        ) || [data as FoodLog]) as FoodLog[],
      }));
      
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["food-logs", dateStr] });
      toast.success(isOnline ? "Voeding toegevoegd" : "Voeding opgeslagen (wordt gesynchroniseerd)");
    },
    onError: (error) => {
      console.error("Error adding food log:", error);
      toast.error("Kon voeding niet toevoegen");
    },
  });

  const deleteFoodLog = useMutation({
    mutationFn: async (id: string) => {
      // Optimistic update to cache
      setCachedLogs(prev => ({
        ...prev,
        [dateStr]: prev[dateStr]?.filter(log => log.id !== id) || [],
      }));

      if (!isOnline) {
        if (!id.startsWith('temp-')) {
          queueAction({
            type: 'delete',
            table: 'food_logs',
            data: { id },
          });
        }
        return;
      }

      const { error } = await supabase
        .from("food_logs")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["food-logs", dateStr] });
      toast.success(isOnline ? "Voeding verwijderd" : "Verwijdering wordt gesynchroniseerd");
    },
    onError: (error) => {
      console.error("Error deleting food log:", error);
      toast.error("Kon voeding niet verwijderen");
    },
  });

  // Use cached data when offline, otherwise use query data
  const effectiveLogs = useMemo(() => {
    if (!isOnline && cachedLogs[dateStr]) {
      return cachedLogs[dateStr];
    }
    return foodLogs;
  }, [isOnline, cachedLogs, dateStr, foodLogs]);

  // Group food logs by meal type
  const loggedMeals: Record<MealType, FoodLog[]> = {
    breakfast: effectiveLogs.filter((log) => log.meal_type === "breakfast"),
    lunch: effectiveLogs.filter((log) => log.meal_type === "lunch"),
    dinner: effectiveLogs.filter((log) => log.meal_type === "dinner"),
    snacks: effectiveLogs.filter((log) => log.meal_type === "snacks"),
  };

  // Calculate totals
  const totals = {
    calories: effectiveLogs.reduce((sum, log) => sum + log.calories, 0),
    carbs: effectiveLogs.reduce((sum, log) => sum + Number(log.carbs), 0),
    fat: effectiveLogs.reduce((sum, log) => sum + Number(log.fat), 0),
    protein: effectiveLogs.reduce((sum, log) => sum + Number(log.protein), 0),
  };

  return {
    foodLogs: effectiveLogs,
    loggedMeals,
    totals,
    isLoading,
    isOnline,
    hasPendingActions,
    addFoodLog,
    deleteFoodLog,
  };
};
