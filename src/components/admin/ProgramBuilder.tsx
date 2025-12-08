import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2, GripVertical, Copy, ChevronDown, ChevronRight, Dumbbell, Library, ArrowLeft, Save, Eye, Pencil, Play, Clock, Target, FileDown } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";

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

interface WorkoutTemplate {
  id: string;
  name: string;
  category: string;
  description: string;
  exercises: Omit<Exercise, 'id'>[];
}

// Predefined workout templates
const WORKOUT_TEMPLATES: WorkoutTemplate[] = [
  {
    id: 'push-day',
    name: 'Push Day',
    category: 'Strength',
    description: 'Chest, shoulders & triceps',
    exercises: [
      { name: 'Bench Press', category: 'Strength', restTimer: '02:00', sets: [
        { id: '1', reps: '8', weight: '60', targetRPE: '7' },
        { id: '2', reps: '8', weight: '60', targetRPE: '8' },
        { id: '3', reps: '8', weight: '60', targetRPE: '8' },
        { id: '4', reps: '8', weight: '60', targetRPE: '9' },
      ]},
      { name: 'Overhead Press', category: 'Strength', restTimer: '02:00', sets: [
        { id: '1', reps: '8', weight: '40', targetRPE: '7' },
        { id: '2', reps: '8', weight: '40', targetRPE: '8' },
        { id: '3', reps: '8', weight: '40', targetRPE: '8' },
      ]},
      { name: 'Incline Dumbbell Press', category: 'Strength', restTimer: '01:30', sets: [
        { id: '1', reps: '10', weight: '24', targetRPE: '7' },
        { id: '2', reps: '10', weight: '24', targetRPE: '8' },
        { id: '3', reps: '10', weight: '24', targetRPE: '8' },
      ]},
      { name: 'Lateral Raises', category: 'Strength', restTimer: '01:00', sets: [
        { id: '1', reps: '12', weight: '10', targetRPE: '7' },
        { id: '2', reps: '12', weight: '10', targetRPE: '8' },
        { id: '3', reps: '12', weight: '10', targetRPE: '8' },
      ]},
      { name: 'Tricep Pushdowns', category: 'Strength', restTimer: '01:00', sets: [
        { id: '1', reps: '12', weight: '25', targetRPE: '7' },
        { id: '2', reps: '12', weight: '25', targetRPE: '8' },
        { id: '3', reps: '12', weight: '25', targetRPE: '8' },
      ]},
    ],
  },
  {
    id: 'pull-day',
    name: 'Pull Day',
    category: 'Strength',
    description: 'Back & biceps',
    exercises: [
      { name: 'Deadlift', category: 'Strength', restTimer: '03:00', sets: [
        { id: '1', reps: '5', weight: '100', targetRPE: '7' },
        { id: '2', reps: '5', weight: '100', targetRPE: '8' },
        { id: '3', reps: '5', weight: '100', targetRPE: '8' },
      ]},
      { name: 'Pull-ups', category: 'Strength', restTimer: '02:00', sets: [
        { id: '1', reps: '8', weight: '0', targetRPE: '7' },
        { id: '2', reps: '8', weight: '0', targetRPE: '8' },
        { id: '3', reps: '8', weight: '0', targetRPE: '8' },
      ]},
      { name: 'Barbell Row', category: 'Strength', restTimer: '02:00', sets: [
        { id: '1', reps: '8', weight: '60', targetRPE: '7' },
        { id: '2', reps: '8', weight: '60', targetRPE: '8' },
        { id: '3', reps: '8', weight: '60', targetRPE: '8' },
      ]},
      { name: 'Face Pulls', category: 'Strength', restTimer: '01:00', sets: [
        { id: '1', reps: '15', weight: '20', targetRPE: '7' },
        { id: '2', reps: '15', weight: '20', targetRPE: '8' },
        { id: '3', reps: '15', weight: '20', targetRPE: '8' },
      ]},
      { name: 'Bicep Curls', category: 'Strength', restTimer: '01:00', sets: [
        { id: '1', reps: '12', weight: '12', targetRPE: '7' },
        { id: '2', reps: '12', weight: '12', targetRPE: '8' },
        { id: '3', reps: '12', weight: '12', targetRPE: '8' },
      ]},
    ],
  },
  {
    id: 'leg-day',
    name: 'Leg Day',
    category: 'Strength',
    description: 'Quads, hamstrings & glutes',
    exercises: [
      { name: 'Back Squat', category: 'Strength', restTimer: '03:00', sets: [
        { id: '1', reps: '6', weight: '80', targetRPE: '7' },
        { id: '2', reps: '6', weight: '80', targetRPE: '8' },
        { id: '3', reps: '6', weight: '80', targetRPE: '8' },
        { id: '4', reps: '6', weight: '80', targetRPE: '9' },
      ]},
      { name: 'Romanian Deadlift', category: 'Strength', restTimer: '02:00', sets: [
        { id: '1', reps: '10', weight: '60', targetRPE: '7' },
        { id: '2', reps: '10', weight: '60', targetRPE: '8' },
        { id: '3', reps: '10', weight: '60', targetRPE: '8' },
      ]},
      { name: 'Leg Press', category: 'Strength', restTimer: '02:00', sets: [
        { id: '1', reps: '10', weight: '120', targetRPE: '7' },
        { id: '2', reps: '10', weight: '120', targetRPE: '8' },
        { id: '3', reps: '10', weight: '120', targetRPE: '8' },
      ]},
      { name: 'Walking Lunges', category: 'Strength', restTimer: '01:30', sets: [
        { id: '1', reps: '12', weight: '20', targetRPE: '7' },
        { id: '2', reps: '12', weight: '20', targetRPE: '8' },
        { id: '3', reps: '12', weight: '20', targetRPE: '8' },
      ]},
      { name: 'Calf Raises', category: 'Strength', restTimer: '01:00', sets: [
        { id: '1', reps: '15', weight: '40', targetRPE: '7' },
        { id: '2', reps: '15', weight: '40', targetRPE: '8' },
        { id: '3', reps: '15', weight: '40', targetRPE: '8' },
      ]},
    ],
  },
  {
    id: 'upper-body',
    name: 'Upper Body',
    category: 'Strength',
    description: 'Complete upper body',
    exercises: [
      { name: 'Bench Press', category: 'Strength', restTimer: '02:00', sets: [
        { id: '1', reps: '8', weight: '60', targetRPE: '7' },
        { id: '2', reps: '8', weight: '60', targetRPE: '8' },
        { id: '3', reps: '8', weight: '60', targetRPE: '8' },
      ]},
      { name: 'Barbell Row', category: 'Strength', restTimer: '02:00', sets: [
        { id: '1', reps: '8', weight: '50', targetRPE: '7' },
        { id: '2', reps: '8', weight: '50', targetRPE: '8' },
        { id: '3', reps: '8', weight: '50', targetRPE: '8' },
      ]},
      { name: 'Overhead Press', category: 'Strength', restTimer: '02:00', sets: [
        { id: '1', reps: '8', weight: '35', targetRPE: '7' },
        { id: '2', reps: '8', weight: '35', targetRPE: '8' },
        { id: '3', reps: '8', weight: '35', targetRPE: '8' },
      ]},
      { name: 'Lat Pulldown', category: 'Strength', restTimer: '01:30', sets: [
        { id: '1', reps: '10', weight: '50', targetRPE: '7' },
        { id: '2', reps: '10', weight: '50', targetRPE: '8' },
        { id: '3', reps: '10', weight: '50', targetRPE: '8' },
      ]},
    ],
  },
  {
    id: 'lower-body',
    name: 'Lower Body',
    category: 'Strength',
    description: 'Complete lower body',
    exercises: [
      { name: 'Back Squat', category: 'Strength', restTimer: '03:00', sets: [
        { id: '1', reps: '8', weight: '70', targetRPE: '7' },
        { id: '2', reps: '8', weight: '70', targetRPE: '8' },
        { id: '3', reps: '8', weight: '70', targetRPE: '8' },
      ]},
      { name: 'Hip Thrust', category: 'Strength', restTimer: '02:00', sets: [
        { id: '1', reps: '10', weight: '80', targetRPE: '7' },
        { id: '2', reps: '10', weight: '80', targetRPE: '8' },
        { id: '3', reps: '10', weight: '80', targetRPE: '8' },
      ]},
      { name: 'Leg Curl', category: 'Strength', restTimer: '01:30', sets: [
        { id: '1', reps: '12', weight: '40', targetRPE: '7' },
        { id: '2', reps: '12', weight: '40', targetRPE: '8' },
        { id: '3', reps: '12', weight: '40', targetRPE: '8' },
      ]},
      { name: 'Leg Extension', category: 'Strength', restTimer: '01:30', sets: [
        { id: '1', reps: '12', weight: '40', targetRPE: '7' },
        { id: '2', reps: '12', weight: '40', targetRPE: '8' },
        { id: '3', reps: '12', weight: '40', targetRPE: '8' },
      ]},
    ],
  },
  {
    id: 'full-body',
    name: 'Full Body',
    category: 'Strength',
    description: 'Complete full body',
    exercises: [
      { name: 'Back Squat', category: 'Strength', restTimer: '02:00', sets: [
        { id: '1', reps: '8', weight: '60', targetRPE: '7' },
        { id: '2', reps: '8', weight: '60', targetRPE: '8' },
        { id: '3', reps: '8', weight: '60', targetRPE: '8' },
      ]},
      { name: 'Bench Press', category: 'Strength', restTimer: '02:00', sets: [
        { id: '1', reps: '8', weight: '50', targetRPE: '7' },
        { id: '2', reps: '8', weight: '50', targetRPE: '8' },
        { id: '3', reps: '8', weight: '50', targetRPE: '8' },
      ]},
      { name: 'Barbell Row', category: 'Strength', restTimer: '02:00', sets: [
        { id: '1', reps: '8', weight: '50', targetRPE: '7' },
        { id: '2', reps: '8', weight: '50', targetRPE: '8' },
        { id: '3', reps: '8', weight: '50', targetRPE: '8' },
      ]},
      { name: 'Overhead Press', category: 'Strength', restTimer: '01:30', sets: [
        { id: '1', reps: '10', weight: '30', targetRPE: '7' },
        { id: '2', reps: '10', weight: '30', targetRPE: '8' },
        { id: '3', reps: '10', weight: '30', targetRPE: '8' },
      ]},
    ],
  },
  {
    id: 'hyrox',
    name: 'Hyrox Training',
    category: 'Hyrox',
    description: 'Hyrox race simulation',
    exercises: [
      { name: 'SkiErg', category: 'Cardio', restTimer: '01:00', notes: '1000m', sets: [
        { id: '1', reps: '1', weight: '0', targetRPE: '8' },
      ]},
      { name: 'Sled Push', category: 'Strength', restTimer: '01:00', notes: '50m', sets: [
        { id: '1', reps: '1', weight: '125', targetRPE: '8' },
      ]},
      { name: 'Sled Pull', category: 'Strength', restTimer: '01:00', notes: '50m', sets: [
        { id: '1', reps: '1', weight: '75', targetRPE: '8' },
      ]},
      { name: 'Wall Balls', category: 'Strength', restTimer: '01:00', sets: [
        { id: '1', reps: '75', weight: '9', targetRPE: '8' },
      ]},
    ],
  },
  {
    id: 'cardio',
    name: 'Cardio Session',
    category: 'Cardio',
    description: 'Endurance focused',
    exercises: [
      { name: 'Treadmill Run', category: 'Cardio', restTimer: '00:30', notes: '20 min steady state', sets: [
        { id: '1', reps: '1', weight: '0', targetRPE: '6' },
      ]},
      { name: 'Rowing Intervals', category: 'Cardio', restTimer: '01:00', notes: '500m x 4', sets: [
        { id: '1', reps: '4', weight: '0', targetRPE: '8' },
      ]},
      { name: 'Assault Bike', category: 'Cardio', restTimer: '01:00', notes: '30s on / 30s off x 10', sets: [
        { id: '1', reps: '10', weight: '0', targetRPE: '9' },
      ]},
    ],
  },
];

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

