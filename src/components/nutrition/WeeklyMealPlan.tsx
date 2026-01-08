import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Calendar, 
  Plus, 
  ShoppingCart, 
  ChevronLeft, 
  ChevronRight,
  Utensils,
  Coffee,
  Salad,
  Cookie,
  WifiOff
} from "lucide-react";
import { useOfflineMealPlans } from "@/hooks/useOfflineMealPlans";
import type { MealPlanItem } from "@/hooks/useMealPlans";
import { useShoppingList } from "@/hooks/useShoppingList";
import { cn } from "@/lib/utils";

const MEAL_ICONS = {
  breakfast: Coffee,
  lunch: Salad,
  dinner: Utensils,
  snack: Cookie,
};

const MEAL_LABELS = {
  breakfast: 'Ontbijt',
  lunch: 'Lunch',
  dinner: 'Diner',
  snack: 'Snack',
};

const DAYS_SHORT = ['Zo', 'Ma', 'Di', 'Wo', 'Do', 'Vr', 'Za'];
const DAYS_FULL = ['Zondag', 'Maandag', 'Dinsdag', 'Woensdag', 'Donderdag', 'Vrijdag', 'Zaterdag'];

export const WeeklyMealPlan = () => {
  const { activeMealPlan, loading, isFromCache, isOnline } = useOfflineMealPlans();
  const { generateFromMealPlan } = useShoppingList();
  const [selectedDay, setSelectedDay] = useState(new Date().getDay());

  if (loading) {
    return (
      <Card className="animate-pulse">
        <CardHeader>
          <div className="h-6 bg-muted rounded w-40" />
        </CardHeader>
        <CardContent>
          <div className="h-40 bg-muted rounded" />
        </CardContent>
      </Card>
    );
  }

  if (!activeMealPlan) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <Calendar className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="font-semibold mb-2">Geen actief maaltijdplan</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Je coach kan een weekmenu voor je aanmaken
          </p>
        </CardContent>
      </Card>
    );
  }

  const itemsForDay = activeMealPlan.items?.filter(
    item => item.day_of_week === selectedDay
  ) || [];

  const mealsByType = {
    breakfast: itemsForDay.filter(i => i.meal_type === 'breakfast'),
    lunch: itemsForDay.filter(i => i.meal_type === 'lunch'),
    dinner: itemsForDay.filter(i => i.meal_type === 'dinner'),
    snack: itemsForDay.filter(i => i.meal_type === 'snack'),
  };

  const totalCalories = itemsForDay.reduce((sum, item) => {
    const cals = item.recipe?.calories_per_serving || 0;
    return sum + (cals * (item.servings || 1));
  }, 0);

  const handleGenerateShoppingList = async () => {
    if (activeMealPlan) {
      await generateFromMealPlan(activeMealPlan.id, activeMealPlan.name);
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div className="flex items-center gap-2">
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            {activeMealPlan.name}
          </CardTitle>
          {isFromCache && (
            <Badge variant="secondary" className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
              <WifiOff className="h-3 w-3 mr-1" />
              Offline
            </Badge>
          )}
        </div>
        <Button 
          variant="outline" 
          size="sm"
          onClick={handleGenerateShoppingList}
          disabled={!isOnline}
        >
          <ShoppingCart className="h-4 w-4 mr-2" />
          Boodschappenlijst
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Day selector */}
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSelectedDay(prev => (prev - 1 + 7) % 7)}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          
          <div className="flex gap-1">
            {DAYS_SHORT.map((day, index) => (
              <Button
                key={day}
                variant={selectedDay === index ? "default" : "ghost"}
                size="sm"
                className={cn(
                  "w-10 h-10 p-0",
                  selectedDay === index && "font-bold"
                )}
                onClick={() => setSelectedDay(index)}
              >
                {day}
              </Button>
            ))}
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSelectedDay(prev => (prev + 1) % 7)}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        <div className="text-center">
          <h3 className="font-semibold">{DAYS_FULL[selectedDay]}</h3>
          {totalCalories > 0 && (
            <p className="text-sm text-muted-foreground">
              Totaal: {totalCalories} kcal
            </p>
          )}
        </div>

        {/* Meals for selected day */}
        <div className="space-y-3">
          {(Object.entries(mealsByType) as [keyof typeof mealsByType, MealPlanItem[]][]).map(([type, items]) => {
            const Icon = MEAL_ICONS[type];
            
            return (
              <div key={type} className="border rounded-lg p-3">
                <div className="flex items-center gap-2 mb-2">
                  <Icon className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium text-sm">{MEAL_LABELS[type]}</span>
                </div>
                
                {items.length === 0 ? (
                  <p className="text-sm text-muted-foreground italic">
                    Nog niet ingevuld
                  </p>
                ) : (
                  <div className="space-y-2">
                    {items.map(item => (
                      <div key={item.id} className="flex items-center justify-between">
                        <div>
                          <span className="text-sm">
                            {item.recipe?.name || item.custom_name}
                          </span>
                          {item.servings > 1 && (
                            <Badge variant="secondary" className="ml-2 text-xs">
                              {item.servings}x
                            </Badge>
                          )}
                        </div>
                        {item.recipe?.calories_per_serving && (
                          <span className="text-xs text-muted-foreground">
                            {item.recipe.calories_per_serving * item.servings} kcal
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};
