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

// Standaard oefening templates
const EXERCISE_TEMPLATES = {
  warmup: [
    { name: "Dynamische stretch", category: "warmup" as const, sets: 2, time: "5 min" },
    { name: "Foam rolling", category: "warmup" as const, sets: 1, time: "5 min" },
  ],
  mainlift: [
    { name: "Squat", category: "mainlift" as const, sets: 4, reps: "8", rpe: 8 },
    { name: "Bench Press", category: "mainlift" as const, sets: 4, reps: "8", rpe: 8 },
    { name: "Deadlift", category: "mainlift" as const, sets: 3, reps: "5", rpe: 9 },
    { name: "Overhead Press", category: "mainlift" as const, sets: 4, reps: "8", rpe: 8 },
  ],
  accessory: [
    { name: "Pull-ups", category: "accessory" as const, sets: 3, reps: "8-12" },
    { name: "Dumbbell Rows", category: "accessory" as const, sets: 3, reps: "10-12" },
    { name: "Leg Press", category: "accessory" as const, sets: 3, reps: "12-15" },
  ],
  conditioning: [
    { name: "Sprint intervals", category: "conditioning" as const, time: "15 min" },
    { name: "Assault bike", category: "conditioning" as const, time: "10 min" },
  ],
};

export const ProgramBuilder = ({ onComplete, onCancel }: ProgramBuilderProps) => {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  
  const [program, setProgram] = useState({
    id: "",
    name: "",
    description: "",
    icon: "Dumbbell",
  });

  const [weeks, setWeeks] = useState<Week[]>([
    { name: "Week 1", weekNumber: 1, workouts: [] }
  ]);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const addWeek = () => {
    setWeeks([
      ...weeks,
      {
        name: `Week ${weeks.length + 1}`,
        weekNumber: weeks.length + 1,
        workouts: [],
      },
    ]);
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
    toast({ description: "Week gedupliceerd" });
  };

  const removeWeek = (index: number) => {
    setWeeks(weeks.filter((_, i) => i !== index));
  };

  const addWorkout = (weekIndex: number) => {
    const newWeeks = [...weeks];
    newWeeks[weekIndex].workouts.push({
      name: `Day ${newWeeks[weekIndex].workouts.length + 1}`,
      dayNumber: newWeeks[weekIndex].workouts.length + 1,
      duration: 60,
      exercises: [],
    });
    setWeeks(newWeeks);
  };

  const duplicateWorkout = (weekIndex: number, workoutIndex: number) => {
    const newWeeks = [...weeks];
    const workoutToDuplicate = newWeeks[weekIndex].workouts[workoutIndex];
    const newWorkout = {
      ...workoutToDuplicate,
      name: `${workoutToDuplicate.name} (copy)`,
      dayNumber: newWeeks[weekIndex].workouts.length + 1,
      exercises: [...workoutToDuplicate.exercises],
    };
    newWeeks[weekIndex].workouts.push(newWorkout);
    setWeeks(newWeeks);
    toast({ description: "Workout gedupliceerd" });
  };

  const removeWorkout = (weekIndex: number, workoutIndex: number) => {
    const newWeeks = [...weeks];
    newWeeks[weekIndex].workouts = newWeeks[weekIndex].workouts.filter((_, i) => i !== workoutIndex);
    setWeeks(newWeeks);
  };

  const addExerciseFromTemplate = (weekIndex: number, workoutIndex: number, exercise: Exercise) => {
    const newWeeks = [...weeks];
    newWeeks[weekIndex].workouts[workoutIndex].exercises.push({ ...exercise });
    setWeeks(newWeeks);
  };

  const addEmptyExercise = (weekIndex: number, workoutIndex: number) => {
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
    toast({ description: "Oefening gedupliceerd" });
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
    if (!program.id || !program.name) {
      toast({
        title: "Vul alle velden in",
        description: "Program ID en naam zijn verplicht",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      let imageUrl = null;

      if (imageFile) {
        const fileExt = imageFile.name.split('.').pop();
        const fileName = `${program.id}-${Date.now()}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('program-images')
          .upload(fileName, imageFile);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('program-images')
          .getPublicUrl(fileName);

        imageUrl = publicUrl;
      }

      const { error: programError } = await supabase.from("programs").insert([
        {
          id: program.id,
          name: program.name,
          description: program.description,
          icon: program.icon,
        },
      ]);

      if (programError) throw programError;

      if (imageUrl) {
        const { data: userData } = await supabase.auth.getUser();
        
        const { data: mediaData, error: mediaError } = await supabase
          .from('media')
          .insert([{
            user_id: userData.user!.id,
            file_name: imageFile!.name,
            file_path: imageUrl,
            bucket_name: 'program-images',
            mime_type: imageFile!.type,
          }])
          .select()
          .single();

        if (mediaError) throw mediaError;

        const { error: programMediaError } = await supabase
          .from('program_media')
          .insert([{
            program_id: program.id,
            media_id: mediaData.id,
            media_type: 'image',
            display_order: 0,
          }]);

        if (programMediaError) throw programMediaError;
      }

      for (const week of weeks) {
        const weekId = `${program.id}-week-${week.weekNumber}`;
        
        const { error: weekError } = await supabase.from("weeks").insert([
          {
            id: weekId,
            program_id: program.id,
            week_number: week.weekNumber,
            name: week.name,
          },
        ]);

        if (weekError) throw weekError;

        for (const workout of week.workouts) {
          const workoutId = `${weekId}-day-${workout.dayNumber}`;
          
          const { error: workoutError } = await supabase.from("workouts").insert([
            {
              id: workoutId,
              week_id: weekId,
              day_number: workout.dayNumber,
              name: workout.name,
              duration: workout.duration,
            },
          ]);

          if (workoutError) throw workoutError;

          for (let i = 0; i < workout.exercises.length; i++) {
            const exercise = workout.exercises[i];
            const exerciseId = `${workoutId}-ex-${i + 1}`;

            const { error: exerciseError } = await supabase.from("exercises").insert([
              {
                id: exerciseId,
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
              },
            ]);

            if (exerciseError) throw exerciseError;
          }
        }
      }

      toast({
        title: "Succes!",
        description: "Programma aangemaakt",
      });

      onComplete();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <Tabs defaultValue="basic" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="basic">Basis</TabsTrigger>
          <TabsTrigger value="structure">Structuur</TabsTrigger>
          <TabsTrigger value="exercises">Oefeningen</TabsTrigger>
        </TabsList>

        <TabsContent value="basic" className="space-y-4 mt-4">
          <Card className="p-6">
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Program ID *</Label>
                  <Input
                    placeholder="bijv: strength-muscle"
                    value={program.id}
                    onChange={(e) => setProgram({ ...program, id: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Icon</Label>
                  <Input
                    placeholder="Dumbbell"
                    value={program.icon}
                    onChange={(e) => setProgram({ ...program, icon: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <Label>Program Naam *</Label>
                <Input
                  placeholder="bijv: Strength & Muscle"
                  value={program.name}
                  onChange={(e) => setProgram({ ...program, name: e.target.value })}
                />
              </div>

              <div>
                <Label>Beschrijving</Label>
                <Textarea
                  placeholder="Beschrijf het programma..."
                  value={program.description}
                  onChange={(e) => setProgram({ ...program, description: e.target.value })}
                  rows={4}
                />
              </div>

              <div>
                <Label>Programma Foto</Label>
                <div className="mt-2">
                  {imagePreview ? (
                    <div className="relative inline-block">
                      <img src={imagePreview} alt="Preview" className="w-full max-w-sm rounded-lg" />
                      <Button
                        variant="destructive"
                        size="icon"
                        className="absolute top-2 right-2"
                        onClick={() => {
                          setImageFile(null);
                          setImagePreview("");
                        }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer hover:bg-accent/10">
                      <Upload className="w-8 h-8 text-muted-foreground mb-2" />
                      <span className="text-sm text-muted-foreground">Klik om foto te uploaden</span>
                      <input
                        type="file"
                        className="hidden"
                        accept="image/*"
                        onChange={handleImageSelect}
                      />
                    </label>
                  )}
                </div>
              </div>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="structure" className="space-y-4 mt-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Weken & Workouts</h3>
            <Button onClick={addWeek} size="sm">
              <Plus className="mr-2 h-4 w-4" />
              Week toevoegen
            </Button>
          </div>

          <Accordion type="multiple" className="space-y-2">
            {weeks.map((week, weekIndex) => (
              <AccordionItem key={weekIndex} value={`week-${weekIndex}`} className="border rounded-lg px-4">
                <div className="flex items-center gap-2">
                  <AccordionTrigger className="flex-1 hover:no-underline">
                    <div className="flex items-center justify-between w-full pr-4">
                      <Input
                        value={week.name}
                        onChange={(e) => {
                          e.stopPropagation();
                          const newWeeks = [...weeks];
                          newWeeks[weekIndex].name = e.target.value;
                          setWeeks(newWeeks);
                        }}
                        onClick={(e) => e.stopPropagation()}
                        className="max-w-xs"
                      />
                      <span className="text-sm text-muted-foreground">
                        {week.workouts.length} workout(s)
                      </span>
                    </div>
                  </AccordionTrigger>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => duplicateWeek(weekIndex)}
                    title="Dupliceer week"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeWeek(weekIndex)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>

                <AccordionContent className="space-y-2 pt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => addWorkout(weekIndex)}
                    className="w-full"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Workout toevoegen
                  </Button>

                  {week.workouts.map((workout, workoutIndex) => (
                    <Card key={workoutIndex} className="p-4">
                      <div className="flex items-start gap-2">
                        <div className="flex-1 space-y-2">
                          <Input
                            value={workout.name}
                            onChange={(e) => {
                              const newWeeks = [...weeks];
                              newWeeks[weekIndex].workouts[workoutIndex].name = e.target.value;
                              setWeeks(newWeeks);
                            }}
                            placeholder="Workout naam"
                          />
                          <div className="flex gap-2">
                            <Input
                              type="number"
                              value={workout.duration}
                              onChange={(e) => {
                                const newWeeks = [...weeks];
                                newWeeks[weekIndex].workouts[workoutIndex].duration = parseInt(e.target.value);
                                setWeeks(newWeeks);
                              }}
                              placeholder="Duur (min)"
                              className="w-32"
                            />
                            <span className="text-sm text-muted-foreground self-center">
                              {workout.exercises.length} oefeningen
                            </span>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => duplicateWorkout(weekIndex, workoutIndex)}
                          title="Dupliceer workout"
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeWorkout(weekIndex, workoutIndex)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </Card>
                  ))}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </TabsContent>

        <TabsContent value="exercises" className="space-y-4 mt-4">
          <Accordion type="multiple" className="space-y-2">
            {weeks.map((week, weekIndex) => (
              <AccordionItem key={weekIndex} value={`week-ex-${weekIndex}`} className="border rounded-lg px-4">
                <AccordionTrigger>
                  {week.name} - {week.workouts.length} workout(s)
                </AccordionTrigger>
                <AccordionContent className="space-y-4 pt-4">
                  {week.workouts.map((workout, workoutIndex) => (
                    <Card key={workoutIndex} className="p-4">
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <h4 className="font-medium">{workout.name}</h4>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => addEmptyExercise(weekIndex, workoutIndex)}
                            >
                              <Plus className="mr-2 h-4 w-4" />
                              Lege oefening
                            </Button>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          <span className="text-xs text-muted-foreground self-center">Snel toevoegen:</span>
                          {Object.entries(EXERCISE_TEMPLATES).map(([category, exercises]) => (
                            <Select
                              key={category}
                              onValueChange={(value) => {
                                const exercise = exercises[parseInt(value)];
                                addExerciseFromTemplate(weekIndex, workoutIndex, exercise);
                              }}
                            >
                              <SelectTrigger className="w-32 h-8">
                                <SelectValue placeholder={category} />
                              </SelectTrigger>
                              <SelectContent>
                                {exercises.map((ex, i) => (
                                  <SelectItem key={i} value={i.toString()}>
                                    {ex.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          ))}
                        </div>

                        {workout.exercises.map((exercise, exerciseIndex) => (
                          <Card key={exerciseIndex} className="p-3 bg-accent/5">
                            <div className="space-y-3">
                              <div className="flex justify-between items-start">
                                <h5 className="text-sm font-medium">Oefening {exerciseIndex + 1}</h5>
                                <div className="flex gap-1">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7"
                                    onClick={() => duplicateExercise(weekIndex, workoutIndex, exerciseIndex)}
                                  >
                                    <Copy className="h-3 w-3" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7"
                                    onClick={() => removeExercise(weekIndex, workoutIndex, exerciseIndex)}
                                  >
                                    <Trash2 className="h-3 w-3 text-destructive" />
                                  </Button>
                                </div>
                              </div>

                              <div className="grid grid-cols-2 gap-2">
                                <Input
                                  value={exercise.name}
                                  onChange={(e) =>
                                    updateExercise(weekIndex, workoutIndex, exerciseIndex, "name", e.target.value)
                                  }
                                  placeholder="Naam"
                                  className="col-span-2"
                                />

                                <Select
                                  value={exercise.category}
                                  onValueChange={(value) =>
                                    updateExercise(weekIndex, workoutIndex, exerciseIndex, "category", value)
                                  }
                                >
                                  <SelectTrigger className="col-span-2">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="warmup">Warm-up</SelectItem>
                                    <SelectItem value="mainlift">Main Lift</SelectItem>
                                    <SelectItem value="accessory">Accessory</SelectItem>
                                    <SelectItem value="conditioning">Conditioning</SelectItem>
                                  </SelectContent>
                                </Select>

                                <Input
                                  type="number"
                                  value={exercise.sets || ""}
                                  onChange={(e) =>
                                    updateExercise(weekIndex, workoutIndex, exerciseIndex, "sets", parseInt(e.target.value) || undefined)
                                  }
                                  placeholder="Sets"
                                />

                                <Input
                                  value={exercise.reps || ""}
                                  onChange={(e) =>
                                    updateExercise(weekIndex, workoutIndex, exerciseIndex, "reps", e.target.value)
                                  }
                                  placeholder="Reps"
                                />

                                <Input
                                  type="number"
                                  value={exercise.weight || ""}
                                  onChange={(e) =>
                                    updateExercise(weekIndex, workoutIndex, exerciseIndex, "weight", parseFloat(e.target.value) || undefined)
                                  }
                                  placeholder="Gewicht (kg)"
                                />

                                <Input
                                  type="number"
                                  min="1"
                                  max="10"
                                  value={exercise.rpe || ""}
                                  onChange={(e) =>
                                    updateExercise(weekIndex, workoutIndex, exerciseIndex, "rpe", parseInt(e.target.value) || undefined)
                                  }
                                  placeholder="RPE (1-10)"
                                />

                                <Input
                                  value={exercise.time || ""}
                                  onChange={(e) =>
                                    updateExercise(weekIndex, workoutIndex, exerciseIndex, "time", e.target.value)
                                  }
                                  placeholder="Tijd"
                                />

                                <Input
                                  value={exercise.distance || ""}
                                  onChange={(e) =>
                                    updateExercise(weekIndex, workoutIndex, exerciseIndex, "distance", e.target.value)
                                  }
                                  placeholder="Afstand"
                                />

                                <Textarea
                                  value={exercise.notes || ""}
                                  onChange={(e) =>
                                    updateExercise(weekIndex, workoutIndex, exerciseIndex, "notes", e.target.value)
                                  }
                                  placeholder="Notities..."
                                  className="col-span-2"
                                  rows={2}
                                />
                              </div>
                            </div>
                          </Card>
                        ))}
                      </div>
                    </Card>
                  ))}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </TabsContent>
      </Tabs>

      <div className="flex justify-between sticky bottom-0 bg-background pt-4 border-t">
        <Button variant="outline" onClick={onCancel} disabled={saving}>
          Annuleren
        </Button>
        <Button onClick={handleSubmit} disabled={saving}>
          <Save className="mr-2 h-4 w-4" />
          {saving ? "Opslaan..." : "Programma Aanmaken"}
        </Button>
      </div>
    </div>
  );
};
