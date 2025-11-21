import { useAuth } from "@/contexts/AuthContext";
import { useDashboardStats } from "@/hooks/useDashboardStats";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Activity, TrendingUp, Flame, Trophy, Calendar, Dumbbell } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { BodyMetricsCard } from "@/components/dashboard/BodyMetricsCard";
import { OneRMCard } from "@/components/dashboard/OneRMCard";
import { BodyCompositionChart } from "@/components/dashboard/BodyCompositionChart";
import { WeightProgressChart } from "@/components/dashboard/WeightProgressChart";

const Dashboard = () => {
  const { user } = useAuth();
  const { data: stats, isLoading } = useDashboardStats(user?.id);

  if (isLoading) {
    return (
      <div className="container mx-auto p-4 space-y-6">
        <Skeleton className="h-12 w-64" />
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  const statCards = [
    {
      title: "Totaal Workouts",
      value: stats?.totalStats.total_workouts || 0,
      icon: Dumbbell,
      color: "text-primary",
    },
    {
      title: "Deze Week",
      value: stats?.thisWeekWorkouts || 0,
      icon: Calendar,
      color: "text-accent",
    },
    {
      title: "Deze Maand",
      value: stats?.thisMonthWorkouts || 0,
      icon: Activity,
      color: "text-secondary",
    },
    {
      title: "Totaal Volume",
      value: `${(stats?.totalStats.total_volume_kg || 0).toLocaleString()} kg`,
      icon: TrendingUp,
      color: "text-primary",
    },
    {
      title: "Huidige Streak",
      value: `${stats?.totalStats.current_streak || 0} dagen`,
      icon: Flame,
      color: "text-accent",
    },
    {
      title: "Personal Records",
      value: stats?.totalStats.total_prs || 0,
      icon: Trophy,
      color: "text-secondary",
    },
  ];

  return (
    <div className="container mx-auto p-4 pb-24 space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">KPI Dashboard</h1>
        <p className="text-muted-foreground">Jouw training statistieken en voortgang</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <Icon className={`w-4 h-4 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Body Metrics & 1RM Section */}
      <div className="grid md:grid-cols-2 gap-6">
        <BodyMetricsCard userId={user?.id || ''} />
        <OneRMCard userId={user?.id || ''} />
      </div>

      {/* Body Composition Progress Charts */}
      <WeightProgressChart userId={user?.id || ''} />
      <BodyCompositionChart userId={user?.id || ''} />

      {/* Weekly Volume Chart */}
      {stats?.weeklyVolumeData && stats.weeklyVolumeData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Volume per Week (kg)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={stats.weeklyVolumeData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis 
                  dataKey="week" 
                  className="text-xs"
                  stroke="hsl(var(--muted-foreground))"
                />
                <YAxis 
                  className="text-xs"
                  stroke="hsl(var(--muted-foreground))"
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                />
                <Bar 
                  dataKey="volume" 
                  fill="hsl(var(--primary))" 
                  radius={[8, 8, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Monthly Workouts Chart */}
      {stats?.monthlyWorkoutData && stats.monthlyWorkoutData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Workouts per Maand</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={stats.monthlyWorkoutData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis 
                  dataKey="month" 
                  className="text-xs"
                  stroke="hsl(var(--muted-foreground))"
                />
                <YAxis 
                  className="text-xs"
                  stroke="hsl(var(--muted-foreground))"
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                />
                <Line 
                  type="monotone" 
                  dataKey="workouts" 
                  stroke="hsl(var(--accent))" 
                  strokeWidth={3}
                  dot={{ fill: "hsl(var(--accent))", r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Recent PRs */}
      {stats?.recentPRs && stats.recentPRs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recente Personal Records</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.recentPRs.slice(0, 5).map((pr, index) => (
                <div 
                  key={index} 
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                >
                  <div className="flex items-center gap-3">
                    <Trophy className="w-5 h-5 text-accent" />
                    <div>
                      <p className="font-medium">{pr.exercise_name}</p>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(pr.completed_at), 'dd MMM yyyy')}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">{pr.weight} kg</p>
                    <p className="text-sm text-muted-foreground">{pr.reps} reps</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Dashboard;
