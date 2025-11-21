import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Search, Dumbbell, Plus, Video, GripVertical } from "lucide-react";
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { MediaUploadZone } from "@/components/media/MediaUploadZone";
import { useToast } from "@/hooks/use-toast";

interface ExerciseLibraryItem {
  id: string;
  name: string;
  description: string | null;
  category: string;
  difficulty: string;
  muscle_groups: string[] | null;
  equipment: string[] | null;
  video_url: string | null;
}

const ExerciseCard = ({ exercise, onClick }: { exercise: ExerciseLibraryItem; onClick?: () => void }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    isDragging,
  } = useDraggable({
    id: `library-${exercise.id}`,
    data: {
      type: 'library-exercise',
      exercise: exercise,
    },
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.5 : 1,
    cursor: isDragging ? 'grabbing' : 'grab',
  };

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
    <div 
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`p-3 rounded-xl bg-muted/30 hover:bg-muted/60 transition-colors border border-border/50 group ${
        isDragging ? 'shadow-lg ring-2 ring-ube-blue/50' : ''
      }`}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <GripVertical className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h4 className="font-medium text-sm truncate">{exercise.name}</h4>
              {exercise.video_url && (
                <Video className="h-3 w-3 text-ube-blue flex-shrink-0" />
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              {exercise.muscle_groups?.[0] || exercise.category}
            </p>
          </div>
        </div>
        <Button
          size="icon"
          variant="ghost"
          className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity bg-ube-blue text-white hover:bg-ube-blue/90"
          onClick={(e) => {
            e.stopPropagation();
            onClick?.();
          }}
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

const CustomExerciseDialog = ({ exercise, onClose }: { exercise?: ExerciseLibraryItem; onClose?: () => void }) => {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(exercise?.name || "");
  const [description, setDescription] = useState(exercise?.description || "");
  const [category, setCategory] = useState(exercise?.category || "strength");
  const [difficulty, setDifficulty] = useState(exercise?.difficulty || "intermediate");
  const [muscleGroups, setMuscleGroups] = useState<string[]>(exercise?.muscle_groups || []);
  const [equipment, setEquipment] = useState<string[]>(exercise?.equipment || []);
  const [videoUrl, setVideoUrl] = useState(exercise?.video_url || "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const handleSubmit = async () => {
    if (!name.trim()) {
      toast({
        title: "Name required",
        description: "Please enter an exercise name",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const exerciseData = {
        name: name.trim(),
        description: description.trim() || null,
        category,
        difficulty,
        muscle_groups: muscleGroups.length > 0 ? muscleGroups : null,
        equipment: equipment.length > 0 ? equipment : null,
        video_url: videoUrl || null,
      };

      if (exercise) {
        // Update existing exercise
        const { error } = await supabase
          .from('exercise_library')
          .update(exerciseData)
          .eq('id', exercise.id);

        if (error) throw error;
        
        toast({
          title: "Exercise updated",
          description: "Exercise has been updated successfully",
        });
      } else {
        // Create new exercise
        const { error } = await supabase
          .from('exercise_library')
          .insert(exerciseData);

        if (error) throw error;
        
        toast({
          title: "Exercise created",
          description: "New exercise has been added to the library",
        });
      }

      queryClient.invalidateQueries({ queryKey: ['exercise-library'] });
      setOpen(false);
      if (onClose) onClose();
      
      // Reset form
      if (!exercise) {
        setName("");
        setDescription("");
        setCategory("strength");
        setDifficulty("intermediate");
        setMuscleGroups([]);
        setEquipment([]);
        setVideoUrl("");
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVideoUpload = (mediaId: string, publicUrl: string) => {
    setVideoUrl(publicUrl);
    toast({
      title: "Video uploaded",
      description: "Exercise video has been uploaded successfully",
    });
  };

  const toggleMuscleGroup = (muscle: string) => {
    setMuscleGroups(prev => 
      prev.includes(muscle) 
        ? prev.filter(m => m !== muscle)
        : [...prev, muscle]
    );
  };

  const toggleEquipment = (equip: string) => {
    setEquipment(prev => 
      prev.includes(equip) 
        ? prev.filter(e => e !== equip)
        : [...prev, equip]
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {exercise ? (
          <div />
        ) : (
          <Button variant="outline" size="sm" className="w-full">
            <Plus className="h-3 w-3 mr-2" />
            Custom exercise
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{exercise ? 'Edit Exercise' : 'Create Custom Exercise'}</DialogTitle>
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
            <label className="text-sm font-medium mb-2 block">Description</label>
            <Textarea
              placeholder="Detailed description of the exercise..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
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

            <div>
              <label className="text-sm font-medium mb-2 block">Difficulty</label>
              <Select value={difficulty} onValueChange={setDifficulty}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="beginner">Beginner</SelectItem>
                  <SelectItem value="intermediate">Intermediate</SelectItem>
                  <SelectItem value="advanced">Advanced</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Muscle Groups</label>
            <div className="flex flex-wrap gap-2">
              {['Chest', 'Back', 'Legs', 'Shoulders', 'Arms', 'Core', 'Full body'].map((muscle) => (
                <Badge
                  key={muscle}
                  variant={muscleGroups.includes(muscle) ? "default" : "outline"}
                  className="cursor-pointer"
                  onClick={() => toggleMuscleGroup(muscle)}
                >
                  {muscle}
                </Badge>
              ))}
            </div>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Equipment</label>
            <div className="flex flex-wrap gap-2">
              {['Bodyweight', 'Barbell', 'Dumbbell', 'Machine', 'Cable', 'Bands'].map((equip) => (
                <Badge
                  key={equip}
                  variant={equipment.includes(equip) ? "default" : "outline"}
                  className="cursor-pointer"
                  onClick={() => toggleEquipment(equip)}
                >
                  {equip}
                </Badge>
              ))}
            </div>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Exercise Video</label>
            <MediaUploadZone
              bucket="exercise-media"
              folder="videos"
              accept="video"
              aspectRatio="16:9"
              maxSizeMB={100}
              onUploadComplete={handleVideoUpload}
              currentMediaUrl={videoUrl}
            />
          </div>

          <Button 
            className="w-full bg-ube-blue hover:bg-ube-blue/90 text-white"
            onClick={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Saving...' : exercise ? 'Update Exercise' : 'Create Exercise'}
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
  const [selectedExercise, setSelectedExercise] = useState<ExerciseLibraryItem | null>(null);

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
              <ExerciseCard 
                key={exercise.id} 
                exercise={exercise}
                onClick={() => setSelectedExercise(exercise)}
              />
            ))
          )}
        </div>
      </ScrollArea>

      {/* Edit Dialog */}
      {selectedExercise && (
        <CustomExerciseDialog 
          exercise={selectedExercise} 
          onClose={() => setSelectedExercise(null)}
        />
      )}
    </div>
  );
};
