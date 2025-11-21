import { useEMOMTimer } from "@/hooks/useEMOMTimer";
import { Button } from "@/components/ui/button";
import { Play, Pause, RotateCcw } from "lucide-react";

interface EMOMTimerProps {
  totalMinutes: number;
}

export const EMOMTimer = ({ totalMinutes }: EMOMTimerProps) => {
  const {
    timeRemaining,
    currentRound,
    isRunning,
    isPaused,
    start,
    pause,
    resume,
    reset,
  } = useEMOMTimer(totalMinutes);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const progress = (timeRemaining / 60) * 100;

  return (
    <div className="bg-gradient-to-br from-primary/10 to-accent/10 rounded-2xl p-6 border border-border/20">
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-sm text-muted-foreground mb-1">EMOM Timer</p>
          <p className="text-xs text-muted-foreground">
            Ronde {currentRound} van {totalMinutes}
          </p>
        </div>
        <div className="flex gap-2">
          {!isRunning ? (
            <Button
              onClick={start}
              size="sm"
              className="bg-[#86efac] text-[#059669] hover:bg-[#86efac]/90"
            >
              <Play className="h-4 w-4" />
            </Button>
          ) : isPaused ? (
            <Button
              onClick={resume}
              size="sm"
              className="bg-[#86efac] text-[#059669] hover:bg-[#86efac]/90"
            >
              <Play className="h-4 w-4" />
            </Button>
          ) : (
            <Button onClick={pause} size="sm" variant="outline">
              <Pause className="h-4 w-4" />
            </Button>
          )}
          <Button onClick={reset} size="sm" variant="outline">
            <RotateCcw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="relative">
        {/* Progress ring background */}
        <div className="w-32 h-32 mx-auto relative">
          <svg className="w-full h-full transform -rotate-90">
            {/* Background circle */}
            <circle
              cx="64"
              cy="64"
              r="56"
              fill="none"
              stroke="hsl(var(--muted))"
              strokeWidth="8"
              opacity="0.2"
            />
            {/* Progress circle */}
            <circle
              cx="64"
              cy="64"
              r="56"
              fill="none"
              stroke="hsl(var(--primary))"
              strokeWidth="8"
              strokeDasharray={`${2 * Math.PI * 56}`}
              strokeDashoffset={`${2 * Math.PI * 56 * (1 - progress / 100)}`}
              strokeLinecap="round"
              className="transition-all duration-1000 ease-linear"
            />
          </svg>
          {/* Timer display */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <p className="text-4xl font-bold">{formatTime(timeRemaining)}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {timeRemaining <= 3 && timeRemaining > 0 ? "Start!" : ""}
              </p>
            </div>
          </div>
        </div>
      </div>

      {currentRound >= totalMinutes && !isRunning && (
        <div className="mt-4 text-center">
          <p className="text-lg font-semibold text-[#059669]">Workout voltooid! 🎉</p>
        </div>
      )}
    </div>
  );
};
