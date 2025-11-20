import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, Upload, X, Copy, Save, GripVertical, Sparkles, Link2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragOverlay,
  useDroppable,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { ExerciseLibrary } from "./ExerciseLibrary";

interface Exercise {
  id: string;
  name: string;
  category: "warmup" | "mainlift" | "accessory" | "conditioning";
  sets?: number;
  reps?: string;
  weight?: number;
  time?: string;
  distance?: string;
  rpe?: number;
  notes?: string;
  group_id?: string;
  group_type?: "superset" | "tri-set" | "giant-set";
}

interface Workout {
  id: string;
  name: string;
  dayNumber: number;
  duration: number;
  exercises: Exercise[];
}

interface Week {
  name: string;
  weekNumber: number;
  description?: string;
  phase_name?: string;
  workouts: Workout[];
}

interface ProgramBuilderProps {
  onComplete: () => void;
  onCancel: () => void;
  initialData?: {
    name: string;
    description: string;
    icon?: string;
    is_public?: boolean;
    weeks: Week[];
  };
}

interface SortableWorkoutProps {
  workout: Workout;
  weekIndex: number;
  workoutIndex: number;
  onDuplicate: () => void;
  onRemove: () => void;
}

interface DroppableWorkoutZoneProps {
  workout: Workout;
  weekIndex: number;
  workoutIndex: number;
  children: React.ReactNode;
}

const DroppableWorkoutZone = ({ workout, weekIndex, workoutIndex, children }: DroppableWorkoutZoneProps) => {
  const { setNodeRef, isOver } = useDroppable({
    id: `workout-${weekIndex}-${workoutIndex}`,
    data: { weekIndex, workoutIndex, workout }
  });

  return (
    <div 
      ref={setNodeRef}
      className={`transition-all ${isOver ? 'ring-2 ring-primary rounded-lg p-2 bg-primary/5' : ''}`}
    >
      {children}
    </div>
  );
};

const SortableWorkout = ({ workout, weekIndex, workoutIndex, onDuplicate, onRemove }: SortableWorkoutProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: workout.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <Card ref={setNodeRef} style={style} className="p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 flex-1">
          <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing">
            <GripVertical className="h-5 w-5 text-muted-foreground" />
          </div>
          <div>
            <h4 className="font-medium">{workout.name}</h4>
            <p className="text-sm text-muted-foreground">
              {workout.exercises.length} oefeningen • {workout.duration} min
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" size="icon" onClick={onDuplicate}>
            <Copy className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={onRemove}>
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      </div>
    </Card>
  );
};

interface SortableExerciseProps {
  exercise: Exercise;
  weekIndex: number;
  workoutIndex: number;
  exerciseIndex: number;
  onUpdate: (field: keyof Exercise, value: any) => void;
  onDuplicate: () => void;
  onRemove: () => void;
}

