import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Share2, Trophy, Dumbbell, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface ShareWorkoutDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workoutId: string;
  workoutName: string;
  stats: {
    totalSets: number;
    completedSets: number;
    totalVolume: number;
    prCount: number;
    durationMinutes: number;
  };
  onShared?: () => void;
}

export const ShareWorkoutDialog = ({
  open,
  onOpenChange,
  workoutId,
  workoutName,
  stats,
  onShared,
}: ShareWorkoutDialogProps) => {
  const { user } = useAuth();
  const [caption, setCaption] = useState("");
  const [isSharing, setIsSharing] = useState(false);

  const handleShare = async () => {
    if (!user) return;

    setIsSharing(true);
    try {
      const { error } = await supabase.from('shared_workouts').insert({
        user_id: user.id,
        workout_id: workoutId,
        workout_name: workoutName,
        total_sets: stats.completedSets,
        total_volume: stats.totalVolume,
        duration_minutes: stats.durationMinutes,
        exercises_completed: stats.completedSets,
        personal_records: stats.prCount,
        caption: caption.trim() || null,
      });

      if (error) throw error;

      toast.success("Workout gedeeld met de community! 💪");
      setCaption("");
      onOpenChange(false);
      onShared?.();
    } catch (error) {
      console.error('Error sharing workout:', error);
      toast.error("Kon workout niet delen");
    } finally {
      setIsSharing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="w-5 h-5" />
            Deel je Workout
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Stats Preview */}
          <div className="bg-muted/50 rounded-lg p-4">
            <h3 className="font-semibold mb-3">{workoutName}</h3>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="flex items-center justify-center gap-1 text-primary">
                  <Dumbbell className="w-4 h-4" />
                  <span className="text-xl font-bold">{stats.completedSets}</span>
                </div>
                <p className="text-xs text-muted-foreground">Sets</p>
              </div>
              <div>
                <div className="flex items-center justify-center gap-1 text-primary">
                  <span className="text-xl font-bold">{Math.round(stats.totalVolume)}</span>
                </div>
                <p className="text-xs text-muted-foreground">kg Volume</p>
              </div>
              <div>
                <div className="flex items-center justify-center gap-1 text-primary">
                  <Clock className="w-4 h-4" />
                  <span className="text-xl font-bold">{stats.durationMinutes}</span>
                </div>
                <p className="text-xs text-muted-foreground">min</p>
              </div>
            </div>
            {stats.prCount > 0 && (
              <div className="mt-3 flex items-center justify-center gap-2 text-yellow-600">
                <Trophy className="w-4 h-4" />
                <span className="font-semibold">{stats.prCount} Personal Record{stats.prCount > 1 ? 's' : ''}!</span>
              </div>
            )}
          </div>

          {/* Caption Input */}
          <div className="space-y-2">
            <Label htmlFor="caption">Voeg een bericht toe (optioneel)</Label>
            <Textarea
              id="caption"
              placeholder="Hoe was je workout? 💪"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              rows={3}
            />
          </div>

          {/* Share Button */}
          <Button
            onClick={handleShare}
            disabled={isSharing}
            className="w-full gap-2"
          >
            <Share2 className="w-4 h-4" />
            {isSharing ? "Delen..." : "Deel met Community"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
