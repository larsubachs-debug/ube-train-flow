import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Target, Trash2, Loader2, CheckCircle2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { format, startOfWeek, endOfWeek } from "date-fns";
import { nl } from "date-fns/locale";

interface HabitAssignmentProps {
  memberId: string;
  memberUserId: string;
}

interface MemberHabit {
  id: string;
  habit_id: string | null;
  custom_title: string | null;
  custom_description: string | null;
  frequency: string;
  assigned_by: string | null;
  is_active: boolean;
  start_date: string;
  habits_library?: {
    title: string;
    description: string | null;
  } | null;
}

export const HabitAssignment = ({ memberId, memberUserId }: HabitAssignmentProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newHabit, setNewHabit] = useState({ title: "", description: "" });

  const today = format(new Date(), "yyyy-MM-dd");
  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
  const weekEnd = endOfWeek(new Date(), { weekStartsOn: 1 });

  // Fetch member's habits
  const { data: habits = [], isLoading } = useQuery({
    queryKey: ["member-habits", memberId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("member_habits")
        .select(`
          id,
          habit_id,
          custom_title,
          custom_description,
          frequency,
          assigned_by,
          is_active,
          start_date,
          habits_library (
            title,
            description
          )
        `)
        .eq("member_id", memberId)
        .eq("is_active", true)
        .order("created_at", { ascending: true });

      if (error) throw error;
      return data as MemberHabit[];
    },
  });

  // Fetch completions for this week
  const { data: completions = [] } = useQuery({
    queryKey: ["member-habit-completions", memberId],
    queryFn: async () => {
      const habitIds = habits.map(h => h.id);
      if (habitIds.length === 0) return [];

      const { data, error } = await supabase
        .from("habit_completions")
        .select("id, member_habit_id, completion_date")
        .in("member_habit_id", habitIds)
        .gte("completion_date", format(weekStart, "yyyy-MM-dd"))
        .lte("completion_date", format(weekEnd, "yyyy-MM-dd"));

      if (error) throw error;
      return data;
    },
    enabled: habits.length > 0,
  });

  // Add habit mutation
  const addHabitMutation = useMutation({
    mutationFn: async (habitData: { title: string; description: string }) => {
      // Get coach's profile ID
      const { data: coachProfile } = await supabase
        .from("profiles")
        .select("id")
        .eq("user_id", user?.id)
        .single();

      if (!coachProfile) throw new Error("Coach profile not found");

      const { data, error } = await supabase
        .from("member_habits")
        .insert({
          member_id: memberId,
          custom_title: habitData.title.trim(),
          custom_description: habitData.description.trim() || null,
          frequency: "daily",
          assigned_by: coachProfile.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["member-habits", memberId] });
      setNewHabit({ title: "", description: "" });
      setIsAddDialogOpen(false);
      toast({
        title: "Gewoonte toegevoegd",
        description: "De gewoonte is toegewezen aan het lid",
      });
    },
    onError: (error) => {
      console.error("Error adding habit:", error);
      toast({
        title: "Fout",
        description: "Kon gewoonte niet toevoegen",
        variant: "destructive",
      });
    },
  });

  // Delete habit mutation
  const deleteHabitMutation = useMutation({
    mutationFn: async (habitId: string) => {
      const { error } = await supabase
        .from("member_habits")
        .delete()
        .eq("id", habitId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["member-habits", memberId] });
      toast({
        title: "Verwijderd",
        description: "Gewoonte is verwijderd",
      });
    },
    onError: (error) => {
      console.error("Error deleting habit:", error);
      toast({
        title: "Fout",
        description: "Kon gewoonte niet verwijderen",
        variant: "destructive",
      });
    },
  });

  const getHabitTitle = (habit: MemberHabit) => {
    return habit.habits_library?.title || habit.custom_title || "Onbekende gewoonte";
  };

  const getWeeklyCompletions = (habitId: string) => {
    return completions.filter(c => c.member_habit_id === habitId).length;
  };

  const isCompletedToday = (habitId: string) => {
    return completions.some(
      c => c.member_habit_id === habitId && c.completion_date === today
    );
  };

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="space-y-4">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold">Gewoontes</h3>
          <p className="text-sm text-muted-foreground">
            Wijs gewoontes toe die het lid dagelijks moet uitvoeren
          </p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-2">
              <Plus className="w-4 h-4" />
              Toevoegen
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nieuwe gewoonte toewijzen</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="habit-title">Titel</Label>
                <Input
                  id="habit-title"
                  placeholder="bijv. 8 glazen water drinken"
                  value={newHabit.title}
                  onChange={(e) => setNewHabit(prev => ({ ...prev, title: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="habit-description">Beschrijving (optioneel)</Label>
                <Textarea
                  id="habit-description"
                  placeholder="Extra uitleg over de gewoonte"
                  value={newHabit.description}
                  onChange={(e) => setNewHabit(prev => ({ ...prev, description: e.target.value }))}
                />
              </div>
              <Button
                onClick={() => addHabitMutation.mutate(newHabit)}
                disabled={!newHabit.title.trim() || addHabitMutation.isPending}
                className="w-full"
              >
                {addHabitMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  "Toewijzen"
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {habits.length === 0 ? (
        <div className="text-center py-8 border-2 border-dashed rounded-lg">
          <Target className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground mb-2">Geen gewoontes toegewezen</p>
          <p className="text-sm text-muted-foreground">
            Voeg gewoontes toe die dit lid dagelijks moet uitvoeren
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {habits.map((habit) => {
            const weeklyCount = getWeeklyCompletions(habit.id);
            const completedToday = isCompletedToday(habit.id);
            const isCoachAssigned = habit.assigned_by !== null;

            return (
              <div
                key={habit.id}
                className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    completedToday ? "bg-foreground text-background" : "bg-muted"
                  }`}>
                    {completedToday ? (
                      <CheckCircle2 className="w-4 h-4" />
                    ) : (
                      <Target className="w-4 h-4 text-muted-foreground" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium">{getHabitTitle(habit)}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-muted-foreground">
                        Deze week: {weeklyCount}/7
                      </span>
                      {isCoachAssigned ? (
                        <Badge variant="secondary" className="text-xs">Coach</Badge>
                      ) : (
                        <Badge variant="outline" className="text-xs">Zelf</Badge>
                      )}
                    </div>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-destructive"
                  onClick={() => deleteHabitMutation.mutate(habit.id)}
                  disabled={deleteHabitMutation.isPending}
                >
                  {deleteHabitMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Trash2 className="w-4 h-4" />
                  )}
                </Button>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
};
