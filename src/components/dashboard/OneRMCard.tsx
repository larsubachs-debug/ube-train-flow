import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { use1RMCalculations } from "@/hooks/use1RMCalculations";
import { Trophy, TrendingUp } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { nl } from "date-fns/locale";

interface OneRMCardProps {
  userId: string;
}

export const OneRMCard = ({ userId }: OneRMCardProps) => {
  const { data: exercises, isLoading } = use1RMCalculations(userId);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>1RM Geschat (Top Lifts)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-16" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!exercises || exercises.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>1RM Geschat (Top Lifts)</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-8">
            Geen 1RM data beschikbaar. Start met trainen om je records te zien!
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>1RM Geschat (Top Lifts)</CardTitle>
        <TrendingUp className="w-5 h-5 text-accent" />
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {exercises.map((exercise, index) => (
            <div 
              key={exercise.exercise_name} 
              className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 flex-shrink-0">
                  {index === 0 ? (
                    <Trophy className="w-4 h-4 text-accent" />
                  ) : (
                    <span className="text-sm font-bold text-muted-foreground">{index + 1}</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{exercise.exercise_name}</p>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(exercise.recorded_at), 'dd MMM yyyy', { locale: nl })}
                  </p>
                </div>
              </div>
              <div className="text-right flex-shrink-0 ml-2">
                <p className="text-xl font-bold text-primary">{exercise.estimated_1rm} kg</p>
                <p className="text-xs text-muted-foreground">
                  van {exercise.max_weight}kg × {exercise.max_reps}
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
