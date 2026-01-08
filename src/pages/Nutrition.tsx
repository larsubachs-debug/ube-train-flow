import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  ChevronLeft, 
  ChevronRight, 
  ChevronDown,
  Plus, 
  MoreHorizontal,
  Utensils,
  CalendarDays,
  BookOpen,
  RefreshCw,
  Flame,
  Trash2,
  Clock
} from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useTranslation } from "react-i18next";
import { useOfflineFoodLogs } from "@/hooks/useOfflineFoodLogs";
import { MealType } from "@/hooks/useFoodLogs";
import { AddFoodDialog } from "@/components/nutrition/AddFoodDialog";
import { RecipesList } from "@/components/nutrition/RecipesList";
import { WeeklyMealPlan } from "@/components/nutrition/WeeklyMealPlan";
import { ShoppingListCard } from "@/components/nutrition/ShoppingListCard";
import { OfflineBanner } from "@/components/ui/OfflineIndicator";
import { format } from "date-fns";
import { useAuth } from "@/contexts/AuthContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type NutritionTab = "log" | "plans" | "recipes";

// Demo meal data
const mealPlanData = {
  name: "Trainingsdag Maaltijden",
  totalCalories: 1473,
  macros: {
    carbs: { grams: 115, percentage: 38 },
    fat: { grams: 53, percentage: 17 },
    protein: { grams: 137, percentage: 45 },
  },
  meals: [
    {
      id: 1,
      type: "Ontbijt",
      name: "Havermout met Fruit",
      calories: 389,
      carbs: 60,
      fat: 5,
      protein: 27,
      emoji: "🥣",
    },
    {
      id: 2,
      type: "Lunch",
      name: "Gegrilde Kip Salade",
      calories: 374,
      carbs: 10,
      fat: 18,
      protein: 44,
      emoji: "🥗",
    },
    {
      id: 3,
      type: "Diner",
      name: "Vis met Gestoomde Groenten",
      calories: 335,
      carbs: 15,
      fat: 11,
      protein: 45,
      emoji: "🍽️",
    },
    {
      id: 4,
      type: "Snack",
      name: "Griekse Yoghurt & Noten",
      calories: 375,
      carbs: 30,
      fat: 19,
      protein: 21,
      emoji: "🥜",
    },
  ],
};

const recipeBooks = [
  {
    id: 1,
    name: "High-Protein Power",
    recipeCount: 12,
    gradient: "from-pink-200 via-pink-100 to-rose-50",
    recipes: [
      { id: 1, name: "Griekse Yoghurt Bowl", time: "10 min", calories: 320, protein: 28 },
      { id: 2, name: "Kipfilet met Quinoa", time: "25 min", calories: 450, protein: 42 },
      { id: 3, name: "Ei Wrap met Avocado", time: "15 min", calories: 380, protein: 24 },
    ],
  },
  {
    id: 2,
    name: "Snelle Recepten",
    recipeCount: 16,
    gradient: "from-orange-200 via-amber-100 to-yellow-50",
    recipes: [
      { id: 1, name: "Overnight Oats", time: "5 min", calories: 350, protein: 12 },
      { id: 2, name: "Tonijn Salade", time: "10 min", calories: 280, protein: 32 },
      { id: 3, name: "Smoothie Bowl", time: "5 min", calories: 290, protein: 15 },
    ],
  },
  {
    id: 3,
    name: "Meal Prep Favoriet",
    recipeCount: 8,
    gradient: "from-green-200 via-emerald-100 to-teal-50",
    recipes: [
      { id: 1, name: "Kip Teriyaki Bowl", time: "30 min", calories: 520, protein: 38 },
      { id: 2, name: "Groentelasagne", time: "45 min", calories: 380, protein: 22 },
      { id: 3, name: "Buddha Bowl", time: "20 min", calories: 420, protein: 18 },
    ],
  },
];

const mealTypes: { id: MealType; label: string; emoji: string }[] = [
  { id: "breakfast", label: "Ontbijt", emoji: "🥐" },
  { id: "lunch", label: "Lunch", emoji: "🥪" },
  { id: "dinner", label: "Diner", emoji: "🍽️" },
  { id: "snacks", label: "Snacks", emoji: "🍌" },
];

