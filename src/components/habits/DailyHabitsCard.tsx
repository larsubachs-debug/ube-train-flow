import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Sparkles } from "lucide-react";

interface MemberHabit {
  id: string;
  habit_id: string | null;
  custom_title: string | null;
  custom_description: string | null;
  habits_library: {
    title: string;
    description: string | null;
  } | null;
}

export const DailyHabitsCard = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [habits, setHabits] = useState<MemberHabit[]>([]);
  const [completions, setCompletions] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadHabits();
    }
  }, [user]);

  const loadHabits = async () => {
    if (!user) return;

    setLoading(true);
    const today = new Date().toISOString().split('T')[0];

    // Get user's profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (!profile) {
      setLoading(false);
      return;
    }

    // Get active habits
    const { data: memberHabits } = await supabase
      .from('member_habits')
      .select(`
        id,
        habit_id,
        custom_title,
        custom_description,
        habits_library (
          title,
          description
        )
      `)
      .eq('member_id', profile.id)
      .eq('is_active', true);

    if (!memberHabits || memberHabits.length === 0) {
      setHabits([]);
      setLoading(false);
      return;
    }

    // Get today's completions
    const habitIds = memberHabits.map(h => h.id);
    const { data: todayCompletions } = await supabase
      .from('habit_completions')
      .select('member_habit_id')
      .in('member_habit_id', habitIds)
      .eq('completion_date', today);

    const completedIds = new Set(todayCompletions?.map(c => c.member_habit_id) || []);

    setHabits(memberHabits as MemberHabit[]);
    setCompletions(completedIds);
    setLoading(false);
  };

  const toggleHabit = async (habitId: string) => {
    if (!user) return;

    const today = new Date().toISOString().split('T')[0];
    const isCompleted = completions.has(habitId);

    if (isCompleted) {
      // Remove completion
      const { error } = await supabase
        .from('habit_completions')
        .delete()
        .eq('member_habit_id', habitId)
        .eq('completion_date', today);

      if (error) {
        toast({
          title: "Fout",
          description: "Kon gewoonte niet ongedaan maken",
          variant: "destructive"
        });
        return;
      }

      setCompletions(prev => {
        const next = new Set(prev);
        next.delete(habitId);
        return next;
      });
    } else {
      // Add completion
      const { error } = await supabase
        .from('habit_completions')
        .insert({
          member_habit_id: habitId,
          user_id: user.id,
          completion_date: today
        });

      if (error) {
        toast({
          title: "Fout",
          description: "Kon gewoonte niet voltooien",
          variant: "destructive"
        });
        return;
      }

      setCompletions(prev => new Set([...prev, habitId]));

      toast({
        title: "Goed bezig! 🎉",
        description: "Gewoonte voltooid voor vandaag!",
      });
    }
  };

  const getTitle = (habit: MemberHabit) => {
    return habit.custom_title || habit.habits_library?.title || 'Gewoonte';
  };

  if (loading) {
    return (
      <Card className="p-3 bg-muted/30 border-border/40">
        <div className="flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Gewoontes laden...</span>
        </div>
      </Card>
    );
  }

  if (habits.length === 0) {
    return null;
  }

  const completedCount = habits.filter(h => completions.has(h.id)).length;

  return (
    <Card className="p-3 bg-muted/30 border-border/40">
      <div className="flex items-center gap-2 mb-3">
        <Sparkles className="h-5 w-5 text-muted-foreground" />
        <div className="flex-1">
          <p className="text-sm font-medium text-foreground">Dagelijkse Gewoontes</p>
          <p className="text-xs text-muted-foreground">{completedCount}/{habits.length} voltooid</p>
        </div>
      </div>
      
      <div className="space-y-2">
        {habits.map((habit) => {
          const isCompleted = completions.has(habit.id);
          return (
            <div 
              key={habit.id}
              className={`flex items-center gap-3 p-2 rounded-lg transition-all ${
                isCompleted ? 'bg-primary/10' : 'bg-background/50'
              }`}
            >
              <Checkbox
                checked={isCompleted}
                onCheckedChange={() => toggleHabit(habit.id)}
              />
              <span className={`text-sm flex-1 ${
                isCompleted ? 'line-through text-muted-foreground' : 'text-foreground'
              }`}>
                {getTitle(habit)}
              </span>
            </div>
          );
        })}
      </div>
    </Card>
  );
};
