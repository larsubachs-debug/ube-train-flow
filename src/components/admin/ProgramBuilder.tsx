import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, Upload, X, Copy, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Exercise {
  name: string;
  category: "warmup" | "mainlift" | "accessory" | "conditioning";
  sets?: number;
  reps?: string;
  weight?: number;
  time?: string;
  distance?: string;
  rpe?: number;
  notes?: string;
}

interface Workout {
  name: string;
  dayNumber: number;
  duration: number;
  exercises: Exercise[];
}

interface Week {
  name: string;
  weekNumber: number;
  workouts: Workout[];
}

interface ProgramBuilderProps {
  onComplete: () => void;
  onCancel: () => void;
}

export const ProgramBuilder = ({ onComplete, onCancel }: ProgramBuilderProps) => {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [step, setStep] = useState<"template" | "details" | "structure">("template");
  
  const [program, setProgram] = useState({
    id: "",
    name: "",
    description: "",
    icon: "Dumbbell",
  });

  const [weeks, setWeeks] = useState<Week[]>([]);

  const createFromTemplate = (weekCount: number, workoutsPerWeek: number) => {
    const newWeeks: Week[] = [];
    for (let w = 0; w < weekCount; w++) {
      const workouts: Workout[] = [];
      for (let d = 0; d < workoutsPerWeek; d++) {
        workouts.push({
          name: `Workout ${d + 1}`,
          dayNumber: d + 1,
          duration: 60,
          exercises: [
            { name: "Warming-up", category: "warmup", sets: 1, time: "5 min" },
            { name: "Squat", category: "mainlift", sets: 4, reps: "8", rpe: 8 },
            { name: "Bench Press", category: "mainlift", sets: 4, reps: "8", rpe: 8 },
          ],
        });
      }
      newWeeks.push({
        name: `Week ${w + 1}`,
        weekNumber: w + 1,
        workouts,
      });
    }
    setWeeks(newWeeks);
    setStep("details");
    toast({ description: "Sjabloon toegepast!" });
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const addWeek = () => {
    setWeeks([...weeks, { name: `Week ${weeks.length + 1}`, weekNumber: weeks.length + 1, workouts: [] }]);
  };

  const duplicateWeek = (weekIndex: number) => {
    const weekToDuplicate = weeks[weekIndex];
    const newWeek = {
      ...weekToDuplicate,
      name: `${weekToDuplicate.name} (copy)`,
      weekNumber: weeks.length + 1,
      workouts: weekToDuplicate.workouts.map(w => ({ ...w, exercises: [...w.exercises] })),
    };
    setWeeks([...weeks, newWeek]);
  };

  const removeWeek = (index: number) => setWeeks(weeks.filter((_, i) => i !== index));

  const addWorkout = (weekIndex: number) => {
    const newWeeks = [...weeks];
    newWeeks[weekIndex].workouts.push({
      name: `Workout ${newWeeks[weekIndex].workouts.length + 1}`,
      dayNumber: newWeeks[weekIndex].workouts.length + 1,
      duration: 60,
      exercises: [],
    });
    setWeeks(newWeeks);
  };

  const duplicateWorkout = (weekIndex: number, workoutIndex: number) => {
    const newWeeks = [...weeks];
    const workoutToDuplicate = newWeeks[weekIndex].workouts[workoutIndex];
    newWeeks[weekIndex].workouts.push({
      ...workoutToDuplicate,
      name: `${workoutToDuplicate.name} (copy)`,
      exercises: [...workoutToDuplicate.exercises],
    });
    setWeeks(newWeeks);
  };

  const removeWorkout = (weekIndex: number, workoutIndex: number) => {
    const newWeeks = [...weeks];
    newWeeks[weekIndex].workouts = newWeeks[weekIndex].workouts.filter((_, i) => i !== workoutIndex);
    setWeeks(newWeeks);
  };

  const addExercise = (weekIndex: number, workoutIndex: number) => {
    const newWeeks = [...weeks];
    newWeeks[weekIndex].workouts[workoutIndex].exercises.push({
      name: "",
      category: "mainlift",
      sets: 3,
      reps: "10",
    });
    setWeeks(newWeeks);
  };

  const duplicateExercise = (weekIndex: number, workoutIndex: number, exerciseIndex: number) => {
    const newWeeks = [...weeks];
    const exercise = newWeeks[weekIndex].workouts[workoutIndex].exercises[exerciseIndex];
    newWeeks[weekIndex].workouts[workoutIndex].exercises.push({ ...exercise });
    setWeeks(newWeeks);
  };

  const removeExercise = (weekIndex: number, workoutIndex: number, exerciseIndex: number) => {
    const newWeeks = [...weeks];
    newWeeks[weekIndex].workouts[workoutIndex].exercises = 
      newWeeks[weekIndex].workouts[workoutIndex].exercises.filter((_, i) => i !== exerciseIndex);
    setWeeks(newWeeks);
  };

  const updateExercise = (
    weekIndex: number,
    workoutIndex: number,
    exerciseIndex: number,
    field: keyof Exercise,
    value: any
  ) => {
    const newWeeks = [...weeks];
    newWeeks[weekIndex].workouts[workoutIndex].exercises[exerciseIndex] = {
      ...newWeeks[weekIndex].workouts[workoutIndex].exercises[exerciseIndex],
      [field]: value,
    };
    setWeeks(newWeeks);
  };

  const handleSubmit = async () => {
    if (!program.name || !program.description) {
      toast({ title: "Vul alle velden in", variant: "destructive" });
      return;
    }

    const programId = program.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    
    const { data: existingProgram } = await supabase.from("programs").select("id").eq("id", programId).maybeSingle();
    if (existingProgram) {
      toast({ title: "Program ID bestaat al", variant: "destructive" });
      return;
    }

    setSaving(true);
    try {
      let imageUrl = null;
      if (imageFile) {
        const fileExt = imageFile.name.split('.').pop();
        const fileName = `${programId}-${Date.now()}.${fileExt}`;
        await supabase.storage.from('program-images').upload(fileName, imageFile);
        const { data: { publicUrl } } = supabase.storage.from('program-images').getPublicUrl(fileName);
        imageUrl = publicUrl;
      }

      await supabase.from("programs").insert([{ id: programId, name: program.name, description: program.description, icon: program.icon }]);

      if (imageUrl) {
        const { data: userData } = await supabase.auth.getUser();
        const { data: mediaData } = await supabase.from('media').insert([{
          user_id: userData.user!.id,
          file_name: imageFile!.name,
          file_path: imageUrl,
          bucket_name: 'program-images',
          mime_type: imageFile!.type,
        }]).select().single();
        await supabase.from('program_media').insert([{ program_id: programId, media_id: mediaData!.id, media_type: 'tile', display_order: 0 }]);
      }

      for (const week of weeks) {
        const weekId = `${programId}-week-${week.weekNumber}`;
        await supabase.from("weeks").insert([{ id: weekId, program_id: programId, week_number: week.weekNumber, name: week.name }]);

        for (const workout of week.workouts) {
          const workoutId = `${weekId}-workout-${workout.dayNumber}`;
          await supabase.from("workouts").insert([{ id: workoutId, week_id: weekId, day_number: workout.dayNumber, name: workout.name, duration: workout.duration }]);

          for (let i = 0; i < workout.exercises.length; i++) {
            const exercise = workout.exercises[i];
            await supabase.from("exercises").insert([{
              id: `${workoutId}-exercise-${i + 1}`,
              workout_id: workoutId,
              name: exercise.name,
              category: exercise.category,
              sets: exercise.sets,
              reps: exercise.reps,
              weight: exercise.weight,
              time: exercise.time,
              distance: exercise.distance,
              rpe: exercise.rpe,
              notes: exercise.notes,
              display_order: i,
            }]);
          }
        }
      }

      toast({ title: "Programma aangemaakt!" });
      onComplete();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {step === "template" && (
        <Card className="p-6">
          <h2 className="text-2xl font-bold mb-4">Kies een sjabloon</h2>
          <div className="grid gap-4 md:grid-cols-3">
            <Card className="p-6 cursor-pointer hover:bg-accent" onClick={() => createFromTemplate(4, 3)}>
              <h3 className="font-bold text-lg">4 Weken - 3x/week</h3>
              <p className="text-sm text-muted-foreground">Voor beginners</p>
            </Card>
            <Card className="p-6 cursor-pointer hover:bg-accent border-2 border-primary" onClick={() => createFromTemplate(8, 4)}>
              <h3 className="font-bold text-lg">8 Weken - 4x/week</h3>
              <p className="text-sm text-muted-foreground">Standaard</p>
            </Card>
            <Card className="p-6 cursor-pointer hover:bg-accent" onClick={() => createFromTemplate(12, 5)}>
              <h3 className="font-bold text-lg">12 Weken - 5x/week</h3>
              <p className="text-sm text-muted-foreground">Gevorderd</p>
            </Card>
          </div>
          <Button variant="outline" onClick={() => { setWeeks([{ name: "Week 1", weekNumber: 1, workouts: [] }]); setStep("details"); }} className="w-full mt-4">
            Start vanaf nul
          </Button>
        </Card>
      )}

      {step === "details" && (
        <Card className="p-6">
          <div className="flex justify-between mb-4">
            <h2 className="text-2xl font-bold">Programma Details</h2>
            <Button variant="ghost" onClick={() => setStep("template")}>Terug</Button>
          </div>
          <div className="space-y-4">
            <div><Label>Naam *</Label><Input value={program.name} onChange={(e) => setProgram({ ...program, name: e.target.value })} /></div>
            <div><Label>Beschrijving *</Label><Textarea value={program.description} onChange={(e) => setProgram({ ...program, description: e.target.value })} rows={4} /></div>
            <div>
              <Label>Afbeelding</Label>
              {imagePreview && <div className="relative w-full h-48 rounded-lg overflow-hidden mt-2"><img src={imagePreview} className="w-full h-full object-cover" /><Button size="icon" variant="destructive" className="absolute top-2 right-2" onClick={() => { setImageFile(null); setImagePreview(""); }}><X className="h-4 w-4" /></Button></div>}
              <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer hover:bg-accent/10 mt-2">
                <Upload className="w-8 h-8 text-muted-foreground" /><input type="file" className="hidden" accept="image/*" onChange={handleImageSelect} />
              </label>
            </div>
          </div>
          <div className="flex gap-3 pt-4">
            <Button onClick={() => setStep("structure")} disabled={!program.name || !program.description} className="flex-1">Volgende</Button>
            <Button onClick={handleSubmit} disabled={saving || !program.name || !program.description} variant="outline" className="flex-1"><Save className="mr-2 h-4 w-4" />Direct opslaan</Button>
          </div>
        </Card>
      )}

      {step === "structure" && (
        <Card className="p-6">
          <div className="flex justify-between mb-4">
            <h2 className="text-2xl font-bold">{program.name}</h2>
            <Button variant="ghost" onClick={() => setStep("details")}>Terug</Button>
          </div>
          <div className="flex justify-between mb-4">
            <h3 className="text-lg font-semibold">Weken ({weeks.length})</h3>
            <Button onClick={addWeek} size="sm"><Plus className="mr-2 h-4 w-4" />Week</Button>
          </div>
          <div className="flex gap-3 pt-4">
            <Button onClick={handleSubmit} disabled={saving} className="flex-1"><Save className="mr-2 h-4 w-4" />{saving ? "Opslaan..." : "Programma Aanmaken"}</Button>
          </div>
        </Card>
      )}

      {step !== "structure" && <Button variant="outline" onClick={onCancel} className="w-full">Annuleren</Button>}
    </div>
  );
};
