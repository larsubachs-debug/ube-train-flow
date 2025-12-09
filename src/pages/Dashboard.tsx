import { useAuth } from "@/contexts/AuthContext";
import { useDashboardStats } from "@/hooks/useDashboardStats";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Activity, TrendingUp, Flame, Trophy, Calendar, Dumbbell } from "lucide-react";
import { format } from "date-fns";
import { BodyMetricsCard } from "@/components/dashboard/BodyMetricsCard";
import { OneRMCard } from "@/components/dashboard/OneRMCard";
import { BodyCompositionChart } from "@/components/dashboard/BodyCompositionChart";
import { WeightProgressChart } from "@/components/dashboard/WeightProgressChart";
import { ProgressPhotosComparison } from "@/components/dashboard/ProgressPhotosComparison";
import { BodyMetricsTimeline } from "@/components/dashboard/BodyMetricsTimeline";
import { useTranslation } from "react-i18next";
import { DashboardSkeleton } from "@/components/skeletons/DashboardSkeleton";

const Dashboard = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { data: stats, isLoading } = useDashboardStats(user?.id);

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  const statCards = [
    {
      titleKey: "dashboard.totalWorkouts",
      value: stats?.totalStats.total_workouts || 0,
      icon: Dumbbell,
      color: "text-primary",
    },
    {
      titleKey: "dashboard.thisWeek",
      value: stats?.thisWeekWorkouts || 0,
      icon: Calendar,
      color: "text-accent",
    },
    {
      titleKey: "dashboard.thisMonth",
      value: stats?.thisMonthWorkouts || 0,
      icon: Activity,
      color: "text-secondary",
    },
    {
      titleKey: "dashboard.totalVolume",
      value: `${(stats?.totalStats.total_volume_kg || 0).toLocaleString()} kg`,
      icon: TrendingUp,
      color: "text-primary",
    },
    {
      titleKey: "dashboard.currentStreak",
      value: `${stats?.totalStats.current_streak || 0} ${t('dashboard.days')}`,
      icon: Flame,
      color: "text-accent",
    },
    {
      titleKey: "dashboard.personalRecords",
      value: stats?.totalStats.total_prs || 0,
      icon: Trophy,
      color: "text-secondary",
    },
  ];

  return (
    <div className="container mx-auto px-3 sm:px-4 pb-24 pt-2 space-y-4 sm:space-y-6">
      {/* Header - meer compact op mobiel */}
      <div className="pt-2">
        <h1 className="text-xl sm:text-3xl font-bold mb-1">{t('dashboard.title')}</h1>
        <p className="text-sm sm:text-base text-muted-foreground">{t('dashboard.subtitle')}</p>
      </div>

      {/* Stats Grid - 2 kolommen op mobiel, compacter */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-4">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.titleKey} className="overflow-hidden">
              <CardHeader className="flex flex-row items-center justify-between p-3 sm:pb-2 sm:pt-4 sm:px-6 space-y-0">
                <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground line-clamp-1">
                  {t(stat.titleKey)}
                </CardTitle>
                <Icon className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${stat.color} flex-shrink-0`} />
              </CardHeader>
              <CardContent className="p-3 pt-0 sm:px-6 sm:pb-4">
                <div className="text-lg sm:text-2xl font-bold truncate">{stat.value}</div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Body Metrics & 1RM Section - stack op mobiel */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        <BodyMetricsCard userId={user?.id || ''} />
        <OneRMCard userId={user?.id || ''} />
      </div>

      {/* Body Composition Progress Charts */}
      <WeightProgressChart userId={user?.id || ''} />
      <BodyCompositionChart userId={user?.id || ''} />

      {/* Progress Photos */}
      <ProgressPhotosComparison userId={user?.id || ''} />

      {/* Timeline Section */}
      <BodyMetricsTimeline userId={user?.id || ''} />

      {/* Weekly Volume Chart - kortere hoogte op mobiel */}
      {stats?.weeklyVolumeData && stats.weeklyVolumeData.length > 0 && (
        <Card>
          <CardHeader className="p-3 sm:p-6">
            <CardTitle className="text-base sm:text-lg">{t('dashboard.volumePerWeek')}</CardTitle>
          </CardHeader>
          <CardContent className="p-2 sm:p-6 pt-0">
            <ResponsiveContainer width="100%" height={200} className="sm:!h-[300px]">
              <BarChart data={stats.weeklyVolumeData} margin={{ left: -20, right: 5 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis 
                  dataKey="week" 
                  className="text-[10px] sm:text-xs"
                  stroke="hsl(var(--muted-foreground))"
                  tick={{ fontSize: 10 }}
                />
                <YAxis 
                  className="text-[10px] sm:text-xs"
                  stroke="hsl(var(--muted-foreground))"
                  tick={{ fontSize: 10 }}
                  width={40}
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                    fontSize: "12px",
                  }}
                />
                <Bar 
                  dataKey="volume" 
                  fill="hsl(var(--primary))" 
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Monthly Workouts Chart - kortere hoogte op mobiel */}
      {stats?.monthlyWorkoutData && stats.monthlyWorkoutData.length > 0 && (
        <Card>
          <CardHeader className="p-3 sm:p-6">
            <CardTitle className="text-base sm:text-lg">{t('dashboard.workoutsPerMonth')}</CardTitle>
          </CardHeader>
          <CardContent className="p-2 sm:p-6 pt-0">
            <ResponsiveContainer width="100%" height={200} className="sm:!h-[300px]">
              <LineChart data={stats.monthlyWorkoutData} margin={{ left: -20, right: 5 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis 
                  dataKey="month" 
                  className="text-[10px] sm:text-xs"
                  stroke="hsl(var(--muted-foreground))"
                  tick={{ fontSize: 10 }}
                />
                <YAxis 
                  className="text-[10px] sm:text-xs"
                  stroke="hsl(var(--muted-foreground))"
                  tick={{ fontSize: 10 }}
                  width={30}
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                    fontSize: "12px",
                  }}
                />
                <Line 
                  type="monotone" 
                  dataKey="workouts" 
                  stroke="hsl(var(--accent))" 
                  strokeWidth={2}
                  dot={{ fill: "hsl(var(--accent))", r: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Recent PRs - compacter op mobiel */}
      {stats?.recentPRs && stats.recentPRs.length > 0 && (
        <Card>
          <CardHeader className="p-3 sm:p-6">
            <CardTitle className="text-base sm:text-lg">{t('dashboard.recentPRs')}</CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0 sm:p-6 sm:pt-0">
            <div className="space-y-2 sm:space-y-3">
              {stats.recentPRs.slice(0, 5).map((pr, index) => (
                <div 
                  key={index} 
                  className="flex items-center justify-between p-2 sm:p-3 rounded-lg bg-muted/50"
                >
                  <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                    <Trophy className="w-4 h-4 sm:w-5 sm:h-5 text-accent flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="font-medium text-sm sm:text-base truncate">{pr.exercise_name}</p>
                      <p className="text-xs sm:text-sm text-muted-foreground">
                        {format(new Date(pr.completed_at), 'dd MMM yyyy')}
                      </p>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0 ml-2">
                    <p className="font-bold text-sm sm:text-base">{pr.weight} kg</p>
                    <p className="text-xs sm:text-sm text-muted-foreground">{pr.reps} reps</p>
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