const Nutrition = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<NutritionTab>("log");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [addFoodDialog, setAddFoodDialog] = useState<{ open: boolean; mealType: MealType; label: string }>({
    open: false,
    mealType: "breakfast",
    label: "Ontbijt",
  });

  const { loggedMeals, totals, isLoading, isOnline, hasPendingActions, addFoodLog, deleteFoodLog } = useOfflineFoodLogs(currentDate);

  const formatDate = (date: Date) => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === today.toDateString()) return "Vandaag";
    if (date.toDateString() === yesterday.toDateString()) return "Gisteren";
    if (date.toDateString() === tomorrow.toDateString()) return "Morgen";
    return date.toLocaleDateString("nl-NL", { weekday: "short", day: "numeric", month: "short" });
  };

  const navigateDate = (direction: "prev" | "next") => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + (direction === "next" ? 1 : -1));
    setCurrentDate(newDate);
  };

  const handleAddFood = (data: { name: string; calories: number; carbs: number; fat: number; protein: number }) => {
    addFoodLog.mutate({
      meal_type: addFoodDialog.mealType,
      name: data.name,
      calories: data.calories,
      carbs: data.carbs,
      fat: data.fat,
      protein: data.protein,
      log_date: format(currentDate, "yyyy-MM-dd"),
    });
  };

  const tabs = [
    { id: "log" as const, label: "Log Voeding", icon: Utensils },
    { id: "plans" as const, label: "Maaltijdplan", icon: CalendarDays },
    { id: "recipes" as const, label: "Recepten", icon: BookOpen },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Offline Banner */}
      <OfflineBanner />
      
      {/* Header */}
      <div className="sticky top-0 z-40 bg-background border-b border-border">
        <div className="px-4 py-4">
          <h1 className="text-xl font-semibold text-center">Voeding</h1>
        </div>
        
        {/* Tab Navigation */}
        <div className="px-4 pb-3">
          <div className="flex bg-muted rounded-xl p-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    activeTab === tab.id
                      ? "bg-card text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span className="hidden sm:inline">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="px-4 py-4">
        {/* Log Food Tab */}
        {activeTab === "log" && (
          <div className="space-y-4">
            {/* Date Navigator & Macro Overview */}
            <Card className="p-4">
              {/* Date Navigation */}
              <div className="flex items-center justify-between mb-6">
                <Button variant="ghost" size="icon" onClick={() => navigateDate("prev")}>
                  <ChevronLeft className="h-5 w-5" />
                </Button>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-lg">{formatDate(currentDate)}</span>
                </div>
                <Button variant="ghost" size="icon" onClick={() => navigateDate("next")}>
                  <ChevronRight className="h-5 w-5" />
                </Button>
              </div>

              {/* Macro Circle & Stats */}
              <div className="flex items-center justify-between">
                {/* Calorie Circle */}
                <div className="relative w-24 h-24">
                  <svg className="w-24 h-24 -rotate-90" viewBox="0 0 100 100">
                    <circle
                      cx="50"
                      cy="50"
                      r="42"
                      fill="none"
                      stroke="hsl(var(--muted))"
                      strokeWidth="8"
                    />
                    <circle
                      cx="50"
                      cy="50"
                      r="42"
                      fill="none"
                      stroke="hsl(var(--accent))"
                      strokeWidth="8"
                      strokeLinecap="round"
                      strokeDasharray={`${(totals.calories / 2000) * 264} 264`}
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-2xl font-bold">{totals.calories}</span>
                    <span className="text-xs text-muted-foreground">cal</span>
                  </div>
                </div>

                {/* Macro Stats */}
                <div className="flex-1 grid grid-cols-3 gap-4 pl-6">
                  <div className="text-center">
                    <p className="text-sm font-semibold text-blue-500">
                      {totals.calories > 0 ? Math.round((totals.carbs * 4 / totals.calories) * 100) : 0}%
                    </p>
                    <p className="text-lg font-bold">{Math.round(totals.carbs)}g</p>
                    <p className="text-xs text-muted-foreground">Koolh.</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-semibold text-pink-500">
                      {totals.calories > 0 ? Math.round((totals.fat * 9 / totals.calories) * 100) : 0}%
                    </p>
                    <p className="text-lg font-bold">{Math.round(totals.fat)}g</p>
                    <p className="text-xs text-muted-foreground">Vet</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-semibold text-cyan-500">
                      {totals.calories > 0 ? Math.round((totals.protein * 4 / totals.calories) * 100) : 0}%
                    </p>
                    <p className="text-lg font-bold">{Math.round(totals.protein)}g</p>
                    <p className="text-xs text-muted-foreground">Eiwit</p>
                  </div>
                </div>
              </div>
            </Card>

            {/* Meal Cards */}
            {mealTypes.map((mealType) => (
              <Card key={mealType.id} className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{mealType.emoji}</span>
                    <h3 className="font-semibold">{mealType.label}</h3>
                  </div>
                  <Button variant="ghost" size="icon">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </div>
                
                {loggedMeals[mealType.id]?.length > 0 ? (
                  <div className="space-y-2">
                    {loggedMeals[mealType.id].map((meal) => (
                      <div key={meal.id} className="flex items-center justify-between py-2 border-t border-border">
                        <div className="flex-1">
                          <span className="font-medium">{meal.name}</span>
                          <div className="flex gap-2 text-xs text-muted-foreground mt-0.5">
                            <span>{Math.round(meal.carbs)}g K</span>
                            <span>{Math.round(meal.fat)}g V</span>
                            <span>{Math.round(meal.protein)}g E</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground">{meal.calories} cal</span>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                className="text-destructive"
                                onClick={() => deleteFoodLog.mutate(meal.id)}
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Verwijderen
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    ))}
                    <button 
                      className="w-full py-2 text-left text-muted-foreground hover:text-foreground transition-colors"
                      onClick={() => setAddFoodDialog({ open: true, mealType: mealType.id, label: mealType.label })}
                    >
                      <span className="flex items-center gap-2">
                        <Plus className="h-4 w-4" />
                        Meer toevoegen
                      </span>
                    </button>
                  </div>
                ) : (
                  <button 
                    className="w-full py-3 text-left text-muted-foreground hover:text-foreground transition-colors border-t border-border"
                    onClick={() => setAddFoodDialog({ open: true, mealType: mealType.id, label: mealType.label })}
                  >
                    <span className="flex items-center gap-2">
                      <Plus className="h-4 w-4" />
                      Voeding toevoegen
                    </span>
                  </button>
                )}
              </Card>
            ))}
          </div>
        )}

        {/* Meal Plans Tab */}
        {activeTab === "plans" && (
          <div className="space-y-4">
            <WeeklyMealPlan />
            <ShoppingListCard />
          </div>
        )}

        {/* Recipe Books Tab */}
        {activeTab === "recipes" && (
          <RecipesList />
        )}
      </div>

      <AddFoodDialog
        open={addFoodDialog.open}
        onOpenChange={(open) => setAddFoodDialog((prev) => ({ ...prev, open }))}
        mealType={addFoodDialog.mealType}
        mealLabel={addFoodDialog.label}
        onAdd={handleAddFood}
        isLoading={addFoodLog.isPending}
      />
    </div>
  );
};

export default Nutrition;
