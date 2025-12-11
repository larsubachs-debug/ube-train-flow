import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, Play, Dumbbell, Activity } from "lucide-react";
import { LiveCardioTracker } from "@/components/cardio/LiveCardioTracker";
import { SpontaneousActivityDialog } from "@/components/workouts/SpontaneousActivityDialog";
import { CardioActivityDialog } from "@/components/workouts/CardioActivityDialog";

type WorkoutType = "live-cardio" | "strength" | "cardio-log" | null;

export function UnplannedWorkoutDialog() {
  const [open, setOpen] = useState(false);
  const [selectedType, setSelectedType] = useState<WorkoutType>(null);

  const handleSelect = (type: WorkoutType) => {
    setSelectedType(type);
    setOpen(false);
  };

  const handleClose = () => {
    setSelectedType(null);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" className="w-full justify-start gap-3 h-14">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Plus className="w-5 h-5 text-primary" />
            </div>
            <span className="font-medium">Start niet geplande workout</span>
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Kies type workout</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 pt-4">
            <Button
              variant="outline"
              className="w-full justify-start gap-3 h-16"
              onClick={() => handleSelect("live-cardio")}
            >
              <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center">
                <Play className="w-6 h-6 text-green-500" />
              </div>
              <div className="text-left">
                <p className="font-medium">Live Cardio</p>
                <p className="text-xs text-muted-foreground">Start tracking met GPS</p>
              </div>
            </Button>

            <Button
              variant="outline"
              className="w-full justify-start gap-3 h-16"
              onClick={() => handleSelect("strength")}
            >
              <div className="w-12 h-12 rounded-full bg-orange-500/10 flex items-center justify-center">
                <Dumbbell className="w-6 h-6 text-orange-500" />
              </div>
              <div className="text-left">
                <p className="font-medium">Kracht Training</p>
                <p className="text-xs text-muted-foreground">Log oefeningen en sets</p>
              </div>
            </Button>

            <Button
              variant="outline"
              className="w-full justify-start gap-3 h-16"
              onClick={() => handleSelect("cardio-log")}
            >
              <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center">
                <Activity className="w-6 h-6 text-blue-500" />
              </div>
              <div className="text-left">
                <p className="font-medium">Cardio Loggen</p>
                <p className="text-xs text-muted-foreground">Log een voltooide cardio activiteit</p>
              </div>
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Render the selected dialog */}
      {selectedType === "live-cardio" && (
        <LiveCardioTracker autoStart onClose={handleClose} />
      )}
      {selectedType === "strength" && (
        <SpontaneousActivityDialog autoOpen onClose={handleClose} />
      )}
      {selectedType === "cardio-log" && (
        <CardioActivityDialog autoOpen onClose={handleClose} />
      )}
    </>
  );
}
