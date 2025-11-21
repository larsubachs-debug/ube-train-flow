import { useState, useEffect } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X, Plus, Minus } from "lucide-react";

interface RestTimerProps {
  isOpen: boolean;
  onClose: () => void;
  defaultRestTime?: number; // in seconds
  onRestComplete?: () => void;
}

export const RestTimer = ({ 
  isOpen, 
  onClose, 
  defaultRestTime = 90,
  onRestComplete 
}: RestTimerProps) => {
  const [timeRemaining, setTimeRemaining] = useState(defaultRestTime);
  const [isRunning, setIsRunning] = useState(false);
  const [configuredTime, setConfiguredTime] = useState(defaultRestTime);

  useEffect(() => {
    if (isOpen) {
      setTimeRemaining(configuredTime);
      setIsRunning(false);
    }
  }, [isOpen, configuredTime]);

  useEffect(() => {
    if (!isRunning || !isOpen) return;

    const interval = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          // Play completion sound
          playBeep(1200, 0.5);
          setIsRunning(false);
          onRestComplete?.();
          return 0;
        }
        // Play beep at 3, 2, 1 seconds
        if (prev <= 3) {
          playBeep(800, 0.1);
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isRunning, isOpen, onRestComplete]);

  const playBeep = (frequency: number, duration: number) => {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.value = frequency;
    oscillator.type = "sine";

    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(
      0.01,
      audioContext.currentTime + duration
    );

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + duration);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const adjustTime = (amount: number) => {
    setConfiguredTime((prev) => Math.max(10, Math.min(600, prev + amount)));
    setTimeRemaining((prev) => Math.max(10, Math.min(600, prev + amount)));
  };

  const progress = (timeRemaining / configuredTime) * 100;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-sm">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full p-2 hover:bg-muted/20 transition-colors"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="pt-8 pb-4">
          <h3 className="text-center text-lg font-semibold mb-6">Rust Timer</h3>

          {/* Circular timer */}
          <div className="relative w-48 h-48 mx-auto mb-6">
            <svg className="w-full h-full transform -rotate-90">
              {/* Background circle */}
              <circle
                cx="96"
                cy="96"
                r="88"
                fill="none"
                stroke="hsl(var(--muted))"
                strokeWidth="8"
                opacity="0.2"
              />
              {/* Progress circle */}
              <circle
                cx="96"
                cy="96"
                r="88"
                fill="none"
                stroke="hsl(var(--primary))"
                strokeWidth="8"
                strokeDasharray={`${2 * Math.PI * 88}`}
                strokeDashoffset={`${2 * Math.PI * 88 * (1 - progress / 100)}`}
                strokeLinecap="round"
                className="transition-all duration-1000 ease-linear"
              />
            </svg>
            {/* Timer display */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <p className="text-5xl font-bold">{formatTime(timeRemaining)}</p>
                {timeRemaining <= 3 && timeRemaining > 0 && (
                  <p className="text-sm text-primary mt-2 font-semibold animate-pulse">
                    Bijna klaar!
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Time adjustment */}
          {!isRunning && (
            <div className="flex items-center justify-center gap-4 mb-6">
              <Button
                onClick={() => adjustTime(-15)}
                size="sm"
                variant="outline"
                className="rounded-full"
              >
                <Minus className="h-4 w-4" />
                15s
              </Button>
              <Button
                onClick={() => adjustTime(15)}
                size="sm"
                variant="outline"
                className="rounded-full"
              >
                <Plus className="h-4 w-4" />
                15s
              </Button>
            </div>
          )}

          {/* Control buttons */}
          <div className="flex gap-3">
            {!isRunning ? (
              <Button
                onClick={() => setIsRunning(true)}
                className="flex-1 bg-[#86efac] text-[#059669] hover:bg-[#86efac]/90 font-semibold"
              >
                Start
              </Button>
            ) : (
              <>
                <Button
                  onClick={() => setIsRunning(false)}
                  variant="outline"
                  className="flex-1"
                >
                  Pause
                </Button>
                <Button
                  onClick={() => {
                    setTimeRemaining(configuredTime);
                    setIsRunning(false);
                  }}
                  variant="outline"
                  className="flex-1"
                >
                  Reset
                </Button>
              </>
            )}
          </div>

          {timeRemaining === 0 && (
            <div className="mt-4 text-center">
              <p className="text-lg font-semibold text-[#059669]">
                Rust voltooid! 💪
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