// Preview Component - Shows how members see the program
const ProgramPreview = ({ program, onClose }: { program: Program; onClose: () => void }) => {
  const [previewWeekIndex, setPreviewWeekIndex] = useState(0);
  const [previewDayIndex, setPreviewDayIndex] = useState(0);
  
  const currentWeek = program.weeks[previewWeekIndex];
  const currentDay = currentWeek?.days[previewDayIndex];
  const progressPercentage = ((previewWeekIndex + 1) / program.weeks.length) * 100;

  return (
    <div className="min-h-screen bg-background">
      {/* Preview Header */}
      <div className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Badge variant="secondary" className="gap-1">
                <Eye className="h-3 w-3" />
                Preview Mode
              </Badge>
              <span className="text-sm text-muted-foreground">
                Zo zien members dit programma
              </span>
            </div>
            <Button variant="outline" size="sm" onClick={onClose}>
              <Pencil className="h-3 w-3 mr-2" />
              Terug naar bewerken
            </Button>
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <div className="relative h-[40vh] min-h-[300px] overflow-hidden bg-gradient-to-br from-primary/20 via-primary/10 to-background">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-background" />
        <div className="absolute bottom-0 left-0 right-0 px-6 pb-8">
          <h1 className="text-3xl md:text-4xl font-bold mb-2">
            {program.name || "Nieuw Programma"}
          </h1>
          <p className="text-muted-foreground">
            {program.goal} • {program.weeks.length} weken • {program.sessionsPerWeek} sessies/week
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 -mt-6 relative z-10 space-y-6 pb-20">
        {/* Progress Card */}
        <Card className="p-5 bg-card/95 backdrop-blur-sm">
          <h2 className="text-lg font-semibold mb-4">Training block progress</h2>
          
          <div className="mb-4">
            <p className="text-base font-medium mb-3">
              {currentWeek?.name || `Week ${previewWeekIndex + 1}`}
            </p>
            <Progress value={progressPercentage} className="h-2" />
            <div className="flex justify-between mt-2 text-sm text-muted-foreground">
              <span>Total: {program.weeks.length} weeks</span>
              <span className="font-medium text-foreground">
                Week {previewWeekIndex + 1}/{program.weeks.length}
              </span>
            </div>
          </div>

          {/* Week Selector for Preview */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2">
            {program.weeks.map((week, index) => (
              <Button
                key={week.id}
                variant={previewWeekIndex === index ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  setPreviewWeekIndex(index);
                  setPreviewDayIndex(0);
                }}
              >
                Week {index + 1}
              </Button>
            ))}
          </div>
        </Card>

        {/* Week Workouts */}
        <div>
          <h3 className="text-lg font-semibold mb-3">
            {currentWeek?.name} - Workouts
          </h3>
          
          <div className="grid gap-3">
            {currentWeek?.days.map((day, dayIndex) => (
              <Card 
                key={day.id} 
                className={`p-4 cursor-pointer transition-all ${
                  previewDayIndex === dayIndex 
                    ? 'ring-2 ring-primary bg-primary/5' 
                    : 'hover:bg-muted/50'
                }`}
                onClick={() => setPreviewDayIndex(dayIndex)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <Dumbbell className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">{day.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {day.exercises.length} oefeningen
                      </p>
                    </div>
                  </div>
                  <Button size="sm" variant="ghost">
                    <Play className="h-4 w-4" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Selected Day Detail */}
        {currentDay && currentDay.exercises.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold mb-3">
              {currentDay.name} - Oefeningen
            </h3>
            
            <div className="space-y-3">
              {currentDay.exercises.map((exercise, exIndex) => (
                <Card key={exercise.id} className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center text-sm font-medium">
                      {exIndex + 1}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{exercise.name || "Oefening"}</p>
                      <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Target className="h-3 w-3" />
                          {exercise.sets.length} sets
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {exercise.restTimer} rust
                        </span>
                      </div>
                      
                      {/* Sets Preview */}
                      <div className="mt-3 space-y-1">
                        {exercise.sets.map((set, setIndex) => (
                          <div key={set.id} className="flex items-center gap-4 text-sm py-1 px-2 rounded bg-muted/50">
                            <span className="text-muted-foreground w-12">Set {setIndex + 1}</span>
                            <span>{set.weight}kg</span>
                            <span>×</span>
                            <span>{set.reps} reps</span>
                            {set.targetRPE && (
                              <span className="text-muted-foreground">@ RPE {set.targetRPE}</span>
                            )}
                          </div>
                        ))}
                      </div>
                      
                      {exercise.notes && (
                        <p className="mt-2 text-sm text-muted-foreground italic">
                          {exercise.notes}
                        </p>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {currentDay && currentDay.exercises.length === 0 && (
          <Card className="p-8 text-center">
            <Dumbbell className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
            <p className="text-muted-foreground">
              Nog geen oefeningen voor {currentDay.name}
            </p>
          </Card>
        )}
      </div>
    </div>
  );
};

export const ProgramBuilder = ({ onComplete, onCancel, initialData }: ProgramBuilderProps) => {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  
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

  // Show preview mode
  if (isPreviewMode) {
    return <ProgramPreview program={program} onClose={() => setIsPreviewMode(false)} />;
  }

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

  // Apply a workout template to the current day
  const applyTemplate = (template: WorkoutTemplate) => {
    if (!selectedDay) return;

    const templateExercises: Exercise[] = template.exercises.map((ex, index) => ({
      id: `ex-${Date.now()}-${index}`,
      name: ex.name,
      category: ex.category,
      restTimer: ex.restTimer,
      notes: ex.notes,
      sets: ex.sets.map((set, setIndex) => ({
        ...set,
        id: `set-${Date.now()}-${index}-${setIndex}`,
      })),
    }));

    const updatedWeeks = program.weeks.map(week =>
      week.id === selectedWeekId
        ? {
            ...week,
            days: week.days.map(day =>
              day.id === selectedDayId
                ? { 
                    ...day, 
                    name: template.name,
                    exercises: [...day.exercises, ...templateExercises] 
                  }
                : day
            ),
          }
        : week
    );

    setProgram({ ...program, weeks: updatedWeeks });
    toast({ description: `Template "${template.name}" toegepast` });
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
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setIsPreviewMode(true)}
                >
                  <Eye className="h-4 w-4 mr-2" />
                  Preview
                </Button>
                
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
                        <div className="flex items-center gap-2">
                          {/* Template Dropdown */}
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="outline" size="sm">
                                <FileDown className="h-3 w-3 mr-1" />
                                Template
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-56">
                              <DropdownMenuLabel>Workout Templates</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              {WORKOUT_TEMPLATES.map((template) => (
                                <DropdownMenuItem
                                  key={template.id}
                                  onClick={() => applyTemplate(template)}
                                >
                                  <div className="flex flex-col">
                                    <span className="font-medium">{template.name}</span>
                                    <span className="text-xs text-muted-foreground">
                                      {template.description} • {template.exercises.length} oefeningen
                                    </span>
                                  </div>
                                </DropdownMenuItem>
                              ))}
                            </DropdownMenuContent>
                          </DropdownMenu>
                          
                          <Button onClick={addExercise} size="sm">
                            <Plus className="h-3 w-3 mr-1" />
                            Oefening
                          </Button>
                        </div>
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
