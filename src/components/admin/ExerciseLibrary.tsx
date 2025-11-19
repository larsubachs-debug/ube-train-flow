import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Search, Dumbbell, Heart, Zap, Target } from "lucide-react";
import { useDraggable } from '@dnd-kit/core';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface ExerciseLibraryItem {
  id: string;
  name: string;
  description: string | null;
  category: string;
  difficulty: string;
  muscle_groups: string[] | null;
  equipment: string[] | null;
}

interface DraggableExerciseProps {
  exercise: ExerciseLibraryItem;
}

const DraggableExercise = ({ exercise }: DraggableExerciseProps) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `library-${exercise.id}`,
    data: exercise
  });

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
    opacity: isDragging ? 0.5 : 1,
    cursor: 'grab'
  } : { cursor: 'grab' };

  const getCategoryIcon = () => {
    switch (exercise.category) {
      case 'strength': return <Dumbbell className="h-4 w-4" />;
      case 'cardio': return <Heart className="h-4 w-4" />;
      case 'mobility': return <Target className="h-4 w-4" />;
      case 'core': return <Zap className="h-4 w-4" />;
      default: return <Dumbbell className="h-4 w-4" />;
    }
  };

  const getCategoryColor = () => {
    switch (exercise.category) {
      case 'strength': return 'bg-blue-500/10 text-blue-700 border-blue-500/20';
      case 'cardio': return 'bg-red-500/10 text-red-700 border-red-500/20';
      case 'mobility': return 'bg-green-500/10 text-green-700 border-green-500/20';
      case 'core': return 'bg-purple-500/10 text-purple-700 border-purple-500/20';
      default: return 'bg-gray-500/10 text-gray-700 border-gray-500/20';
    }
  };

  const getDifficultyColor = () => {
    switch (exercise.difficulty) {
      case 'beginner': return 'bg-green-500/10 text-green-700';
      case 'intermediate': return 'bg-yellow-500/10 text-yellow-700';
      case 'advanced': return 'bg-red-500/10 text-red-700';
      default: return 'bg-gray-500/10 text-gray-700';
    }
  };

  return (
    <Card 
      ref={setNodeRef} 
      style={style}
      {...listeners}
      {...attributes}
      className="p-3 hover:shadow-md transition-shadow border-l-4 border-l-primary"
    >
      <div className="flex items-start gap-3">
        <div className="bg-primary/10 p-2 rounded-lg flex-shrink-0">
          {getCategoryIcon()}
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-sm truncate">{exercise.name}</h4>
          {exercise.description && (
            <p className="text-xs text-muted-foreground line-clamp-2 mt-1">{exercise.description}</p>
          )}
          <div className="flex flex-wrap gap-1 mt-2">
            <Badge className={`text-xs ${getCategoryColor()}`}>
              {exercise.category}
            </Badge>
            <Badge variant="outline" className={`text-xs ${getDifficultyColor()}`}>
              {exercise.difficulty}
            </Badge>
          </div>
          {exercise.muscle_groups && exercise.muscle_groups.length > 0 && (
            <p className="text-xs text-muted-foreground mt-1">
              {exercise.muscle_groups.slice(0, 2).join(', ')}
            </p>
          )}
        </div>
      </div>
    </Card>
  );
};

export const ExerciseLibrary = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");

  const { data: exercises = [], isLoading } = useQuery({
    queryKey: ['exercise-library'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('exercise_library')
        .select('*')
        .order('name');
      
      if (error) throw error;
      return data || [];
    }
  });

  const filteredExercises = exercises.filter((ex: ExerciseLibraryItem) => {
    const matchesSearch = ex.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         ex.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === "all" || ex.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b space-y-3">
        <div className="flex items-center gap-2">
          <Dumbbell className="h-5 w-5 text-primary" />
          <h3 className="font-semibold">Oefeningen Bibliotheek</h3>
        </div>
        <p className="text-xs text-muted-foreground">
          Sleep oefeningen naar je workouts
        </p>
        
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Zoek oefeningen..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger>
            <SelectValue placeholder="Alle categorieën" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alle categorieën</SelectItem>
            <SelectItem value="strength">Kracht</SelectItem>
            <SelectItem value="cardio">Cardio</SelectItem>
            <SelectItem value="mobility">Mobiliteit</SelectItem>
            <SelectItem value="core">Core</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-2">
          {isLoading ? (
            <p className="text-sm text-muted-foreground text-center py-8">Laden...</p>
          ) : filteredExercises.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">Geen oefeningen gevonden</p>
          ) : (
            filteredExercises.map((exercise: ExerciseLibraryItem) => (
              <DraggableExercise key={exercise.id} exercise={exercise} />
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
};
