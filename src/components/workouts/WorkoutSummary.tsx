import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Trophy, TrendingUp, Dumbbell, CheckCircle2 } from "lucide-react";
import confetti from "canvas-confetti";
import { useEffect } from "react";

interface WorkoutSummaryProps {
  isOpen: boolean;
  onClose: () => void;
  totalSets: number;
  completedSets: number;
  totalVolume: number; // in kg
  prCount: number;
  exercises: Array<{
    name: string;
    sets: number;
    avgWeight: number;
    hadPR: boolean;
  }>;
}

export const WorkoutSummary = ({
  isOpen,
  onClose,
  totalSets,
  completedSets,
  totalVolume,
  prCount,
  exercises,
}: WorkoutSummaryProps) => {
  useEffect(() => {
    if (isOpen && prCount > 0) {
      // Trigger confetti if there were PRs
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      });
    }
  }, [isOpen, prCount]);

  const completionRate = totalSets > 0 ? Math.round((completedSets / totalSets) * 100) : 0;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-center gap-2">
            <CheckCircle2 className="h-6 w-6 text-[#059669]" />
            Workout Voltooid!
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Stats Overview */}
          <div className="grid grid-cols-3 gap-3">
            <Card className="p-4 text-center">
              <Dumbbell className="h-5 w-5 text-primary mx-auto mb-2" />
              <p className="text-2xl font-bold">{completedSets}</p>
              <p className="text-xs text-muted-foreground">Sets</p>
            </Card>
            <Card className="p-4 text-center">
              <TrendingUp className="h-5 w-5 text-primary mx-auto mb-2" />
              <p className="text-2xl font-bold">{totalVolume}</p>
              <p className="text-xs text-muted-foreground">kg Volume</p>
            </Card>
            <Card className="p-4 text-center bg-gradient-to-br from-amber-500/10 to-amber-600/10 border-amber-500/20">
              <Trophy className="h-5 w-5 text-amber-500 mx-auto mb-2" />
              <p className="text-2xl font-bold text-amber-600 dark:text-amber-500">{prCount}</p>
              <p className="text-xs text-muted-foreground">PR's</p>
            </Card>
          </div>

          {/* Completion Rate */}
          <Card className="p-4">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-semibold text-sm">Voltooiingspercentage</h4>
              <span className="text-2xl font-bold text-primary">{completionRate}%</span>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div
                className="bg-primary h-2 rounded-full transition-all duration-500"
                style={{ width: `${completionRate}%` }}
              />
            </div>
          </Card>

          {/* Exercise Breakdown */}
          <div>
            <h4 className="font-semibold text-sm mb-3">Oefening Overzicht</h4>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {exercises.map((exercise, idx) => (
                <Card key={idx} className="p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h5 className="font-medium text-sm">{exercise.name}</h5>
                        {exercise.hadPR && (
                          <Trophy className="h-4 w-4 text-amber-500" />
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {exercise.sets} sets • Gem. {exercise.avgWeight}kg
                      </p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>

          {/* Motivational Message */}
          {prCount > 0 && (
            <Card className="p-4 bg-gradient-to-br from-amber-500/10 to-amber-600/10 border-amber-500/20">
              <p className="text-center font-semibold text-amber-700 dark:text-amber-500">
                🎉 {prCount} nieuwe persoonlijke record{prCount > 1 ? "s" : ""}! Geweldig werk!
              </p>
            </Card>
          )}

          <Button onClick={onClose} className="w-full" size="lg">
            Sluiten
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
