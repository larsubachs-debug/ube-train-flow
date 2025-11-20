import { Button } from "@/components/ui/button";
import { useWorkoutCompletion } from "@/hooks/useWorkoutCompletion";
import { CheckCircle2 } from "lucide-react";
import { useEffect, useState } from "react";

interface WorkoutCompleteButtonProps {
  workoutId: string;
  onComplete?: () => void;
}

export const WorkoutCompleteButton = ({ workoutId, onComplete }: WorkoutCompleteButtonProps) => {
  const { completeWorkout, checkIfCompleted, isCompleting } = useWorkoutCompletion();
  const [isCompleted, setIsCompleted] = useState(false);

  useEffect(() => {
    const checkCompletion = async () => {
      const completed = await checkIfCompleted(workoutId);
      setIsCompleted(completed);
    };
    checkCompletion();
  }, [workoutId, checkIfCompleted]);

  const handleComplete = async () => {
    const success = await completeWorkout(workoutId);
    if (success) {
      setIsCompleted(true);
      onComplete?.();
    }
  };

  if (isCompleted) {
    return (
      <Button variant="outline" className="w-full" disabled>
        <CheckCircle2 className="mr-2 h-5 w-5 text-ube-green" />
        Completed Today
      </Button>
    );
  }

  return (
    <Button 
      onClick={handleComplete}
      disabled={isCompleting}
      className="w-full bg-accent hover:bg-accent/90 text-accent-foreground font-semibold"
    >
      {isCompleting ? "Completing..." : "Mark as Complete"}
    </Button>
  );
};
