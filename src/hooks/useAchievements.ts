import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface Achievement {
  id: string;
  name: string;
  description: string;
  category: string;
  requirement_type: string | null;
  requirement_value: number | null;
  rarity: string | null;
  badge_color: string;
  badge_icon: string;
  points: number | null;
}

export interface UserAchievement {
  id: string;
  achievement_id: string;
  user_id: string;
  progress: number | null;
  is_unlocked: boolean | null;
  unlocked_at: string | null;
  achievements: Achievement;
}

export const useAchievements = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch all achievements
  const { data: achievements = [], isLoading: achievementsLoading } = useQuery({
    queryKey: ["achievements"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("achievements")
        .select("*")
        .order("points", { ascending: true });

      if (error) throw error;
      return data as Achievement[];
    },
  });

  // Fetch user achievements
  const { data: userAchievements = [], isLoading: userAchievementsLoading } = useQuery({
    queryKey: ["userAchievements"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from("user_achievements")
        .select("*, achievements(*)")
        .eq("user_id", user.id);

      if (error) throw error;
      return data as UserAchievement[];
    },
  });

  // Check and unlock achievements
  const checkAchievements = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No user");

      // Get user stats
      const { data: stats, error: statsError } = await supabase
        .from("user_stats")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (statsError) throw statsError;
      if (!stats) return [];

      // Get all achievements and user achievements
      const { data: allAchievements } = await supabase
        .from("achievements")
        .select("*");

      const { data: userAchs } = await supabase
        .from("user_achievements")
        .select("*")
        .eq("user_id", user.id);

      if (!allAchievements) return [];

      const newlyUnlocked: Achievement[] = [];

      for (const achievement of allAchievements) {
        const userAch = userAchs?.find(ua => ua.achievement_id === achievement.id);
        
        if (userAch?.is_unlocked) continue; // Already unlocked

        let currentProgress = 0;
        let meetsRequirement = false;

        // Check if achievement requirements are met
        if (achievement.requirement_type && achievement.requirement_value) {
          switch (achievement.requirement_type) {
            case "total_prs":
              currentProgress = stats.total_prs || 0;
              break;
            case "current_streak":
              currentProgress = stats.current_streak || 0;
              break;
            case "total_workouts":
              currentProgress = stats.total_workouts || 0;
              break;
          }

          meetsRequirement = currentProgress >= achievement.requirement_value;
        }

        if (userAch) {
          // Update existing achievement
          await supabase
            .from("user_achievements")
            .update({
              progress: currentProgress,
              is_unlocked: meetsRequirement,
              unlocked_at: meetsRequirement ? new Date().toISOString() : userAch.unlocked_at,
            })
            .eq("id", userAch.id);

          if (meetsRequirement && !userAch.is_unlocked) {
            newlyUnlocked.push(achievement);
          }
        } else {
          // Create new achievement entry
          await supabase
            .from("user_achievements")
            .insert({
              user_id: user.id,
              achievement_id: achievement.id,
              progress: currentProgress,
              is_unlocked: meetsRequirement,
              unlocked_at: meetsRequirement ? new Date().toISOString() : null,
            });

          if (meetsRequirement) {
            newlyUnlocked.push(achievement);
          }
        }
      }

      return newlyUnlocked;
    },
    onSuccess: (newlyUnlocked) => {
      queryClient.invalidateQueries({ queryKey: ["userAchievements"] });
      
      // Show toast for each newly unlocked achievement
      newlyUnlocked.forEach(achievement => {
        toast({
          title: "🎉 Achievement Unlocked!",
          description: `${achievement.name} - ${achievement.description}`,
        });
      });
    },
  });

  return {
    achievements,
    userAchievements,
    isLoading: achievementsLoading || userAchievementsLoading,
    checkAchievements: checkAchievements.mutate,
    isChecking: checkAchievements.isPending,
  };
};