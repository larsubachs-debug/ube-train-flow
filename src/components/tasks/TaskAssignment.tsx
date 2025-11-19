import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, UserPlus, Calendar } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import * as LucideIcons from "lucide-react";

interface TaskAssignmentProps {
  tasks: any[];
}

export const TaskAssignment = ({ tasks }: TaskAssignmentProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedMember, setSelectedMember] = useState<string>("");
  const [selectedTasks, setSelectedTasks] = useState<string[]>([]);
  const [durationDays, setDurationDays] = useState<Record<string, number>>({});
  const [notes, setNotes] = useState("");
  const [isAssigning, setIsAssigning] = useState(false);

  // Fetch members
  const { data: members = [], isLoading: loadingMembers } = useQuery({
    queryKey: ['members-for-tasks'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, display_name, user_id')
        .order('display_name');
      
      if (error) throw error;
      return data || [];
    }
  });

  const handleAssign = async () => {
    if (!selectedMember) {
      toast({
        title: "Fout",
        description: "Selecteer eerst een member",
        variant: "destructive"
      });
      return;
    }

    if (selectedTasks.length === 0) {
      toast({
        title: "Fout",
        description: "Selecteer minimaal één taak",
        variant: "destructive"
      });
      return;
    }

    setIsAssigning(true);

    const today = new Date();
    const assignments = selectedTasks.map((taskId) => {
      const task = tasks.find(t => t.id === taskId);
      const days = durationDays[taskId] || task?.default_duration_days || 7;
      const endDate = new Date(today);
      endDate.setDate(endDate.getDate() + days);

      return {
        member_id: selectedMember,
        task_id: taskId,
        start_date: today.toISOString().split('T')[0],
        end_date: endDate.toISOString().split('T')[0],
        notes: notes || null,
        is_active: true
      };
    });

    const { error } = await supabase
      .from('member_tasks')
      .insert(assignments);

    setIsAssigning(false);

    if (error) {
      toast({
        title: "Fout",
        description: "Kon taken niet toewijzen",
        variant: "destructive"
      });
      return;
    }

    toast({
      title: "Succesvol",
      description: `${selectedTasks.length} taken toegewezen aan member`
    });

    // Reset form
    setSelectedTasks([]);
    setDurationDays({});
    setNotes("");
    queryClient.invalidateQueries({ queryKey: ['member-tasks'] });
  };

  const toggleTask = (taskId: string) => {
    setSelectedTasks(prev => 
      prev.includes(taskId)
        ? prev.filter(id => id !== taskId)
        : [...prev, taskId]
    );
  };

  const updateDuration = (taskId: string, days: number) => {
    setDurationDays(prev => ({
      ...prev,
      [taskId]: days
    }));
  };

  const getIcon = (iconName: string) => {
    const Icon = (LucideIcons as any)[iconName] || LucideIcons.CheckSquare;
    return Icon;
  };

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <UserPlus className="h-5 w-5" />
          Taken Toewijzen aan Member
        </h2>

        <div className="space-y-4">
          <div>
            <Label>Selecteer Member</Label>
            <Select value={selectedMember} onValueChange={setSelectedMember}>
              <SelectTrigger>
                <SelectValue placeholder="Kies een member..." />
              </SelectTrigger>
              <SelectContent>
                {loadingMembers ? (
                  <div className="p-2 text-center">
                    <Loader2 className="h-4 w-4 animate-spin mx-auto" />
                  </div>
                ) : (
                  members.map((member: any) => (
                    <SelectItem key={member.id} value={member.id}>
                      {member.display_name || 'Naamloos'}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          {selectedMember && (
            <>
              <div>
                <Label className="mb-3 block">Selecteer Taken</Label>
                <div className="space-y-3 max-h-[400px] overflow-y-auto">
                  {tasks.map((task: any) => {
                    const Icon = getIcon(task.icon);
                    const isSelected = selectedTasks.includes(task.id);
                    return (
                      <div key={task.id} className="p-3 border rounded-lg space-y-3">
                        <div className="flex items-start gap-3">
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={() => toggleTask(task.id)}
                          />
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <Icon className="h-4 w-4" />
                              <p className="font-medium">{task.title}</p>
                            </div>
                            <p className="text-sm text-muted-foreground">{task.description}</p>
                          </div>
                        </div>
                        
                        {isSelected && (
                          <div className="ml-9">
                            <Label className="text-xs">Duur (dagen)</Label>
                            <Input
                              type="number"
                              value={durationDays[task.id] || task.default_duration_days}
                              onChange={(e) => updateDuration(task.id, parseInt(e.target.value))}
                              min={1}
                              className="w-24"
                            />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div>
                <Label>Notities (optioneel)</Label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Extra instructies voor de member..."
                  rows={3}
                />
              </div>

              <Button 
                onClick={handleAssign} 
                disabled={isAssigning || selectedTasks.length === 0} 
                className="w-full"
              >
                {isAssigning ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Toewijzen...
                  </>
                ) : (
                  <>
                    <Calendar className="h-4 w-4 mr-2" />
                    {selectedTasks.length} taken toewijzen
                  </>
                )}
              </Button>
            </>
          )}
        </div>
      </Card>
    </div>
  );
};
