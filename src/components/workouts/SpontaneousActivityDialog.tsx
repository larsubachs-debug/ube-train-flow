import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Plus, Zap, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";

interface Exercise {
  name: string;
  sets: number | null;
  reps: string;
  weight: number | null;
  notes: string;
}

export const SpontaneousActivityDialog = () => {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [workoutName, setWorkoutName] = useState("");
  const [notes, setNotes] = useState("");
  const [exercises, setExercises] = useState<Exercise[]>([
    { name: "", sets: null, reps: "", weight: null, notes: "" }
  ]);

  const addExercise = () => {
    setExercises([...exercises, { name: "", sets: null, reps: "", weight: null, notes: "" }]);
  };

  const removeExercise = (index: number) => {
    if (exercises.length > 1) {
      setExercises(exercises.filter((_, i) => i !== index));
    }
  };

  const updateExercise = (index: number, field: keyof Exercise, value: string | number | null) => {
    const updated = [...exercises];
    updated[index] = { ...updated[index], [field]: value };
    setExercises(updated);
  };

  const resetForm = () => {
    setWorkoutName("");
    setNotes("");
    setExercises([{ name: "", sets: null, reps: "", weight: null, notes: "" }]);
  };

  const handleSubmit = async () => {
    if (!user) return;
    if (!workoutName.trim()) {
      toast.error("Geef je activiteit een naam");
      return;
    }

    const validExercises = exercises.filter(e => e.name.trim());
    if (validExercises.length === 0) {
      toast.error("Voeg minimaal één oefening toe");
      return;
    }

    setIsSubmitting(true);
    try {
      // Create custom workout
      const { data: workout, error: workoutError } = await supabase
        .from("custom_workouts")
        .insert({
          user_id: user.id,
          name: workoutName.trim(),
          notes: notes.trim() || null,
        })
        .select()
        .single();

      if (workoutError) throw workoutError;

      // Add exercises
      const exerciseInserts = validExercises.map((ex, index) => ({
        workout_id: workout.id,
        name: ex.name.trim(),
        sets: ex.sets,
        reps: ex.reps || null,
        weight: ex.weight,
        notes: ex.notes || null,
        display_order: index,
      }));

      const { error: exercisesError } = await supabase
        .from("custom_workout_exercises")
        .insert(exerciseInserts);

      if (exercisesError) throw exercisesError;

      toast.success("Activiteit opgeslagen! 💪");
      resetForm();
      setOpen(false);
    } catch (error: any) {
      toast.error("Fout bij opslaan: " + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="w-full gap-2" variant="outline">
          <Zap className="w-4 h-4" />
          Spontane activiteit loggen
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-accent" />
            Spontane Activiteit
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {/* Workout name */}
          <div className="space-y-2">
            <Label htmlFor="workout-name">Naam activiteit *</Label>
            <Input
              id="workout-name"
              placeholder="bijv. Ochtend hardlopen, Zwemmen..."
              value={workoutName}
              onChange={(e) => setWorkoutName(e.target.value)}
            />
          </div>

          {/* Exercises */}
          <div className="space-y-3">
            <Label>Oefeningen *</Label>
            {exercises.map((exercise, index) => (
              <Card key={index} className="p-3 space-y-3">
                <div className="flex items-center gap-2">
                  <Input
                    placeholder="Oefening naam"
                    value={exercise.name}
                    onChange={(e) => updateExercise(index, "name", e.target.value)}
                    className="flex-1"
                  />
                  {exercises.length > 1 && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9 text-destructive"
                      onClick={() => removeExercise(index)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
                
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <Label className="text-xs text-muted-foreground">Sets</Label>
                    <Input
                      type="number"
                      placeholder="3"
                      value={exercise.sets ?? ""}
                      onChange={(e) => updateExercise(index, "sets", e.target.value ? parseInt(e.target.value) : null)}
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Reps/Tijd</Label>
                    <Input
                      placeholder="10"
                      value={exercise.reps}
                      onChange={(e) => updateExercise(index, "reps", e.target.value)}
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Gewicht (kg)</Label>
                    <Input
                      type="number"
                      placeholder="0"
                      value={exercise.weight ?? ""}
                      onChange={(e) => updateExercise(index, "weight", e.target.value ? parseFloat(e.target.value) : null)}
                    />
                  </div>
                </div>
              </Card>
            ))}

            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="w-full"
              onClick={addExercise}
            >
              <Plus className="w-4 h-4 mr-1" />
              Oefening toevoegen
            </Button>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notities (optioneel)</Label>
            <Textarea
              id="notes"
              placeholder="Hoe ging het? Hoe voelde je je?"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
            />
          </div>

          {/* Submit */}
          <Button 
            className="w-full" 
            onClick={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? "Opslaan..." : "Activiteit opslaan"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
