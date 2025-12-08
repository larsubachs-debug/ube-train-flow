import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Plus, Flame, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface WarmupSet {
  id: string;
  weight: number;
  reps: number;
  completed: boolean;
}

interface WarmupSetTrackerProps {
  exerciseName: string;
  targetWeight?: number;
  onWarmupComplete?: () => void;
}

// Calculate recommended warmup sets based on target weight
const calculateWarmupSets = (targetWeight: number): WarmupSet[] => {
  if (targetWeight <= 0) return [];
  
  const percentages = [0.4, 0.5, 0.6, 0.7, 0.8];
  const reps = [10, 8, 5, 3, 2];
  
  return percentages.map((pct, idx) => ({
    id: `warmup-${idx}`,
    weight: Math.round((targetWeight * pct) / 2.5) * 2.5, // Round to nearest 2.5kg
    reps: reps[idx],
    completed: false,
  }));
};

export const WarmupSetTracker = ({
  exerciseName,
  targetWeight = 0,
  onWarmupComplete,
}: WarmupSetTrackerProps) => {
  const [warmupSets, setWarmupSets] = useState<WarmupSet[]>(() => 
    calculateWarmupSets(targetWeight)
  );
  const [customWeight, setCustomWeight] = useState("");
  const [customReps, setCustomReps] = useState("10");
  const [isExpanded, setIsExpanded] = useState(true);

  const toggleSetComplete = (setId: string) => {
    setWarmupSets((prev) =>
      prev.map((set) =>
        set.id === setId ? { ...set, completed: !set.completed } : set
      )
    );
  };

  const addCustomSet = () => {
    const weight = parseFloat(customWeight);
    const reps = parseInt(customReps);
    
    if (!weight || !reps) {
      toast.error("Vul gewicht en reps in");
      return;
    }

    const newSet: WarmupSet = {
      id: `custom-${Date.now()}`,
      weight,
      reps,
      completed: false,
    };

    setWarmupSets((prev) => [...prev, newSet]);
    setCustomWeight("");
    setCustomReps("10");
  };

  const removeSet = (setId: string) => {
    setWarmupSets((prev) => prev.filter((set) => set.id !== setId));
  };

  const completedCount = warmupSets.filter((s) => s.completed).length;
  const allCompleted = warmupSets.length > 0 && completedCount === warmupSets.length;

  const handleCompleteWarmup = () => {
    toast.success("Warm-up voltooid! Tijd voor de hoofdsets 💪");
    onWarmupComplete?.();
  };

  const regenerateSets = () => {
    if (targetWeight > 0) {
      setWarmupSets(calculateWarmupSets(targetWeight));
    }
  };

  return (
    <Card className="p-4 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 border-amber-200 dark:border-amber-800">
      <div 
        className="flex items-center justify-between cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2">
          <Flame className="h-5 w-5 text-amber-600" />
          <h4 className="font-semibold text-amber-900 dark:text-amber-100">
            Warm-up Sets
          </h4>
          <Badge variant="outline" className="bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 border-amber-300">
            {completedCount}/{warmupSets.length}
          </Badge>
        </div>
        {allCompleted && (
          <Badge className="bg-emerald-500 text-white">
            <Check className="h-3 w-3 mr-1" />
            Voltooid
          </Badge>
        )}
      </div>

      {isExpanded && (
        <div className="mt-4 space-y-3">
          {warmupSets.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-2">
              Voer een doelgewicht in om aanbevolen warm-up sets te genereren
            </p>
          ) : (
            <>
              {/* Warmup sets list */}
              <div className="space-y-2">
                {warmupSets.map((set, idx) => (
                  <div
                    key={set.id}
                    className={`flex items-center gap-3 p-2 rounded-lg transition-colors ${
                      set.completed 
                        ? "bg-emerald-100 dark:bg-emerald-900/30" 
                        : "bg-white/50 dark:bg-white/5"
                    }`}
                  >
                    <span className="text-sm font-medium text-muted-foreground w-6">
                      {idx + 1}
                    </span>
                    <div className="flex-1 flex items-center gap-2">
                      <span className={`font-semibold ${set.completed ? "line-through text-muted-foreground" : ""}`}>
                        {set.weight}kg
                      </span>
                      <span className="text-muted-foreground">×</span>
                      <span className={set.completed ? "line-through text-muted-foreground" : ""}>
                        {set.reps} reps
                      </span>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeSet(set.id);
                      }}
                      className="p-1 text-muted-foreground hover:text-destructive transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleSetComplete(set.id);
                      }}
                      className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                        set.completed
                          ? "bg-emerald-500 text-white"
                          : "bg-muted/50 hover:bg-emerald-100 dark:hover:bg-emerald-900/30"
                      }`}
                    >
                      <Check className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Add custom set */}
              <div className="flex items-center gap-2 pt-2 border-t border-amber-200 dark:border-amber-800">
                <Input
                  type="number"
                  placeholder="kg"
                  value={customWeight}
                  onChange={(e) => setCustomWeight(e.target.value)}
                  className="w-20 h-8 text-sm"
                />
                <span className="text-muted-foreground">×</span>
                <Input
                  type="number"
                  placeholder="reps"
                  value={customReps}
                  onChange={(e) => setCustomReps(e.target.value)}
                  className="w-16 h-8 text-sm"
                />
                <Button
                  onClick={addCustomSet}
                  size="sm"
                  variant="outline"
                  className="h-8"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              {/* Complete button */}
              {allCompleted && (
                <Button
                  onClick={handleCompleteWarmup}
                  className="w-full mt-2 bg-amber-500 hover:bg-amber-600 text-white"
                >
                  Start Hoofdsets →
                </Button>
              )}
            </>
          )}

          {targetWeight > 0 && (
            <Button
              onClick={regenerateSets}
              variant="ghost"
              size="sm"
              className="w-full text-amber-700 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/30"
            >
              Regenereer voor {targetWeight}kg doel
            </Button>
          )}
        </div>
      )}
    </Card>
  );
};
