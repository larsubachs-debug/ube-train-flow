import { useQuery } from "@tanstack/react-query";

export interface OpenFoodFactsItem {
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
  source: "openfoodfacts";
}

interface OpenFoodFactsProduct {
  code: string;
  product_name?: string;
  brands?: string;
  nutriments?: {
    "energy-kcal_100g"?: number;
    carbohydrates_100g?: number;
    fat_100g?: number;
    proteins_100g?: number;
  };
  categories?: string;
}

interface OpenFoodFactsSearchResponse {
  products: OpenFoodFactsProduct[];
  count: number;
}

export const useOpenFoodFacts = (searchQuery: string) => {
  return useQuery({
    queryKey: ["openfoodfacts", searchQuery],
    queryFn: async (): Promise<OpenFoodFactsItem[]> => {
      if (!searchQuery || searchQuery.length < 2) {
        return [];
      }

      try {
        // Search Open Food Facts API - prioritize Dutch products
        const response = await fetch(
          `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(searchQuery)}&search_simple=1&action=process&json=1&page_size=15&countries_tags_en=netherlands,belgium&sort_by=unique_scans_n`
        );

        if (!response.ok) {
          throw new Error("Failed to fetch from Open Food Facts");
        }

        const data: OpenFoodFactsSearchResponse = await response.json();

        // Transform to our format
        return data.products
          .filter((product) => product.product_name && product.nutriments)
          .map((product): OpenFoodFactsItem => {
            const nutriments = product.nutriments || {};
            return {
              id: `off-${product.code}`,
              name: product.product_name || "Onbekend product",
              brand: product.brands?.split(",")[0] || null,
              serving_size: 100,
              serving_unit: "g",
              calories_per_serving: Math.round(nutriments["energy-kcal_100g"] || 0),
              carbs_per_serving: Math.round((nutriments.carbohydrates_100g || 0) * 10) / 10,
              fat_per_serving: Math.round((nutriments.fat_100g || 0) * 10) / 10,
              protein_per_serving: Math.round((nutriments.proteins_100g || 0) * 10) / 10,
              category: product.categories?.split(",")[0]?.trim() || null,
              source: "openfoodfacts",
            };
          });
      } catch (error) {
        console.error("Open Food Facts search error:", error);
        return [];
      }
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    enabled: searchQuery.length >= 2,
  });
};

export const fetchProductByBarcode = async (barcode: string): Promise<OpenFoodFactsItem | null> => {
  try {
    const response = await fetch(
      `https://world.openfoodfacts.org/api/v0/product/${barcode}.json`
    );
    const data = await response.json();

    if (data.status === 1 && data.product) {
      const product = data.product;
      const nutriments = product.nutriments || {};

      return {
        id: `off-${barcode}`,
        name: product.product_name || "Onbekend product",
        brand: product.brands?.split(",")[0] || null,
        serving_size: 100,
        serving_unit: "g",
        calories_per_serving: Math.round(nutriments["energy-kcal_100g"] || 0),
        carbs_per_serving: Math.round((nutriments.carbohydrates_100g || 0) * 10) / 10,
        fat_per_serving: Math.round((nutriments.fat_100g || 0) * 10) / 10,
        protein_per_serving: Math.round((nutriments.proteins_100g || 0) * 10) / 10,
        category: product.categories?.split(",")[0]?.trim() || null,
        source: "openfoodfacts",
      };
    }

    return null;
  } catch (error) {
    console.error("Barcode lookup error:", error);
    return null;
  }
};
