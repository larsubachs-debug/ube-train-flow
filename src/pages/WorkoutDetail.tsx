import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { programs } from "@/data/programs";
import { ChevronLeft, Play, Check } from "lucide-react";
import { toast } from "sonner";

const WorkoutDetail = () => {
  const { workoutId } = useParams();
  const [notes, setNotes] = useState("");
  const [completed, setCompleted] = useState(false);

  // Find workout across all programs
  let workout;
  let programName = "";
  
  for (const program of programs) {
    for (const week of program.weeks) {
      const found = week.workouts.find((w) => w.id === workoutId);
      if (found) {
        workout = found;
        programName = program.name;
        break;
      }
    }
    if (workout) break;
  }

  if (!workout) {
    return <div className="p-6">Workout not found</div>;
  }

  const handleComplete = () => {
    setCompleted(true);
    toast.success("Workout completed! Great job! 💪");
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="p-6">
        <Link to="/programs">
          <Button variant="ghost" size="sm" className="mb-4 gap-2">
            <ChevronLeft className="w-4 h-4" />
            Back
          </Button>
        </Link>

        {/* Header */}
        <div className="mb-6">
          <Badge variant="secondary" className="mb-2">
            {programName} • Day {workout.dayNumber}
          </Badge>
          <h1 className="text-3xl font-bold mb-2">{workout.name}</h1>
          <p className="text-muted-foreground">{workout.duration} minutes</p>
        </div>

        {/* Warm-up */}
        {workout.warmUp.length > 0 && (
          <Card className="p-5 mb-4">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
              <span className="text-accent">01</span> Warm-up
            </h2>
            <div className="space-y-3">
              {workout.warmUp.map((exercise) => (
                <div key={exercise.id} className="border-l-2 border-accent/30 pl-4">
                  <p className="font-medium">{exercise.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {exercise.sets && `${exercise.sets} sets • `}
                    {exercise.reps || exercise.time}
                  </p>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Main Lifts */}
        {workout.mainLifts.length > 0 && (
          <Card className="p-5 mb-4">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
              <span className="text-accent">02</span> Main Lifts
            </h2>
            <div className="space-y-4">
              {workout.mainLifts.map((exercise) => (
                <div key={exercise.id} className="border-l-2 border-accent pl-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-semibold text-lg">{exercise.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {exercise.sets} sets × {exercise.reps} reps
                        {exercise.rpe && ` @ RPE ${exercise.rpe}`}
                      </p>
                    </div>
                    <Button size="sm" variant="outline" className="gap-1">
                      <Play className="w-3 h-3" />
                      Video
                    </Button>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-2 mt-3">
                    {Array.from({ length: exercise.sets || 0 }).map((_, i) => (
                      <Input
                        key={i}
                        placeholder={`Set ${i + 1}`}
                        className="text-sm"
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Accessories */}
        {workout.accessories.length > 0 && (
          <Card className="p-5 mb-4">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
              <span className="text-accent">03</span> Accessories
            </h2>
            <div className="space-y-3">
              {workout.accessories.map((exercise) => (
                <div key={exercise.id} className="border-l-2 border-muted pl-4">
                  <p className="font-medium">{exercise.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {exercise.sets} sets × {exercise.reps} reps
                  </p>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Conditioning */}
        {workout.conditioning.length > 0 && (
          <Card className="p-5 mb-4">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
              <span className="text-accent">04</span> Conditioning
            </h2>
            <div className="space-y-3">
              {workout.conditioning.map((exercise) => (
                <div key={exercise.id} className="border-l-2 border-muted pl-4">
                  <p className="font-medium">{exercise.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {exercise.time || exercise.distance}
                    {exercise.notes && ` • ${exercise.notes}`}
                  </p>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Notes */}
        <Card className="p-5 mb-4">
          <h3 className="font-semibold mb-3">Workout Notes</h3>
          <Textarea
            placeholder="How did it go? Any observations?"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={4}
            className="resize-none"
          />
        </Card>

        {/* Complete Button */}
        <Button
          onClick={handleComplete}
          disabled={completed}
          className={`w-full h-14 text-lg gap-2 ${
            completed
              ? "bg-green-600 hover:bg-green-600"
              : "bg-accent hover:bg-accent/90"
          } text-accent-foreground`}
        >
          {completed ? (
            <>
              <Check className="w-5 h-5" />
              Workout Completed!
            </>
          ) : (
            "Mark as Complete"
          )}
        </Button>
      </div>
    </div>
  );
};

export default WorkoutDetail;
