import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Plus, Trash2, Play } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface Exercise {
  id: string;
  name: string;
  sets: number;
  reps: string;
  weight: number;
  notes: string;
}

const CustomWorkout = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [workoutName, setWorkoutName] = useState("");
  const [workoutNotes, setWorkoutNotes] = useState("");
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [currentExercise, setCurrentExercise] = useState<Exercise>({
    id: crypto.randomUUID(),
    name: "",
    sets: 3,
    reps: "",
    weight: 0,
    notes: "",
  });
  const [isSaving, setIsSaving] = useState(false);

  const addExercise = () => {
    if (!currentExercise.name) {
      toast.error("Vul een oefening naam in");
      return;
    }

    setExercises([...exercises, currentExercise]);
    setCurrentExercise({
      id: crypto.randomUUID(),
      name: "",
      sets: 3,
      reps: "",
      weight: 0,
      notes: "",
    });
    toast.success("Oefening toegevoegd");
  };

  const removeExercise = (id: string) => {
    setExercises(exercises.filter((ex) => ex.id !== id));
  };

  const saveAndStartWorkout = async () => {
    if (!workoutName) {
      toast.error("Vul een workout naam in");
      return;
    }

    if (exercises.length === 0) {
      toast.error("Voeg minimaal 1 oefening toe");
      return;
    }

    if (!user) {
      toast.error("Je moet ingelogd zijn");
      return;
    }

    setIsSaving(true);

    try {
      // Create custom workout
      const { data: workout, error: workoutError } = await supabase
        .from("custom_workouts")
        .insert({
          user_id: user.id,
          name: workoutName,
          notes: workoutNotes,
        })
        .select()
        .single();

      if (workoutError) throw workoutError;

      // Add exercises
      const exercisesWithWorkoutId = exercises.map((ex, index) => ({
        workout_id: workout.id,
        name: ex.name,
        sets: ex.sets,
        reps: ex.reps,
        weight: ex.weight,
        notes: ex.notes,
        display_order: index,
      }));

      const { error: exercisesError } = await supabase
        .from("custom_workout_exercises")
        .insert(exercisesWithWorkoutId);

      if (exercisesError) throw exercisesError;

      // Mark workout as completed
      const { error: completionError } = await supabase
        .from("workout_completions")
        .insert({
          user_id: user.id,
          workout_id: workout.id,
          completion_date: new Date().toISOString().split("T")[0],
          notes: workoutNotes,
        });

      if (completionError) throw completionError;

      toast.success("Training opgeslagen en voltooid! 💪");
      navigate("/");
    } catch (error: any) {
      console.error("Error saving workout:", error);
      toast.error("Kon training niet opslaan: " + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="bg-card border-b border-border p-6">
        <button
          onClick={() => navigate("/")}
          className="inline-flex items-center text-sm mb-4 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Terug
        </button>
        <h1 className="text-2xl font-bold">Eigen Training</h1>
        <p className="text-muted-foreground mt-1">
          Stel je eigen workout samen
        </p>
      </div>

      <div className="p-6 space-y-6">
        {/* Workout Details */}
        <Card className="p-4 space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">
              Training Naam *
            </label>
            <Input
              placeholder="Bijv. Upper Body, Legs, Full Body..."
              value={workoutName}
              onChange={(e) => setWorkoutName(e.target.value)}
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">
              Notities (optioneel)
            </label>
            <Textarea
              placeholder="Voeg notities toe over je training..."
              value={workoutNotes}
              onChange={(e) => setWorkoutNotes(e.target.value)}
              rows={3}
            />
          </div>
        </Card>

        {/* Current Exercise Input */}
        <Card className="p-4 space-y-4">
          <h3 className="font-semibold flex items-center gap-2">
            <Plus className="w-5 h-5" />
            Oefening Toevoegen
          </h3>

          <div>
            <label className="text-sm font-medium mb-2 block">
              Oefening Naam *
            </label>
            <Input
              placeholder="Bijv. Bench Press, Squats..."
              value={currentExercise.name}
              onChange={(e) =>
                setCurrentExercise({ ...currentExercise, name: e.target.value })
              }
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-sm font-medium mb-2 block">Sets</label>
              <Input
                type="number"
                min="1"
                value={currentExercise.sets}
                onChange={(e) =>
                  setCurrentExercise({
                    ...currentExercise,
                    sets: parseInt(e.target.value) || 1,
                  })
                }
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Reps</label>
              <Input
                placeholder="8-12"
                value={currentExercise.reps}
                onChange={(e) =>
                  setCurrentExercise({ ...currentExercise, reps: e.target.value })
                }
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">
                Gewicht (kg)
              </label>
              <Input
                type="number"
                min="0"
                step="2.5"
                value={currentExercise.weight}
                onChange={(e) =>
                  setCurrentExercise({
                    ...currentExercise,
                    weight: parseFloat(e.target.value) || 0,
                  })
                }
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">
              Notities (optioneel)
            </label>
            <Input
              placeholder="Bijv. Focus op vorm, tempo..."
              value={currentExercise.notes}
              onChange={(e) =>
                setCurrentExercise({ ...currentExercise, notes: e.target.value })
              }
            />
          </div>

          <Button onClick={addExercise} className="w-full">
            <Plus className="w-4 h-4 mr-2" />
            Oefening Toevoegen
          </Button>
        </Card>

        {/* Exercise List */}
        {exercises.length > 0 && (
          <div className="space-y-3">
            <h3 className="font-semibold">
              Oefeningen ({exercises.length})
            </h3>
            {exercises.map((exercise, index) => (
              <Card key={exercise.id} className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-sm font-medium text-muted-foreground">
                        #{index + 1}
                      </span>
                      <h4 className="font-semibold">{exercise.name}</h4>
                    </div>
                    <div className="text-sm text-muted-foreground space-y-1">
                      <p>
                        {exercise.sets} sets × {exercise.reps} reps
                        {exercise.weight > 0 && ` @ ${exercise.weight}kg`}
                      </p>
                      {exercise.notes && (
                        <p className="italic">{exercise.notes}</p>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeExercise(exercise.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Save Button */}
        <Button
          onClick={saveAndStartWorkout}
          disabled={isSaving || !workoutName || exercises.length === 0}
          className="w-full py-6 text-lg"
          size="lg"
        >
          <Play className="w-5 h-5 mr-2" />
          {isSaving ? "Opslaan..." : "Training Voltooien"}
        </Button>
      </div>
    </div>
  );
};

export default CustomWorkout;
