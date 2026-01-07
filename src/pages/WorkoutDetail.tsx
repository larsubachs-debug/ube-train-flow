import { useState, useRef, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";

import { usePrograms } from "@/hooks/usePrograms";
import { ArrowLeft, Calendar, TrendingUp, Check, Play, BarChart3, Timer, Trophy, Link2, Users, Video, Flame } from "lucide-react";
import { WorkoutCompleteButton } from "@/components/workouts/WorkoutCompleteButton";
import { ExerciseVideoDialog } from "@/components/workouts/ExerciseVideoDialog";
import { EMOMTimer } from "@/components/workouts/EMOMTimer";
import { RPEHistoryChart } from "@/components/workouts/RPEHistoryChart";
import { RestTimer } from "@/components/workouts/RestTimer";
import { OneRMCalculator } from "@/components/workouts/OneRMCalculator";
import { WorkoutSummary } from "@/components/workouts/WorkoutSummary";
import { ExerciseLeaderboard } from "@/components/workouts/ExerciseLeaderboard";
import { WorkoutTimer } from "@/components/workouts/WorkoutTimer";
import { PlateCalculator } from "@/components/workouts/PlateCalculator";
import { ExerciseVideoButton } from "@/components/workouts/ExerciseVideoButton";
import { WarmupSetTracker } from "@/components/workouts/WarmupSetTracker";
import { SupersetIndicator, SupersetWrapper } from "@/components/workouts/SupersetIndicator";
import { ShareWorkoutDialog } from "@/components/social/ShareWorkoutDialog";
import { useWorkoutSets } from "@/hooks/useWorkoutSets";
import { toast } from "sonner";

type Section = 'warmup' | 'main' | 'accessories' | 'conditioning' | 'complete';
type GroupType = 'superset' | 'circuit' | 'dropset' | null;

interface SetData {
  weight: number;
  completed: boolean;
}

const WorkoutDetail = () => {
  const { workoutId } = useParams();
  const navigate = useNavigate();
  const [notes, setNotes] = useState("");
  const [currentSection, setCurrentSection] = useState<Section>('warmup');
  const [selectedExercise, setSelectedExercise] = useState<{ name: string; videoUrl?: string } | null>(null);
  const [showRPEHistory, setShowRPEHistory] = useState<{ exerciseName: string; liftIndex: number } | null>(null);
  const [showRestTimer, setShowRestTimer] = useState(false);
  const [restTimerDuration, setRestTimerDuration] = useState(90);
  const [showSummary, setShowSummary] = useState(false);
  const [show1RMCalc, setShow1RMCalc] = useState<Record<number, Record<number, boolean>>>({});
  // Leaderboard state
  const [showLeaderboard, setShowLeaderboard] = useState<{ exerciseName: string } | null>(null);
  // Share workout dialog
  const [showShareDialog, setShowShareDialog] = useState(false);
  // RPE values: { liftIndex: { setIndex: rpeValue } }
  const [rpeValues, setRpeValues] = useState<Record<number, Record<number, number>>>({});
  // Weight values: { liftIndex: { setIndex: weight } }
  const [weightValues, setWeightValues] = useState<Record<number, Record<number, number>>>({});
  // Set completion: { liftIndex: { setIndex: completed } }
  const [setsCompleted, setSetsCompleted] = useState<Record<number, Record<number, boolean>>>({});
  // PR status: { liftIndex: { setIndex: isPR } }
  const [prStatus, setPrStatus] = useState<Record<number, Record<number, boolean>>>({});
  // Rest time per exercise: { liftIndex: restTime }
  const [restTimes, setRestTimes] = useState<Record<number, number>>({});
  // Workout timer elapsed time
  const [workoutElapsedTime, setWorkoutElapsedTime] = useState(0);
  // Target weight for warmup sets: { liftIndex: weight }
  const [targetWeights, setTargetWeights] = useState<Record<number, number>>({});
  // Group types for exercises: { liftIndex: groupType }
  const [exerciseGroupTypes, setExerciseGroupTypes] = useState<Record<number, GroupType>>({});
  // Show warmup tracker per exercise
  const [showWarmup, setShowWarmup] = useState<Record<number, boolean>>({});
  
  const { data: programs = [], isLoading } = usePrograms();
  const { saveSet, checkIfPR, getPersonalRecord } = useWorkoutSets(workoutId || "");
  
  // Refs for scrolling
  const warmupRef = useRef<HTMLDivElement>(null);
  const mainRef = useRef<HTMLDivElement>(null);
  const accessoriesRef = useRef<HTMLDivElement>(null);
  const conditioningRef = useRef<HTMLDivElement>(null);
  const completeRef = useRef<HTMLDivElement>(null);

  // Only use database programs - no fallback to static data
  // Find workout across all programs
  let workout;
  let program;
  
  for (const prog of programs) {
    for (const week of prog.weeks || []) {
      const found = week.workouts?.find((w) => w.id === workoutId);
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
    return (
      <div className="min-h-screen bg-background pb-20">
        <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border">
          <div className="flex items-center gap-3 p-4">
            <Link to="/">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <h1 className="text-xl font-bold text-foreground">Workout niet gevonden</h1>
          </div>
        </div>
        <div className="p-6 text-center space-y-4">
          <p className="text-muted-foreground">Deze workout bestaat niet of is nog niet aan je toegewezen.</p>
          <Link to="/">
            <Button>Terug naar Home</Button>
          </Link>
        </div>
      </div>
    );
  }

  // Check if workout has any exercises
  const hasExercises = (workout.warmUp?.length || 0) + (workout.mainLifts?.length || 0) + 
                       (workout.accessories?.length || 0) + (workout.conditioning?.length || 0) > 0;

  if (!hasExercises) {
    return (
      <div className="min-h-screen bg-background pb-20">
        <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border">
          <div className="flex items-center gap-3 p-4">
            <Link to={`/programs/${program.id}`}>
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-xl font-bold text-foreground">{workout.name}</h1>
              <p className="text-sm text-muted-foreground">{program.name}</p>
            </div>
          </div>
        </div>
        <div className="p-6 text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto">
            <Calendar className="w-8 h-8 text-muted-foreground" />
          </div>
          <h2 className="text-lg font-semibold text-foreground">Nog geen oefeningen</h2>
          <p className="text-muted-foreground max-w-sm mx-auto">
            Deze workout heeft nog geen oefeningen. Je coach zal binnenkort de oefeningen toevoegen.
          </p>
          <Link to={`/programs/${program.id}`}>
            <Button variant="outline">Terug naar programma</Button>
          </Link>
        </div>
      </div>
    );
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

  // Check for PR when weight changes
  const checkForPR = async (liftIndex: number, setIdx: number, exerciseName: string, weight: number) => {
    if (weight <= 0) {
      setPrStatus((prev) => ({
        ...prev,
        [liftIndex]: {
          ...prev[liftIndex],
          [setIdx]: false,
        },
      }));
      return;
    }

    const isPR = await checkIfPR(exerciseName, weight);
    setPrStatus((prev) => ({
      ...prev,
      [liftIndex]: {
        ...prev[liftIndex],
        [setIdx]: isPR,
      },
    }));
  };

  // Function to handle set completion
  const handleSetComplete = async (
    liftIndex: number,
    setIdx: number,
    exerciseName: string,
    reps: number
  ) => {
    const weight = weightValues[liftIndex]?.[setIdx] || 0;
    const rpe = rpeValues[liftIndex]?.[setIdx] || null;
    const isPR = prStatus[liftIndex]?.[setIdx] || false;

    // Save to database
    const success = await saveSet(exerciseName, setIdx + 1, weight, reps, rpe);

    if (success) {
      // Mark as completed
      setSetsCompleted((prev) => ({
        ...prev,
        [liftIndex]: {
          ...prev[liftIndex],
          [setIdx]: true,
        },
      }));
      
      if (isPR) {
        toast.success(`🏆 Nieuw PR! Set ${setIdx + 1} voltooid met ${weight}kg!`, {
          duration: 5000,
        });
      } else {
        toast.success(`Set ${setIdx + 1} voltooid!`);
      }

      // Start rest timer after set completion (unless in grouped mode)
      const groupType = exerciseGroupTypes[liftIndex];
      if (!groupType) {
        const configuredRestTime = restTimes[liftIndex] || 90;
        setRestTimerDuration(configuredRestTime);
        setShowRestTimer(true);
      } else {
        const groupLabels: Record<string, string> = {
          superset: "Superset",
          circuit: "Circuit",
          dropset: "Dropset",
        };
        toast.info(`${groupLabels[groupType] || "Groep"} - Ga direct naar de volgende oefening! 💪`);
      }
    }
  };

  // Calculate workout statistics
  const calculateWorkoutStats = () => {
    const stats = {
      totalSets: 0,
      completedSets: 0,
      totalVolume: 0,
      prCount: 0,
      exercises: [] as Array<{
        name: string;
        sets: number;
        avgWeight: number;
        hadPR: boolean;
      }>,
    };

    workout?.mainLifts.forEach((lift, liftIndex) => {
      const setsCount = lift.sets || 6;
      stats.totalSets += setsCount;
      
      let completedCount = 0;
      let totalWeight = 0;
      let hadPR = false;

      for (let i = 0; i < setsCount; i++) {
        if (setsCompleted[liftIndex]?.[i]) {
          completedCount++;
          const weight = weightValues[liftIndex]?.[i] || 0;
          const reps = parseInt(lift.reps || "0");
          totalWeight += weight;
          stats.totalVolume += weight * reps;

          if (prStatus[liftIndex]?.[i]) {
            stats.prCount++;
            hadPR = true;
          }
        }
      }

      if (completedCount > 0) {
        stats.exercises.push({
          name: lift.name,
          sets: completedCount,
          avgWeight: Math.round(totalWeight / completedCount),
          hadPR,
        });
      }

      stats.completedSets += completedCount;
    });

    return stats;
  };

  const handleWorkoutComplete = () => {
    setShowSummary(true);
    // Navigate to home page after a short delay to let user see the success message
    setTimeout(() => {
      navigate('/');
    }, 1500);
  };

  const handleShareWorkout = () => {
    setShowShareDialog(true);
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="bg-background border-b border-border/10 px-6 pt-6 pb-4">
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="text-sm text-muted-foreground mb-1">{program.name}</p>
            <h1 className="text-3xl font-bold text-foreground">{workout.name}</h1>
          </div>
          <div className="flex flex-col items-end gap-2">
            {/* Workout Timer */}
            <WorkoutTimer 
              autoStart={true} 
              onTimeUpdate={setWorkoutElapsedTime} 
            />
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
                    <span className="text-sm font-semibold text-primary">A{liftIndex + 1}</span>
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
        {workout.mainLifts.map((lift, liftIndex) => {
          const groupType = exerciseGroupTypes[liftIndex];
          const repsNum = parseInt(lift.reps || "0");
          const targetWeight = targetWeights[liftIndex] || 0;
          const showWarmupTracker = showWarmup[liftIndex] || false;

          const exerciseContent = (
            <div
              key={`detail-${lift.id}`}
              className={`space-y-4 ${
                !groupType ? "border-b border-border/10 pb-8 last:border-0" : ""
              }`}
            >
              {/* Exercise Header with Controls */}
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm text-muted-foreground">Barbell</p>
                    <SupersetIndicator groupType={groupType} isActive={!!groupType} />
                  </div>
                  <h3 className="text-xl font-bold">{lift.name}</h3>

                  {/* Video button - prominent placement */}
                  {(lift.videoUrl || lift.name) && (
                    <div className="mt-2">
                      <ExerciseVideoButton
                        exerciseName={lift.name}
                        videoUrl={lift.videoUrl}
                        onVideoClick={(name, url) =>
                          setSelectedExercise({ name, videoUrl: url })
                        }
                        variant="prominent"
                      />
                    </div>
                  )}
                </div>

                <div className="flex gap-1 flex-wrap justify-end">
                  {/* Warmup toggle */}
                  <button
                    onClick={() =>
                      setShowWarmup((prev) => ({
                        ...prev,
                        [liftIndex]: !prev[liftIndex],
                      }))
                    }
                    className={`p-2.5 rounded-lg transition-colors ${
                      showWarmupTracker
                        ? "bg-amber-100 dark:bg-amber-900/30 text-amber-700"
                        : "hover:bg-muted/20"
                    }`}
                    title="Warm-up sets"
                  >
                    <Flame className="h-5 w-5" />
                  </button>

                  {/* Plate calculator */}
                  <PlateCalculator targetWeight={targetWeight} />

                  {/* Group type selector */}
                  <Popover>
                    <PopoverTrigger asChild>
                      <button
                        className={`p-2.5 rounded-lg transition-colors ${
                          groupType
                            ? "bg-blue-100 dark:bg-blue-900/30"
                            : "hover:bg-muted/20"
                        }`}
                        title="Groepering"
                      >
                        <Link2 className="h-5 w-5" />
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-48">
                      <div className="space-y-2">
                        <h4 className="font-semibold text-sm mb-2">Groepering</h4>
                        {[
                          { type: null, label: "Geen" },
                          { type: "superset" as GroupType, label: "Superset" },
                          { type: "circuit" as GroupType, label: "Circuit" },
                          { type: "dropset" as GroupType, label: "Dropset" },
                        ].map((option) => (
                          <button
                            key={option.label}
                            onClick={() =>
                              setExerciseGroupTypes((prev) => ({
                                ...prev,
                                [liftIndex]: option.type,
                              }))
                            }
                            className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                              exerciseGroupTypes[liftIndex] === option.type
                                ? "bg-primary text-primary-foreground"
                                : "hover:bg-muted/20"
                            }`}
                          >
                            {option.label}
                          </button>
                        ))}
                      </div>
                    </PopoverContent>
                  </Popover>

                  {/* Rest timer config */}
                  <Popover>
                    <PopoverTrigger asChild>
                      <button className="p-2.5 hover:bg-muted/20 rounded-lg transition-colors">
                        <Timer className="h-5 w-5" />
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-48">
                      <div className="space-y-3">
                        <h4 className="font-semibold text-sm">Rest Tijd</h4>
                        <div className="space-y-2">
                          {[60, 90, 120, 180].map((seconds) => (
                            <button
                              key={seconds}
                              onClick={() =>
                                setRestTimes((prev) => ({
                                  ...prev,
                                  [liftIndex]: seconds,
                                }))
                              }
                              className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                                restTimes[liftIndex] === seconds
                                  ? "bg-primary text-primary-foreground"
                                  : "hover:bg-muted/20"
                              }`}
                            >
                              {Math.floor(seconds / 60)}:
                              {(seconds % 60).toString().padStart(2, "0")}
                            </button>
                          ))}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Huidige: {Math.floor((restTimes[liftIndex] || 90) / 60)}:
                          {((restTimes[liftIndex] || 90) % 60)
                            .toString()
                            .padStart(2, "0")}
                        </p>
                      </div>
                    </PopoverContent>
                  </Popover>

                  <button
                    onClick={() =>
                      setShowRPEHistory({ exerciseName: lift.name, liftIndex })
                    }
                    className="p-2.5 hover:bg-muted/20 rounded-lg transition-colors"
                    title="RPE Geschiedenis"
                  >
                    <BarChart3 className="h-5 w-5" />
                  </button>

                  <button
                    onClick={() => setShowLeaderboard({ exerciseName: lift.name })}
                    className="p-2.5 hover:bg-muted/20 rounded-lg transition-colors"
                    title="Leaderboard"
                  >
                    <Users className="h-5 w-5" />
                  </button>

                  <ExerciseVideoButton
                    exerciseName={lift.name}
                    videoUrl={lift.videoUrl}
                    onVideoClick={(name, url) =>
                      setSelectedExercise({ name, videoUrl: url })
                    }
                    variant="icon"
                  />
                </div>
              </div>

              {/* Warmup Set Tracker */}
              {showWarmupTracker && (
                <WarmupSetTracker
                  exerciseName={lift.name}
                  targetWeight={targetWeight}
                  onWarmupComplete={() =>
                    setShowWarmup((prev) => ({ ...prev, [liftIndex]: false }))
                  }
                />
              )}

              {/* Sets Table */}
              <div className="space-y-2.5">
                {Array.from({ length: lift.sets || 6 }).map((_, setIdx) => {
                  const currentRPE = rpeValues[liftIndex]?.[setIdx] || 5;
                  const currentWeight = weightValues[liftIndex]?.[setIdx] || 0;
                  const isCompleted = setsCompleted[liftIndex]?.[setIdx] || false;
                  const isPR = prStatus[liftIndex]?.[setIdx] || false;

                  return (
                    <div key={setIdx} className="flex items-center gap-3 relative">
                      <span className="text-base font-medium w-6 text-center">
                        {setIdx + 1}
                      </span>

                      <div className="flex items-center gap-2 relative">
                        <Input
                          type="number"
                          placeholder="50"
                          value={currentWeight || ""}
                          onChange={(e) => {
                            const value = parseFloat(e.target.value) || 0;
                            setWeightValues((prev) => ({
                              ...prev,
                              [liftIndex]: {
                                ...prev[liftIndex],
                                [setIdx]: value,
                              },
                            }));

                            if (setIdx === 0 && value > 0) {
                              setTargetWeights((prev) => ({
                                ...prev,
                                [liftIndex]: value,
                              }));
                            }

                            if (value > 0) {
                              checkForPR(liftIndex, setIdx, lift.name, value);
                            }
                          }}
                          onBlur={(e) => {
                            const value = parseFloat(e.target.value) || 0;
                            if (value > 0) {
                              checkForPR(liftIndex, setIdx, lift.name, value);
                              setShow1RMCalc((prev) => ({
                                ...prev,
                                [liftIndex]: {
                                  ...prev[liftIndex],
                                  [setIdx]: true,
                                },
                              }));
                            }
                          }}
                          disabled={isCompleted}
                          className={`w-20 h-10 text-sm border-0 rounded-xl text-center font-medium ${
                            isCompleted
                              ? "bg-muted/50"
                              : isPR
                                ? "bg-amber-100 dark:bg-amber-900/20 border-2 border-amber-500"
                                : "bg-muted/30"
                          }`}
                        />
                        {isPR && !isCompleted && (
                          <Badge className="absolute -top-2 -right-2 bg-amber-500 text-white text-[10px] px-1.5 py-0.5 pointer-events-none">
                            <Trophy className="h-3 w-3 mr-0.5" />
                            PR
                          </Badge>
                        )}
                        <span className="text-xs text-muted-foreground">kg</span>
                      </div>

                      <Popover>
                        <PopoverTrigger asChild>
                          <button
                            disabled={isCompleted}
                            className={`w-8 h-8 rounded-full flex items-center justify-center text-muted-foreground hover:bg-muted/40 transition-colors relative ${
                              isCompleted ? "bg-muted/50" : "bg-muted/30"
                            }`}
                          >
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
                              <h4 className="font-semibold text-sm">
                                RPE (Rate of Perceived Exertion)
                              </h4>
                              <span className="text-2xl font-bold text-primary">
                                {currentRPE}
                              </span>
                            </div>
                            <Slider
                              value={[currentRPE]}
                              onValueChange={(value) => {
                                setRpeValues((prev) => ({
                                  ...prev,
                                  [liftIndex]: {
                                    ...prev[liftIndex],
                                    [setIdx]: value[0],
                                  },
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

                      <button
                        onClick={() =>
                          handleSetComplete(
                            liftIndex,
                            setIdx,
                            lift.name,
                            parseInt(lift.reps || "0")
                          )
                        }
                        disabled={isCompleted}
                        className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ml-auto ${
                          isCompleted
                            ? "bg-[#86efac] text-[#059669]"
                            : "bg-muted/30 hover:bg-[#86efac] hover:text-[#059669]"
                        }`}
                      >
                        ✓
                      </button>
                    </div>
                  );
                })}
              </div>

              {/* 1RM Calculator */}
              {(() => {
                for (let i = 0; i < (lift.sets || 6); i++) {
                  const weight = weightValues[liftIndex]?.[i] || 0;
                  if (weight > 0 && (setsCompleted[liftIndex]?.[i] || show1RMCalc[liftIndex]?.[i])) {
                    return (
                      <div className="mt-4">
                        <OneRMCalculator weight={weight} reps={repsNum} />
                      </div>
                    );
                  }
                }
                return null;
              })()}
            </div>
          );

          return groupType ? (
            <SupersetWrapper key={`wrapper-${lift.id}`} groupType={groupType}>
              {exerciseContent}
            </SupersetWrapper>
          ) : (
            exerciseContent
          );
        })}

        {/* Complete Button */}
        <div ref={completeRef} className="pt-6 scroll-mt-24">
          <WorkoutCompleteButton 
            workoutId={workoutId || ""} 
            onComplete={handleWorkoutComplete}
          />
        </div>
      </div>

      {/* Exercise Video Dialog */}
      <ExerciseVideoDialog
        open={!!selectedExercise}
        onOpenChange={(open) => !open && setSelectedExercise(null)}
        exerciseName={selectedExercise?.name || ""}
        videoUrl={selectedExercise?.videoUrl}
      />

      {/* RPE History Dialog */}
      <Dialog open={!!showRPEHistory} onOpenChange={(open) => !open && setShowRPEHistory(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>RPE Geschiedenis</DialogTitle>
          </DialogHeader>
          {showRPEHistory && (
            <RPEHistoryChart
              workoutId={workoutId || ""}
              exerciseName={showRPEHistory.exerciseName}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Rest Timer */}
      <RestTimer
        isOpen={showRestTimer}
        onClose={() => setShowRestTimer(false)}
        defaultRestTime={restTimerDuration}
        onRestComplete={() => {
          toast.info("Rust voltooid! Start je volgende set 💪");
        }}
      />

      {/* Workout Summary */}
      <WorkoutSummary
        isOpen={showSummary}
        onClose={() => setShowSummary(false)}
        {...calculateWorkoutStats()}
      />

      {/* Exercise Leaderboard */}
      <ExerciseLeaderboard
        open={!!showLeaderboard}
        onOpenChange={(open) => !open && setShowLeaderboard(null)}
        exerciseName={showLeaderboard?.exerciseName || ""}
      />

      {/* Share Workout Dialog */}
      <ShareWorkoutDialog
        open={showShareDialog}
        onOpenChange={setShowShareDialog}
        workoutId={workoutId || ""}
        workoutName={workout.name}
        stats={{
          ...calculateWorkoutStats(),
          durationMinutes: Math.floor(workoutElapsedTime / 60),
        }}
        onShared={() => toast.success("Workout gedeeld! 🎉")}
      />
    </div>
  );
};

export default WorkoutDetail;
