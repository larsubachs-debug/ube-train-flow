import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface Recipe {
  id: string;
  name: string;
  description: string | null;
  image_url: string | null;
  prep_time_minutes: number | null;
  cook_time_minutes: number | null;
  servings: number;
  difficulty: 'easy' | 'medium' | 'hard' | null;
  category: string | null;
  calories_per_serving: number | null;
  protein_per_serving: number | null;
  carbs_per_serving: number | null;
  fat_per_serving: number | null;
  instructions: string[] | null;
  tags: string[] | null;
  is_public: boolean;
  created_by: string | null;
  created_at: string;
  ingredients?: RecipeIngredient[];
  is_favorite?: boolean;
}

export interface RecipeIngredient {
  id: string;
  recipe_id: string;
  name: string;
  amount: number | null;
  unit: string | null;
  notes: string | null;
  display_order: number;
}

export const useRecipes = () => {
  const { user } = useAuth();
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRecipes = async () => {
    try {
      const { data, error } = await supabase
        .from('recipes')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch favorites if user is logged in
      let favoriteIds: string[] = [];
      if (user) {
        const { data: favData } = await supabase
          .from('favorite_recipes')
          .select('recipe_id')
          .eq('user_id', user.id);
        favoriteIds = favData?.map(f => f.recipe_id) || [];
        setFavorites(favoriteIds);
      }

      const recipesWithFavorites = (data || []).map(recipe => ({
        ...recipe,
        is_favorite: favoriteIds.includes(recipe.id),
      }));

      setRecipes(recipesWithFavorites as Recipe[]);
    } catch (error) {
      console.error('Error fetching recipes:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRecipeWithIngredients = async (recipeId: string): Promise<Recipe | null> => {
    try {
      const { data: recipe, error: recipeError } = await supabase
        .from('recipes')
        .select('*')
        .eq('id', recipeId)
        .single();

      if (recipeError) throw recipeError;

      const { data: ingredients, error: ingredientsError } = await supabase
        .from('recipe_ingredients')
        .select('*')
        .eq('recipe_id', recipeId)
        .order('display_order');

      if (ingredientsError) throw ingredientsError;

      return {
        ...recipe,
        ingredients: ingredients || [],
        is_favorite: favorites.includes(recipe.id),
      } as Recipe;
    } catch (error) {
      console.error('Error fetching recipe:', error);
      return null;
    }
  };

  const toggleFavorite = async (recipeId: string) => {
    if (!user) {
      toast.error('Je moet ingelogd zijn om favorieten op te slaan');
      return;
    }

    const isFavorite = favorites.includes(recipeId);

    try {
      if (isFavorite) {
        const { error } = await supabase
          .from('favorite_recipes')
          .delete()
          .eq('user_id', user.id)
          .eq('recipe_id', recipeId);

        if (error) throw error;

        setFavorites(prev => prev.filter(id => id !== recipeId));
        setRecipes(prev => prev.map(r => 
          r.id === recipeId ? { ...r, is_favorite: false } : r
        ));
        toast.success('Verwijderd uit favorieten');
      } else {
        const { error } = await supabase
          .from('favorite_recipes')
          .insert({ user_id: user.id, recipe_id: recipeId });

        if (error) throw error;

        setFavorites(prev => [...prev, recipeId]);
        setRecipes(prev => prev.map(r => 
          r.id === recipeId ? { ...r, is_favorite: true } : r
        ));
        toast.success('Toegevoegd aan favorieten');
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
      toast.error('Fout bij bijwerken favorieten');
    }
  };

  const createRecipe = async (recipe: Partial<Recipe>, ingredients: Omit<RecipeIngredient, 'id' | 'recipe_id'>[]) => {
    if (!user) return null;

    try {
      const { data: newRecipe, error: recipeError } = await supabase
        .from('recipes')
        .insert({
          name: recipe.name || 'Nieuw recept',
          description: recipe.description,
          image_url: recipe.image_url,
          prep_time_minutes: recipe.prep_time_minutes,
          cook_time_minutes: recipe.cook_time_minutes,
          servings: recipe.servings || 1,
          difficulty: recipe.difficulty,
          category: recipe.category,
          calories_per_serving: recipe.calories_per_serving,
          protein_per_serving: recipe.protein_per_serving,
          carbs_per_serving: recipe.carbs_per_serving,
          fat_per_serving: recipe.fat_per_serving,
          instructions: recipe.instructions,
          tags: recipe.tags,
          is_public: recipe.is_public ?? true,
          created_by: user.id,
        })
        .select()
        .single();

      if (recipeError) throw recipeError;

      if (ingredients.length > 0) {
        const { error: ingredientsError } = await supabase
          .from('recipe_ingredients')
          .insert(ingredients.map((ing, index) => ({
            ...ing,
            recipe_id: newRecipe.id,
            display_order: index,
          })));

        if (ingredientsError) throw ingredientsError;
      }

      toast.success('Recept aangemaakt!');
      fetchRecipes();
      return newRecipe;
    } catch (error) {
      console.error('Error creating recipe:', error);
      toast.error('Fout bij aanmaken recept');
      return null;
    }
  };

  useEffect(() => {
    fetchRecipes();
  }, [user]);

  return {
    recipes,
    favorites,
    loading,
    fetchRecipes,
    fetchRecipeWithIngredients,
    toggleFavorite,
    createRecipe,
  };
};
