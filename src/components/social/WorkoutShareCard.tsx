import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
import { nl } from "date-fns/locale";
import { Trophy, Clock, Dumbbell, Flame } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface SharedWorkout {
  id: string;
  user_id: string;
  workout_name: string;
  total_sets: number;
  total_volume: number;
  duration_minutes: number;
  exercises_completed: number;
  personal_records: number;
  caption: string | null;
  created_at: string;
  user_name: string;
  user_avatar: string | null;
  kudos_count: number;
  user_gave_kudos: boolean;
}

interface WorkoutShareCardProps {
  workout: SharedWorkout;
  onKudosUpdate: () => void;
}

const KUDOS_TYPES = ['💪', '🔥', '👏', '⚡', '🎯'];

export const WorkoutShareCard = ({ workout, onKudosUpdate }: WorkoutShareCardProps) => {
  const { user } = useAuth();
  const [isGivingKudos, setIsGivingKudos] = useState(false);

  const handleKudos = async () => {
    if (!user) return;
    
    setIsGivingKudos(true);
    try {
      if (workout.user_gave_kudos) {
        await supabase
          .from('kudos')
          .delete()
          .eq('shared_workout_id', workout.id)
          .eq('user_id', user.id);
        toast.success("Kudos verwijderd");
      } else {
        const randomKudos = KUDOS_TYPES[Math.floor(Math.random() * KUDOS_TYPES.length)];
        await supabase
          .from('kudos')
          .insert({
            shared_workout_id: workout.id,
            user_id: user.id,
            kudos_type: randomKudos,
          });
        toast.success("High-five gegeven! 🙌");
      }
      onKudosUpdate();
    } catch (error) {
      console.error('Error handling kudos:', error);
      toast.error("Kon kudos niet verwerken");
    } finally {
      setIsGivingKudos(false);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <Card className="p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Avatar>
          {workout.user_avatar && <AvatarImage src={workout.user_avatar} />}
          <AvatarFallback className="bg-accent/10 text-accent font-semibold">
            {getInitials(workout.user_name)}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <p className="font-semibold">{workout.user_name}</p>
          <p className="text-xs text-muted-foreground">
            {formatDistanceToNow(new Date(workout.created_at), { addSuffix: true, locale: nl })}
          </p>
        </div>
        {workout.personal_records > 0 && (
          <Badge variant="secondary" className="bg-yellow-500/20 text-yellow-600">
            <Trophy className="w-3 h-3 mr-1" />
            {workout.personal_records} PR{workout.personal_records > 1 ? "'s" : ""}
          </Badge>
        )}
      </div>

      {/* Workout Info */}
      <div className="bg-muted/50 rounded-lg p-4">
        <h3 className="font-semibold text-lg mb-3">{workout.workout_name}</h3>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="flex items-center justify-center gap-1 text-primary">
              <Dumbbell className="w-4 h-4" />
              <span className="text-xl font-bold">{workout.total_sets}</span>
            </div>
            <p className="text-xs text-muted-foreground">Sets</p>
          </div>
          <div>
            <div className="flex items-center justify-center gap-1 text-primary">
              <Flame className="w-4 h-4" />
              <span className="text-xl font-bold">{Math.round(workout.total_volume)}</span>
            </div>
            <p className="text-xs text-muted-foreground">kg Volume</p>
          </div>
          <div>
            <div className="flex items-center justify-center gap-1 text-primary">
              <Clock className="w-4 h-4" />
              <span className="text-xl font-bold">{workout.duration_minutes}</span>
            </div>
            <p className="text-xs text-muted-foreground">min</p>
          </div>
        </div>
      </div>

      {/* Caption */}
      {workout.caption && (
        <p className="text-sm">{workout.caption}</p>
      )}

      {/* Kudos Button */}
      <div className="flex items-center justify-between pt-2 border-t">
        <Button
          variant={workout.user_gave_kudos ? "secondary" : "ghost"}
          size="sm"
          onClick={handleKudos}
          disabled={isGivingKudos || workout.user_id === user?.id}
          className="gap-2"
        >
          <span className="text-lg">🙌</span>
          High-Five
          {workout.kudos_count > 0 && (
            <Badge variant="outline" className="ml-1">
              {workout.kudos_count}
            </Badge>
          )}
        </Button>
      </div>
    </Card>
  );
};
