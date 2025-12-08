import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export const useEducationFavorites = () => {
  const { user } = useAuth();
  const [favorites, setFavorites] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchFavorites = async () => {
    if (!user) {
      setFavorites([]);
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("education_favorites")
        .select("module_id")
        .eq("user_id", user.id);

      if (error) throw error;
      setFavorites(data?.map((f) => f.module_id) || []);
    } catch (error) {
      console.error("Error fetching favorites:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFavorites();
  }, [user]);

  const toggleFavorite = async (moduleId: string) => {
    if (!user) {
      toast.error("Log in om favorieten op te slaan");
      return;
    }

    const isFavorite = favorites.includes(moduleId);

    // Optimistic update
    setFavorites((prev) =>
      isFavorite ? prev.filter((id) => id !== moduleId) : [...prev, moduleId]
    );

    try {
      if (isFavorite) {
        const { error } = await supabase
          .from("education_favorites")
          .delete()
          .eq("user_id", user.id)
          .eq("module_id", moduleId);

        if (error) throw error;
        toast.success("Verwijderd uit favorieten");
      } else {
        const { error } = await supabase
          .from("education_favorites")
          .insert({ user_id: user.id, module_id: moduleId });

        if (error) throw error;
        toast.success("Toegevoegd aan favorieten");
      }
    } catch (error) {
      // Revert optimistic update on error
      setFavorites((prev) =>
        isFavorite ? [...prev, moduleId] : prev.filter((id) => id !== moduleId)
      );
      toast.error("Er ging iets mis");
      console.error("Error toggling favorite:", error);
    }
  };

  const isFavorite = (moduleId: string) => favorites.includes(moduleId);

  return {
    favorites,
    isLoading,
    toggleFavorite,
    isFavorite,
  };
};
