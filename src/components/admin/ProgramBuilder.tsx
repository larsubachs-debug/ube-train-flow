import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, ChevronLeft, ChevronRight, Upload, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

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
  const [step, setStep] = useState(1);
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

  const [currentWeekIndex, setCurrentWeekIndex] = useState(0);
  const [currentWorkoutIndex, setCurrentWorkoutIndex] = useState<number | null>(null);

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
    setCurrentWorkoutIndex(newWeeks[weekIndex].workouts.length - 1);
  };

  const removeWorkout = (weekIndex: number, workoutIndex: number) => {
    const newWeeks = [...weeks];
    newWeeks[weekIndex].workouts = newWeeks[weekIndex].workouts.filter((_, i) => i !== workoutIndex);
    setWeeks(newWeeks);
    if (currentWorkoutIndex === workoutIndex) {
      setCurrentWorkoutIndex(null);
    }
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
    try {
      let imageUrl = null;

      // Upload image if provided
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

      // Create program
      const { error: programError } = await supabase.from("programs").insert([
        {
          id: program.id,
          name: program.name,
          description: program.description,
          icon: program.icon,
        },
      ]);

      if (programError) throw programError;

      // Store image URL in program_media if image was uploaded
      if (imageUrl) {
        const { data: userData } = await supabase.auth.getUser();
        
        // First create media record
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

        // Link media to program
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

      // Create weeks, workouts, and exercises
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
        title: "Success",
        description: "Program created successfully with all details",
      });

      onComplete();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const renderStep1 = () => (
    <div className="space-y-4">
      <div>
        <Label>Program ID (URL-friendly)</Label>
        <Input
          placeholder="e.g., strength-muscle"
          value={program.id}
          onChange={(e) => setProgram({ ...program, id: e.target.value })}
        />
      </div>
      <div>
        <Label>Program Name</Label>
        <Input
          placeholder="e.g., Strength & Muscle"
          value={program.name}
          onChange={(e) => setProgram({ ...program, name: e.target.value })}
        />
      </div>
      <div>
        <Label>Description</Label>
        <Textarea
          placeholder="Describe the program..."
          value={program.description}
          onChange={(e) => setProgram({ ...program, description: e.target.value })}
        />
      </div>
      <div>
        <Label>Program Image</Label>
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
              <span className="text-sm text-muted-foreground">Click to upload image</span>
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
  );

  const renderStep2 = () => (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Program Weeks</h3>
        <Button onClick={addWeek} size="sm">
          <Plus className="mr-2 h-4 w-4" />
          Add Week
        </Button>
      </div>

      {weeks.map((week, weekIndex) => (
        <Card key={weekIndex} className="p-4">
          <div className="flex justify-between items-start mb-2">
            <div className="flex-1">
              <Input
                value={week.name}
                onChange={(e) => {
                  const newWeeks = [...weeks];
                  newWeeks[weekIndex].name = e.target.value;
                  setWeeks(newWeeks);
                }}
                placeholder="Week name"
              />
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => removeWeek(weekIndex)}
              className="ml-2"
            >
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">
            {week.workouts.length} workout(s)
          </p>
        </Card>
      ))}
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-4">
      <div>
        <Label>Select Week</Label>
        <Select
          value={currentWeekIndex.toString()}
          onValueChange={(value) => setCurrentWeekIndex(parseInt(value))}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {weeks.map((week, index) => (
              <SelectItem key={index} value={index.toString()}>
                {week.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Workouts</h3>
        <Button onClick={() => addWorkout(currentWeekIndex)} size="sm">
          <Plus className="mr-2 h-4 w-4" />
          Add Workout
        </Button>
      </div>

      {weeks[currentWeekIndex].workouts.map((workout, workoutIndex) => (
        <Card key={workoutIndex} className="p-4">
          <div className="space-y-3">
            <div className="flex justify-between items-start">
              <div className="flex-1 space-y-2">
                <Input
                  value={workout.name}
                  onChange={(e) => {
                    const newWeeks = [...weeks];
                    newWeeks[currentWeekIndex].workouts[workoutIndex].name = e.target.value;
                    setWeeks(newWeeks);
                  }}
                  placeholder="Workout name"
                />
                <Input
                  type="number"
                  value={workout.duration}
                  onChange={(e) => {
                    const newWeeks = [...weeks];
                    newWeeks[currentWeekIndex].workouts[workoutIndex].duration = parseInt(e.target.value);
                    setWeeks(newWeeks);
                  }}
                  placeholder="Duration (minutes)"
                />
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => removeWorkout(currentWeekIndex, workoutIndex)}
                className="ml-2"
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentWorkoutIndex(workoutIndex)}
            >
              {workout.exercises.length} exercise(s) - Click to edit
            </Button>
          </div>
        </Card>
      ))}
    </div>
  );

  const renderStep4 = () => {
    if (currentWorkoutIndex === null) {
      return (
        <div className="text-center py-8 text-muted-foreground">
          Please select a workout from Step 3 to add exercises
        </div>
      );
    }

    const workout = weeks[currentWeekIndex].workouts[currentWorkoutIndex];

    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold">
            Exercises for {workout.name}
          </h3>
          <Button onClick={() => addExercise(currentWeekIndex, currentWorkoutIndex)} size="sm">
            <Plus className="mr-2 h-4 w-4" />
            Add Exercise
          </Button>
        </div>

        {workout.exercises.map((exercise, exerciseIndex) => (
          <Card key={exerciseIndex} className="p-4">
            <div className="space-y-3">
              <div className="flex justify-between">
                <h4 className="font-medium">Exercise {exerciseIndex + 1}</h4>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeExercise(currentWeekIndex, currentWorkoutIndex, exerciseIndex)}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <Label>Exercise Name</Label>
                  <Input
                    value={exercise.name}
                    onChange={(e) =>
                      updateExercise(currentWeekIndex, currentWorkoutIndex, exerciseIndex, "name", e.target.value)
                    }
                    placeholder="e.g., Barbell Squat"
                  />
                </div>

                <div className="col-span-2">
                  <Label>Category</Label>
                  <Select
                    value={exercise.category}
                    onValueChange={(value) =>
                      updateExercise(currentWeekIndex, currentWorkoutIndex, exerciseIndex, "category", value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="warmup">Warm-up</SelectItem>
                      <SelectItem value="mainlift">Main Lift</SelectItem>
                      <SelectItem value="accessory">Accessory</SelectItem>
                      <SelectItem value="conditioning">Conditioning</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Sets</Label>
                  <Input
                    type="number"
                    value={exercise.sets || ""}
                    onChange={(e) =>
                      updateExercise(currentWeekIndex, currentWorkoutIndex, exerciseIndex, "sets", parseInt(e.target.value) || undefined)
                    }
                    placeholder="3"
                  />
                </div>

                <div>
                  <Label>Reps</Label>
                  <Input
                    value={exercise.reps || ""}
                    onChange={(e) =>
                      updateExercise(currentWeekIndex, currentWorkoutIndex, exerciseIndex, "reps", e.target.value)
                    }
                    placeholder="10 or 8-12"
                  />
                </div>

                <div>
                  <Label>Weight (kg)</Label>
                  <Input
                    type="number"
                    value={exercise.weight || ""}
                    onChange={(e) =>
                      updateExercise(currentWeekIndex, currentWorkoutIndex, exerciseIndex, "weight", parseFloat(e.target.value) || undefined)
                    }
                    placeholder="100"
                  />
                </div>

                <div>
                  <Label>RPE (1-10)</Label>
                  <Input
                    type="number"
                    min="1"
                    max="10"
                    value={exercise.rpe || ""}
                    onChange={(e) =>
                      updateExercise(currentWeekIndex, currentWorkoutIndex, exerciseIndex, "rpe", parseInt(e.target.value) || undefined)
                    }
                    placeholder="8"
                  />
                </div>

                <div>
                  <Label>Time</Label>
                  <Input
                    value={exercise.time || ""}
                    onChange={(e) =>
                      updateExercise(currentWeekIndex, currentWorkoutIndex, exerciseIndex, "time", e.target.value)
                    }
                    placeholder="30 seconds"
                  />
                </div>

                <div>
                  <Label>Distance</Label>
                  <Input
                    value={exercise.distance || ""}
                    onChange={(e) =>
                      updateExercise(currentWeekIndex, currentWorkoutIndex, exerciseIndex, "distance", e.target.value)
                    }
                    placeholder="5 km"
                  />
                </div>

                <div className="col-span-2">
                  <Label>Notes</Label>
                  <Textarea
                    value={exercise.notes || ""}
                    onChange={(e) =>
                      updateExercise(currentWeekIndex, currentWorkoutIndex, exerciseIndex, "notes", e.target.value)
                    }
                    placeholder="Additional instructions..."
                  />
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Progress indicator */}
      <div className="flex justify-between items-center">
        <div className="flex gap-2">
          {[1, 2, 3, 4].map((s) => (
            <div
              key={s}
              className={`h-2 w-16 rounded-full ${
                s <= step ? "bg-primary" : "bg-muted"
              }`}
            />
          ))}
        </div>
        <span className="text-sm text-muted-foreground">
          Step {step} of 4
        </span>
      </div>

      {/* Step content */}
      <Card className="p-6">
        {step === 1 && renderStep1()}
        {step === 2 && renderStep2()}
        {step === 3 && renderStep3()}
        {step === 4 && renderStep4()}
      </Card>

      {/* Navigation */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={() => {
            if (step === 1) {
              onCancel();
            } else {
              setStep(step - 1);
            }
          }}
        >
          <ChevronLeft className="mr-2 h-4 w-4" />
          {step === 1 ? "Cancel" : "Previous"}
        </Button>

        {step < 4 ? (
          <Button onClick={() => setStep(step + 1)}>
            Next
            <ChevronRight className="ml-2 h-4 w-4" />
          </Button>
        ) : (
          <Button onClick={handleSubmit}>
            Create Program
          </Button>
        )}
      </div>
    </div>
  );
};
