import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useBodyMetrics } from "@/hooks/useBodyMetrics";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { nl } from "date-fns/locale";
import { TrendingUp } from "lucide-react";

interface BodyCompositionChartProps {
  userId: string;
}

export const BodyCompositionChart = ({ userId }: BodyCompositionChartProps) => {
  const { metrics, isLoading } = useBodyMetrics(userId);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Body Composition Progressie</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[300px]" />
        </CardContent>
      </Card>
    );
  }

  if (!metrics || metrics.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Body Composition Progressie</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-8">
            Geen body metrics beschikbaar. Voeg metingen toe om je progressie te volgen!
          </p>
        </CardContent>
      </Card>
    );
  }

  // Prepare data for chart (reverse to show oldest first)
  const chartData = [...metrics]
    .reverse()
    .map((metric) => ({
      date: format(new Date(metric.recorded_at), 'dd MMM', { locale: nl }),
      fullDate: format(new Date(metric.recorded_at), 'dd MMMM yyyy', { locale: nl }),
      weight: metric.weight ? Number(metric.weight) : null,
      bodyFat: metric.body_fat_percentage ? Number(metric.body_fat_percentage) : null,
      muscleMass: metric.muscle_mass ? Number(metric.muscle_mass) : null,
    }));

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
          <p className="text-sm font-medium mb-2">{payload[0].payload.fullDate}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {entry.value !== null ? entry.value.toFixed(1) : 'N/A'}
              {entry.dataKey === 'bodyFat' ? '%' : ' kg'}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Body Composition Progressie</CardTitle>
        <TrendingUp className="w-5 h-5 text-accent" />
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis 
              dataKey="date" 
              className="text-xs"
              stroke="hsl(var(--muted-foreground))"
            />
            <YAxis 
              className="text-xs"
              stroke="hsl(var(--muted-foreground))"
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend 
              wrapperStyle={{ paddingTop: '20px' }}
              iconType="line"
            />
            <Line 
              type="monotone" 
              dataKey="weight" 
              name="Gewicht"
              stroke="hsl(var(--primary))" 
              strokeWidth={2}
              dot={{ fill: "hsl(var(--primary))", r: 4 }}
              connectNulls
            />
            <Line 
              type="monotone" 
              dataKey="bodyFat" 
              name="Vetpercentage"
              stroke="hsl(var(--accent))" 
              strokeWidth={2}
              dot={{ fill: "hsl(var(--accent))", r: 4 }}
              connectNulls
            />
            <Line 
              type="monotone" 
              dataKey="muscleMass" 
              name="Spiermassa"
              stroke="hsl(var(--secondary))" 
              strokeWidth={2}
              dot={{ fill: "hsl(var(--secondary))", r: 4 }}
              connectNulls
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};
