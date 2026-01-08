import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface ShoppingList {
  id: string;
  user_id: string;
  meal_plan_id: string | null;
  name: string;
  start_date: string | null;
  end_date: string | null;
  is_completed: boolean;
  created_at: string;
  items?: ShoppingListItem[];
}

export interface ShoppingListItem {
  id: string;
  shopping_list_id: string;
  ingredient_name: string;
  amount: number | null;
  unit: string | null;
  category: string | null;
  is_checked: boolean;
  recipe_id: string | null;
}

const CATEGORIES = [
  'Groenten & Fruit',
  'Vlees & Vis',
  'Zuivel',
  'Brood & Bakkerij',
  'Droge producten',
  'Sauzen & Kruiden',
  'Dranken',
  'Overig',
];

export const useShoppingList = () => {
  const { user } = useAuth();
  const [shoppingLists, setShoppingLists] = useState<ShoppingList[]>([]);
  const [activeList, setActiveList] = useState<ShoppingList | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchShoppingLists = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('shopping_lists')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setShoppingLists(data as ShoppingList[] || []);

      // Set most recent non-completed list as active
      const active = data?.find(list => !list.is_completed);
      if (active) {
        await fetchListWithItems(active.id);
      }
    } catch (error) {
      console.error('Error fetching shopping lists:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchListWithItems = async (listId: string) => {
    try {
      const { data: list, error: listError } = await supabase
        .from('shopping_lists')
        .select('*')
        .eq('id', listId)
        .single();

      if (listError) throw listError;

      const { data: items, error: itemsError } = await supabase
        .from('shopping_list_items')
        .select('*')
        .eq('shopping_list_id', listId)
        .order('category')
        .order('ingredient_name');

      if (itemsError) throw itemsError;

      const fullList = {
        ...list,
        items: items || [],
      } as ShoppingList;

      setActiveList(fullList);
      return fullList;
    } catch (error) {
      console.error('Error fetching shopping list:', error);
      return null;
    }
  };

  const generateFromMealPlan = async (mealPlanId: string, mealPlanName: string) => {
    if (!user) return null;

    try {
      // Fetch meal plan items with their recipes and ingredients
      const { data: items, error: itemsError } = await supabase
        .from('meal_plan_items')
        .select(`
          servings,
          recipe:recipes(
            id,
            name,
            servings
          )
        `)
        .eq('meal_plan_id', mealPlanId)
        .not('recipe_id', 'is', null);

      if (itemsError) throw itemsError;

      // Get all recipe IDs
      const recipeIds = items
        ?.map(item => item.recipe?.id)
        .filter(Boolean) as string[];

      if (recipeIds.length === 0) {
        toast.error('Geen recepten gevonden in maaltijdplan');
        return null;
      }

      // Fetch all ingredients for these recipes
      const { data: ingredients, error: ingError } = await supabase
        .from('recipe_ingredients')
        .select('*')
        .in('recipe_id', recipeIds);

      if (ingError) throw ingError;

      // Create shopping list
      const { data: newList, error: listError } = await supabase
        .from('shopping_lists')
        .insert({
          user_id: user.id,
          meal_plan_id: mealPlanId,
          name: `Boodschappen - ${mealPlanName}`,
        })
        .select()
        .single();

      if (listError) throw listError;

      // Aggregate ingredients (combine same ingredients)
      const aggregatedIngredients = new Map<string, ShoppingListItem>();

      items?.forEach(item => {
        if (!item.recipe) return;
        const servingMultiplier = item.servings / (item.recipe.servings || 1);

        const recipeIngredients = ingredients?.filter(
          ing => ing.recipe_id === item.recipe?.id
        ) || [];

        recipeIngredients.forEach(ing => {
          const key = `${ing.name}-${ing.unit}`;
          if (aggregatedIngredients.has(key)) {
            const existing = aggregatedIngredients.get(key)!;
            existing.amount = (existing.amount || 0) + (ing.amount || 0) * servingMultiplier;
          } else {
            aggregatedIngredients.set(key, {
              id: '',
              shopping_list_id: newList.id,
              ingredient_name: ing.name,
              amount: ing.amount ? ing.amount * servingMultiplier : null,
              unit: ing.unit,
              category: categorizeIngredient(ing.name),
              is_checked: false,
              recipe_id: ing.recipe_id,
            });
          }
        });
      });

      // Insert shopping list items
      if (aggregatedIngredients.size > 0) {
        const { error: insertError } = await supabase
          .from('shopping_list_items')
          .insert(Array.from(aggregatedIngredients.values()).map(item => ({
            shopping_list_id: item.shopping_list_id,
            ingredient_name: item.ingredient_name,
            amount: item.amount,
            unit: item.unit,
            category: item.category,
            is_checked: false,
            recipe_id: item.recipe_id,
          })));

        if (insertError) throw insertError;
      }

      toast.success('Boodschappenlijst gegenereerd!');
      await fetchListWithItems(newList.id);
      fetchShoppingLists();
      return newList;
    } catch (error) {
      console.error('Error generating shopping list:', error);
      toast.error('Fout bij genereren boodschappenlijst');
      return null;
    }
  };

  const toggleItem = async (itemId: string, isChecked: boolean) => {
    try {
      const { error } = await supabase
        .from('shopping_list_items')
        .update({ is_checked: isChecked })
        .eq('id', itemId);

      if (error) throw error;

      if (activeList) {
        setActiveList(prev => prev ? {
          ...prev,
          items: prev.items?.map(item =>
            item.id === itemId ? { ...item, is_checked: isChecked } : item
          ),
        } : null);
      }
    } catch (error) {
      console.error('Error toggling item:', error);
    }
  };

  const addItem = async (listId: string, ingredientName: string, amount?: number, unit?: string) => {
    try {
      const { error } = await supabase
        .from('shopping_list_items')
        .insert({
          shopping_list_id: listId,
          ingredient_name: ingredientName,
          amount,
          unit,
          category: categorizeIngredient(ingredientName),
          is_checked: false,
        });

      if (error) throw error;

      if (activeList?.id === listId) {
        await fetchListWithItems(listId);
      }

      toast.success('Item toegevoegd');
    } catch (error) {
      console.error('Error adding item:', error);
      toast.error('Fout bij toevoegen item');
    }
  };

  const removeItem = async (itemId: string) => {
    try {
      const { error } = await supabase
        .from('shopping_list_items')
        .delete()
        .eq('id', itemId);

      if (error) throw error;

      if (activeList) {
        setActiveList(prev => prev ? {
          ...prev,
          items: prev.items?.filter(item => item.id !== itemId),
        } : null);
      }
    } catch (error) {
      console.error('Error removing item:', error);
    }
  };

  useEffect(() => {
    fetchShoppingLists();
  }, [user]);

  return {
    shoppingLists,
    activeList,
    loading,
    fetchShoppingLists,
    fetchListWithItems,
    generateFromMealPlan,
    toggleItem,
    addItem,
    removeItem,
    CATEGORIES,
  };
};

