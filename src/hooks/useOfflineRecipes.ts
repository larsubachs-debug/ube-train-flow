import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useLocalStorage } from './useLocalStorage';
import { useNetworkStatus } from './useNetworkStatus';
import { toast } from 'sonner';
import type { Recipe, RecipeIngredient } from './useRecipes';

const CACHE_KEY = 'offline-recipes';
const FAVORITES_CACHE_KEY = 'offline-recipe-favorites';

export const useOfflineRecipes = () => {
  const { user } = useAuth();
  const { isOnline } = useNetworkStatus();
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFromCache, setIsFromCache] = useState(false);

  const [cachedRecipes, setCachedRecipes] = useLocalStorage<Recipe[]>(CACHE_KEY, []);
  const [cachedFavorites, setCachedFavorites] = useLocalStorage<string[]>(FAVORITES_CACHE_KEY, []);

  const fetchRecipes = useCallback(async () => {
    setLoading(true);

    // If offline, use cached data
    if (!isOnline) {
      if (cachedRecipes.length > 0) {
        const recipesWithFavorites = cachedRecipes.map(recipe => ({
          ...recipe,
          is_favorite: cachedFavorites.includes(recipe.id),
        }));
        setRecipes(recipesWithFavorites);
        setFavorites(cachedFavorites);
        setIsFromCache(true);
      }
      setLoading(false);
      return;
    }

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
        setCachedFavorites(favoriteIds);
      }

      const recipesWithFavorites = (data || []).map(recipe => ({
        ...recipe,
        is_favorite: favoriteIds.includes(recipe.id),
      })) as Recipe[];

      setRecipes(recipesWithFavorites);
      setCachedRecipes(recipesWithFavorites);
      setIsFromCache(false);
    } catch (error) {
      console.error('Error fetching recipes:', error);
      // Fallback to cache on error
      if (cachedRecipes.length > 0) {
        setRecipes(cachedRecipes);
        setFavorites(cachedFavorites);
        setIsFromCache(true);
      }
    } finally {
      setLoading(false);
    }
  }, [isOnline, user, cachedRecipes, cachedFavorites, setCachedRecipes, setCachedFavorites]);

  const fetchRecipeWithIngredients = useCallback(async (recipeId: string): Promise<Recipe | null> => {
    // Check cache first
    const cachedRecipe = cachedRecipes.find(r => r.id === recipeId);

    if (!isOnline) {
      return cachedRecipe || null;
    }

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

      const fullRecipe = {
        ...recipe,
        ingredients: ingredients || [],
        is_favorite: favorites.includes(recipe.id),
      } as Recipe;

      // Update cache with ingredients
      const updatedCache = cachedRecipes.map(r => 
        r.id === recipeId ? fullRecipe : r
      );
      if (!cachedRecipes.find(r => r.id === recipeId)) {
        updatedCache.push(fullRecipe);
      }
      setCachedRecipes(updatedCache);

      return fullRecipe;
    } catch (error) {
      console.error('Error fetching recipe:', error);
      return cachedRecipe || null;
    }
  }, [isOnline, favorites, cachedRecipes, setCachedRecipes]);

  const toggleFavorite = useCallback(async (recipeId: string) => {
    if (!user) {
      toast.error('Je moet ingelogd zijn om favorieten op te slaan');
      return;
    }

    const isFavorite = favorites.includes(recipeId);
    
    // Optimistic update
    const newFavorites = isFavorite
      ? favorites.filter(id => id !== recipeId)
      : [...favorites, recipeId];
    
    setFavorites(newFavorites);
    setCachedFavorites(newFavorites);
    setRecipes(prev => prev.map(r =>
      r.id === recipeId ? { ...r, is_favorite: !isFavorite } : r
    ));

    if (!isOnline) {
      toast.info('Wordt gesynchroniseerd wanneer je online bent');
      return;
    }

    try {
      if (isFavorite) {
        const { error } = await supabase
          .from('favorite_recipes')
          .delete()
          .eq('user_id', user.id)
          .eq('recipe_id', recipeId);

        if (error) throw error;
        toast.success('Verwijderd uit favorieten');
      } else {
        const { error } = await supabase
          .from('favorite_recipes')
          .insert({ user_id: user.id, recipe_id: recipeId });

        if (error) throw error;
        toast.success('Toegevoegd aan favorieten');
      }
    } catch (error) {
      // Revert on error
      setFavorites(favorites);
      setCachedFavorites(favorites);
      setRecipes(prev => prev.map(r =>
        r.id === recipeId ? { ...r, is_favorite: isFavorite } : r
      ));
      console.error('Error toggling favorite:', error);
      toast.error('Fout bij bijwerken favorieten');
    }
  }, [user, favorites, isOnline, setCachedFavorites]);

  useEffect(() => {
    fetchRecipes();
  }, [user, isOnline]);

  return {
    recipes,
    favorites,
    loading,
    isFromCache,
    isOnline,
    fetchRecipes,
    fetchRecipeWithIngredients,
    toggleFavorite,
  };
};
