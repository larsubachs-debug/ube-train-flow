import { useEffect, useState } from "react";
import { format } from "date-fns";
import { nl } from "date-fns/locale";
import { Line, LineChart, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { Card } from "@/components/ui/card";
import { useWorkoutSets, WorkoutSet } from "@/hooks/useWorkoutSets";

interface RPEHistoryChartProps {
  workoutId: string;
  exerciseName: string;
}

export const RPEHistoryChart = ({ workoutId, exerciseName }: RPEHistoryChartProps) => {
  const { getHistoricalRPE } = useWorkoutSets(workoutId, exerciseName);
  const [chartData, setChartData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      const history = await getHistoricalRPE(exerciseName, 10);
      
      // Format data for chart (reverse to show oldest first)
      const formatted = history
        .reverse()
        .map((set: WorkoutSet) => ({
          date: format(new Date(set.completed_at), "dd MMM", { locale: nl }),
          rpe: set.rpe || 0,
          weight: set.weight || 0,
        }));

      setChartData(formatted);
      setLoading(false);
    };

    loadData();
  }, [exerciseName, workoutId]);

  if (loading) {
    return (
      <Card className="p-4">
        <p className="text-sm text-muted-foreground">Laden...</p>
      </Card>
    );
  }

  if (chartData.length === 0) {
    return (
      <Card className="p-4">
        <p className="text-sm text-muted-foreground">
          Nog geen RPE geschiedenis voor deze oefening
        </p>
      </Card>
    );
  }

  return (
    <Card className="p-4">
      <div className="mb-3">
        <h4 className="font-semibold text-sm mb-1">RPE Geschiedenis</h4>
        <p className="text-xs text-muted-foreground">
          Laatste 10 sessies voor {exerciseName}
        </p>
      </div>
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={chartData}>
          <XAxis 
            dataKey="date" 
            tick={{ fontSize: 11 }}
            stroke="hsl(var(--muted-foreground))"
          />
          <YAxis 
            domain={[0, 10]} 
            tick={{ fontSize: 11 }}
            stroke="hsl(var(--muted-foreground))"
          />
          <Tooltip 
            contentStyle={{
              backgroundColor: "hsl(var(--background))",
              border: "1px solid hsl(var(--border))",
              borderRadius: "8px",
              fontSize: "12px",
            }}
          />
          <Line 
            type="monotone" 
            dataKey="rpe" 
            stroke="hsl(var(--primary))" 
            strokeWidth={2}
            dot={{ fill: "hsl(var(--primary))", r: 4 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </Card>
  );
};
