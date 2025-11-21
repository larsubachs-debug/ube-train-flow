import { useState, useRef, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { programs as staticPrograms } from "@/data/programs";
import { usePrograms } from "@/hooks/usePrograms";
import { ArrowLeft, Calendar, TrendingUp, Check, Play } from "lucide-react";
import { WorkoutCompleteButton } from "@/components/workouts/WorkoutCompleteButton";
import { ExerciseVideoDialog } from "@/components/workouts/ExerciseVideoDialog";

type Section = 'warmup' | 'main' | 'accessories' | 'conditioning' | 'complete';

const WorkoutDetail = () => {
  const { workoutId } = useParams();
  const [notes, setNotes] = useState("");
  const [currentSection, setCurrentSection] = useState<Section>('warmup');
  const [selectedExercise, setSelectedExercise] = useState<{ name: string; videoUrl?: string } | null>(null);
  const { data: programs = [], isLoading } = usePrograms();
  
  // Refs for scrolling
  const warmupRef = useRef<HTMLDivElement>(null);
  const mainRef = useRef<HTMLDivElement>(null);
  const accessoriesRef = useRef<HTMLDivElement>(null);
  const conditioningRef = useRef<HTMLDivElement>(null);
  const completeRef = useRef<HTMLDivElement>(null);

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

  // Function to get available sections
  const getAvailableSections = (): Section[] => {
    const sections: Section[] = [];
    if (workout.warmUp.length > 0) sections.push('warmup');
    if (workout.mainLifts.length > 0) sections.push('main');
    if (workout.accessories.length > 0) sections.push('accessories');
    if (workout.conditioning.length > 0) sections.push('conditioning');
    sections.push('complete');
    return sections;
  };

  const availableSections = getAvailableSections();

  // Function to scroll to section
  const scrollToSection = (section: Section) => {
    const refs: Record<Section, React.RefObject<HTMLDivElement>> = {
      warmup: warmupRef,
      main: mainRef,
      accessories: accessoriesRef,
      conditioning: conditioningRef,
      complete: completeRef,
    };
    
    refs[section]?.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setCurrentSection(section);
  };

  // Function to go to next section
  const goToNextSection = () => {
    const currentIndex = availableSections.indexOf(currentSection);
    if (currentIndex < availableSections.length - 1) {
      const nextSection = availableSections[currentIndex + 1];
      scrollToSection(nextSection);
    }
  };

  // Map sections to display labels
  const sectionLabels: Record<Section, string> = {
    warmup: 'W',
    main: 'A',
    accessories: 'B',
    conditioning: 'C',
    complete: 'D',
  };

  // Check if section is completed
  const isSectionCompleted = (section: Section) => {
    const currentIndex = availableSections.indexOf(currentSection);
    const sectionIndex = availableSections.indexOf(section);
    return sectionIndex < currentIndex;
  };

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
          {availableSections.slice(0, -1).map((section, idx) => {
            const isCompleted = isSectionCompleted(section);
            const isCurrent = section === currentSection;
            return (
              <button
                key={section}
                onClick={() => scrollToSection(section)}
                className={`w-12 h-12 rounded-full flex items-center justify-center text-sm font-semibold transition-all ${
                  isCompleted
                    ? 'bg-ube-green-light text-ube-green'
                    : isCurrent
                    ? 'bg-foreground text-background'
                    : 'bg-muted/30 text-muted-foreground'
                }`}
              >
                {sectionLabels[section]}
              </button>
            );
          })}
        </div>
      </div>

      <div className="px-6 py-6 space-y-6">
        {/* Warm-up */}
        {workout.warmUp.length > 0 && (
          <div ref={warmupRef} className="scroll-mt-24">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-semibold uppercase text-muted-foreground tracking-wide">
                Warm-up
              </h3>
              {currentSection === 'warmup' && (
                <Button
                  onClick={goToNextSection}
                  variant="ghost"
                  size="sm"
                  className="text-ube-green hover:text-ube-green"
                >
                  <Check className="w-4 h-4 mr-2" />
                  Voltooid
                </Button>
              )}
            </div>
            <div className="space-y-2">
              {workout.warmUp.map((exercise) => (
                <div 
                  key={exercise.id} 
                  className="flex items-baseline justify-between py-2 hover:bg-muted/30 rounded-lg px-2 -mx-2 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium text-sm">{exercise.name}</h4>
                      {exercise.videoUrl && (
                        <button
                          onClick={() => setSelectedExercise({ name: exercise.name, videoUrl: exercise.videoUrl })}
                          className="p-1 hover:bg-ube-blue/10 rounded-full transition-colors"
                        >
                          <Play className="h-4 w-4 text-ube-blue" fill="currentColor" />
                        </button>
                      )}
                    </div>
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

        {/* EMOM Info & Coach Notes */}
        <div className="py-3">
          <p className="text-sm">
            <span className="text-muted-foreground">EMOM |</span>{" "}
            <span className="font-semibold">Every 1 min</span>{" "}
            <span className="text-muted-foreground">for</span>{" "}
            <span className="font-semibold">{workout.duration}mins</span>
          </p>
          <p className="text-sm text-muted-foreground mt-1">🔄 6</p>
        </div>

        {/* Coaches Notes */}
        <div>
          <h3 className="text-sm font-medium text-muted-foreground mb-2">Coaches Notes:</h3>
          <p className="text-sm text-foreground/80 leading-relaxed">
            {workout.coachNotes || "This is where all the notes go that the coaches have to say"}
          </p>
        </div>

        {/* Main Lifts */}
        {workout.mainLifts.length > 0 && (
          <div ref={mainRef} className="scroll-mt-24">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-semibold uppercase text-muted-foreground tracking-wide">
                Main Lifts
              </h3>
              {currentSection === 'main' && (
                <Button
                  onClick={goToNextSection}
                  variant="ghost"
                  size="sm"
                  className="text-ube-green hover:text-ube-green"
                >
                  <Check className="w-4 h-4 mr-2" />
                  Voltooid
                </Button>
              )}
            </div>
            {/* Main Lifts Overview */}
            <div className="space-y-2 mb-4">
              {workout.mainLifts.map((lift, liftIndex) => (
                <div 
                  key={lift.id} 
                  className="flex items-baseline justify-between py-2 border-b border-border/30 hover:bg-muted/30 rounded-lg px-2 -mx-2 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <div>
                        <p className="text-xs text-muted-foreground">Min {liftIndex}-{liftIndex + 1}</p>
                        <h3 className="font-semibold text-base">{lift.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {lift.reps} reps
                        </p>
                      </div>
                      {lift.videoUrl && (
                        <button
                          onClick={() => setSelectedExercise({ name: lift.name, videoUrl: lift.videoUrl })}
                          className="p-1 hover:bg-ube-blue/10 rounded-full transition-colors ml-auto"
                        >
                          <Play className="h-4 w-4 text-ube-blue" fill="currentColor" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Detailed Lift Tracking */}
            {workout.mainLifts.map((lift, liftIndex) => (
              <div key={`detail-${lift.id}`} className="pt-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div>
                      <p className="text-xs text-muted-foreground">Barbell</p>
                      <h3 className="text-lg font-semibold mt-1">{lift.name}</h3>
                    </div>
                    {lift.videoUrl && (
                      <button
                        onClick={() => setSelectedExercise({ name: lift.name, videoUrl: lift.videoUrl })}
                        className="p-2 hover:bg-ube-blue/10 rounded-full transition-colors"
                      >
                        <Play className="h-5 w-5 text-ube-blue" fill="currentColor" />
                      </button>
                    )}
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
          </div>
        )}

        {/* Accessories */}
        {workout.accessories.length > 0 && (
          <div ref={accessoriesRef} className="scroll-mt-24">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-semibold uppercase text-muted-foreground tracking-wide">
                Accessories
              </h3>
              {currentSection === 'accessories' && (
                <Button
                  onClick={goToNextSection}
                  variant="ghost"
                  size="sm"
                  className="text-ube-green hover:text-ube-green"
                >
                  <Check className="w-4 h-4 mr-2" />
                  Voltooid
                </Button>
              )}
            </div>
            <div className="space-y-2">
              {workout.accessories.map((exercise) => (
                <div 
                  key={exercise.id} 
                  className="flex items-baseline justify-between py-2 border-b border-border/30 last:border-0 hover:bg-muted/30 rounded-lg px-2 -mx-2 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium text-sm">{exercise.name}</h4>
                      {exercise.videoUrl && (
                        <button
                          onClick={() => setSelectedExercise({ name: exercise.name, videoUrl: exercise.videoUrl })}
                          className="p-1 hover:bg-ube-blue/10 rounded-full transition-colors"
                        >
                          <Play className="h-4 w-4 text-ube-blue" fill="currentColor" />
                        </button>
                      )}
                    </div>
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
          <div ref={conditioningRef} className="scroll-mt-24">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-semibold uppercase text-muted-foreground tracking-wide">
                Conditioning
              </h3>
              {currentSection === 'conditioning' && (
                <Button
                  onClick={goToNextSection}
                  variant="ghost"
                  size="sm"
                  className="text-ube-green hover:text-ube-green"
                >
                  <Check className="w-4 h-4 mr-2" />
                  Voltooid
                </Button>
              )}
            </div>
            <div className="space-y-2">
              {workout.conditioning.map((exercise) => (
                <div 
                  key={exercise.id} 
                  className="flex items-baseline justify-between py-2 border-b border-border/30 last:border-0 hover:bg-muted/30 rounded-lg px-2 -mx-2 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium text-sm">{exercise.name}</h4>
                      {exercise.videoUrl && (
                        <button
                          onClick={() => setSelectedExercise({ name: exercise.name, videoUrl: exercise.videoUrl })}
                          className="p-1 hover:bg-ube-blue/10 rounded-full transition-colors"
                        >
                          <Play className="h-4 w-4 text-ube-blue" fill="currentColor" />
                        </button>
                      )}
                    </div>
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
        <div ref={completeRef} className="pt-6 scroll-mt-24">
          <WorkoutCompleteButton workoutId={workoutId || ""} />
        </div>
      </div>

      {/* Exercise Video Dialog */}
      <ExerciseVideoDialog
        open={!!selectedExercise}
        onOpenChange={(open) => !open && setSelectedExercise(null)}
        exerciseName={selectedExercise?.name || ""}
        videoUrl={selectedExercise?.videoUrl}
      />
    </div>
  );
};

export default WorkoutDetail;
