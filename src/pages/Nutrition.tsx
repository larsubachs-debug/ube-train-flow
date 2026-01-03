import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  MoreHorizontal,
  Utensils,
  CalendarDays,
  BookOpen,
  RefreshCw,
  Flame
} from "lucide-react";
import BottomNav from "@/components/BottomNav";
import { useTranslation } from "react-i18next";

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
  },
  {
    id: 2,
    name: "Snelle Recepten",
    recipeCount: 16,
    gradient: "from-orange-200 via-amber-100 to-yellow-50",
  },
  {
    id: 3,
    name: "Meal Prep Favoriet",
    recipeCount: 8,
    gradient: "from-green-200 via-emerald-100 to-teal-50",
  },
];

const mealTypes = [
  { id: "breakfast", label: "Ontbijt", emoji: "🥐" },
  { id: "lunch", label: "Lunch", emoji: "🥪" },
  { id: "dinner", label: "Diner", emoji: "🍽️" },
  { id: "snacks", label: "Snacks", emoji: "🍌" },
];

const Nutrition = () => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<NutritionTab>("log");
  const [currentDate, setCurrentDate] = useState(new Date());
  
  // Demo: empty log for today
  const [loggedMeals, setLoggedMeals] = useState<Record<string, any[]>>({
    breakfast: [],
    lunch: [],
    dinner: [],
    snacks: [],
  });

  const totalCalories = Object.values(loggedMeals).flat().reduce((sum, meal) => sum + (meal?.calories || 0), 0);
  const totalCarbs = Object.values(loggedMeals).flat().reduce((sum, meal) => sum + (meal?.carbs || 0), 0);
  const totalFat = Object.values(loggedMeals).flat().reduce((sum, meal) => sum + (meal?.fat || 0), 0);
  const totalProtein = Object.values(loggedMeals).flat().reduce((sum, meal) => sum + (meal?.protein || 0), 0);

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

  const tabs = [
    { id: "log" as const, label: "Log Voeding", icon: Utensils },
    { id: "plans" as const, label: "Maaltijdplan", icon: CalendarDays },
    { id: "recipes" as const, label: "Recepten", icon: BookOpen },
  ];

  return (
    <div className="min-h-screen bg-background pb-24">
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
                      strokeDasharray={`${(totalCalories / 2000) * 264} 264`}
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-2xl font-bold">{totalCalories}</span>
                    <span className="text-xs text-muted-foreground">cal</span>
                  </div>
                </div>

                {/* Macro Stats */}
                <div className="flex-1 grid grid-cols-3 gap-4 pl-6">
                  <div className="text-center">
                    <p className="text-sm font-semibold text-blue-500">
                      {totalCalories > 0 ? Math.round((totalCarbs * 4 / (totalCalories || 1)) * 100) : 0}%
                    </p>
                    <p className="text-lg font-bold">{totalCarbs}g</p>
                    <p className="text-xs text-muted-foreground">Koolh.</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-semibold text-pink-500">
                      {totalCalories > 0 ? Math.round((totalFat * 9 / (totalCalories || 1)) * 100) : 0}%
                    </p>
                    <p className="text-lg font-bold">{totalFat}g</p>
                    <p className="text-xs text-muted-foreground">Vet</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-semibold text-cyan-500">
                      {totalCalories > 0 ? Math.round((totalProtein * 4 / (totalCalories || 1)) * 100) : 0}%
                    </p>
                    <p className="text-lg font-bold">{totalProtein}g</p>
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
                    {loggedMeals[mealType.id].map((meal: any, idx: number) => (
                      <div key={idx} className="flex items-center justify-between py-2 border-t border-border">
                        <span>{meal.name}</span>
                        <span className="text-muted-foreground">{meal.calories} cal</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <button className="w-full py-3 text-left text-muted-foreground hover:text-foreground transition-colors border-t border-border">
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
            {/* Active Meal Plan */}
            <Card className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-lg">{mealPlanData.name}</h2>
                <div className="flex gap-2">
                  <Button variant="ghost" size="icon">
                    <BookOpen className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon">
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Macro Overview */}
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
                    {/* Carbs segment */}
                    <circle
                      cx="50"
                      cy="50"
                      r="42"
                      fill="none"
                      stroke="#3B82F6"
                      strokeWidth="8"
                      strokeLinecap="round"
                      strokeDasharray={`${mealPlanData.macros.carbs.percentage * 2.64} 264`}
                      strokeDashoffset="0"
                    />
                    {/* Fat segment */}
                    <circle
                      cx="50"
                      cy="50"
                      r="42"
                      fill="none"
                      stroke="#EC4899"
                      strokeWidth="8"
                      strokeLinecap="round"
                      strokeDasharray={`${mealPlanData.macros.fat.percentage * 2.64} 264`}
                      strokeDashoffset={`${-mealPlanData.macros.carbs.percentage * 2.64}`}
                    />
                    {/* Protein segment */}
                    <circle
                      cx="50"
                      cy="50"
                      r="42"
                      fill="none"
                      stroke="#06B6D4"
                      strokeWidth="8"
                      strokeLinecap="round"
                      strokeDasharray={`${mealPlanData.macros.protein.percentage * 2.64} 264`}
                      strokeDashoffset={`${-(mealPlanData.macros.carbs.percentage + mealPlanData.macros.fat.percentage) * 2.64}`}
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-2xl font-bold">{mealPlanData.totalCalories}</span>
                    <span className="text-xs text-muted-foreground">cal</span>
                  </div>
                </div>

                {/* Macro Stats */}
                <div className="flex-1 grid grid-cols-3 gap-4 pl-6">
                  <div className="text-center">
                    <p className="text-sm font-semibold text-blue-500">{mealPlanData.macros.carbs.percentage}%</p>
                    <p className="text-lg font-bold">{mealPlanData.macros.carbs.grams}g</p>
                    <p className="text-xs text-muted-foreground">Koolh.</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-semibold text-pink-500">{mealPlanData.macros.fat.percentage}%</p>
                    <p className="text-lg font-bold">{mealPlanData.macros.fat.grams}g</p>
                    <p className="text-xs text-muted-foreground">Vet</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-semibold text-cyan-500">{mealPlanData.macros.protein.percentage}%</p>
                    <p className="text-lg font-bold">{mealPlanData.macros.protein.grams}g</p>
                    <p className="text-xs text-muted-foreground">Eiwit</p>
                  </div>
                </div>
              </div>
            </Card>

            {/* Meal List */}
            {mealPlanData.meals.map((meal) => (
              <Card key={meal.id} className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold">{meal.type}</h3>
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <Flame className="h-4 w-4" />
                    <span className="font-medium">{meal.calories}</span>
                    <span className="text-sm">kcals</span>
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  {/* Meal emoji placeholder */}
                  <div className="w-16 h-16 rounded-xl bg-muted flex items-center justify-center text-2xl">
                    {meal.emoji}
                  </div>
                  
                  <div className="flex-1">
                    <h4 className="font-medium mb-2">{meal.name}</h4>
                    <div className="flex gap-2">
                      <Badge variant="secondary" className="text-blue-600 bg-blue-50">
                        {meal.carbs}g K
                      </Badge>
                      <Badge variant="secondary" className="text-pink-600 bg-pink-50">
                        {meal.fat}g V
                      </Badge>
                      <Badge variant="secondary" className="text-cyan-600 bg-cyan-50">
                        {meal.protein}g E
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon">
                      <RefreshCw className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Recipe Books Tab */}
        {activeTab === "recipes" && (
          <div className="space-y-4">
            {recipeBooks.map((book) => (
              <Card 
                key={book.id} 
                className={`relative overflow-hidden h-48 bg-gradient-to-br ${book.gradient} border-0 cursor-pointer hover:shadow-lg transition-shadow`}
              >
                <div className="absolute inset-0 p-6 flex flex-col justify-end">
                  <h3 className="text-xl font-bold text-foreground mb-2">{book.name}</h3>
                  <Badge variant="secondary" className="w-fit bg-background/80 backdrop-blur-sm">
                    {book.recipeCount} RECEPTEN
                  </Badge>
                </div>
                
                {/* Decorative icon */}
                <div className="absolute right-4 bottom-4">
                  <Button variant="ghost" size="icon" className="bg-background/50 backdrop-blur-sm">
                    <BookOpen className="h-4 w-4" />
                  </Button>
                </div>
              </Card>
            ))}
            
            {/* Empty state prompt */}
            <Card className="p-6 text-center border-dashed">
              <BookOpen className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
              <h3 className="font-medium mb-1">Meer recepten nodig?</h3>
              <p className="text-sm text-muted-foreground">
                Vraag je coach om nieuwe receptenboeken toe te voegen.
              </p>
            </Card>
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
};

export default Nutrition;