const SortableExercise = ({ exercise, weekIndex, workoutIndex, exerciseIndex, onUpdate, onDuplicate, onRemove }: SortableExerciseProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: exercise.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const isCardio = exercise.category === "conditioning";
  const hasGrouping = exercise.group_id && exercise.group_type;

  return (
    <Card ref={setNodeRef} style={style} className={`p-4 ${hasGrouping ? 'border-l-4 border-l-primary' : ''}`}>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 flex-1">
            <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing">
              <GripVertical className="h-5 w-5 text-muted-foreground" />
            </div>
            <Select value={exercise.category} onValueChange={(value) => onUpdate("category", value)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="warmup">Warming-up</SelectItem>
                <SelectItem value="mainlift">Hoofdoefening</SelectItem>
                <SelectItem value="accessory">Accessoire</SelectItem>
                <SelectItem value="conditioning">Cardio</SelectItem>
              </SelectContent>
            </Select>
            {hasGrouping && (
              <span className="text-xs px-2 py-1 bg-primary/10 text-primary rounded">
                {exercise.group_type === 'superset' ? 'Superset' : exercise.group_type === 'tri-set' ? 'Tri-set' : 'Giant-set'}
              </span>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" size="icon" onClick={onDuplicate}>
              <Copy className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={onRemove}>
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>
        </div>
        <Input placeholder="Oefening naam" value={exercise.name} onChange={(e) => onUpdate("name", e.target.value)} />
        
        {isCardio ? (
          <div className="grid grid-cols-2 gap-2">
            <Input placeholder="Tijd (bijv. 20 min)" value={exercise.time || ""} onChange={(e) => onUpdate("time", e.target.value)} />
            <Input placeholder="Afstand (optioneel)" value={exercise.distance || ""} onChange={(e) => onUpdate("distance", e.target.value)} />
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-2">
            <Input type="number" placeholder="Sets" value={exercise.sets || ""} onChange={(e) => onUpdate("sets", parseInt(e.target.value) || undefined)} />
            <Input placeholder="Reps" value={exercise.reps || ""} onChange={(e) => onUpdate("reps", e.target.value)} />
            <Input type="number" placeholder="RPE" value={exercise.rpe || ""} onChange={(e) => onUpdate("rpe", parseInt(e.target.value) || undefined)} />
          </div>
        )}
        
        <Textarea placeholder="Notities (optioneel)" value={exercise.notes || ""} onChange={(e) => onUpdate("notes", e.target.value)} rows={2} />
      </div>
    </Card>
  );
};

export const ProgramBuilder = ({ onComplete, onCancel, initialData }: ProgramBuilderProps) => {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [step, setStep] = useState<"template" | "details" | "structure">(initialData ? "structure" : "template");
  const [activeId, setActiveId] = useState<string | null>(null);
  const [aiGenerating, setAiGenerating] = useState(false);
  
  const [program, setProgram] = useState({
    id: "",
    name: initialData?.name || "",
    description: initialData?.description || "",
    icon: initialData?.icon || "Dumbbell",
    is_public: initialData?.is_public ?? true,
  });

  const [weeks, setWeeks] = useState<Week[]>(initialData?.weeks || []);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleLibraryDrop = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over || !active.id.toString().startsWith('library-')) return;
    
    // Parse the drop target (format: "workout-{weekIndex}-{workoutIndex}")
    const overIdStr = over.id.toString();
    if (!overIdStr.startsWith('workout-')) return;
    
    const [_, weekIndexStr, workoutIndexStr] = overIdStr.split('-');
    const weekIndex = parseInt(weekIndexStr);
    const workoutIndex = parseInt(workoutIndexStr);
    
    // Get the exercise data from active
    const exerciseData = active.data.current as any;
    
    if (!exerciseData || weekIndex === undefined || workoutIndex === undefined) return;
    
    // Create new exercise from library item
    const newExercise: Exercise = {
      id: `ex-${Date.now()}-${Math.random()}`,
      name: exerciseData.name,
      category: exerciseData.category === 'cardio' ? 'conditioning' : 
               exerciseData.category === 'core' ? 'accessory' : 
               exerciseData.category === 'strength' ? 'mainlift' : 'accessory',
      sets: 3,
      reps: '10',
    };
    
    // Add exercise to the target workout
    const newWeeks = [...weeks];
    if (newWeeks[weekIndex] && newWeeks[weekIndex].workouts[workoutIndex]) {
      newWeeks[weekIndex].workouts[workoutIndex].exercises.push(newExercise);
      setWeeks(newWeeks);
      toast({ description: `${exerciseData.name} toegevoegd!` });
    }
  };

  const createFromTemplate = (weekCount: number, workoutsPerWeek: number) => {
    const newWeeks: Week[] = [];
    for (let w = 0; w < weekCount; w++) {
      const workouts: Workout[] = [];
      for (let d = 0; d < workoutsPerWeek; d++) {
        const workoutId = `temp-workout-${w}-${d}`;
        workouts.push({
          id: workoutId,
          name: `Workout ${d + 1}`,
          dayNumber: d + 1,
          duration: 60,
          exercises: [
            { id: `${workoutId}-ex-1`, name: "Warming-up", category: "warmup", sets: 1, time: "5 min" },
            { id: `${workoutId}-ex-2`, name: "Squat", category: "mainlift", sets: 4, reps: "8", rpe: 8 },
            { id: `${workoutId}-ex-3`, name: "Bench Press", category: "mainlift", sets: 4, reps: "8", rpe: 8 },
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
      workouts: weekToDuplicate.workouts.map(w => ({
        ...w,
        id: `temp-workout-${Date.now()}-${Math.random()}`,
        exercises: w.exercises.map(e => ({ ...e, id: `temp-ex-${Date.now()}-${Math.random()}` }))
      })),
    };
    setWeeks([...weeks, newWeek]);
  };

  const removeWeek = (index: number) => setWeeks(weeks.filter((_, i) => i !== index));

  const addWorkout = (weekIndex: number) => {
    const newWeeks = [...weeks];
    const workoutId = `temp-workout-${Date.now()}`;
    newWeeks[weekIndex].workouts.push({
      id: workoutId,
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
    const newWorkoutId = `temp-workout-${Date.now()}`;
    newWeeks[weekIndex].workouts.push({
      ...workoutToDuplicate,
      id: newWorkoutId,
      name: `${workoutToDuplicate.name} (copy)`,
      exercises: workoutToDuplicate.exercises.map(e => ({ ...e, id: `${newWorkoutId}-ex-${Date.now()}-${Math.random()}` })),
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
    const exerciseId = `temp-ex-${Date.now()}`;
    newWeeks[weekIndex].workouts[workoutIndex].exercises.push({
      id: exerciseId,
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
    newWeeks[weekIndex].workouts[workoutIndex].exercises.push({ ...exercise, id: `temp-ex-${Date.now()}` });
    setWeeks(newWeeks);
  };

  const removeExercise = (weekIndex: number, workoutIndex: number, exerciseIndex: number) => {
    const newWeeks = [...weeks];
    newWeeks[weekIndex].workouts[workoutIndex].exercises = 
      newWeeks[weekIndex].workouts[workoutIndex].exercises.filter((_, i) => i !== exerciseIndex);
    setWeeks(newWeeks);
  };

  const generateWeekWithAI = async (weekIndex: number) => {
    if (aiGenerating) return;
    
    setAiGenerating(true);
    try {
      const context = {
        programType: program.name,
        weekNumber: weeks[weekIndex].weekNumber,
        focus: weeks[weekIndex].phase_name || "",
      };

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-program`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ type: "generate-week", context }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "AI generatie mislukt");
      }

      const data = await response.json();
      const newWeeks = [...weeks];
      
      const workoutsWithIds = data.week.workouts.map((workout: any, wIdx: number) => ({
        ...workout,
        id: `temp-workout-${Date.now()}-${wIdx}`,
        exercises: workout.exercises.map((ex: any, exIdx: number) => ({
          ...ex,
          id: `temp-ex-${Date.now()}-${wIdx}-${exIdx}`,
        })),
      }));

      newWeeks[weekIndex] = {
        ...newWeeks[weekIndex],
        name: data.week.name,
        description: data.week.description,
        phase_name: data.week.phase_name,
        workouts: workoutsWithIds,
      };
      
      setWeeks(newWeeks);
      toast({ description: "Week gegenereerd met AI! 🤖" });
    } catch (error: any) {
      toast({ title: "AI generatie fout", description: error.message, variant: "destructive" });
    } finally {
      setAiGenerating(false);
    }
  };

  const generateExercisesWithAI = async (weekIndex: number, workoutIndex: number, includeSuperset = false) => {
    if (aiGenerating) return;
    
    setAiGenerating(true);
    try {
      const workout = weeks[weekIndex].workouts[workoutIndex];
      const context = {
        workoutType: workout.name,
        count: 5,
        includeSuperset,
      };

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-program`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ type: "generate-exercises", context }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "AI generatie mislukt");
      }

      const data = await response.json();
      const newWeeks = [...weeks];
      
      const exercisesWithIds = data.exercises.map((ex: any, idx: number) => ({
        ...ex,
        id: `temp-ex-${Date.now()}-${idx}`,
      }));

      newWeeks[weekIndex].workouts[workoutIndex].exercises.push(...exercisesWithIds);
      setWeeks(newWeeks);
      toast({ description: `${exercisesWithIds.length} oefeningen gegenereerd met AI! 🤖` });
    } catch (error: any) {
      toast({ title: "AI generatie fout", description: error.message, variant: "destructive" });
    } finally {
      setAiGenerating(false);
    }
  };

  const createSuperset = (weekIndex: number, workoutIndex: number, exerciseIndex: number) => {
    const newWeeks = [...weeks];
    const workout = newWeeks[weekIndex].workouts[workoutIndex];
    const exercise = workout.exercises[exerciseIndex];
    
    if (exerciseIndex + 1 < workout.exercises.length && !workout.exercises[exerciseIndex + 1].group_id) {
      const groupId = `group-${Date.now()}`;
      exercise.group_id = groupId;
      exercise.group_type = "superset";
      workout.exercises[exerciseIndex + 1].group_id = groupId;
      workout.exercises[exerciseIndex + 1].group_type = "superset";
      setWeeks(newWeeks);
      toast({ description: "Superset aangemaakt!" });
    } else if (!exercise.group_id) {
      const groupId = `group-${Date.now()}`;
      exercise.group_id = groupId;
      exercise.group_type = "superset";
      workout.exercises.splice(exerciseIndex + 1, 0, {
        id: `temp-ex-${Date.now()}`,
        name: "",
        category: exercise.category,
        group_id: groupId,
        group_type: "superset",
      });
      setWeeks(newWeeks);
      toast({ description: "Superset aangemaakt! Vul de tweede oefening in." });
    }
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

  const handleWorkoutDragEnd = (event: DragEndEvent, weekIndex: number) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const newWeeks = [...weeks];
    const workouts = newWeeks[weekIndex].workouts;
    const oldIndex = workouts.findIndex(w => w.id === active.id);
    const newIndex = workouts.findIndex(w => w.id === over.id);

    newWeeks[weekIndex].workouts = arrayMove(workouts, oldIndex, newIndex);
    setWeeks(newWeeks);
    toast({ description: "Workout volgorde aangepast" });
  };

  const handleExerciseDragEnd = (event: DragEndEvent, weekIndex: number, workoutIndex: number) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const newWeeks = [...weeks];
    const exercises = newWeeks[weekIndex].workouts[workoutIndex].exercises;
    const oldIndex = exercises.findIndex(e => e.id === active.id);
    const newIndex = exercises.findIndex(e => e.id === over.id);

    newWeeks[weekIndex].workouts[workoutIndex].exercises = arrayMove(exercises, oldIndex, newIndex);
    setWeeks(newWeeks);
    toast({ description: "Oefening volgorde aangepast" });
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

      const { data: userData } = await supabase.auth.getUser();
      await supabase.from("programs").insert([{ 
        id: programId, 
        name: program.name, 
        description: program.description, 
        icon: program.icon,
        is_public: program.is_public,
        created_by: userData.user?.id,
      }]);

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
        await supabase.from("weeks").insert([{ 
          id: weekId, 
          program_id: programId, 
          week_number: week.weekNumber, 
          name: week.name,
          description: week.description || null,
          phase_name: week.phase_name || null,
        }]);

        for (let w = 0; w < week.workouts.length; w++) {
          const workout = week.workouts[w];
          const workoutId = `${weekId}-workout-${w + 1}`;
          await supabase.from("workouts").insert([{ 
            id: workoutId, 
            week_id: weekId, 
            day_number: w + 1, 
            name: workout.name, 
            duration: workout.duration,
            display_order: w 
          }]);

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
              group_id: exercise.group_id || null,
              group_type: exercise.group_type || null,
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
    <DndContext sensors={sensors} onDragEnd={handleLibraryDrop}>
      <div className="flex gap-6 min-h-screen">
        {/* Exercise Library Sidebar */}
        {step === "structure" && (
          <div className="w-80 flex-shrink-0 border-r bg-muted/30">
            <div className="sticky top-0">
              <ExerciseLibrary />
            </div>
          </div>
        )}
        
        {/* Main Content */}
        <div className="flex-1 space-y-6">
      {step === "template" && (
        <Card className="p-6">
          <h2 className="text-2xl font-bold mb-4">Kies een sjabloon</h2>
          <div className="grid gap-4 md:grid-cols-3">
            <Card className="p-6 cursor-pointer hover:bg-accent transition-colors" onClick={() => createFromTemplate(4, 3)}>
              <h3 className="font-bold text-lg">4 Weken - 3x/week</h3>
              <p className="text-sm text-muted-foreground">Voor beginners</p>
            </Card>
            <Card className="p-6 cursor-pointer hover:bg-accent transition-colors border-2 border-primary" onClick={() => createFromTemplate(8, 4)}>
              <div className="inline-block px-2 py-1 bg-primary text-primary-foreground text-xs rounded mb-2">Populair</div>
              <h3 className="font-bold text-lg">8 Weken - 4x/week</h3>
              <p className="text-sm text-muted-foreground">Standaard</p>
            </Card>
            <Card className="p-6 cursor-pointer hover:bg-accent transition-colors" onClick={() => createFromTemplate(12, 5)}>
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
            <div className="flex items-center gap-2 p-4 bg-muted/50 rounded-lg">
              <input
                type="checkbox"
                id="isPublic"
                checked={program.is_public}
                onChange={(e) => setProgram({ ...program, is_public: e.target.checked })}
                className="w-4 h-4 rounded border-input"
              />
              <Label htmlFor="isPublic" className="cursor-pointer">
                Publiek programma (zichtbaar voor iedereen)
              </Label>
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

          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="basic">Overzicht</TabsTrigger>
              <TabsTrigger value="exercises">Oefeningen Bewerken</TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-4 mt-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Weken ({weeks.length})</h3>
                <Button onClick={addWeek} size="sm"><Plus className="mr-2 h-4 w-4" />Week</Button>
              </div>

              <Accordion type="multiple" className="space-y-2">
                {weeks.map((week, weekIndex) => (
                  <AccordionItem key={weekIndex} value={`week-${weekIndex}`} className="border rounded-lg px-4">
                    <div className="flex items-center gap-2">
                      <AccordionTrigger className="flex-1 hover:no-underline">
                        <span className="font-semibold">{week.name} - {week.workouts.length} workouts</span>
                      </AccordionTrigger>
                      <Button variant="ghost" size="icon" onClick={() => duplicateWeek(weekIndex)}><Copy className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => removeWeek(weekIndex)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                    </div>
                    <AccordionContent className="pt-4">
                      <div className="space-y-4">
                        <div className="grid gap-4">
                          <div>
                            <Label>Week Naam</Label>
                            <Input
                              value={week.name}
                              onChange={(e) => {
                                const newWeeks = [...weeks];
                                newWeeks[weekIndex].name = e.target.value;
                                setWeeks(newWeeks);
                              }}
                            />
                          </div>
                          <div>
                            <Label>Fase Naam (optioneel)</Label>
                            <Input
                              placeholder="bijv: Weeks 1-4, Accumulation"
                              value={week.phase_name || ""}
                              onChange={(e) => {
                                const newWeeks = [...weeks];
                                newWeeks[weekIndex].phase_name = e.target.value;
                                setWeeks(newWeeks);
                              }}
                            />
                          </div>
                          <div>
                            <Label>Fase Beschrijving (optioneel)</Label>
                            <Textarea
                              placeholder="Wat gaan we bereiken in deze fase?"
                              rows={3}
                              value={week.description || ""}
                              onChange={(e) => {
                                const newWeeks = [...weeks];
                                newWeeks[weekIndex].description = e.target.value;
                                setWeeks(newWeeks);
                              }}
                            />
                          </div>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium">Workouts (sleep om te herschikken)</span>
                          <div className="flex gap-2">
                            <Button 
                              onClick={() => generateWeekWithAI(weekIndex)} 
                              size="sm" 
                              variant="secondary"
                              disabled={aiGenerating}
                            >
                              <Sparkles className="mr-2 h-4 w-4" />
                              {aiGenerating ? "Genereren..." : "AI Week"}
                            </Button>
                            <Button onClick={() => addWorkout(weekIndex)} size="sm" variant="outline">
                              <Plus className="mr-2 h-4 w-4" />Workout
                            </Button>
                          </div>
                        </div>
                        
                        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={(event) => handleWorkoutDragEnd(event, weekIndex)}>
                          <SortableContext items={week.workouts.map(w => w.id)} strategy={verticalListSortingStrategy}>
                            <div className="space-y-2">
                              {week.workouts.map((workout, workoutIndex) => (
                                <SortableWorkout
                                  key={workout.id}
                                  workout={workout}
                                  weekIndex={weekIndex}
                                  workoutIndex={workoutIndex}
                                  onDuplicate={() => duplicateWorkout(weekIndex, workoutIndex)}
                                  onRemove={() => removeWorkout(weekIndex, workoutIndex)}
                                />
                              ))}
                            </div>
                          </SortableContext>
                        </DndContext>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </TabsContent>

            <TabsContent value="exercises" className="space-y-4 mt-4">
              <Accordion type="multiple" className="space-y-2">
                {weeks.map((week, weekIndex) => (
                  <AccordionItem key={weekIndex} value={`week-${weekIndex}`} className="border rounded-lg px-4">
                    <AccordionTrigger><span className="font-semibold">{week.name}</span></AccordionTrigger>
                    <AccordionContent className="pt-4">
                      <Accordion type="multiple" className="space-y-2">
                        {week.workouts.map((workout, workoutIndex) => (
                          <DroppableWorkoutZone
                            key={workout.id}
                            workout={workout}
                            weekIndex={weekIndex}
                            workoutIndex={workoutIndex}
                          >
                            <AccordionItem value={workout.id} className="border rounded-lg px-4">
                            <AccordionTrigger><span>{workout.name}</span></AccordionTrigger>
                            <AccordionContent className="pt-4 space-y-4">
                              <div className="flex gap-2">
                                <Button 
                                  onClick={() => generateExercisesWithAI(weekIndex, workoutIndex, false)} 
                                  size="sm" 
                                  variant="secondary"
                                  disabled={aiGenerating}
                                  className="flex-1"
                                >
                                  <Sparkles className="mr-2 h-4 w-4" />
                                  {aiGenerating ? "Genereren..." : "AI Oefeningen"}
                                </Button>
                                <Button 
                                  onClick={() => generateExercisesWithAI(weekIndex, workoutIndex, true)} 
                                  size="sm" 
                                  variant="secondary"
                                  disabled={aiGenerating}
                                  className="flex-1"
                                >
                                  <Link2 className="mr-2 h-4 w-4" />
                                  {aiGenerating ? "Genereren..." : "AI Superset"}
                                </Button>
                                <Button 
                                  onClick={() => addExercise(weekIndex, workoutIndex)} 
                                  size="sm" 
                                  variant="outline"
                                  className="flex-1"
                                >
                                  <Plus className="mr-2 h-4 w-4" />Handmatig
                                </Button>
                              </div>

                              <div className="text-sm text-muted-foreground mb-2">Sleep om volgorde te wijzigen</div>

                              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={(event) => handleExerciseDragEnd(event, weekIndex, workoutIndex)}>
                                <SortableContext items={workout.exercises.map(e => e.id)} strategy={verticalListSortingStrategy}>
                                  <div className="space-y-2">
                                    {workout.exercises.map((exercise, exerciseIndex) => (
                                      <SortableExercise
                                        key={exercise.id}
                                        exercise={exercise}
                                        weekIndex={weekIndex}
                                        workoutIndex={workoutIndex}
                                        exerciseIndex={exerciseIndex}
                                        onUpdate={(field, value) => updateExercise(weekIndex, workoutIndex, exerciseIndex, field, value)}
                                        onDuplicate={() => duplicateExercise(weekIndex, workoutIndex, exerciseIndex)}
                                        onRemove={() => removeExercise(weekIndex, workoutIndex, exerciseIndex)}
                                      />
                                    ))}
                                  </div>
                                </SortableContext>
                              </DndContext>
                            </AccordionContent>
                          </AccordionItem>
                          </DroppableWorkoutZone>
                        ))}
                      </Accordion>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </TabsContent>
          </Tabs>

          <div className="flex gap-3 pt-4">
            <Button onClick={handleSubmit} disabled={saving} className="flex-1"><Save className="mr-2 h-4 w-4" />{saving ? "Opslaan..." : "Programma Aanmaken"}</Button>
          </div>
        </Card>
      )}

      {step !== "structure" && <Button variant="outline" onClick={onCancel} className="w-full">Annuleren</Button>}
        </div>
      </div>
    </DndContext>
  );
};
