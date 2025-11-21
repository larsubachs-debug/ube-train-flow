import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Dumbbell, CheckSquare, X, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import * as LucideIcons from "lucide-react";

interface BulkActionToolbarProps {
  selectedMembers: Array<{ id: string; user_id: string; display_name: string | null }>;
  onClearSelection: () => void;
}

export const BulkActionToolbar = ({
  selectedMembers,
  onClearSelection,
}: BulkActionToolbarProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showProgramDialog, setShowProgramDialog] = useState(false);
  const [showTasksDialog, setShowTasksDialog] = useState(false);
  const [selectedProgram, setSelectedProgram] = useState("");
  const [selectedTasks, setSelectedTasks] = useState<string[]>([]);
  const [durationDays, setDurationDays] = useState<Record<string, number>>({});

  // Fetch programs
  const { data: programs = [] } = useQuery({
    queryKey: ["programs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("programs")
        .select("id, name, description")
        .order("name");

      if (error) throw error;
      return data || [];
    },
  });

  // Fetch tasks
  const { data: tasks = [] } = useQuery({
    queryKey: ["tasks-library"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tasks_library")
        .select("*")
        .order("title");

      if (error) throw error;
      return data || [];
    },
  });

  const assignProgramMutation = useMutation({
    mutationFn: async () => {
      if (!selectedProgram) throw new Error("Geen programma geselecteerd");

      const assignments = selectedMembers.map((member) => ({
        user_id: member.user_id,
        program_id: selectedProgram,
        current_week_number: 1,
        start_date: new Date().toISOString().split("T")[0],
        completed: false,
      }));

      const { error } = await supabase
        .from("user_program_progress")
        .insert(assignments);

      if (error) throw error;

      // Send notifications
      for (const member of selectedMembers) {
        try {
          const programName = programs.find((p) => p.id === selectedProgram)?.name || "een programma";
          await supabase.functions.invoke("send-notification", {
            body: {
              userId: member.user_id,
              title: "Nieuw programma toegewezen! 🎯",
              body: `Je coach heeft ${programName} aan je toegewezen. Bekijk het in je programma's.`,
              data: {
                type: "program_assigned",
                programId: selectedProgram,
              },
            },
          });
        } catch (error) {
          console.error("Failed to send notification:", error);
        }
      }
    },
    onSuccess: () => {
      toast({
        title: "Succesvol",
        description: `Programma toegewezen aan ${selectedMembers.length} members`,
      });
      queryClient.invalidateQueries({ queryKey: ["user-program-progress"] });
      setShowProgramDialog(false);
      setSelectedProgram("");
      onClearSelection();
    },
    onError: (error: any) => {
      toast({
        title: "Fout",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const assignTasksMutation = useMutation({
    mutationFn: async () => {
      if (selectedTasks.length === 0) throw new Error("Geen taken geselecteerd");

      const today = new Date();
      const assignments = selectedMembers.flatMap((member) =>
        selectedTasks.map((taskId) => {
          const task = tasks.find((t) => t.id === taskId);
          const days = durationDays[taskId] || task?.default_duration_days || 7;
          const endDate = new Date(today);
          endDate.setDate(endDate.getDate() + days);

          return {
            member_id: member.id,
            task_id: taskId,
            start_date: today.toISOString().split("T")[0],
            end_date: endDate.toISOString().split("T")[0],
            is_active: true,
          };
        })
      );

      const { error } = await supabase.from("member_tasks").insert(assignments);

      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: "Succesvol",
        description: `${selectedTasks.length} taken toegewezen aan ${selectedMembers.length} members`,
      });
      queryClient.invalidateQueries({ queryKey: ["member-tasks"] });
      setShowTasksDialog(false);
      setSelectedTasks([]);
      setDurationDays({});
      onClearSelection();
    },
    onError: (error: any) => {
      toast({
        title: "Fout",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const getIcon = (iconName: string) => {
    const Icon = (LucideIcons as any)[iconName] || LucideIcons.CheckSquare;
    return Icon;
  };

  const toggleTask = (taskId: string) => {
    setSelectedTasks((prev) =>
      prev.includes(taskId) ? prev.filter((id) => id !== taskId) : [...prev, taskId]
    );
  };

  const updateDuration = (taskId: string, days: number) => {
    setDurationDays((prev) => ({
      ...prev,
      [taskId]: days,
    }));
  };

  if (selectedMembers.length === 0) return null;

  return (
    <>
      <Card className="p-4 mb-6 bg-primary/5 border-primary">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <p className="font-semibold">
              {selectedMembers.length} member{selectedMembers.length !== 1 ? "s" : ""}{" "}
              geselecteerd
            </p>
            <Button
              size="sm"
              variant="ghost"
              onClick={onClearSelection}
            >
              <X className="h-4 w-4 mr-1" />
              Wissen
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" onClick={() => setShowProgramDialog(true)}>
              <Dumbbell className="h-4 w-4 mr-1" />
              Programma Toewijzen
            </Button>
            <Button size="sm" variant="outline" onClick={() => setShowTasksDialog(true)}>
              <CheckSquare className="h-4 w-4 mr-1" />
              Taken Toewijzen
            </Button>
          </div>
        </div>
      </Card>

      {/* Program Assignment Dialog */}
      <Dialog open={showProgramDialog} onOpenChange={setShowProgramDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Programma Toewijzen aan {selectedMembers.length} Members
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Selecteer Programma</Label>
              <Select value={selectedProgram} onValueChange={setSelectedProgram}>
                <SelectTrigger>
                  <SelectValue placeholder="Kies een programma..." />
                </SelectTrigger>
                <SelectContent>
                  {programs.map((program) => (
                    <SelectItem key={program.id} value={program.id}>
                      {program.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() => {
                  setShowProgramDialog(false);
                  setSelectedProgram("");
                }}
              >
                Annuleren
              </Button>
              <Button
                onClick={() => assignProgramMutation.mutate()}
                disabled={!selectedProgram || assignProgramMutation.isPending}
              >
                {assignProgramMutation.isPending && (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                )}
                Toewijzen
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Tasks Assignment Dialog */}
      <Dialog open={showTasksDialog} onOpenChange={setShowTasksDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Taken Toewijzen aan {selectedMembers.length} Members
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
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
                          <p className="text-sm text-muted-foreground">
                            {task.description}
                          </p>
                        </div>
                      </div>

                      {isSelected && (
                        <div className="ml-9">
                          <Label className="text-xs">Duur (dagen)</Label>
                          <Input
                            type="number"
                            value={durationDays[task.id] || task.default_duration_days}
                            onChange={(e) =>
                              updateDuration(task.id, parseInt(e.target.value))
                            }
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
            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() => {
                  setShowTasksDialog(false);
                  setSelectedTasks([]);
                  setDurationDays({});
                }}
              >
                Annuleren
              </Button>
              <Button
                onClick={() => assignTasksMutation.mutate()}
                disabled={selectedTasks.length === 0 || assignTasksMutation.isPending}
              >
                {assignTasksMutation.isPending && (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                )}
                {selectedTasks.length} taken toewijzen
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
