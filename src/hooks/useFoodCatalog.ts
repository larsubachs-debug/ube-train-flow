import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface FoodCatalogItem {
  id: string;
  name: string;
  brand: string | null;
  serving_size: number;
  serving_unit: string;
  calories_per_serving: number;
  carbs_per_serving: number;
  fat_per_serving: number;
  protein_per_serving: number;
  category: string | null;
}

export const useFoodCatalog = (searchQuery: string) => {
  return useQuery({
    queryKey: ["food-catalog", searchQuery],
    queryFn: async () => {
      if (!searchQuery || searchQuery.length < 2) {
        // Return popular items when no search query
        const { data, error } = await supabase
          .from("food_catalog")
          .select("*")
          .order("name")
          .limit(20);

        if (error) throw error;
        return data as FoodCatalogItem[];
      }

      const { data, error } = await supabase
        .from("food_catalog")
        .select("*")
        .ilike("name", `%${searchQuery}%`)
        .order("name")
        .limit(20);

      if (error) throw error;
      return data as FoodCatalogItem[];
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};
