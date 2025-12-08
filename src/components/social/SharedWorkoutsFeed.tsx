import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Dumbbell } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { WorkoutShareCard } from "./WorkoutShareCard";

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

export const SharedWorkoutsFeed = () => {
  const { user } = useAuth();
  const [workouts, setWorkouts] = useState<SharedWorkout[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSharedWorkouts();

    // Subscribe to new shared workouts
    const channel = supabase
      .channel('shared-workouts-feed')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'shared_workouts',
        },
        () => {
          fetchSharedWorkouts();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'kudos',
        },
        () => {
          fetchSharedWorkouts();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const fetchSharedWorkouts = async () => {
    try {
      // Fetch shared workouts
      const { data: workoutsData, error } = await supabase
        .from('shared_workouts')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;

      if (!workoutsData || workoutsData.length === 0) {
        setWorkouts([]);
        setLoading(false);
        return;
      }

      // Fetch user profiles
      const userIds = [...new Set(workoutsData.map(w => w.user_id))];
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('user_id, display_name, avatar_url')
        .in('user_id', userIds);

      const profilesMap = new Map(profilesData?.map(p => [p.user_id, p]) || []);

      // Fetch kudos for all workouts
      const workoutIds = workoutsData.map(w => w.id);
      const { data: kudosData } = await supabase
        .from('kudos')
        .select('*')
        .in('shared_workout_id', workoutIds);

      // Group kudos by workout
      const kudosMap = new Map<string, any[]>();
      kudosData?.forEach(kudos => {
        if (!kudosMap.has(kudos.shared_workout_id)) {
          kudosMap.set(kudos.shared_workout_id, []);
        }
        kudosMap.get(kudos.shared_workout_id)?.push(kudos);
      });

      const formattedWorkouts: SharedWorkout[] = workoutsData.map(workout => {
        const profile = profilesMap.get(workout.user_id);
        const workoutKudos = kudosMap.get(workout.id) || [];

        return {
          id: workout.id,
          user_id: workout.user_id,
          workout_name: workout.workout_name,
          total_sets: workout.total_sets || 0,
          total_volume: workout.total_volume || 0,
          duration_minutes: workout.duration_minutes || 0,
          exercises_completed: workout.exercises_completed || 0,
          personal_records: workout.personal_records || 0,
          caption: workout.caption,
          created_at: workout.created_at,
          user_name: profile?.display_name || 'Unknown',
          user_avatar: profile?.avatar_url || null,
          kudos_count: workoutKudos.length,
          user_gave_kudos: workoutKudos.some(k => k.user_id === user?.id),
        };
      });

      setWorkouts(formattedWorkouts);
    } catch (error) {
      console.error('Error fetching shared workouts:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <Card key={i} className="p-4">
            <div className="animate-pulse space-y-4">
              <div className="flex gap-3">
                <div className="w-10 h-10 bg-muted rounded-full" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-muted rounded w-1/4" />
                  <div className="h-3 bg-muted rounded w-1/6" />
                </div>
              </div>
              <div className="h-24 bg-muted rounded" />
            </div>
          </Card>
        ))}
      </div>
    );
  }

  if (workouts.length === 0) {
    return (
      <Card className="p-8 text-center">
        <Dumbbell className="w-12 h-12 mx-auto mb-2 text-muted-foreground opacity-50" />
        <p className="text-muted-foreground">Nog geen gedeelde workouts</p>
        <p className="text-sm text-muted-foreground">Deel je workout na het afronden! 💪</p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {workouts.map(workout => (
        <WorkoutShareCard
          key={workout.id}
          workout={workout}
          onKudosUpdate={fetchSharedWorkouts}
        />
      ))}
    </div>
  );
};
