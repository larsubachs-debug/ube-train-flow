import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Search, Dumbbell, Plus } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface ExerciseLibraryItem {
  id: string;
  name: string;
  description: string | null;
  category: string;
  difficulty: string;
  muscle_groups: string[] | null;
  equipment: string[] | null;
}

const ExerciseCard = ({ exercise }: { exercise: ExerciseLibraryItem }) => {
  const getCategoryColor = () => {
    switch (exercise.category) {
      case 'strength': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'cardio': return 'bg-red-50 text-red-700 border-red-200';
      case 'mobility': return 'bg-green-50 text-green-700 border-green-200';
      case 'core': return 'bg-purple-50 text-purple-700 border-purple-200';
      default: return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  return (
    <div className="p-3 rounded-xl bg-muted/30 hover:bg-muted/60 transition-colors cursor-pointer border border-border/50 group">
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-sm truncate">{exercise.name}</h4>
          <p className="text-xs text-muted-foreground mt-0.5">
            {exercise.muscle_groups?.[0] || exercise.category}
          </p>
        </div>
        <Button
          size="icon"
          variant="ghost"
          className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity bg-ube-blue text-white hover:bg-ube-blue/90"
        >
          <Plus className="h-3 w-3" />
        </Button>
      </div>
      <Badge className={`text-xs ${getCategoryColor()}`}>
        {exercise.category}
      </Badge>
    </div>
  );
};

const CustomExerciseDialog = () => {
  const [name, setName] = useState("");
  const [category, setCategory] = useState("strength");

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="w-full">
          <Plus className="h-3 w-3 mr-2" />
          Custom exercise
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Custom Exercise</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Exercise Name</label>
            <Input
              placeholder="Bench Press"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">Category</label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="strength">Strength</SelectItem>
                <SelectItem value="cardio">Cardio</SelectItem>
                <SelectItem value="mobility">Mobility</SelectItem>
                <SelectItem value="core">Core</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button className="w-full bg-ube-blue hover:bg-ube-blue/90 text-white">
            Create Exercise
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export const ExerciseLibrary = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [equipmentFilter, setEquipmentFilter] = useState<string>("all");
  const [muscleFilter, setMuscleFilter] = useState<string>("all");

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
    const matchesEquipment = equipmentFilter === "all" || 
                            ex.equipment?.includes(equipmentFilter);
    const matchesMuscle = muscleFilter === "all" || 
                         ex.muscle_groups?.includes(muscleFilter);
    return matchesSearch && matchesEquipment && matchesMuscle;
  });

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-5 border-b space-y-4">
        <div className="flex items-center gap-2">
          <Dumbbell className="h-5 w-5 text-ube-blue" />
          <h3 className="font-semibold">Exercise Library</h3>
        </div>
        
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search exercises..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Filters */}
        <div className="space-y-2">
          <Select value={equipmentFilter} onValueChange={setEquipmentFilter}>
            <SelectTrigger className="h-9">
              <SelectValue placeholder="Equipment" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Equipment</SelectItem>
              <SelectItem value="Bodyweight">Bodyweight</SelectItem>
              <SelectItem value="Barbell">Barbell</SelectItem>
              <SelectItem value="Dumbbell">Dumbbell</SelectItem>
              <SelectItem value="Machine">Machine</SelectItem>
              <SelectItem value="Cable">Cable</SelectItem>
            </SelectContent>
          </Select>

          <Select value={muscleFilter} onValueChange={setMuscleFilter}>
            <SelectTrigger className="h-9">
              <SelectValue placeholder="Muscle Group" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Muscles</SelectItem>
              <SelectItem value="Chest">Chest</SelectItem>
              <SelectItem value="Back">Back</SelectItem>
              <SelectItem value="Legs">Legs</SelectItem>
              <SelectItem value="Shoulders">Shoulders</SelectItem>
              <SelectItem value="Arms">Arms</SelectItem>
              <SelectItem value="Core">Core</SelectItem>
              <SelectItem value="Full body">Full Body</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <CustomExerciseDialog />
      </div>

      {/* Exercise List */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-2">
          {isLoading ? (
            <p className="text-sm text-muted-foreground text-center py-8">Loading...</p>
          ) : filteredExercises.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No exercises found
            </p>
          ) : (
            filteredExercises.map((exercise: ExerciseLibraryItem) => (
              <ExerciseCard key={exercise.id} exercise={exercise} />
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
};
