import { useState, useEffect, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";
import { format, subDays, startOfDay, endOfDay } from "date-fns";
import { nl } from "date-fns/locale";
import { AlertTriangle, TrendingUp, TrendingDown, Activity, Zap, Battery, BatteryWarning } from "lucide-react";

interface FatigueManagementProps {
  daysToShow?: number;
}

export const FatigueManagement = ({ daysToShow = 30 }: FatigueManagementProps) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [workoutData, setWorkoutData] = useState<any[]>([]);

  useEffect(() => {
    const fetchWorkoutData = async () => {
      if (!user) return;

      const startDate = format(subDays(new Date(), daysToShow), "yyyy-MM-dd");
      
      const { data, error } = await supabase
        .from("workout_sets")
        .select("exercise_name, rpe, weight, reps, completed_at")
        .eq("user_id", user.id)
        .gte("completed_at", startDate)
        .not("rpe", "is", null)
        .order("completed_at", { ascending: true });

      if (!error && data) {
        setWorkoutData(data);
      }
      setLoading(false);
    };

    fetchWorkoutData();
  }, [user, daysToShow]);

  const fatigueData = useMemo(() => {
    // Group by day and calculate daily average RPE
    const dailyData: Record<string, { rpes: number[]; volume: number }> = {};
    
    workoutData.forEach((set) => {
      const day = format(new Date(set.completed_at), "yyyy-MM-dd");
      if (!dailyData[day]) {
        dailyData[day] = { rpes: [], volume: 0 };
      }
      if (set.rpe) {
        dailyData[day].rpes.push(set.rpe);
      }
      dailyData[day].volume += (set.weight || 0) * (set.reps || 0);
    });

    // Create chart data
    const chartData = Object.entries(dailyData)
      .map(([date, data]) => ({
        date: format(new Date(date), "d MMM", { locale: nl }),
        fullDate: date,
        avgRpe: data.rpes.length > 0
          ? Math.round((data.rpes.reduce((a, b) => a + b, 0) / data.rpes.length) * 10) / 10
          : null,
        volume: data.volume,
        setsCount: data.rpes.length,
      }))
      .filter((d) => d.avgRpe !== null)
      .sort((a, b) => a.fullDate.localeCompare(b.fullDate));

    // Calculate rolling 7-day average for fatigue trend
    const rollingAvg = chartData.map((day, idx) => {
      const start = Math.max(0, idx - 6);
      const subset = chartData.slice(start, idx + 1);
      const avg = subset.reduce((sum, d) => sum + (d.avgRpe || 0), 0) / subset.length;
      return { ...day, rollingAvg: Math.round(avg * 10) / 10 };
    });

    // Detect overtraining signals
    const recentDays = rollingAvg.slice(-7);
    const avgRecentRpe = recentDays.reduce((sum, d) => sum + (d.avgRpe || 0), 0) / recentDays.length;
    const previousDays = rollingAvg.slice(-14, -7);
    const avgPreviousRpe = previousDays.reduce((sum, d) => sum + (d.avgRpe || 0), 0) / (previousDays.length || 1);
    
    const rpeChange = avgRecentRpe - avgPreviousRpe;
    const isOvertraining = avgRecentRpe >= 8.5 || (rpeChange > 1 && avgRecentRpe >= 7.5);
    const isUndertraining = avgRecentRpe <= 5.5 && recentDays.length >= 3;
    const isOptimal = avgRecentRpe >= 6 && avgRecentRpe <= 8;

    // Calculate fatigue score (0-100)
    const fatigueScore = Math.min(100, Math.max(0, Math.round(
      avgRecentRpe > 0 ? ((10 - avgRecentRpe) / 10) * 100 : 100
    )));

    // Weekly trend
    const weeklyTrend = rpeChange > 0.5 ? "increasing" : rpeChange < -0.5 ? "decreasing" : "stable";

    return {
      chartData: rollingAvg,
      avgRecentRpe: Math.round(avgRecentRpe * 10) / 10,
      avgPreviousRpe: Math.round(avgPreviousRpe * 10) / 10,
      isOvertraining,
      isUndertraining,
      isOptimal,
      fatigueScore,
      weeklyTrend,
      totalSets: workoutData.length,
      highRpeSets: workoutData.filter((s) => s.rpe >= 9).length,
    };
  }, [workoutData]);

  const getFatigueIcon = () => {
    if (fatigueData.isOvertraining) return <BatteryWarning className="h-5 w-5 text-red-500" />;
    if (fatigueData.isUndertraining) return <Battery className="h-5 w-5 text-amber-500" />;
    if (fatigueData.isOptimal) return <Zap className="h-5 w-5 text-emerald-500" />;
    return <Activity className="h-5 w-5 text-muted-foreground" />;
  };

  const getFatigueStatus = () => {
    if (fatigueData.isOvertraining) return { label: "Mogelijke overtraining", color: "text-red-600", bg: "bg-red-100 dark:bg-red-900/30" };
    if (fatigueData.isUndertraining) return { label: "Laag belast", color: "text-amber-600", bg: "bg-amber-100 dark:bg-amber-900/30" };
    if (fatigueData.isOptimal) return { label: "Optimale belasting", color: "text-emerald-600", bg: "bg-emerald-100 dark:bg-emerald-900/30" };
    return { label: "Onbekend", color: "text-muted-foreground", bg: "bg-muted" };
  };

  if (loading) {
    return (
      <Card className="p-6">
        <Skeleton className="h-8 w-48 mb-4" />
        <Skeleton className="h-[300px] w-full" />
      </Card>
    );
  }

  const status = getFatigueStatus();

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold">Fatigue Management</h3>
          <p className="text-sm text-muted-foreground">
            RPE trends om overtraining te detecteren
          </p>
        </div>
        <Badge variant="outline">Laatste {daysToShow} dagen</Badge>
      </div>

      {/* Status Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className={`rounded-lg p-4 ${status.bg}`}>
          <div className="flex items-center gap-2 mb-2">
            {getFatigueIcon()}
            <span className="text-sm font-medium">Status</span>
          </div>
          <p className={`text-lg font-bold ${status.color}`}>{status.label}</p>
        </div>
        
        <div className="bg-muted/30 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Activity className="h-5 w-5 text-primary" />
            <span className="text-sm font-medium">Gem. RPE</span>
          </div>
          <p className="text-lg font-bold">{fatigueData.avgRecentRpe || "-"}</p>
          <p className="text-xs text-muted-foreground">Laatste 7 dagen</p>
        </div>

        <div className="bg-muted/30 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            {fatigueData.weeklyTrend === "increasing" ? (
              <TrendingUp className="h-5 w-5 text-red-500" />
            ) : fatigueData.weeklyTrend === "decreasing" ? (
              <TrendingDown className="h-5 w-5 text-emerald-500" />
            ) : (
              <Activity className="h-5 w-5 text-amber-500" />
            )}
            <span className="text-sm font-medium">Trend</span>
          </div>
          <p className="text-lg font-bold capitalize">
            {fatigueData.weeklyTrend === "increasing" ? "Stijgend" : 
             fatigueData.weeklyTrend === "decreasing" ? "Dalend" : "Stabiel"}
          </p>
        </div>

        <div className="bg-muted/30 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            <span className="text-sm font-medium">Hoge RPE</span>
          </div>
          <p className="text-lg font-bold">{fatigueData.highRpeSets}</p>
          <p className="text-xs text-muted-foreground">Sets met RPE ≥9</p>
        </div>
      </div>

      {/* Warning Alert */}
      {fatigueData.isOvertraining && (
        <Alert variant="destructive" className="mb-6">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Overtraining signaal gedetecteerd</AlertTitle>
          <AlertDescription>
            Je gemiddelde RPE is hoog ({fatigueData.avgRecentRpe}). Overweeg een deload week 
            of extra rustdagen om herstel te bevorderen.
          </AlertDescription>
        </Alert>
      )}

      {/* RPE Trend Chart */}
      {fatigueData.chartData.length > 0 ? (
        <div className="h-[250px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={fatigueData.chartData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 11 }}
                className="text-muted-foreground"
              />
              <YAxis 
                domain={[1, 10]}
                tick={{ fontSize: 11 }}
                className="text-muted-foreground"
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--background))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                }}
                formatter={(value: number, name: string) => [
                  value.toFixed(1),
                  name === "avgRpe" ? "Dag RPE" : "7-daags gemiddelde",
                ]}
              />
              {/* Optimal zone */}
              <ReferenceLine y={6} stroke="#22c55e" strokeDasharray="3 3" opacity={0.5} />
              <ReferenceLine y={8} stroke="#22c55e" strokeDasharray="3 3" opacity={0.5} />
              {/* Danger zone */}
              <ReferenceLine y={8.5} stroke="#ef4444" strokeDasharray="3 3" opacity={0.5} />
              
              <Line
                type="monotone"
                dataKey="avgRpe"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                dot={{ fill: "hsl(var(--primary))", strokeWidth: 0, r: 3 }}
                name="avgRpe"
              />
              <Line
                type="monotone"
                dataKey="rollingAvg"
                stroke="#f97316"
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={false}
                name="rollingAvg"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="text-center py-12 text-muted-foreground">
          <Activity className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <p>Nog geen RPE data beschikbaar</p>
          <p className="text-sm">Log RPE bij je sets om fatigue te monitoren</p>
        </div>
      )}

      {/* Legend */}
      {fatigueData.chartData.length > 0 && (
        <div className="mt-4 flex items-center justify-center gap-6 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-0.5 bg-primary" />
            <span className="text-muted-foreground">Dagelijks RPE</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-0.5 bg-orange-500" style={{ borderTop: "2px dashed" }} />
            <span className="text-muted-foreground">7-daags gemiddelde</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-2 bg-emerald-500/20 border border-emerald-500 rounded" />
            <span className="text-muted-foreground">Optimale zone (6-8)</span>
          </div>
        </div>
      )}
    </Card>
  );
};
