import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Target, Flame, CheckCircle2, Loader2, Trash2, User } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import BottomNav from "@/components/BottomNav";
import { format, startOfWeek, endOfWeek, isWithinInterval, parseISO } from "date-fns";
import { nl } from "date-fns/locale";

interface MemberHabit {
  id: string;
  habit_id: string | null;
  custom_title: string | null;
  custom_description: string | null;
  custom_icon: string | null;
  frequency: string;
  assigned_by: string | null;
  is_active: boolean;
  start_date: string;
  habits_library?: {
    title: string;
    description: string | null;
    icon: string | null;
  } | null;
}

interface HabitCompletion {
  id: string;
  member_habit_id: string;
  completion_date: string;
}

const Habits = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [habits, setHabits] = useState<MemberHabit[]>([]);
  const [completions, setCompletions] = useState<HabitCompletion[]>([]);
  const [loading, setLoading] = useState(true);
  const [completing, setCompleting] = useState<string | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newHabit, setNewHabit] = useState({ title: "", description: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const today = format(new Date(), "yyyy-MM-dd");
  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
  const weekEnd = endOfWeek(new Date(), { weekStartsOn: 1 });

  useEffect(() => {
    if (user) {
      fetchHabits();
    }
  }, [user]);

  const fetchHabits = async () => {
    if (!user) return;

    try {
      // Get user's profile ID
      const { data: profile } = await supabase
        .from("profiles")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (!profile) return;

      // Fetch active habits
      const { data: habitsData, error: habitsError } = await supabase
        .from("member_habits")
        .select(`
          id,
          habit_id,
          custom_title,
          custom_description,
          custom_icon,
          frequency,
          assigned_by,
          is_active,
          start_date,
          habits_library (
            title,
            description,
            icon
          )
        `)
        .eq("member_id", profile.id)
        .eq("is_active", true)
        .order("created_at", { ascending: true });

      if (habitsError) throw habitsError;

      setHabits(habitsData || []);

      // Fetch completions for this week
      const habitIds = habitsData?.map(h => h.id) || [];
      if (habitIds.length > 0) {
        const { data: completionsData, error: completionsError } = await supabase
          .from("habit_completions")
          .select("id, member_habit_id, completion_date")
          .in("member_habit_id", habitIds)
          .gte("completion_date", format(weekStart, "yyyy-MM-dd"))
          .lte("completion_date", format(weekEnd, "yyyy-MM-dd"));

        if (completionsError) throw completionsError;
        setCompletions(completionsData || []);
      }
    } catch (error) {
      console.error("Error fetching habits:", error);
      toast({
        title: "Fout",
        description: "Kon gewoontes niet laden",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleCompletion = async (habitId: string) => {
    if (!user) return;

    setCompleting(habitId);

    const existingCompletion = completions.find(
      c => c.member_habit_id === habitId && c.completion_date === today
    );

    try {
      if (existingCompletion) {
        // Remove completion
        const { error } = await supabase
          .from("habit_completions")
          .delete()
          .eq("id", existingCompletion.id);

        if (error) throw error;

        setCompletions(prev => prev.filter(c => c.id !== existingCompletion.id));
      } else {
        // Add completion
        const { data, error } = await supabase
          .from("habit_completions")
          .insert({
            member_habit_id: habitId,
            user_id: user.id,
            completion_date: today,
          })
          .select()
          .single();

        if (error) throw error;

        setCompletions(prev => [...prev, data]);
      }
    } catch (error) {
      console.error("Error toggling completion:", error);
      toast({
        title: "Fout",
        description: "Kon status niet bijwerken",
        variant: "destructive",
      });
    } finally {
      setCompleting(null);
    }
  };

  const addHabit = async () => {
    if (!user || !newHabit.title.trim()) return;

    setIsSubmitting(true);

    try {
      const { data: profile } = await supabase
        .from("profiles")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (!profile) throw new Error("Profile not found");

      const { data, error } = await supabase
        .from("member_habits")
        .insert({
          member_id: profile.id,
          custom_title: newHabit.title.trim(),
          custom_description: newHabit.description.trim() || null,
          frequency: "daily",
          assigned_by: null,
        })
        .select(`
          id,
          habit_id,
          custom_title,
          custom_description,
          custom_icon,
          frequency,
          assigned_by,
          is_active,
          start_date
        `)
        .single();

      if (error) throw error;

      setHabits(prev => [...prev, data]);
      setNewHabit({ title: "", description: "" });
      setIsAddDialogOpen(false);

      toast({
        title: "Gewoonte toegevoegd",
        description: "Je nieuwe gewoonte is opgeslagen",
      });
    } catch (error) {
      console.error("Error adding habit:", error);
      toast({
        title: "Fout",
        description: "Kon gewoonte niet toevoegen",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const deleteHabit = async (habitId: string, assignedBy: string | null) => {
    if (assignedBy !== null) {
      toast({
        title: "Niet toegestaan",
        description: "Je kunt alleen je eigen gewoontes verwijderen",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from("member_habits")
        .delete()
        .eq("id", habitId);

      if (error) throw error;

      setHabits(prev => prev.filter(h => h.id !== habitId));
      setCompletions(prev => prev.filter(c => c.member_habit_id !== habitId));

      toast({
        title: "Verwijderd",
        description: "Gewoonte is verwijderd",
      });
    } catch (error) {
      console.error("Error deleting habit:", error);
      toast({
        title: "Fout",
        description: "Kon gewoonte niet verwijderen",
        variant: "destructive",
      });
    }
  };

  const getHabitTitle = (habit: MemberHabit) => {
    return habit.habits_library?.title || habit.custom_title || "Onbekende gewoonte";
  };

  const getHabitDescription = (habit: MemberHabit) => {
    return habit.habits_library?.description || habit.custom_description;
  };

  const isCompletedToday = (habitId: string) => {
    return completions.some(
      c => c.member_habit_id === habitId && c.completion_date === today
    );
  };

  const getWeeklyProgress = (habitId: string) => {
    const habitCompletions = completions.filter(c => c.member_habit_id === habitId);
    return habitCompletions.length;
  };

  // Calculate streak (consecutive days)
  const totalCompletedToday = habits.filter(h => isCompletedToday(h.id)).length;
  const totalHabits = habits.length;

  if (loading) {
    return (
      <div className="min-h-screen pb-20 bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20 bg-background">
      {/* Header */}
      <div className="px-6 pt-6 pb-4">
        <h1 className="text-2xl font-bold text-foreground">Gewoontes</h1>
        <p className="text-sm text-muted-foreground">Bouw gezonde gewoontes op</p>
      </div>

      <div className="px-6 space-y-6">
        {/* Today's Progress */}
        <Card className="bg-foreground text-background">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-background/10 flex items-center justify-center">
                  <Flame className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm opacity-80">Vandaag</p>
                  <p className="text-2xl font-bold">
                    {totalCompletedToday}/{totalHabits}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm opacity-80">{format(new Date(), "EEEE", { locale: nl })}</p>
                <p className="text-lg font-semibold">{format(new Date(), "d MMMM", { locale: nl })}</p>
              </div>
            </div>

            {/* Progress bar */}
            {totalHabits > 0 && (
              <div className="mt-4">
                <div className="h-2 bg-background/20 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-background/80 rounded-full transition-all duration-500"
                    style={{ width: `${(totalCompletedToday / totalHabits) * 100}%` }}
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Habits List */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground">Jouw gewoontes</h2>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" variant="outline" className="gap-2">
                  <Plus className="w-4 h-4" />
                  Toevoegen
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Nieuwe gewoonte</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Titel</Label>
                    <Input
                      id="title"
                      placeholder="bijv. 8 glazen water drinken"
                      value={newHabit.title}
                      onChange={(e) => setNewHabit(prev => ({ ...prev, title: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Beschrijving (optioneel)</Label>
                    <Textarea
                      id="description"
                      placeholder="Waarom is deze gewoonte belangrijk?"
                      value={newHabit.description}
                      onChange={(e) => setNewHabit(prev => ({ ...prev, description: e.target.value }))}
                    />
                  </div>
                  <Button
                    onClick={addHabit}
                    disabled={!newHabit.title.trim() || isSubmitting}
                    className="w-full"
                  >
                    {isSubmitting ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      "Toevoegen"
                    )}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {habits.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-8 text-center">
                <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4">
                  <Target className="w-6 h-6 text-muted-foreground" />
                </div>
                <h3 className="font-medium text-foreground mb-1">Geen gewoontes</h3>
                <p className="text-sm text-muted-foreground max-w-xs mb-4">
                  Voeg je eerste gewoonte toe of vraag je coach om gewoontes voor je in te stellen
                </p>
                <Button onClick={() => setIsAddDialogOpen(true)} variant="outline" className="gap-2">
                  <Plus className="w-4 h-4" />
                  Eerste gewoonte toevoegen
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {habits.map((habit) => {
                const completed = isCompletedToday(habit.id);
                const weeklyProgress = getWeeklyProgress(habit.id);
                const isCoachAssigned = habit.assigned_by !== null;

                return (
                  <Card
                    key={habit.id}
                    className={`transition-all ${completed ? "bg-muted/50 border-muted" : ""}`}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <button
                          onClick={() => toggleCompletion(habit.id)}
                          disabled={completing === habit.id}
                          className={`mt-0.5 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all flex-shrink-0 ${
                            completed
                              ? "bg-foreground border-foreground"
                              : "border-muted-foreground hover:border-foreground"
                          }`}
                        >
                          {completing === habit.id ? (
                            <Loader2 className="w-3 h-3 animate-spin text-muted-foreground" />
                          ) : completed ? (
                            <CheckCircle2 className="w-4 h-4 text-background" />
                          ) : null}
                        </button>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <h3
                                className={`font-medium ${
                                  completed ? "text-muted-foreground line-through" : "text-foreground"
                                }`}
                              >
                                {getHabitTitle(habit)}
                              </h3>
                              {getHabitDescription(habit) && (
                                <p className="text-sm text-muted-foreground mt-0.5">
                                  {getHabitDescription(habit)}
                                </p>
                              )}
                            </div>
                            <div className="flex items-center gap-1">
                              {isCoachAssigned && (
                                <div className="px-2 py-0.5 bg-primary/10 rounded-full">
                                  <span className="text-xs text-primary font-medium flex items-center gap-1">
                                    <User className="w-3 h-3" />
                                    Coach
                                  </span>
                                </div>
                              )}
                              {!isCoachAssigned && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                  onClick={() => deleteHabit(habit.id, habit.assigned_by)}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              )}
                            </div>
                          </div>

                          {/* Weekly progress dots */}
                          <div className="flex items-center gap-1 mt-2">
                            <span className="text-xs text-muted-foreground mr-1">Deze week:</span>
                            {[0, 1, 2, 3, 4, 5, 6].map((day) => {
                              const date = new Date(weekStart);
                              date.setDate(date.getDate() + day);
                              const dateStr = format(date, "yyyy-MM-dd");
                              const isCompleted = completions.some(
                                c => c.member_habit_id === habit.id && c.completion_date === dateStr
                              );
                              const isToday = dateStr === today;

                              return (
                                <div
                                  key={day}
                                  className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-medium ${
                                    isCompleted
                                      ? "bg-foreground text-background"
                                      : isToday
                                      ? "border-2 border-foreground text-foreground"
                                      : "bg-muted text-muted-foreground"
                                  }`}
                                >
                                  {format(date, "EEEEE", { locale: nl })}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <BottomNav />
    </div>
  );
};

export default Habits;