// Simple ingredient categorization
function categorizeIngredient(name: string): string {
  const lowerName = name.toLowerCase();
  
  if (['tomaat', 'ui', 'knoflook', 'paprika', 'wortel', 'sla', 'komkommer', 'appel', 'banaan', 'citroen', 'spinazie', 'broccoli', 'courgette', 'aubergine'].some(v => lowerName.includes(v))) {
    return 'Groenten & Fruit';
  }
  if (['kip', 'rund', 'varken', 'gehakt', 'zalm', 'tonijn', 'garnaal', 'vis', 'bacon', 'ham'].some(v => lowerName.includes(v))) {
    return 'Vlees & Vis';
  }
  if (['melk', 'kaas', 'yoghurt', 'boter', 'room', 'ei', 'eieren', 'kwark'].some(v => lowerName.includes(v))) {
    return 'Zuivel';
  }
  if (['brood', 'croissant', 'beschuit'].some(v => lowerName.includes(v))) {
    return 'Brood & Bakkerij';
  }
  if (['pasta', 'rijst', 'noodle', 'meel', 'suiker', 'haver', 'quinoa', 'couscous'].some(v => lowerName.includes(v))) {
    return 'Droge producten';
  }
  if (['saus', 'kruiden', 'peper', 'zout', 'olie', 'azijn', 'mosterd', 'ketchup'].some(v => lowerName.includes(v))) {
    return 'Sauzen & Kruiden';
  }
  
  return 'Overig';
}
