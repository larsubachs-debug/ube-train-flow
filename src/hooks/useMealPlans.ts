import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface MealPlan {
  id: string;
  name: string;
  description: string | null;
  start_date: string | null;
  end_date: string | null;
  is_template: boolean;
  created_by: string | null;
  assigned_to: string | null;
  assigned_by: string | null;
  is_active: boolean;
  created_at: string;
  items?: MealPlanItem[];
}

export interface MealPlanItem {
  id: string;
  meal_plan_id: string;
  recipe_id: string | null;
  day_of_week: number;
  meal_type: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  custom_name: string | null;
  servings: number;
  notes: string | null;
  display_order: number;
  recipe?: {
    id: string;
    name: string;
    calories_per_serving: number | null;
    protein_per_serving: number | null;
  };
}

const DAYS = ['Zondag', 'Maandag', 'Dinsdag', 'Woensdag', 'Donderdag', 'Vrijdag', 'Zaterdag'];
const MEAL_TYPES = {
  breakfast: 'Ontbijt',
  lunch: 'Lunch',
  dinner: 'Diner',
  snack: 'Snack',
};

export const useMealPlans = () => {
  const { user } = useAuth();
  const [mealPlans, setMealPlans] = useState<MealPlan[]>([]);
  const [activeMealPlan, setActiveMealPlan] = useState<MealPlan | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchMealPlans = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('meal_plans')
        .select('*')
        .or(`created_by.eq.${user.id},assigned_to.eq.${user.id},is_template.eq.true`)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setMealPlans(data as MealPlan[] || []);

      // Find active meal plan
      const active = data?.find(mp => mp.is_active && mp.assigned_to === user.id);
      if (active) {
        await fetchMealPlanWithItems(active.id);
      }
    } catch (error) {
      console.error('Error fetching meal plans:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMealPlanWithItems = async (mealPlanId: string) => {
    try {
      const { data: mealPlan, error: mpError } = await supabase
        .from('meal_plans')
        .select('*')
        .eq('id', mealPlanId)
        .single();

      if (mpError) throw mpError;

      const { data: items, error: itemsError } = await supabase
        .from('meal_plan_items')
        .select(`
          *,
          recipe:recipes(id, name, calories_per_serving, protein_per_serving)
        `)
        .eq('meal_plan_id', mealPlanId)
        .order('day_of_week')
        .order('display_order');

      if (itemsError) throw itemsError;

      const fullMealPlan = {
        ...mealPlan,
        items: items || [],
      } as MealPlan;

      setActiveMealPlan(fullMealPlan);
      return fullMealPlan;
    } catch (error) {
      console.error('Error fetching meal plan:', error);
      return null;
    }
  };

  const createMealPlan = async (mealPlan: Partial<MealPlan>) => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('meal_plans')
        .insert({
          name: mealPlan.name || 'Nieuw maaltijdplan',
          description: mealPlan.description,
          start_date: mealPlan.start_date,
          end_date: mealPlan.end_date,
          is_template: mealPlan.is_template || false,
          created_by: user.id,
        })
        .select()
        .single();

      if (error) throw error;

      toast.success('Maaltijdplan aangemaakt!');
      fetchMealPlans();
      return data;
    } catch (error) {
      console.error('Error creating meal plan:', error);
      toast.error('Fout bij aanmaken maaltijdplan');
      return null;
    }
  };

  const addMealPlanItem = async (item: Omit<MealPlanItem, 'id' | 'recipe'>) => {
    try {
      const { error } = await supabase
        .from('meal_plan_items')
        .insert(item);

      if (error) throw error;

      if (activeMealPlan?.id === item.meal_plan_id) {
        await fetchMealPlanWithItems(item.meal_plan_id);
      }

      toast.success('Maaltijd toegevoegd!');
    } catch (error) {
      console.error('Error adding meal plan item:', error);
      toast.error('Fout bij toevoegen maaltijd');
    }
  };

  const removeMealPlanItem = async (itemId: string) => {
    try {
      const { error } = await supabase
        .from('meal_plan_items')
        .delete()
        .eq('id', itemId);

      if (error) throw error;

      if (activeMealPlan) {
        await fetchMealPlanWithItems(activeMealPlan.id);
      }

      toast.success('Maaltijd verwijderd');
    } catch (error) {
      console.error('Error removing meal plan item:', error);
      toast.error('Fout bij verwijderen maaltijd');
    }
  };

  useEffect(() => {
    fetchMealPlans();
  }, [user]);

  return {
    mealPlans,
    activeMealPlan,
    loading,
    fetchMealPlans,
    fetchMealPlanWithItems,
    createMealPlan,
    addMealPlanItem,
    removeMealPlanItem,
    DAYS,
    MEAL_TYPES,
  };
};
