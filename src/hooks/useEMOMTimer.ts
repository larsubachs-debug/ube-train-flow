import { useState, useEffect, useRef } from "react";

export const useEMOMTimer = (totalMinutes: number, autoStart = false) => {
  const [timeRemaining, setTimeRemaining] = useState(60); // seconds
  const [currentRound, setCurrentRound] = useState(1);
  const [isRunning, setIsRunning] = useState(autoStart);
  const [isPaused, setIsPaused] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize audio context
  useEffect(() => {
    audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    return () => {
      audioContextRef.current?.close();
    };
  }, []);

  // Play beep sound
  const playBeep = (frequency: number, duration: number) => {
    if (!audioContextRef.current) return;

    const oscillator = audioContextRef.current.createOscillator();
    const gainNode = audioContextRef.current.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContextRef.current.destination);

    oscillator.frequency.value = frequency;
    oscillator.type = "sine";

    gainNode.gain.setValueAtTime(0.3, audioContextRef.current.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(
      0.01,
      audioContextRef.current.currentTime + duration
    );

    oscillator.start(audioContextRef.current.currentTime);
    oscillator.stop(audioContextRef.current.currentTime + duration);
  };

  useEffect(() => {
    if (!isRunning || isPaused) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    intervalRef.current = setInterval(() => {
      setTimeRemaining((prev) => {
        // At 3, 2, 1 seconds - play countdown beeps
        if (prev === 3 || prev === 2 || prev === 1) {
          playBeep(800, 0.1);
        }

        if (prev <= 1) {
          // Round complete - play different beep
          playBeep(1000, 0.3);
          
          if (currentRound >= totalMinutes) {
            // Workout complete - play success sound
            playBeep(1200, 0.5);
            setIsRunning(false);
            return 0;
          }

          setCurrentRound((r) => r + 1);
          return 60;
        }

        return prev - 1;
      });
    }, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, isPaused, currentRound, totalMinutes]);

  const start = () => {
    setIsRunning(true);
    setIsPaused(false);
  };

  const pause = () => {
    setIsPaused(true);
  };

  const resume = () => {
    setIsPaused(false);
  };

  const reset = () => {
    setIsRunning(false);
    setIsPaused(false);
    setTimeRemaining(60);
    setCurrentRound(1);
  };

  return {
    timeRemaining,
    currentRound,
    isRunning,
    isPaused,
    start,
    pause,
    resume,
    reset,
    totalMinutes,
  };
};
