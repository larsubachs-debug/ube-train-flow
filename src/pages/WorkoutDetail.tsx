import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { programs as staticPrograms } from "@/data/programs";
import { usePrograms } from "@/hooks/usePrograms";
import { ArrowLeft, Play, Calendar, TrendingUp } from "lucide-react";
import { toast } from "sonner";

const WorkoutDetail = () => {
  const { workoutId } = useParams();
  const [notes, setNotes] = useState("");
  const [completed, setCompleted] = useState(false);
  const { data: programs = [], isLoading } = usePrograms();

  // Fallback to static programs if database is empty
  const displayPrograms = programs.length > 0 ? programs : staticPrograms;

  // Find workout across all programs
  let workout;
  let program;
  
  for (const prog of displayPrograms) {
    for (const week of prog.weeks) {
      const found = week.workouts.find((w) => w.id === workoutId);
      if (found) {
        workout = found;
        program = prog;
        break;
      }
    }
    if (workout) break;
  }

  if (isLoading) {
    return <div className="p-6">Loading workout...</div>;
  }

  if (!workout || !program) {
    return <div className="p-6">Workout not found</div>;
  }

  const handleComplete = () => {
    setCompleted(true);
    toast.success("Workout completed! Great job! 💪");
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="bg-background border-b border-border p-6">
        <Link to="/" className="inline-flex items-center text-sm mb-4 text-muted-foreground hover:text-foreground">
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back
        </Link>
        
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="text-sm text-muted-foreground mb-1">{program.name}</p>
            <h1 className="text-3xl font-bold">{workout.name}</h1>
          </div>
          <div className="flex gap-2">
            <button className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
              ⏸
            </button>
            <button className="px-4 py-2 rounded-full bg-muted text-sm font-medium">
              End
            </button>
          </div>
        </div>

        {/* Day Pills */}
        <div className="flex gap-2 mb-4">
          {['W', 'A', 'B', 'C', 'D', 'E'].map((day, idx) => {
            const isCompleted = idx < workout.dayNumber - 1;
            const isCurrent = idx === workout.dayNumber - 1;
            return (
              <div
                key={day}
                className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium ${
                  isCompleted
                    ? 'bg-ube-green-light text-ube-green'
                    : isCurrent
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                {day}
              </div>
            );
          })}
        </div>
      </div>

      <div className="px-6 py-6 space-y-6">
        {/* EMOM Info */}
        <Card className="p-4 shadow-md bg-muted/30">
          <p className="text-sm">
            <span className="text-muted-foreground">EMOM |</span>{" "}
            <span className="font-medium">Every 1 min</span>{" "}
            <span className="text-muted-foreground">for</span>{" "}
            <span className="font-medium">{workout.duration}mins</span>
          </p>
          <p className="text-sm text-muted-foreground mt-1">🔄 6</p>
        </Card>

        {/* Warm-up */}
        {workout.warmUp.length > 0 && (
          <Card className="p-5 shadow-md">
            <h2 className="text-base font-bold mb-3">Warm-up</h2>
            <ul className="space-y-2">
              {workout.warmUp.map((exercise) => (
                <li key={exercise.id} className="text-sm flex items-start gap-2">
                  <span className="text-muted-foreground">•</span>
                  <div>
                    <span className="font-medium">{exercise.name}</span>
                    {(exercise.sets || exercise.reps || exercise.time) && (
                      <span className="text-muted-foreground">
                        {" "}— {exercise.sets && `${exercise.sets} sets`}
                        {exercise.reps && ` ${exercise.reps}`}
                        {exercise.time && ` ${exercise.time}`}
                      </span>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </Card>
        )}

        {/* Main Lifts - Quick Overview */}
        <div className="space-y-3">
          {workout.mainLifts.map((lift, liftIndex) => (
            <Card key={lift.id} className="p-4 shadow-md">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Min 0-{liftIndex + 1}</p>
                  <h3 className="font-bold">{lift.name}</h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    {lift.sets} sets × {lift.reps} reps {lift.rpe && `@ RPE ${lift.rpe}`}
                  </p>
                </div>
                <button className="text-muted-foreground hover:text-foreground">
                  <Play className="w-5 h-5" />
                </button>
              </div>
            </Card>
          ))}
        </div>

        {/* Coaches Notes & Video */}
        <Card className="p-4 shadow-md">
          <Tabs defaultValue="notes" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="notes">Notes</TabsTrigger>
              <TabsTrigger value="video">Coach Video</TabsTrigger>
            </TabsList>
            <TabsContent value="notes" className="mt-4">
              <h3 className="text-sm font-bold mb-2 text-muted-foreground">Coaches Notes:</h3>
              <p className="text-sm">This is where all the notes go that the coaches have to say</p>
            </TabsContent>
            <TabsContent value="video" className="mt-4">
              <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <Play className="w-12 h-12 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    Coach video will appear here when uploaded
                  </p>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </Card>

        {/* Detailed Lift Tracking */}
        {workout.mainLifts.map((lift, liftIndex) => (
          <Card key={`detail-${lift.id}`} className="p-5 shadow-md">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Barbell</p>
                <h3 className="text-lg font-bold">{lift.name}</h3>
              </div>
              <div className="flex gap-2">
                <button className="p-2 hover:bg-muted rounded">
                  <TrendingUp className="w-5 h-5" />
                </button>
                <button className="p-2 hover:bg-muted rounded">
                  <Calendar className="w-5 h-5" />
                </button>
                <button className="p-2 hover:bg-muted rounded">
                  ⋯
                </button>
              </div>
            </div>

            {/* Sets Table */}
            <div className="space-y-2">
              {Array.from({ length: lift.sets || 3 }).map((_, setIndex) => (
                <div key={setIndex} className="flex items-center gap-2">
                  <span className="w-8 text-sm text-muted-foreground">{setIndex + 1}</span>
                  <div className="flex-1 flex items-center gap-2 bg-muted/30 rounded-lg px-3 py-2">
                    <Input 
                      type="number" 
                      placeholder="50"
                      defaultValue="50"
                      className="h-8 bg-transparent border-none text-center w-16 p-0"
                    />
                    <span className="text-xs text-muted-foreground">kg</span>
                    <div className="w-px h-6 bg-border" />
                    <button className="w-6 h-6 rounded-full bg-muted flex items-center justify-center">
                      <span className="text-xs">○</span>
                    </button>
                    <div className="w-px h-6 bg-border" />
                    <Input 
                      type="number" 
                      placeholder="10"
                      defaultValue="10"
                      className="h-8 bg-transparent border-none text-center w-12 p-0"
                    />
                    <span className="text-xs text-muted-foreground">reps</span>
                  </div>
                  <button className="w-8 h-8 rounded bg-muted/50 flex items-center justify-center">
                    ✓
                  </button>
                </div>
              ))}
            </div>
          </Card>
        ))}

        {/* Accessories */}
        {workout.accessories.length > 0 && (
          <Card className="p-5 shadow-md">
            <h2 className="text-base font-bold mb-4">Accessories</h2>
            <div className="space-y-3">
              {workout.accessories.map((exercise, index) => (
                <div key={exercise.id} className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-full bg-muted text-foreground flex items-center justify-center text-sm font-medium flex-shrink-0">
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-sm mb-1">{exercise.name}</h4>
                    <p className="text-xs text-muted-foreground">
                      {exercise.sets} sets × {exercise.reps} reps
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Conditioning */}
        {workout.conditioning.length > 0 && (
          <Card className="p-5 shadow-md">
            <h2 className="text-base font-bold mb-3">Conditioning</h2>
            <div className="space-y-2">
              {workout.conditioning.map((exercise) => (
                <div key={exercise.id}>
                  <p className="text-sm font-medium">{exercise.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {exercise.time || exercise.distance}
                    {exercise.notes && ` • ${exercise.notes}`}
                  </p>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Notes */}
        <Card className="p-5 shadow-md">
          <h2 className="text-base font-bold mb-3">Notes</h2>
          <Textarea
            placeholder="Add your notes about this workout..."
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
          className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground text-base font-semibold rounded-full"
        >
          {completed ? "Workout Completed! ✓" : "Mark Workout as Complete"}
        </Button>
      </div>
    </div>
  );
};

export default WorkoutDetail;
