import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2, GripVertical, Copy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface Set {
  id: string;
  reps: string;
  weight: string;
}

interface Exercise {
  id: string;
  name: string;
  sets: Set[];
  notes?: string;
  category: "strength" | "cardio";
  selected?: boolean;
}

interface SortableExerciseItemProps {
  exercise: Exercise;
  isSelected: boolean;
  onClick: () => void;
}

interface Day {
  id: string;
  name: string;
  exercises: Exercise[];
}

interface ProgramBuilderProps {
  onComplete: () => void;
  onCancel: () => void;
  initialData?: any;
}

const SortableExerciseItem = ({ exercise, isSelected, onClick }: SortableExerciseItemProps) => {
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

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-4 p-4 rounded-xl cursor-pointer transition-all ${
        isSelected 
          ? 'bg-[hsl(199,89%,48%)]/10 border-2 border-[hsl(199,89%,48%)]' 
          : 'bg-muted/50 hover:bg-muted'
      } ${isDragging ? 'shadow-lg ring-2 ring-[hsl(199,89%,48%)]/50' : ''}`}
      onClick={onClick}
    >
      <div 
        {...attributes} 
        {...listeners}
        className="cursor-grab active:cursor-grabbing touch-none"
        onClick={(e) => e.stopPropagation()}
      >
        <GripVertical className="h-5 w-5 text-muted-foreground hover:text-foreground transition-colors" />
      </div>
      <div className="w-16 h-16 rounded-lg bg-muted flex-shrink-0 flex items-center justify-center">
        <span className="text-2xl">💪</span>
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="font-medium text-foreground truncate">
          {exercise.name || "New exercise"}
        </h4>
        <p className="text-sm text-muted-foreground">
          {exercise.sets.length} sets
        </p>
      </div>
      <Checkbox 
        checked={isSelected} 
        className="pointer-events-none"
      />
    </div>
  );
};

export const ProgramBuilder = ({ onComplete, onCancel, initialData }: ProgramBuilderProps) => {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [imagePreview, setImagePreview] = useState<string>("");
  
  const [program, setProgram] = useState({
    name: initialData?.name || "",
    description: initialData?.description || "",
    difficulty: "Beginner",
  });

  const [days, setDays] = useState<Day[]>([
    { id: "day-1", name: "Day 1", exercises: [] },
    { id: "day-2", name: "Day 2", exercises: [] },
    { id: "day-3", name: "Day 3", exercises: [] },
  ]);

  const [selectedDayId, setSelectedDayId] = useState<string>("day-1");
  const [selectedExerciseId, setSelectedExerciseId] = useState<string | null>(null);

  const selectedDay = days.find(d => d.id === selectedDayId);
  const selectedExercise = selectedDay?.exercises.find(e => e.id === selectedExerciseId);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id || !selectedDay) return;

    const oldIndex = selectedDay.exercises.findIndex(ex => ex.id === active.id);
    const newIndex = selectedDay.exercises.findIndex(ex => ex.id === over.id);

    if (oldIndex === -1 || newIndex === -1) return;

    const updatedDays = days.map(day => 
      day.id === selectedDayId
        ? { ...day, exercises: arrayMove(day.exercises, oldIndex, newIndex) }
        : day
    );

    setDays(updatedDays);
  };

  const addDay = () => {
    const newDay: Day = {
      id: `day-${Date.now()}`,
      name: `Day ${days.length + 1}`,
      exercises: [],
    };
    setDays([...days, newDay]);
  };

  const addExercise = () => {
    if (!selectedDay) return;
    
    const newExercise: Exercise = {
      id: `ex-${Date.now()}`,
      name: "",
      category: "strength",
      sets: [
        { id: `set-1`, reps: "12", weight: "20" },
        { id: `set-2`, reps: "10", weight: "22" },
        { id: `set-3`, reps: "8", weight: "24" },
      ],
      selected: false,
    };

    const updatedDays = days.map(day => 
      day.id === selectedDayId 
        ? { ...day, exercises: [...day.exercises, newExercise] }
        : day
    );
    
    setDays(updatedDays);
    setSelectedExerciseId(newExercise.id);
  };

  const updateExercise = (exerciseId: string, field: keyof Exercise, value: any) => {
    const updatedDays = days.map(day => ({
      ...day,
      exercises: day.exercises.map(ex => 
        ex.id === exerciseId ? { ...ex, [field]: value } : ex
      ),
    }));
    setDays(updatedDays);
  };

  const updateSet = (exerciseId: string, setId: string, field: keyof Set, value: string) => {
    const updatedDays = days.map(day => ({
      ...day,
      exercises: day.exercises.map(ex => {
        if (ex.id === exerciseId) {
          return {
            ...ex,
            sets: ex.sets.map(set => 
              set.id === setId ? { ...set, [field]: value } : set
            ),
          };
        }
        return ex;
      }),
    }));
    setDays(updatedDays);
  };

  const addSet = (exerciseId: string) => {
    const updatedDays = days.map(day => ({
      ...day,
      exercises: day.exercises.map(ex => {
        if (ex.id === exerciseId) {
          const lastSet = ex.sets[ex.sets.length - 1];
          return {
            ...ex,
            sets: [...ex.sets, { 
              id: `set-${Date.now()}`, 
              reps: lastSet?.reps || "10", 
              weight: lastSet?.weight || "20" 
            }],
          };
        }
        return ex;
      }),
    }));
    setDays(updatedDays);
  };

  const toggleExerciseSelection = (exerciseId: string) => {
    const updatedDays = days.map(day => ({
      ...day,
      exercises: day.exercises.map(ex => 
        ex.id === exerciseId ? { ...ex, selected: !ex.selected } : ex
      ),
    }));
    setDays(updatedDays);
    setSelectedExerciseId(exerciseId);
  };

  const deleteExercise = (exerciseId: string) => {
    const updatedDays = days.map(day => ({
      ...day,
      exercises: day.exercises.filter(ex => ex.id !== exerciseId),
    }));
    setDays(updatedDays);
    setSelectedExerciseId(null);
    toast({ description: "Oefening verwijderd" });
  };

  const duplicateExercise = (exerciseId: string) => {
    const exercise = selectedDay?.exercises.find(ex => ex.id === exerciseId);
    if (!exercise) return;

    const newExercise: Exercise = {
      ...exercise,
      id: `ex-${Date.now()}`,
      name: `${exercise.name} (copy)`,
      sets: exercise.sets.map(set => ({
        ...set,
        id: `set-${Date.now()}-${Math.random()}`,
      })),
      selected: false,
    };

    const updatedDays = days.map(day => 
      day.id === selectedDayId 
        ? { ...day, exercises: [...day.exercises, newExercise] }
        : day
    );
    
    setDays(updatedDays);
    setSelectedExerciseId(newExercise.id);
    toast({ description: "Oefening gedupliceerd" });
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async () => {
    if (!program.name.trim()) {
      toast({ title: "Vul een programmanaam in", variant: "destructive" });
      return;
    }

    setSaving(true);
    try {
      // Save program logic here
      toast({ description: "Programma opgeslagen!" });
      onComplete();
    } catch (error: any) {
      toast({ title: "Fout bij opslaan", description: error.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Header */}
      <div className="border-b bg-background">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-foreground">Workout editor</h1>
          <div className="flex gap-3">
            <Button variant="outline" onClick={onCancel}>
              Annuleren
            </Button>
            <Button 
              onClick={handleSubmit} 
              disabled={saving}
              className="bg-[hsl(199,89%,48%)] hover:bg-[hsl(199,89%,42%)] text-white"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create workout
            </Button>
          </div>
        </div>
      </div>

      {/* Top Section */}
      <div className="container mx-auto px-6 py-6">
        <div className="grid grid-cols-12 gap-6">
          {/* Image */}
          <div className="col-span-3">
            <div 
              className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-muted cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => document.getElementById('program-image')?.click()}
            >
              {imagePreview ? (
                <img src={imagePreview} alt="Program" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Plus className="h-12 w-12 text-muted-foreground" />
                </div>
              )}
              <input
                id="program-image"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageSelect}
              />
            </div>
          </div>

          {/* Details */}
          <div className="col-span-9 grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">Workout name</label>
              <Input
                placeholder="Indoor strength workout"
                value={program.name}
                onChange={(e) => setProgram({ ...program, name: e.target.value })}
                className="bg-muted/50"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">Description</label>
              <Input
                placeholder="Add description..."
                value={program.description}
                onChange={(e) => setProgram({ ...program, description: e.target.value })}
                className="bg-muted/50"
              />
            </div>
            <div className="col-span-2">
              <label className="text-sm font-medium text-foreground mb-2 block">Difficulty</label>
              <Select value={program.difficulty} onValueChange={(val) => setProgram({ ...program, difficulty: val })}>
                <SelectTrigger className="bg-muted/50 w-[200px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Beginner">Beginner</SelectItem>
                  <SelectItem value="Intermediate">Intermediate</SelectItem>
                  <SelectItem value="Advanced">Advanced</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content - 3 Columns */}
      <div className="container mx-auto px-6 pb-8">
        <div className="grid grid-cols-12 gap-6">
          {/* Days Column */}
          <div className="col-span-3">
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-foreground">Days</h3>
                <Button 
                  size="icon" 
                  variant="ghost"
                  onClick={addDay}
                  className="h-8 w-8 rounded-full bg-[hsl(199,89%,48%)] hover:bg-[hsl(199,89%,42%)] text-white"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <div className="space-y-2">
                {days.map((day) => (
                  <button
                    key={day.id}
                    onClick={() => setSelectedDayId(day.id)}
                    className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
                      selectedDayId === day.id
                        ? 'bg-muted text-foreground font-medium'
                        : 'text-muted-foreground hover:bg-muted/50'
                    }`}
                  >
                    {day.name}
                  </button>
                ))}
              </div>
            </Card>
          </div>

          {/* Activities Column */}
          <div className="col-span-5">
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-foreground">Activities</h3>
                <Button 
                  size="icon" 
                  variant="ghost"
                  onClick={addExercise}
                  className="h-8 w-8 rounded-full bg-[hsl(199,89%,48%)] hover:bg-[hsl(199,89%,42%)] text-white"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={selectedDay?.exercises.map(ex => ex.id) || []}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-3">
                    {selectedDay?.exercises.map((exercise) => (
                      <SortableExerciseItem
                        key={exercise.id}
                        exercise={exercise}
                        isSelected={exercise.selected || false}
                        onClick={() => toggleExerciseSelection(exercise.id)}
                      />
                    ))}
                    {selectedDay && selectedDay.exercises.length === 0 && (
                      <p className="text-center text-muted-foreground py-8">
                        No activities yet. Click + to add one.
                      </p>
                    )}
                  </div>
                </SortableContext>
              </DndContext>
            </Card>
          </div>

          {/* Exercise Detail Column */}
          <div className="col-span-4">
            {selectedExercise ? (
              <Card className="p-6">
                <div className="space-y-6">
                  {/* Header with Action Buttons */}
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium text-muted-foreground">Exercise details</h3>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => duplicateExercise(selectedExercise.id)}
                        className="h-8 w-8 hover:bg-muted"
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteExercise(selectedExercise.id)}
                        className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Exercise Image */}
                  <div className="aspect-video rounded-xl bg-muted flex items-center justify-center">
                    <span className="text-6xl">💪</span>
                  </div>

                  {/* Exercise Name */}
                  <div>
                    <Input
                      placeholder="Exercise name"
                      value={selectedExercise.name}
                      onChange={(e) => updateExercise(selectedExercise.id, 'name', e.target.value)}
                      className="text-lg font-semibold bg-muted/50"
                    />
                    <p className="text-sm text-muted-foreground mt-1">
                      {selectedExercise.sets.length} sets
                    </p>
                  </div>

                  {/* Sets */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      {selectedExercise.sets.map((set, index) => (
                        <div key={set.id} className="flex-1">
                          <div className="bg-muted/50 rounded-lg p-3 text-center">
                            <div className="text-xs text-muted-foreground mb-1">
                              {set.reps}x
                            </div>
                            <Input
                              type="text"
                              value={set.weight}
                              onChange={(e) => updateSet(selectedExercise.id, set.id, 'weight', e.target.value)}
                              className="text-center text-sm font-medium bg-transparent border-0 p-0 h-auto"
                            />
                            <div className="text-xs text-muted-foreground mt-1">kg</div>
                          </div>
                        </div>
                      ))}
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => addSet(selectedExercise.id)}
                        className="h-10 w-10 rounded-full bg-[hsl(199,89%,48%)] hover:bg-[hsl(199,89%,42%)] text-white"
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Notes */}
                  <Textarea
                    placeholder="Add note..."
                    value={selectedExercise.notes || ""}
                    onChange={(e) => updateExercise(selectedExercise.id, 'notes', e.target.value)}
                    className="bg-muted/50 resize-none"
                    rows={3}
                  />
                </div>
              </Card>
            ) : (
              <Card className="p-6">
                <p className="text-center text-muted-foreground py-12">
                  Select an exercise to view details
                </p>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
