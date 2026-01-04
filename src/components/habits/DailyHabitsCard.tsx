import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Target, Flame } from "lucide-react";

interface MemberHabit {
  id: string;
  habit_id: string | null;
  custom_title: string | null;
  custom_description: string | null;
  habits_library: {
    title: string;
    description: string | null;
  } | null;
  streak?: number;
}

export const DailyHabitsCard = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [habits, setHabits] = useState<MemberHabit[]>([]);
  const [completions, setCompletions] = useState<Set<string>>(new Set());
  const [streaks, setStreaks] = useState<Map<string, number>>(new Map());
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

    // Calculate streaks for each habit
    const { data: allCompletions } = await supabase
      .from('habit_completions')
      .select('member_habit_id, completion_date')
      .in('member_habit_id', habitIds)
      .order('completion_date', { ascending: false });

    const habitStreaks = new Map<string, number>();
    
    for (const habitId of habitIds) {
      const habitCompletions = allCompletions
        ?.filter(c => c.member_habit_id === habitId)
        .map(c => c.completion_date)
        .sort((a, b) => new Date(b).getTime() - new Date(a).getTime()) || [];
      
      let streak = 0;
      const now = new Date();
      let checkDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      
      for (const completionDate of habitCompletions) {
        const compDate = new Date(completionDate);
        const checkDateStr = checkDate.toISOString().split('T')[0];
        
        if (completionDate === checkDateStr) {
          streak++;
          checkDate.setDate(checkDate.getDate() - 1);
        } else if (streak === 0 && completionDate === new Date(checkDate.getTime() - 86400000).toISOString().split('T')[0]) {
          // Allow yesterday if today not completed yet
          streak++;
          checkDate.setDate(checkDate.getDate() - 2);
        } else {
          break;
        }
      }
      
      habitStreaks.set(habitId, streak);
    }

    setHabits(memberHabits as MemberHabit[]);
    setCompletions(completedIds);
    setStreaks(habitStreaks);
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
        <Target className="h-5 w-5 text-muted-foreground" />
        <div className="flex-1">
          <p className="text-sm font-medium text-foreground">Dagelijkse Gewoontes</p>
          <p className="text-xs text-muted-foreground">{completedCount}/{habits.length} voltooid</p>
        </div>
      </div>
      
      <div className="space-y-2">
        {habits.map((habit) => {
          const isCompleted = completions.has(habit.id);
          const streak = streaks.get(habit.id) || 0;
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
              {streak > 0 && (
                <div className="flex items-center gap-1 text-xs text-orange-500">
                  <Flame className="h-3 w-3" />
                  <span className="font-medium">{streak}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </Card>
  );
};
