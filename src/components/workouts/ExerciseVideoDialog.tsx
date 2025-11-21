import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Play, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ExerciseVideoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  exerciseName: string;
  videoUrl?: string;
}

export const ExerciseVideoDialog = ({
  open,
  onOpenChange,
  exerciseName,
  videoUrl,
}: ExerciseVideoDialogProps) => {
  if (!videoUrl) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl p-0 overflow-hidden">
        <DialogHeader className="p-6 pb-4">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-bold">{exerciseName}</DialogTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onOpenChange(false)}
              className="h-8 w-8"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </DialogHeader>
        
        <div className="relative aspect-video bg-black">
          <video
            controls
            autoPlay
            className="w-full h-full"
            src={videoUrl}
          >
            <source src={videoUrl} type="video/mp4" />
            Je browser ondersteunt geen video playback.
          </video>
        </div>

        <div className="p-6 pt-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Play className="h-4 w-4" />
            <span>Bekijk de correcte uitvoering van deze oefening</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
