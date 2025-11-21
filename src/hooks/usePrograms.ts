import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Program, Week, Workout, Exercise } from "@/types/training";
import { programs as staticPrograms } from "@/data/programs";

export const usePrograms = () => {
  return useQuery({
    queryKey: ["programs"],
    queryFn: async () => {
      const { data: programsData, error } = await supabase
        .from("programs")
        .select("*")
        .order("name");

      if (error) throw error;

      // Fetch all related data
      const programs: Program[] = [];

      for (const program of programsData || []) {
        const { data: weeksData } = await supabase
          .from("weeks")
          .select("*")
          .eq("program_id", program.id)
          .order("week_number");

        const weeks: Week[] = [];

        for (const week of weeksData || []) {
          const { data: workoutsData } = await supabase
            .from("workouts")
            .select("*")
            .eq("week_id", week.id)
            .order("day_number");

          const workouts: Workout[] = [];

          for (const workout of workoutsData || []) {
            const { data: exercisesData } = await supabase
              .from("exercises")
              .select("*")
              .eq("workout_id", workout.id)
              .order("display_order");

            const groupedExercises = {
              warmUp: [] as Exercise[],
              mainLifts: [] as Exercise[],
              accessories: [] as Exercise[],
              conditioning: [] as Exercise[],
            };

            exercisesData?.forEach((ex: any) => {
              const exercise: Exercise = {
                id: ex.id,
                name: ex.name,
                sets: ex.sets,
                reps: ex.reps,
                weight: ex.weight,
                time: ex.time,
                distance: ex.distance,
                rpe: ex.rpe,
                notes: ex.notes,
                videoUrl: ex.video_url,
              };

              switch (ex.category) {
                case "warmup":
                  groupedExercises.warmUp.push(exercise);
                  break;
                case "mainlift":
                  groupedExercises.mainLifts.push(exercise);
                  break;
                case "accessory":
                  groupedExercises.accessories.push(exercise);
                  break;
                case "conditioning":
                  groupedExercises.conditioning.push(exercise);
                  break;
              }
            });

            workouts.push({
              id: workout.id,
              dayNumber: workout.day_number,
              name: workout.name,
              duration: workout.duration,
              ...groupedExercises,
            });
          }

          weeks.push({
            id: week.id,
            weekNumber: week.week_number,
            name: week.name,
            workouts,
          });
        }

        programs.push({
          id: program.id,
          name: program.name,
          description: program.description,
          icon: program.icon,
          weeks,
        });
      }

      return programs;
    },
  });
};

export const useProgram = (programId: string) => {
  const { data: programs } = usePrograms();
  
  return useQuery({
    queryKey: ["program", programId],
    queryFn: async () => {
      return programs?.find((p) => p.id === programId) || null;
    },
    enabled: !!programs,
  });
};