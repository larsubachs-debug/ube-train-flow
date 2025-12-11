import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Target, Plus, Trash2, Check, Ruler, Clock, Activity } from "lucide-react";
import { toast } from "sonner";
import { useCardioStats } from "@/hooks/useCardioActivities";

interface CardioGoal {
  id: string;
  user_id: string;
  activity_type: string | null;
  goal_type: string;
  target_value: number;
  period: string;
  is_active: boolean;
}

const ACTIVITY_TYPES = [
  { value: "all", label: "Alle activiteiten", icon: "🏃" },
  { value: "running", label: "Hardlopen", icon: "🏃" },
  { value: "cycling", label: "Fietsen", icon: "🚴" },
  { value: "walking", label: "Wandelen", icon: "🚶" },
  { value: "swimming", label: "Zwemmen", icon: "🏊" },
];

const GOAL_TYPES = [
  { value: "distance", label: "Afstand (km)", icon: Ruler },
  { value: "duration", label: "Tijd (minuten)", icon: Clock },
  { value: "activities", label: "Activiteiten", icon: Activity },
];

export const CardioGoalsCard = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { data: stats } = useCardioStats();
  const [dialogOpen, setDialogOpen] = useState(false);
  
  // Form state
  const [activityType, setActivityType] = useState("all");
  const [goalType, setGoalType] = useState("distance");
  const [targetValue, setTargetValue] = useState("");
  const [period, setPeriod] = useState("weekly");

  // Fetch goals
  const { data: goals = [], isLoading } = useQuery({
    queryKey: ["cardio-goals", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("cardio_goals" as any)
        .select("*")
        .eq("user_id", user.id)
        .eq("is_active", true)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as unknown as CardioGoal[];
    },
    enabled: !!user,
  });

  // Add goal mutation
  const addGoal = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Not authenticated");
      const { error } = await supabase.from("cardio_goals" as any).insert({
        user_id: user.id,
        activity_type: activityType === "all" ? null : activityType,
        goal_type: goalType,
        target_value: parseFloat(targetValue),
        period,
      } as any);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cardio-goals"] });
      toast.success("Doel toegevoegd!");
      setDialogOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      toast.error("Fout: " + error.message);
    },
  });

  // Delete goal mutation
  const deleteGoal = useMutation({
    mutationFn: async (goalId: string) => {
      const { error } = await supabase
        .from("cardio_goals" as any)
        .delete()
        .eq("id", goalId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cardio-goals"] });
      toast.success("Doel verwijderd");
    },
  });

  const resetForm = () => {
    setActivityType("all");
    setGoalType("distance");
    setTargetValue("");
    setPeriod("weekly");
  };

  // Calculate progress for a goal
  const calculateProgress = (goal: CardioGoal) => {
    if (!stats) return 0;
    
    const isWeekly = goal.period === "weekly";
    let current = 0;

    switch (goal.goal_type) {
      case "distance":
        current = (isWeekly ? stats.weeklyDistance : stats.monthlyDistance) / 1000; // Convert to km
        break;
      case "duration":
        current = (isWeekly ? stats.weeklyDuration : stats.monthlyDuration) / 60; // Convert to minutes
        break;
      case "activities":
        current = isWeekly ? stats.weeklyActivities : stats.monthlyActivities;
        break;
    }

    return Math.min((current / goal.target_value) * 100, 100);
  };

  const getCurrentValue = (goal: CardioGoal) => {
    if (!stats) return 0;
    
    const isWeekly = goal.period === "weekly";
    
    switch (goal.goal_type) {
      case "distance":
        return ((isWeekly ? stats.weeklyDistance : stats.monthlyDistance) / 1000).toFixed(1);
      case "duration":
        return Math.round((isWeekly ? stats.weeklyDuration : stats.monthlyDuration) / 60);
      case "activities":
        return isWeekly ? stats.weeklyActivities : stats.monthlyActivities;
      default:
        return 0;
    }
  };

  const getGoalLabel = (goal: CardioGoal) => {
    const activityLabel = goal.activity_type 
      ? ACTIVITY_TYPES.find(a => a.value === goal.activity_type)?.label 
      : "Alle";
    const typeLabel = GOAL_TYPES.find(t => t.value === goal.goal_type)?.label?.split(" ")[0];
    const periodLabel = goal.period === "weekly" ? "per week" : "per maand";
    const unit = goal.goal_type === "distance" ? "km" : goal.goal_type === "duration" ? "min" : "";
    
    return `${activityLabel}: ${goal.target_value}${unit} ${periodLabel}`;
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Target className="h-5 w-5 text-accent" />
            Cardio Doelen
          </CardTitle>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <Plus className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Nieuw Cardio Doel</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-2">
                <div className="space-y-2">
                  <Label>Activiteit</Label>
                  <Select value={activityType} onValueChange={setActivityType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ACTIVITY_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.icon} {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Doel type</Label>
                  <Select value={goalType} onValueChange={setGoalType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {GOAL_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>
                    Doel waarde
                    {goalType === "distance" && " (km)"}
                    {goalType === "duration" && " (minuten)"}
                    {goalType === "activities" && " (aantal)"}
                  </Label>
                  <Input
                    type="number"
                    placeholder={goalType === "distance" ? "50" : goalType === "duration" ? "300" : "10"}
                    value={targetValue}
                    onChange={(e) => setTargetValue(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Periode</Label>
                  <Select value={period} onValueChange={setPeriod}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="weekly">Per week</SelectItem>
                      <SelectItem value="monthly">Per maand</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button 
                  className="w-full" 
                  onClick={() => addGoal.mutate()}
                  disabled={!targetValue || addGoal.isPending}
                >
                  Doel Toevoegen
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {isLoading ? (
          <div className="h-20 bg-muted/50 animate-pulse rounded-lg" />
        ) : goals.length === 0 ? (
          <div className="text-center py-4 text-muted-foreground">
            <Target className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Geen cardio doelen ingesteld</p>
            <p className="text-xs mt-1">Klik op + om een doel toe te voegen</p>
          </div>
        ) : (
          goals.map((goal) => {
            const progress = calculateProgress(goal);
            const current = getCurrentValue(goal);
            const isComplete = progress >= 100;

            return (
              <div key={goal.id} className="p-3 bg-muted/50 rounded-lg space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium flex items-center gap-2">
                    {isComplete && <Check className="h-4 w-4 text-green-500" />}
                    {getGoalLabel(goal)}
                  </p>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-muted-foreground hover:text-destructive"
                    onClick={() => deleteGoal.mutate(goal.id)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
                <Progress value={progress} className="h-2" />
                <p className="text-xs text-muted-foreground">
                  {current} / {goal.target_value}
                  {goal.goal_type === "distance" && " km"}
                  {goal.goal_type === "duration" && " min"}
                  {" "}({Math.round(progress)}%)
                </p>
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
};
