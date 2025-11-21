import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useBodyMetrics } from "@/hooks/useBodyMetrics";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { nl } from "date-fns/locale";
import { Scale, TrendingDown, TrendingUp } from "lucide-react";

interface WeightProgressChartProps {
  userId: string;
}

export const WeightProgressChart = ({ userId }: WeightProgressChartProps) => {
  const { metrics, isLoading } = useBodyMetrics(userId);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Gewicht Progressie</CardTitle>
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
          <CardTitle>Gewicht Progressie</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-8">
            Geen gewichtsdata beschikbaar.
          </p>
        </CardContent>
      </Card>
    );
  }

  // Filter metrics with weight data and reverse to show oldest first
  const metricsWithWeight = [...metrics]
    .filter(m => m.weight !== null)
    .reverse();

  if (metricsWithWeight.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Gewicht Progressie</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-8">
            Geen gewichtsdata beschikbaar.
          </p>
        </CardContent>
      </Card>
    );
  }

  const chartData = metricsWithWeight.map((metric) => ({
    date: format(new Date(metric.recorded_at), 'dd MMM', { locale: nl }),
    fullDate: format(new Date(metric.recorded_at), 'dd MMMM yyyy', { locale: nl }),
    weight: Number(metric.weight),
  }));

  // Calculate weight change
  const firstWeight = metricsWithWeight[0].weight!;
  const lastWeight = metricsWithWeight[metricsWithWeight.length - 1].weight!;
  const weightChange = Number(lastWeight) - Number(firstWeight);
  const isPositive = weightChange > 0;

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
          <p className="text-sm font-medium mb-1">{payload[0].payload.fullDate}</p>
          <p className="text-sm font-bold text-primary">
            {payload[0].value.toFixed(1)} kg
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Gewicht Progressie</CardTitle>
          <div className="flex items-center gap-2">
            {isPositive ? (
              <TrendingUp className="w-5 h-5 text-accent" />
            ) : (
              <TrendingDown className="w-5 h-5 text-secondary" />
            )}
            <Scale className="w-5 h-5 text-muted-foreground" />
          </div>
        </div>
        <div className="flex items-center gap-2 mt-2">
          <span className="text-2xl font-bold">{Number(lastWeight).toFixed(1)} kg</span>
          <span className={`text-sm font-medium ${isPositive ? 'text-accent' : 'text-secondary'}`}>
            {isPositive ? '+' : ''}{weightChange.toFixed(1)} kg
          </span>
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="weightGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis 
              dataKey="date" 
              className="text-xs"
              stroke="hsl(var(--muted-foreground))"
            />
            <YAxis 
              className="text-xs"
              stroke="hsl(var(--muted-foreground))"
              domain={['dataMin - 2', 'dataMax + 2']}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area 
              type="monotone" 
              dataKey="weight" 
              stroke="hsl(var(--primary))" 
              strokeWidth={3}
              fill="url(#weightGradient)"
              dot={{ fill: "hsl(var(--primary))", r: 4, strokeWidth: 2, stroke: "hsl(var(--background))" }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};
