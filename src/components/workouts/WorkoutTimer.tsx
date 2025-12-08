import { useState, useEffect, useCallback } from "react";
import { Play, Pause, RotateCcw, Timer } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface WorkoutTimerProps {
  autoStart?: boolean;
  onTimeUpdate?: (seconds: number) => void;
}

export const WorkoutTimer = ({ autoStart = true, onTimeUpdate }: WorkoutTimerProps) => {
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isRunning, setIsRunning] = useState(autoStart);
  const [startTime, setStartTime] = useState<number | null>(autoStart ? Date.now() : null);

  useEffect(() => {
    if (!isRunning || !startTime) return;

    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTime) / 1000) + elapsedSeconds;
      setElapsedSeconds(elapsed);
      onTimeUpdate?.(elapsed);
    }, 1000);

    return () => clearInterval(interval);
  }, [isRunning, startTime]);

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    }
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const toggleTimer = useCallback(() => {
    if (isRunning) {
      // Pause - save elapsed time
      setIsRunning(false);
      setStartTime(null);
    } else {
      // Resume - reset start time
      setStartTime(Date.now());
      setIsRunning(true);
    }
  }, [isRunning, elapsedSeconds]);

  const resetTimer = useCallback(() => {
    setElapsedSeconds(0);
    setIsRunning(false);
    setStartTime(null);
    onTimeUpdate?.(0);
  }, [onTimeUpdate]);

  return (
    <div className="flex items-center gap-3 bg-muted/30 rounded-full px-4 py-2">
      <Timer className="h-4 w-4 text-muted-foreground" />
      <span className="font-mono text-lg font-semibold min-w-[80px]">
        {formatTime(elapsedSeconds)}
      </span>
      <div className="flex items-center gap-1">
        <button
          onClick={toggleTimer}
          className="p-1.5 rounded-full hover:bg-muted/50 transition-colors"
          title={isRunning ? "Pause" : "Start"}
        >
          {isRunning ? (
            <Pause className="h-4 w-4" />
          ) : (
            <Play className="h-4 w-4" />
          )}
        </button>
        <button
          onClick={resetTimer}
          className="p-1.5 rounded-full hover:bg-muted/50 transition-colors"
          title="Reset"
        >
          <RotateCcw className="h-3 w-3" />
        </button>
      </div>
      {isRunning && (
        <Badge variant="secondary" className="text-xs bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300">
          Actief
        </Badge>
      )}
    </div>
  );
};
