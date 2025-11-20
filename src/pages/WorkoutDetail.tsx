import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { programs as staticPrograms } from "@/data/programs";
import { usePrograms } from "@/hooks/usePrograms";
import { ArrowLeft, Calendar, TrendingUp } from "lucide-react";
import { WorkoutCompleteButton } from "@/components/workouts/WorkoutCompleteButton";

const WorkoutDetail = () => {
  const { workoutId } = useParams();
  const [notes, setNotes] = useState("");
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

  return (
    <div className="min-h-screen bg-white pb-20">
      {/* Header */}
      <div className="bg-white border-b border-border/30 p-6">
        <Link to="/" className="inline-flex items-center text-sm mb-4 text-muted-foreground hover:text-foreground">
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back
        </Link>
        
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="text-sm text-muted-foreground mb-1">{program.name}</p>
            <h1 className="text-2xl font-bold text-foreground">{workout.name}</h1>
          </div>
          <div className="flex gap-2">
            <button className="w-10 h-10 rounded-full bg-foreground text-background flex items-center justify-center">
              ⏸
            </button>
            <button className="px-4 py-2 rounded-full bg-muted/50 text-sm font-medium">
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
                className={`w-12 h-12 rounded-full flex items-center justify-center text-sm font-semibold ${
                  isCompleted
                    ? 'bg-ube-green-light text-ube-green'
                    : isCurrent
                    ? 'bg-foreground text-background'
                    : 'bg-muted/30 text-muted-foreground'
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
        <div className="py-3">
          <p className="text-sm">
            <span className="text-muted-foreground">EMOM |</span>{" "}
            <span className="font-semibold">Every 1 min</span>{" "}
            <span className="text-muted-foreground">for</span>{" "}
            <span className="font-semibold">{workout.duration}mins</span>
          </p>
          <p className="text-sm text-muted-foreground mt-1">🔄 6</p>
        </div>

        {/* Warm-up */}
        {workout.warmUp.length > 0 && (
          <div>
            <h3 className="text-xs font-semibold uppercase text-muted-foreground mb-3 tracking-wide">
              Warm-up
            </h3>
            <div className="space-y-2">
              {workout.warmUp.map((exercise) => (
                <div key={exercise.id} className="flex items-baseline justify-between py-2">
                  <div className="flex-1">
                    <h4 className="font-medium text-sm">{exercise.name}</h4>
                    <div className="flex gap-3 text-xs text-muted-foreground mt-1">
                      {exercise.sets && <span>{exercise.sets} sets</span>}
                      {exercise.reps && <span>{exercise.reps} reps</span>}
                      {exercise.time && <span>{exercise.time}</span>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Main Lifts - Quick Overview */}
        <div className="space-y-2">
          {workout.mainLifts.map((lift, liftIndex) => (
            <div key={lift.id} className="flex items-baseline justify-between py-2 border-b border-border/30">
              <div>
                <p className="text-xs text-muted-foreground">Min {liftIndex}-{liftIndex + 1}</p>
                <h3 className="font-semibold text-base">{lift.name}</h3>
                <p className="text-sm text-muted-foreground">
                  {lift.reps} reps
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Coaches Notes & Video */}
        <div className="pt-4">
          <h3 className="text-sm font-medium text-muted-foreground mb-2">Coaches Notes:</h3>
          <p className="text-sm text-foreground/80 leading-relaxed">
            {workout.coachNotes || "This is where all the notes go that the coaches have to say"}
          </p>
        </div>

        {/* Detailed Lift Tracking */}
        {workout.mainLifts.map((lift, liftIndex) => (
          <div key={`detail-${lift.id}`} className="pt-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Barbell</p>
                <h3 className="text-lg font-semibold mt-1">{lift.name}</h3>
              </div>
              <div className="flex gap-2">
                <button className="p-2 hover:bg-muted/20 rounded">
                  <TrendingUp className="w-4 h-4 text-muted-foreground" />
                </button>
                <button className="p-2 hover:bg-muted/20 rounded">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                </button>
                <button className="p-2 hover:bg-muted/20 rounded">
                  •••
                </button>
              </div>
            </div>

            {/* Sets Table */}
            <div className="space-y-2">
              {Array.from({ length: lift.sets || 3 }).map((_, setIdx) => (
                <div key={setIdx} className="flex items-center gap-3 py-2">
                  <span className="text-sm font-medium w-8">{setIdx + 1}</span>
                  <div className="flex-1 flex items-center gap-2">
                    <Input
                      type="number"
                      placeholder="50"
                      className="w-24 h-9 text-sm bg-muted/20 border-border/30"
                    />
                    <span className="text-xs text-muted-foreground">kg</span>
                  </div>
                  <div className="w-16 h-6 rounded-full bg-muted/20" />
                  <div className="flex items-center gap-1">
                    <span className="text-sm font-medium">{lift.reps}</span>
                    <span className="text-xs text-muted-foreground">reps</span>
                  </div>
                  <button className="w-6 h-6 rounded-full bg-muted/20 flex items-center justify-center text-muted-foreground hover:bg-muted/30">
                    ✓
                  </button>
                </div>
              ))}
            </div>
          </div>
        ))}

        {/* Accessories */}
        {workout.accessories.length > 0 && (
          <div>
            <h3 className="text-xs font-semibold uppercase text-muted-foreground mb-3 tracking-wide">
              Accessories
            </h3>
            <div className="space-y-2">
              {workout.accessories.map((exercise) => (
                <div key={exercise.id} className="flex items-baseline justify-between py-2 border-b border-border/30 last:border-0">
                  <div className="flex-1">
                    <h4 className="font-medium text-sm">{exercise.name}</h4>
                    <div className="flex gap-3 text-xs text-muted-foreground mt-1">
                      {exercise.sets && <span>{exercise.sets} sets</span>}
                      {exercise.reps && <span>{exercise.reps} reps</span>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Conditioning */}
        {workout.conditioning.length > 0 && (
          <div>
            <h3 className="text-xs font-semibold uppercase text-muted-foreground mb-3 tracking-wide">
              Conditioning
            </h3>
            <div className="space-y-2">
              {workout.conditioning.map((exercise) => (
                <div key={exercise.id} className="flex items-baseline justify-between py-2 border-b border-border/30 last:border-0">
                  <div className="flex-1">
                    <h4 className="font-medium text-sm">{exercise.name}</h4>
                    <div className="flex gap-3 text-xs text-muted-foreground mt-1">
                      {exercise.distance && <span>{exercise.distance}</span>}
                      {exercise.time && <span>{exercise.time}</span>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Complete Button */}
        <div className="pt-6">
          <WorkoutCompleteButton workoutId={workoutId || ""} />
        </div>
      </div>
    </div>
  );
};

export default WorkoutDetail;
