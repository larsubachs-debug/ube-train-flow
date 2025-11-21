import { useState, useRef, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
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
  // RPE values: { liftIndex: { setIndex: rpeValue } }
  const [rpeValues, setRpeValues] = useState<Record<number, Record<number, number>>>({});
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
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="bg-background border-b border-border/10 px-6 pt-6 pb-4">
        <div className="flex items-start justify-between mb-6">
          <div>
            <p className="text-sm text-muted-foreground mb-1">{program.name}</p>
            <h1 className="text-3xl font-bold text-foreground">{workout.name}</h1>
          </div>
          <div className="flex gap-3">
            <button className="w-12 h-12 rounded-full bg-foreground text-background flex items-center justify-center text-xl hover:bg-foreground/90 transition-colors">
              ⏸
            </button>
            <button className="px-5 py-3 rounded-full bg-muted/60 text-sm font-medium hover:bg-muted/80 transition-colors">
              End
            </button>
          </div>
        </div>

        {/* Section Pills */}
        <div className="flex gap-2.5">
          {availableSections.slice(0, -1).map((section, idx) => {
            const isCompleted = isSectionCompleted(section);
            const isCurrent = section === currentSection;
            return (
              <button
                key={section}
                onClick={() => scrollToSection(section)}
                className={`w-14 h-14 rounded-full flex items-center justify-center text-base font-semibold transition-all ${
                  isCompleted
                    ? 'bg-[#86efac] text-[#059669]'
                    : isCurrent
                    ? 'bg-foreground text-background'
                    : 'bg-muted/40 text-muted-foreground'
                }`}
              >
                {sectionLabels[section]}
              </button>
            );
          })}
        </div>
      </div>

      <div className="px-6 py-6 space-y-8">
        {/* EMOM Info */}
        <div className="border-b border-border/10 pb-6">
          <p className="text-base mb-3">
            <span className="text-muted-foreground">EMOM |</span>{" "}
            <span className="font-semibold">Every 1 min</span>{" "}
            <span className="text-muted-foreground">for</span>{" "}
            <span className="font-semibold">{workout.duration}mins</span>
          </p>
          <p className="text-base text-muted-foreground flex items-center gap-2">
            <span className="text-lg">🔄</span> 6
          </p>
        </div>

        {/* Main Lifts Overview */}
        {workout.mainLifts.length > 0 && (
          <div ref={mainRef} className="scroll-mt-24">
            <div className="space-y-3 mb-6">
              {workout.mainLifts.map((lift, liftIndex) => (
                <div 
                  key={lift.id} 
                  className="flex items-center justify-between py-3 bg-muted/20 rounded-lg px-4"
                >
                  <div className="flex items-center gap-3 flex-1">
                    <span className="text-sm text-muted-foreground font-medium">Min {liftIndex}-{liftIndex + 1}</span>
                    <h3 className="font-semibold text-base">{lift.name}</h3>
                  </div>
                  <p className="text-sm">
                    <span className="font-semibold">{lift.reps}</span>
                    <span className="text-muted-foreground ml-1">reps</span>
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Coaches Notes */}
        <div className="border-b border-border/10 pb-6">
          <h3 className="text-sm text-muted-foreground mb-2">Coaches Notes:</h3>
          <p className="text-sm text-foreground leading-relaxed">
            {workout.coachNotes || "This is where all the notes go that the coaches have to say"}
          </p>
        </div>

        {/* Detailed Lift Tracking */}
        {workout.mainLifts.map((lift, liftIndex) => (
          <div key={`detail-${lift.id}`} className="space-y-4 border-b border-border/10 pb-8 last:border-0">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Barbell</p>
                <h3 className="text-xl font-bold">{lift.name}</h3>
              </div>
              <div className="flex gap-1">
                <button className="p-2.5 hover:bg-muted/20 rounded-lg transition-colors">
                  ✏️
                </button>
                <button className="p-2.5 hover:bg-muted/20 rounded-lg transition-colors">
                  📊
                </button>
                <button className="p-2.5 hover:bg-muted/20 rounded-lg transition-colors">
                  •••
                </button>
              </div>
            </div>

            {/* Sets Table */}
            <div className="space-y-2.5">
              {Array.from({ length: lift.sets || 6 }).map((_, setIdx) => {
                const currentRPE = rpeValues[liftIndex]?.[setIdx] || 5;
                
                return (
                  <div key={setIdx} className="flex items-center gap-3">
                    <span className="text-base font-medium w-6 text-center">{setIdx + 1}</span>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        placeholder="50"
                        className="w-20 h-10 text-sm bg-muted/30 border-0 rounded-xl text-center font-medium"
                      />
                      <span className="text-xs text-muted-foreground">kg</span>
                    </div>
                    
                    <Popover>
                      <PopoverTrigger asChild>
                        <button className="w-8 h-8 rounded-full bg-muted/30 flex items-center justify-center text-muted-foreground hover:bg-muted/40 transition-colors relative">
                          {currentRPE > 5 && (
                            <span className="absolute -top-1 -right-1 w-4 h-4 bg-primary text-primary-foreground text-[10px] rounded-full flex items-center justify-center font-bold">
                              {currentRPE}
                            </span>
                          )}
                          ✕
                        </button>
                      </PopoverTrigger>
                      <PopoverContent className="w-64 pointer-events-auto">
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <h4 className="font-semibold text-sm">RPE (Rate of Perceived Exertion)</h4>
                            <span className="text-2xl font-bold text-primary">{currentRPE}</span>
                          </div>
                          <Slider
                            value={[currentRPE]}
                            onValueChange={(value) => {
                              setRpeValues(prev => ({
                                ...prev,
                                [liftIndex]: {
                                  ...prev[liftIndex],
                                  [setIdx]: value[0]
                                }
                              }));
                            }}
                            min={1}
                            max={10}
                            step={0.5}
                            className="w-full"
                          />
                          <div className="flex justify-between text-xs text-muted-foreground">
                            <span>1 - Zeer licht</span>
                            <span>10 - Maximaal</span>
                          </div>
                        </div>
                      </PopoverContent>
                    </Popover>
                    
                    <div className="flex items-center gap-1.5 bg-muted/30 px-3 py-2 rounded-xl">
                      <span className="text-sm font-semibold">{lift.reps}</span>
                      <span className="text-xs text-muted-foreground">reps</span>
                    </div>
                    <button className="w-8 h-8 rounded-full bg-muted/30 flex items-center justify-center hover:bg-[#86efac] hover:text-[#059669] transition-colors ml-auto">
                      ✓
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        ))}


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
