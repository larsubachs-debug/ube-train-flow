import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useLocalStorage } from './useLocalStorage';
import { useNetworkStatus } from './useNetworkStatus';
import { toast } from 'sonner';
import type { MealPlan, MealPlanItem } from './useMealPlans';

const CACHE_KEY = 'offline-meal-plans';
const ACTIVE_PLAN_CACHE_KEY = 'offline-active-meal-plan';

const DAYS = ['Zondag', 'Maandag', 'Dinsdag', 'Woensdag', 'Donderdag', 'Vrijdag', 'Zaterdag'];
const MEAL_TYPES = {
  breakfast: 'Ontbijt',
  lunch: 'Lunch',
  dinner: 'Diner',
  snack: 'Snack',
};

export const useOfflineMealPlans = () => {
  const { user } = useAuth();
  const { isOnline } = useNetworkStatus();
  const [mealPlans, setMealPlans] = useState<MealPlan[]>([]);
  const [activeMealPlan, setActiveMealPlan] = useState<MealPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFromCache, setIsFromCache] = useState(false);

  const [cachedMealPlans, setCachedMealPlans] = useLocalStorage<MealPlan[]>(CACHE_KEY, []);
  const [cachedActivePlan, setCachedActivePlan] = useLocalStorage<MealPlan | null>(ACTIVE_PLAN_CACHE_KEY, null);

  const fetchMealPlans = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    // If offline, use cached data
    if (!isOnline) {
      if (cachedMealPlans.length > 0) {
        setMealPlans(cachedMealPlans);
        setActiveMealPlan(cachedActivePlan);
        setIsFromCache(true);
      }
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('meal_plans')
        .select('*')
        .or(`created_by.eq.${user.id},assigned_to.eq.${user.id},is_template.eq.true`)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const plans = data as MealPlan[] || [];
      setMealPlans(plans);
      setCachedMealPlans(plans);
      setIsFromCache(false);

      // Find active meal plan
      const active = plans.find(mp => mp.is_active && mp.assigned_to === user.id);
      if (active) {
        await fetchMealPlanWithItems(active.id);
      }
    } catch (error) {
      console.error('Error fetching meal plans:', error);
      // Fallback to cache
      if (cachedMealPlans.length > 0) {
        setMealPlans(cachedMealPlans);
        setActiveMealPlan(cachedActivePlan);
        setIsFromCache(true);
      }
    } finally {
      setLoading(false);
    }
  }, [user, isOnline, cachedMealPlans, cachedActivePlan, setCachedMealPlans]);

  const fetchMealPlanWithItems = useCallback(async (mealPlanId: string) => {
    if (!isOnline && cachedActivePlan?.id === mealPlanId) {
      setActiveMealPlan(cachedActivePlan);
      return cachedActivePlan;
    }

    if (!isOnline) {
      return null;
    }

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
      setCachedActivePlan(fullMealPlan);
      return fullMealPlan;
    } catch (error) {
      console.error('Error fetching meal plan:', error);
      return cachedActivePlan;
    }
  }, [isOnline, cachedActivePlan, setCachedActivePlan]);

  const createMealPlan = useCallback(async (mealPlan: Partial<MealPlan>) => {
    if (!user) return null;

    if (!isOnline) {
      toast.error('Je moet online zijn om een maaltijdplan aan te maken');
      return null;
    }

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
  }, [user, isOnline, fetchMealPlans]);

  const addMealPlanItem = useCallback(async (item: Omit<MealPlanItem, 'id' | 'recipe'>) => {
    if (!isOnline) {
      toast.error('Je moet online zijn om items toe te voegen');
      return;
    }

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
  }, [isOnline, activeMealPlan, fetchMealPlanWithItems]);

  const removeMealPlanItem = useCallback(async (itemId: string) => {
    if (!isOnline) {
      toast.error('Je moet online zijn om items te verwijderen');
      return;
    }

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
  }, [isOnline, activeMealPlan, fetchMealPlanWithItems]);

  useEffect(() => {
    fetchMealPlans();
  }, [user, isOnline]);

  return {
    mealPlans,
    activeMealPlan,
    loading,
    isFromCache,
    isOnline,
    fetchMealPlans,
    fetchMealPlanWithItems,
    createMealPlan,
    addMealPlanItem,
    removeMealPlanItem,
    DAYS,
    MEAL_TYPES,
  };
};
