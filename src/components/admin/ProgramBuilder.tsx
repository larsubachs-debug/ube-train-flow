import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2, GripVertical, Copy, ChevronDown, ChevronRight, Dumbbell, Library, ArrowLeft, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Badge } from "@/components/ui/badge";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
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

interface Set {
  id: string;
  reps: string;
  weight: string;
  targetRPE?: string;
}

interface Exercise {
  id: string;
  name: string;
  sets: Set[];
  notes?: string;
  category: string;
  restTimer: string;
  muscleGroup?: string;
}

interface Day {
  id: string;
  name: string;
  exercises: Exercise[];
}

interface Week {
  id: string;
  name: string;
  weekNumber: number;
  days: Day[];
}

interface Program {
  id?: string;
  name: string;
  goal: string;
  sessionsPerWeek: number;
  weeks: Week[];
}

interface ProgramBuilderProps {
  onComplete: () => void;
  onCancel: () => void;
  initialData?: any;
}

// Compact sortable exercise card
const SortableExerciseCard = ({ 
  exercise, 
  onUpdate, 
  onDelete, 
  onDuplicate 
}: { 
  exercise: Exercise;
  onUpdate: (id: string, field: keyof Exercise, value: any) => void;
  onDelete: (id: string) => void;
  onDuplicate: (id: string) => void;
}) => {
  const [isOpen, setIsOpen] = useState(false);
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

  const updateSet = (setId: string, field: keyof Set, value: string) => {
    const updatedSets = exercise.sets.map(set =>
      set.id === setId ? { ...set, [field]: value } : set
    );
    onUpdate(exercise.id, 'sets', updatedSets);
  };

  const addSet = () => {
    const lastSet = exercise.sets[exercise.sets.length - 1];
    const newSet: Set = {
      id: `set-${Date.now()}`,
      reps: lastSet?.reps || "10",
      weight: lastSet?.weight || "20",
      targetRPE: lastSet?.targetRPE || "7",
    };
    onUpdate(exercise.id, 'sets', [...exercise.sets, newSet]);
  };

  const removeSet = (setId: string) => {
    if (exercise.sets.length <= 1) return;
    onUpdate(exercise.id, 'sets', exercise.sets.filter(s => s.id !== setId));
  };

  return (
    <div ref={setNodeRef} style={style}>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <Card className={`overflow-hidden ${isDragging ? 'shadow-lg ring-2 ring-primary/50' : ''}`}>
          {/* Collapsed Header */}
          <CollapsibleTrigger asChild>
            <div className="flex items-center gap-3 p-4 cursor-pointer hover:bg-muted/50 transition-colors">
              <div 
                {...attributes} 
                {...listeners}
                className="cursor-grab active:cursor-grabbing touch-none"
                onClick={(e) => e.stopPropagation()}
              >
                <GripVertical className="h-4 w-4 text-muted-foreground" />
              </div>
              
              {isOpen ? (
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              )}
              
              <div className="flex-1 min-w-0">
                <div className="font-medium truncate">
                  {exercise.name || "Nieuwe oefening"}
                </div>
                <div className="text-xs text-muted-foreground">
                  {exercise.sets.length} sets • {exercise.category}
                </div>
              </div>
              
              <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onDuplicate(exercise.id)}
                  className="h-8 w-8"
                >
                  <Copy className="h-3 w-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onDelete(exercise.id)}
                  className="h-8 w-8 text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </CollapsibleTrigger>

          {/* Expanded Content */}
          <CollapsibleContent>
            <div className="px-4 pb-4 space-y-4 border-t pt-4">
              {/* Exercise Name & Settings */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Naam</label>
                  <Input
                    placeholder="Naam oefening"
                    value={exercise.name}
                    onChange={(e) => onUpdate(exercise.id, 'name', e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Rest</label>
                  <Select 
                    value={exercise.restTimer} 
                    onValueChange={(val) => onUpdate(exercise.id, 'restTimer', val)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Rest" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="00:30">00:30</SelectItem>
                      <SelectItem value="01:00">01:00</SelectItem>
                      <SelectItem value="01:30">01:30</SelectItem>
                      <SelectItem value="02:00">02:00</SelectItem>
                      <SelectItem value="03:00">03:00</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Sets Table - Compact */}
              <div className="space-y-2">
                <div className="grid grid-cols-[50px_1fr_1fr_1fr_32px] gap-2 text-xs text-muted-foreground font-medium px-1">
                  <div>Set</div>
                  <div>Kg</div>
                  <div>Reps</div>
                  <div>RPE</div>
                  <div></div>
                </div>
                
                {exercise.sets.map((set, index) => (
                  <div key={set.id} className="grid grid-cols-[50px_1fr_1fr_1fr_32px] gap-2 items-center">
                    <div className="text-sm text-muted-foreground pl-1">{index + 1}</div>
                    <Input
                      type="text"
                      value={set.weight}
                      onChange={(e) => updateSet(set.id, 'weight', e.target.value)}
                      className="h-8 text-sm"
                    />
                    <Input
                      type="text"
                      value={set.reps}
                      onChange={(e) => updateSet(set.id, 'reps', e.target.value)}
                      className="h-8 text-sm"
                    />
                    <Input
                      type="text"
                      value={set.targetRPE || ""}
                      onChange={(e) => updateSet(set.id, 'targetRPE', e.target.value)}
                      placeholder="-"
                      className="h-8 text-sm"
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeSet(set.id)}
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                ))}

                <Button
                  variant="outline"
                  size="sm"
                  onClick={addSet}
                  className="w-full h-8"
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Set toevoegen
                </Button>
              </div>

              {/* Notes */}
              <Textarea
                placeholder="Notities (optioneel)"
                value={exercise.notes || ""}
                onChange={(e) => onUpdate(exercise.id, 'notes', e.target.value)}
                className="resize-none text-sm h-16"
              />
            </div>
          </CollapsibleContent>
        </Card>
      </Collapsible>
    </div>
  );
};

export const ProgramBuilder = ({ onComplete, onCancel, initialData }: ProgramBuilderProps) => {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [libraryOpen, setLibraryOpen] = useState(false);
  
  const [program, setProgram] = useState<Program>({
    name: initialData?.name || "",
    goal: "Strength",
    sessionsPerWeek: 3,
    weeks: [
      {
        id: "week-1",
        name: "Week 1",
        weekNumber: 1,
        days: [
          { id: "day-1", name: "Dag 1", exercises: [] },
          { id: "day-2", name: "Dag 2", exercises: [] },
          { id: "day-3", name: "Dag 3", exercises: [] },
        ],
      },
    ],
  });

  const [selectedWeekId, setSelectedWeekId] = useState<string>("week-1");
  const [selectedDayId, setSelectedDayId] = useState<string>("day-1");

  const selectedWeek = program.weeks.find(w => w.id === selectedWeekId);
  const selectedDay = selectedWeek?.days.find(d => d.id === selectedDayId);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const { setNodeRef: setDroppableRef, isOver } = useDroppable({
    id: 'exercise-drop-zone',
  });

  // When week changes, select first day
  useEffect(() => {
    if (selectedWeek && selectedWeek.days.length > 0) {
      if (!selectedWeek.days.find(d => d.id === selectedDayId)) {
        setSelectedDayId(selectedWeek.days[0].id);
      }
    }
  }, [selectedWeekId, selectedWeek]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!selectedDay) return;

    const isFromLibrary = active.data.current?.type === 'library-exercise';
    
    if (isFromLibrary) {
      if (!over || (over.id !== 'exercise-drop-zone' && !selectedDay.exercises.find(ex => ex.id === over.id))) {
        return;
      }

      const libraryExercise = active.data.current?.exercise;
      if (!libraryExercise) return;

      const newExercise: Exercise = {
        id: `ex-${Date.now()}`,
        name: libraryExercise.name,
        category: libraryExercise.category || 'Strength',
        restTimer: '01:00',
        notes: libraryExercise.description || '',
        sets: [
          { id: `set-1`, reps: '10', weight: '20', targetRPE: '7' },
          { id: `set-2`, reps: '10', weight: '20', targetRPE: '7' },
          { id: `set-3`, reps: '10', weight: '20', targetRPE: '7' },
        ],
      };

      const updatedWeeks = program.weeks.map(week =>
        week.id === selectedWeekId
          ? {
              ...week,
              days: week.days.map(day =>
                day.id === selectedDayId
                  ? { ...day, exercises: [...day.exercises, newExercise] }
                  : day
              ),
            }
          : week
      );
      
      setProgram({ ...program, weeks: updatedWeeks });
      toast({ description: `${libraryExercise.name} toegevoegd` });
      return;
    }

    if (!over || active.id === over.id) return;

    const oldIndex = selectedDay.exercises.findIndex(ex => ex.id === active.id);
    const newIndex = selectedDay.exercises.findIndex(ex => ex.id === over.id);

    if (oldIndex === -1 || newIndex === -1) return;

    const updatedWeeks = program.weeks.map(week =>
      week.id === selectedWeekId
        ? {
            ...week,
            days: week.days.map(day =>
              day.id === selectedDayId
                ? { ...day, exercises: arrayMove(day.exercises, oldIndex, newIndex) }
                : day
            ),
          }
        : week
    );

    setProgram({ ...program, weeks: updatedWeeks });
  };

  const addWeek = () => {
    const newWeek: Week = {
      id: `week-${Date.now()}`,
      name: `Week ${program.weeks.length + 1}`,
      weekNumber: program.weeks.length + 1,
      days: [
        { id: `day-${Date.now()}-1`, name: "Dag 1", exercises: [] },
        { id: `day-${Date.now()}-2`, name: "Dag 2", exercises: [] },
        { id: `day-${Date.now()}-3`, name: "Dag 3", exercises: [] },
      ],
    };
    setProgram({ ...program, weeks: [...program.weeks, newWeek] });
    setSelectedWeekId(newWeek.id);
  };

  const duplicateWeek = (weekId: string) => {
    const week = program.weeks.find(w => w.id === weekId);
    if (!week) return;

    const newWeek: Week = {
      ...week,
      id: `week-${Date.now()}`,
      name: `Week ${program.weeks.length + 1}`,
      weekNumber: program.weeks.length + 1,
      days: week.days.map(day => ({
        ...day,
        id: `day-${Date.now()}-${Math.random()}`,
        exercises: day.exercises.map(ex => ({
          ...ex,
          id: `ex-${Date.now()}-${Math.random()}`,
          sets: ex.sets.map(s => ({ ...s, id: `set-${Date.now()}-${Math.random()}` })),
        })),
      })),
    };
    setProgram({ ...program, weeks: [...program.weeks, newWeek] });
    toast({ description: "Week gedupliceerd" });
  };

  const deleteWeek = (weekId: string) => {
    if (program.weeks.length <= 1) {
      toast({ description: "Je moet minstens 1 week hebben", variant: "destructive" });
      return;
    }
    const newWeeks = program.weeks.filter(w => w.id !== weekId);
    setProgram({ ...program, weeks: newWeeks });
    if (selectedWeekId === weekId) {
      setSelectedWeekId(newWeeks[0].id);
    }
  };

  const addDay = () => {
    if (!selectedWeek) return;
    const newDay: Day = {
      id: `day-${Date.now()}`,
      name: `Dag ${selectedWeek.days.length + 1}`,
      exercises: [],
    };
    const updatedWeeks = program.weeks.map(week =>
      week.id === selectedWeekId
        ? { ...week, days: [...week.days, newDay] }
        : week
    );
    setProgram({ ...program, weeks: updatedWeeks });
    setSelectedDayId(newDay.id);
  };

  const deleteDay = (dayId: string) => {
    if (!selectedWeek || selectedWeek.days.length <= 1) {
      toast({ description: "Je moet minstens 1 dag hebben", variant: "destructive" });
      return;
    }
    const updatedWeeks = program.weeks.map(week =>
      week.id === selectedWeekId
        ? { ...week, days: week.days.filter(d => d.id !== dayId) }
        : week
    );
    setProgram({ ...program, weeks: updatedWeeks });
    if (selectedDayId === dayId) {
      const remaining = selectedWeek.days.filter(d => d.id !== dayId);
      setSelectedDayId(remaining[0]?.id || "");
    }
  };

  const addExercise = () => {
    if (!selectedDay) return;
    const newExercise: Exercise = {
      id: `ex-${Date.now()}`,
      name: "",
      category: "Strength",
      restTimer: "01:00",
      sets: [
        { id: `set-1`, reps: "10", weight: "20", targetRPE: "7" },
        { id: `set-2`, reps: "10", weight: "20", targetRPE: "7" },
        { id: `set-3`, reps: "10", weight: "20", targetRPE: "7" },
      ],
    };

    const updatedWeeks = program.weeks.map(week =>
      week.id === selectedWeekId
        ? {
            ...week,
            days: week.days.map(day =>
              day.id === selectedDayId
                ? { ...day, exercises: [...day.exercises, newExercise] }
                : day
            ),
          }
        : week
    );
    setProgram({ ...program, weeks: updatedWeeks });
  };

  const updateExercise = (exerciseId: string, field: keyof Exercise, value: any) => {
    const updatedWeeks = program.weeks.map(week =>
      week.id === selectedWeekId
        ? {
            ...week,
            days: week.days.map(day =>
              day.id === selectedDayId
                ? {
                    ...day,
                    exercises: day.exercises.map(ex =>
                      ex.id === exerciseId ? { ...ex, [field]: value } : ex
                    ),
                  }
                : day
            ),
          }
        : week
    );
    setProgram({ ...program, weeks: updatedWeeks });
  };

  const deleteExercise = (exerciseId: string) => {
    const updatedWeeks = program.weeks.map(week =>
      week.id === selectedWeekId
        ? {
            ...week,
            days: week.days.map(day =>
              day.id === selectedDayId
                ? { ...day, exercises: day.exercises.filter(ex => ex.id !== exerciseId) }
                : day
            ),
          }
        : week
    );
    setProgram({ ...program, weeks: updatedWeeks });
  };

  const duplicateExercise = (exerciseId: string) => {
    const exercise = selectedDay?.exercises.find(ex => ex.id === exerciseId);
    if (!exercise) return;

    const newExercise: Exercise = {
      ...exercise,
      id: `ex-${Date.now()}`,
      name: `${exercise.name} (kopie)`,
      sets: exercise.sets.map(set => ({ ...set, id: `set-${Date.now()}-${Math.random()}` })),
    };

    const updatedWeeks = program.weeks.map(week =>
      week.id === selectedWeekId
        ? {
            ...week,
            days: week.days.map(day =>
              day.id === selectedDayId
                ? { ...day, exercises: [...day.exercises, newExercise] }
                : day
            ),
          }
        : week
    );
    setProgram({ ...program, weeks: updatedWeeks });
  };

  const handleSubmit = async () => {
    if (!program.name.trim()) {
      toast({ title: "Vul een programmanaam in", variant: "destructive" });
      return;
    }

    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Je moet ingelogd zijn");

      const programId = `program-${Date.now()}`;

      const { error: programError } = await supabase
        .from("programs")
        .insert({
          id: programId,
          name: program.name,
          description: program.goal,
          icon: "Dumbbell",
          is_public: true,
          created_by: user.id,
        });

      if (programError) throw programError;

      for (const week of program.weeks) {
        const weekId = `week-${programId}-${week.weekNumber}`;
        
        const { error: weekError } = await supabase
          .from("weeks")
          .insert({
            id: weekId,
            program_id: programId,
            week_number: week.weekNumber,
            name: week.name,
            display_order: week.weekNumber,
          });

        if (weekError) throw weekError;

        for (const day of week.days) {
          const workoutId = `workout-${weekId}-${day.id}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
          
          const { error: workoutError } = await supabase
            .from("workouts")
            .insert({
              id: workoutId,
              week_id: weekId,
              day_number: week.days.indexOf(day) + 1,
              name: day.name,
              duration: 60,
              display_order: week.days.indexOf(day),
            });

          if (workoutError) throw workoutError;

          for (const exercise of day.exercises) {
            const exerciseId = `exercise-${workoutId}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
            const { error: exerciseError } = await supabase
              .from("exercises")
              .insert({
                id: exerciseId,
                workout_id: workoutId,
                name: exercise.name,
                category: exercise.category.toLowerCase(),
                sets: exercise.sets.length,
                reps: exercise.sets[0]?.reps || "10",
                weight: parseFloat(exercise.sets[0]?.weight || "0"),
                notes: exercise.notes || null,
                display_order: day.exercises.indexOf(exercise),
              });

            if (exerciseError) throw exerciseError;
          }
        }
      }

      toast({ description: "Programma succesvol opgeslagen!" });
      onComplete();
    } catch (error: any) {
      console.error("Save error:", error);
      toast({ 
        title: "Fout bij opslaan", 
        description: error.message, 
        variant: "destructive" 
      });
    } finally {
      setSaving(false);
    }
  };

  const getTotalExercises = () => {
    return program.weeks.reduce((total, week) => 
      total + week.days.reduce((dayTotal, day) => dayTotal + day.exercises.length, 0), 0
    );
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <div className="min-h-screen bg-background">
        {/* Sticky Header */}
        <div className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur">
          <div className="container mx-auto px-4 py-3">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Button variant="ghost" size="icon" onClick={onCancel}>
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <div>
                  <Input
                    placeholder="Programma naam..."
                    value={program.name}
                    onChange={(e) => setProgram({ ...program, name: e.target.value })}
                    className="text-lg font-semibold border-0 px-0 h-auto focus-visible:ring-0 bg-transparent"
                  />
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{program.weeks.length} weken</span>
                    <span>•</span>
                    <span>{getTotalExercises()} oefeningen</span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Sheet open={libraryOpen} onOpenChange={setLibraryOpen}>
                  <SheetTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Library className="h-4 w-4 mr-2" />
                      Bibliotheek
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="right" className="w-[400px] sm:w-[540px]">
                    <SheetHeader>
                      <SheetTitle>Oefeningen Bibliotheek</SheetTitle>
                    </SheetHeader>
                    <div className="mt-4">
                      <ExerciseLibrary />
                    </div>
                  </SheetContent>
                </Sheet>
                
                <Button 
                  onClick={handleSubmit} 
                  disabled={saving}
                  size="sm"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {saving ? "Opslaan..." : "Opslaan"}
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-6 max-w-4xl">
          {/* Program Settings */}
          <Card className="p-4 mb-6">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Doel</label>
                <Select 
                  value={program.goal} 
                  onValueChange={(val) => setProgram({ ...program, goal: val })}
                >
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Strength">Strength</SelectItem>
                    <SelectItem value="Hyrox">Hyrox</SelectItem>
                    <SelectItem value="Run">Run</SelectItem>
                    <SelectItem value="General">General</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Sessies/week</label>
                <Input
                  type="number"
                  min="1"
                  value={program.sessionsPerWeek}
                  onChange={(e) => setProgram({ ...program, sessionsPerWeek: parseInt(e.target.value) || 1 })}
                  className="h-9"
                />
              </div>
            </div>
          </Card>

          {/* Week Tabs */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <h2 className="font-semibold">Weken</h2>
              <Button variant="outline" size="sm" onClick={addWeek}>
                <Plus className="h-3 w-3 mr-1" />
                Week
              </Button>
            </div>
            
            <Tabs value={selectedWeekId} onValueChange={setSelectedWeekId}>
              <TabsList className="w-full justify-start overflow-x-auto">
                {program.weeks.map((week) => (
                  <TabsTrigger key={week.id} value={week.id} className="relative group">
                    {week.name}
                    <div className="absolute -top-1 -right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-4 w-4"
                        onClick={(e) => {
                          e.stopPropagation();
                          duplicateWeek(week.id);
                        }}
                      >
                        <Copy className="h-2 w-2" />
                      </Button>
                    </div>
                  </TabsTrigger>
                ))}
              </TabsList>

              {program.weeks.map((week) => (
                <TabsContent key={week.id} value={week.id} className="mt-4">
                  {/* Day Tabs inside Week */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      {week.days.map((day) => (
                        <Badge
                          key={day.id}
                          variant={selectedDayId === day.id ? "default" : "outline"}
                          className="cursor-pointer"
                          onClick={() => setSelectedDayId(day.id)}
                        >
                          {day.name}
                          <span className="ml-1 text-xs opacity-70">
                            ({day.exercises.length})
                          </span>
                        </Badge>
                      ))}
                      <Button variant="ghost" size="sm" onClick={addDay} className="h-6 px-2">
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                    
                    {program.weeks.length > 1 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteWeek(week.id)}
                        className="text-destructive hover:text-destructive h-6"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    )}
                  </div>

                  {/* Day Content */}
                  {selectedDay && selectedWeek?.id === week.id && (
                    <div 
                      ref={setDroppableRef}
                      className={`min-h-[300px] rounded-lg transition-colors ${
                        isOver ? 'bg-primary/5 ring-2 ring-primary ring-inset' : ''
                      }`}
                    >
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <Input
                            value={selectedDay.name}
                            onChange={(e) => {
                              const updatedWeeks = program.weeks.map(w =>
                                w.id === selectedWeekId
                                  ? {
                                      ...w,
                                      days: w.days.map(d =>
                                        d.id === selectedDayId ? { ...d, name: e.target.value } : d
                                      ),
                                    }
                                  : w
                              );
                              setProgram({ ...program, weeks: updatedWeeks });
                            }}
                            className="text-lg font-medium border-0 px-0 h-auto focus-visible:ring-0 bg-transparent w-32"
                          />
                          {selectedWeek && selectedWeek.days.length > 1 && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => deleteDay(selectedDayId)}
                              className="h-6 w-6 text-muted-foreground hover:text-destructive"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                        <Button onClick={addExercise} size="sm">
                          <Plus className="h-3 w-3 mr-1" />
                          Oefening
                        </Button>
                      </div>

                      <SortableContext
                        items={selectedDay.exercises.map(ex => ex.id)}
                        strategy={verticalListSortingStrategy}
                      >
                        <div className="space-y-3">
                          {selectedDay.exercises.map((exercise) => (
                            <SortableExerciseCard
                              key={exercise.id}
                              exercise={exercise}
                              onUpdate={updateExercise}
                              onDelete={deleteExercise}
                              onDuplicate={duplicateExercise}
                            />
                          ))}
                        </div>
                      </SortableContext>

                      {selectedDay.exercises.length === 0 && (
                        <div className={`text-center py-12 rounded-lg border-2 border-dashed transition-colors ${
                          isOver ? 'border-primary bg-primary/5' : 'border-border'
                        }`}>
                          <Dumbbell className={`h-10 w-10 mx-auto mb-3 ${
                            isOver ? 'text-primary' : 'text-muted-foreground'
                          }`} />
                          <p className="text-sm text-muted-foreground">
                            Sleep oefeningen uit de bibliotheek of klik op "Oefening"
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </TabsContent>
              ))}
            </Tabs>
          </div>
        </div>
      </div>
    </DndContext>
  );
};
