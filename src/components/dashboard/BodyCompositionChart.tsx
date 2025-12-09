import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useBodyMetrics } from "@/hooks/useBodyMetrics";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Skeleton } from "@/components/ui/skeleton";
import { format, subDays, subWeeks, subMonths, subYears, isAfter } from "date-fns";
import { nl } from "date-fns/locale";
import { TrendingUp, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

interface BodyCompositionChartProps {
  userId: string;
}

type TimeRange = "7d" | "4w" | "6m" | "1y" | "all";

const timeRangeLabels: Record<TimeRange, string> = {
  "7d": "7 dagen",
  "4w": "4 weken",
  "6m": "6 maanden",
  "1y": "1 jaar",
  "all": "Alles",
};

export const BodyCompositionChart = ({ userId }: BodyCompositionChartProps) => {
  const { metrics, isLoading } = useBodyMetrics(userId);
  const [isOpen, setIsOpen] = useState(false);
  const [timeRange, setTimeRange] = useState<TimeRange>("4w");

  const getFilteredMetrics = () => {
    if (!metrics) return [];
    
    const now = new Date();
    let cutoffDate: Date;

    switch (timeRange) {
      case "7d":
        cutoffDate = subDays(now, 7);
        break;
      case "4w":
        cutoffDate = subWeeks(now, 4);
        break;
      case "6m":
        cutoffDate = subMonths(now, 6);
        break;
      case "1y":
        cutoffDate = subYears(now, 1);
        break;
      case "all":
      default:
        return metrics;
    }

    return metrics.filter((metric) => 
      isAfter(new Date(metric.recorded_at), cutoffDate)
    );
  };

  const filteredMetrics = getFilteredMetrics();

  // Get latest metric for summary display
  const latestMetric = metrics?.[0];

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-accent" />
            Lichaamssamenstelling
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[60px]" />
        </CardContent>
      </Card>
    );
  }

  if (!metrics || metrics.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-accent" />
            Lichaamssamenstelling
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-4">
            Geen metingen beschikbaar. Voeg metingen toe om je progressie te volgen!
          </p>
        </CardContent>
      </Card>
    );
  }

  // Prepare data for chart (reverse to show oldest first)
  const chartData = [...filteredMetrics]
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
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CardHeader className="pb-2">
          <CollapsibleTrigger asChild>
            <div className="flex items-center justify-between cursor-pointer hover:bg-muted/50 -mx-2 px-2 py-1 rounded-lg transition-colors">
              <CardTitle className="flex items-center gap-2 text-base">
                <TrendingUp className="w-5 h-5 text-accent" />
                Lichaamssamenstelling
              </CardTitle>
              <div className="flex items-center gap-3">
                {latestMetric && (
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    {latestMetric.weight && (
                      <span>{latestMetric.weight} kg</span>
                    )}
                    {latestMetric.body_fat_percentage && (
                      <span>{latestMetric.body_fat_percentage}% vet</span>
                    )}
                    {latestMetric.muscle_mass && (
                      <span>{latestMetric.muscle_mass} kg spier</span>
                    )}
                  </div>
                )}
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  {isOpen ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          </CollapsibleTrigger>
        </CardHeader>
        
        <CollapsibleContent>
          <CardContent className="pt-2">
            {/* Time range toggle */}
            <div className="flex justify-center mb-4">
              <ToggleGroup 
                type="single" 
                value={timeRange} 
                onValueChange={(value) => value && setTimeRange(value as TimeRange)}
                className="bg-muted/50 p-1 rounded-lg"
              >
                {(Object.keys(timeRangeLabels) as TimeRange[]).map((range) => (
                  <ToggleGroupItem 
                    key={range} 
                    value={range}
                    className="text-xs px-3 py-1.5 data-[state=on]:bg-background data-[state=on]:shadow-sm"
                  >
                    {timeRangeLabels[range]}
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
            </div>

            {chartData.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                Geen data beschikbaar voor deze periode
              </p>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis 
                    dataKey="date" 
                    className="text-xs"
                    stroke="hsl(var(--muted-foreground))"
                    tick={{ fontSize: 11 }}
                  />
                  <YAxis 
                    className="text-xs"
                    stroke="hsl(var(--muted-foreground))"
                    tick={{ fontSize: 11 }}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend 
                    wrapperStyle={{ paddingTop: '16px' }}
                    iconType="line"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="weight" 
                    name="Gewicht"
                    stroke="hsl(var(--primary))" 
                    strokeWidth={2}
                    dot={{ fill: "hsl(var(--primary))", r: 3 }}
                    activeDot={{ r: 5 }}
                    connectNulls
                  />
                  <Line 
                    type="monotone" 
                    dataKey="bodyFat" 
                    name="Vetpercentage"
                    stroke="hsl(var(--accent))" 
                    strokeWidth={2}
                    dot={{ fill: "hsl(var(--accent))", r: 3 }}
                    activeDot={{ r: 5 }}
                    connectNulls
                  />
                  <Line 
                    type="monotone" 
                    dataKey="muscleMass" 
                    name="Spiermassa"
                    stroke="hsl(var(--chart-3))" 
                    strokeWidth={2}
                    dot={{ fill: "hsl(var(--chart-3))", r: 3 }}
                    activeDot={{ r: 5 }}
                    connectNulls
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
            
            {/* Stats summary */}
            {chartData.length > 1 && (
              <div className="mt-4 pt-4 border-t border-border">
                <p className="text-xs text-muted-foreground text-center">
                  {chartData.length} metingen in geselecteerde periode
                </p>
              </div>
            )}
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
};
