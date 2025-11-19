import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Target } from "lucide-react";
import * as LucideIcons from "lucide-react";

interface Task {
  id: string;
  member_task_id: string;
  title: string;
  description: string;
  icon: string;
  category: string;
  end_date: string;
  is_completed_today: boolean;
}

export const DailyTasksCard = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadTasks();
    }
  }, [user]);

  const loadTasks = async () => {
    if (!user) return;

    setLoading(true);
    const today = new Date().toISOString().split('T')[0];

    // Get user's profile id
    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (!profile) {
      setLoading(false);
      return;
    }

    // Get active tasks assigned to this member
    const { data: memberTasks } = await supabase
      .from('member_tasks')
      .select(`
        id,
        end_date,
        tasks_library (
          id,
          title,
          description,
          icon,
          category
        )
      `)
      .eq('member_id', profile.id)
      .eq('is_active', true)
      .gte('end_date', today)
      .lte('start_date', today);

    if (!memberTasks || memberTasks.length === 0) {
      setTasks([]);
      setLoading(false);
      return;
    }

    // Get today's completions
    const memberTaskIds = memberTasks.map(mt => mt.id);
    const { data: completions } = await supabase
      .from('task_completions')
      .select('member_task_id')
      .in('member_task_id', memberTaskIds)
      .eq('completion_date', today);

    const completedTaskIds = new Set(completions?.map(c => c.member_task_id) || []);

    // Format tasks
    const formattedTasks = memberTasks.map((mt: any) => ({
      id: mt.tasks_library.id,
      member_task_id: mt.id,
      title: mt.tasks_library.title,
      description: mt.tasks_library.description,
      icon: mt.tasks_library.icon,
      category: mt.tasks_library.category,
      end_date: mt.end_date,
      is_completed_today: completedTaskIds.has(mt.id)
    }));

    setTasks(formattedTasks);
    setLoading(false);
  };

  const handleToggleTask = async (task: Task) => {
    if (!user) return;

    const today = new Date().toISOString().split('T')[0];

    if (task.is_completed_today) {
      // Remove completion
      const { error } = await supabase
        .from('task_completions')
        .delete()
        .eq('member_task_id', task.member_task_id)
        .eq('completion_date', today);

      if (error) {
        toast({
          title: "Fout",
          description: "Kon taak niet ongedaan maken",
          variant: "destructive"
        });
        return;
      }
    } else {
      // Add completion
      const { error } = await supabase
        .from('task_completions')
        .insert({
          member_task_id: task.member_task_id,
          user_id: user.id,
          completion_date: today
        });

      if (error) {
        toast({
          title: "Fout",
          description: "Kon taak niet voltooien",
          variant: "destructive"
        });
        return;
      }

      toast({
        title: "Goed gedaan! 🎉",
        description: `Je hebt "${task.title}" voltooid!`,
      });
    }

    // Update local state
    setTasks(tasks.map(t => 
      t.member_task_id === task.member_task_id 
        ? { ...t, is_completed_today: !t.is_completed_today }
        : t
    ));
  };

  const getIcon = (iconName: string) => {
    const Icon = (LucideIcons as any)[iconName] || Target;
    return Icon;
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'nutrition': return 'from-green-500/10 to-green-600/10 border-green-500/30';
      case 'training': return 'from-blue-500/10 to-blue-600/10 border-blue-500/30';
      case 'lifestyle': return 'from-purple-500/10 to-purple-600/10 border-purple-500/30';
      default: return 'from-primary/10 to-accent/10 border-primary/30';
    }
  };

  if (loading) {
    return (
      <Card className="p-4 bg-gradient-to-br from-primary/5 to-primary/10">
        <div className="flex items-center gap-3">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
          <span className="text-sm text-muted-foreground">Taken laden...</span>
        </div>
      </Card>
    );
  }

  if (tasks.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      {tasks.map((task) => {
        const Icon = getIcon(task.icon);
        return (
          <Card 
            key={task.member_task_id} 
            className={`p-4 bg-gradient-to-br ${getCategoryColor(task.category)} transition-all ${
              task.is_completed_today ? 'opacity-60' : ''
            }`}
          >
            <div className="flex items-start gap-3">
              <Checkbox
                checked={task.is_completed_today}
                onCheckedChange={() => handleToggleTask(task)}
                className="mt-1"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <Icon className="h-4 w-4 flex-shrink-0" />
                  <h4 className={`font-semibold text-foreground ${
                    task.is_completed_today ? 'line-through' : ''
                  }`}>
                    {task.title}
                  </h4>
                </div>
                <p className="text-sm text-muted-foreground">{task.description}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Tot {new Date(task.end_date).toLocaleDateString('nl-NL')}
                </p>
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
};
