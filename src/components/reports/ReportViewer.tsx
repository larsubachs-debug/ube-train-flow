import { format } from "date-fns";
import { nl } from "date-fns/locale";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useReports, type UserReport, type ReportData } from "@/hooks/useReports";
import ubeLogo from "@/assets/ube-logo.png";
import {
  Dumbbell,
  Utensils,
  Scale,
  Heart,
  Download,
  Share2,
  Trash2,
  TrendingUp,
  TrendingDown,
  Minus,
  Activity,
  Flame,
  Target,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Cell,
  Tooltip,
} from "recharts";

interface ReportViewerProps {
  report: UserReport;
}

export function ReportViewer({ report }: ReportViewerProps) {
  const { deleteReport, toggleShareWithCoach } = useReports();
  const rawData = report.report_data as ReportData | null;

  // Safe date parsing helper
  const safeParseDate = (dateStr: string | null | undefined): Date => {
    if (!dateStr) return new Date();
    const parsed = new Date(dateStr);
    return isNaN(parsed.getTime()) ? new Date() : parsed;
  };

  // Mock data for preview when no real data exists
  const mockData: ReportData = {
    user: {
      name: "Demo Gebruiker",
    },
    period: {
      start: report.period_start || new Date().toISOString().split('T')[0],
      end: report.period_end || new Date().toISOString().split('T')[0],
      type: report.report_type,
      generatedAt: report.created_at || new Date().toISOString(),
    },
    training: {
      totalWorkouts: 12,
      totalVolume: 45820,
      averageRPE: 7.4,
      exerciseBreakdown: [
        { name: "Squat", sets: 24, volume: 12500 },
        { name: "Bench Press", sets: 20, volume: 9800 },
        { name: "Deadlift", sets: 16, volume: 14200 },
        { name: "Overhead Press", sets: 16, volume: 4200 },
        { name: "Barbell Row", sets: 18, volume: 5120 },
      ],
    },
    nutrition: {
      daysLogged: 21,
      averageCalories: 2450,
      averageProtein: 165,
      averageCarbs: 280,
      averageFat: 78,
    },
    body: {
      measurementsCount: 4,
      weightChange: -1.2,
      latestWeight: 82.5,
      latestBodyFat: 14.8,
    },
    wellness: {
      checkinsCompleted: 18,
      habitsCompleted: 42,
    },
  };

  // Use real data if available, otherwise use mock data
  const data = rawData && rawData.training?.totalWorkouts > 0 ? rawData : mockData;
  const isUsingMockData = !rawData || rawData.training?.totalWorkouts === 0;

  const handleDownloadPDF = () => {
    const content = `
VOORTGANGSRAPPORT - ${data.user.name}
${format(safeParseDate(data.period.start), "d MMMM yyyy", { locale: nl })} - ${format(safeParseDate(data.period.end), "d MMMM yyyy", { locale: nl })}

═══════════════════════════════════════════════════════════════

TRAINING OVERZICHT
───────────────────────────────────────────────────────────────
Workouts voltooid:     ${data.training.totalWorkouts}
Totaal volume:         ${data.training.totalVolume.toLocaleString()} kg
Gemiddelde RPE:        ${data.training.averageRPE}

Top Oefeningen:
${data.training.exerciseBreakdown.slice(0, 5).map((e, i) => `  ${i + 1}. ${e.name} - ${e.sets} sets, ${e.volume.toLocaleString()} kg`).join('\n')}

═══════════════════════════════════════════════════════════════

VOEDING (gemiddeld per dag)
───────────────────────────────────────────────────────────────
Dagen gelogd:          ${data.nutrition.daysLogged}
Calorieën:             ${data.nutrition.averageCalories} kcal
Eiwit:                 ${data.nutrition.averageProtein}g
Koolhydraten:          ${data.nutrition.averageCarbs}g
Vet:                   ${data.nutrition.averageFat}g

═══════════════════════════════════════════════════════════════

LICHAAMSMETINGEN
───────────────────────────────────────────────────────────────
Aantal metingen:       ${data.body.measurementsCount}
Gewichtsverandering:   ${data.body.weightChange !== null ? `${data.body.weightChange > 0 ? "+" : ""}${data.body.weightChange} kg` : "N/A"}
Huidig gewicht:        ${data.body.latestWeight ? `${data.body.latestWeight} kg` : "N/A"}
Vetpercentage:         ${data.body.latestBodyFat ? `${data.body.latestBodyFat}%` : "N/A"}

═══════════════════════════════════════════════════════════════

WELLNESS & HABITS
───────────────────────────────────────────────────────────────
Check-ins voltooid:    ${data.wellness.checkinsCompleted}
Habits voltooid:       ${data.wellness.habitsCompleted}

═══════════════════════════════════════════════════════════════

Gegenereerd op ${format(safeParseDate(data.period.generatedAt), "d MMMM yyyy 'om' HH:mm", { locale: nl })}
    `.trim();

    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `rapport-${report.report_type}-${report.period_start}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getReportTypeLabel = (type: string) => {
    switch (type) {
      case "week": return "WEEKLY";
      case "month": return "MONTHLY";
      case "year": return "YEARLY";
      case "program": return "PROGRAM";
      default: return "";
    }
  };

  const getInitials = (name: string) => {
    return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  };

  // Create chart data for exercise breakdown
  const exerciseChartData = data.training.exerciseBreakdown.slice(0, 6).map((ex) => ({
    name: ex.name.length > 12 ? ex.name.slice(0, 12) + "..." : ex.name,
    fullName: ex.name,
    volume: ex.volume,
    sets: ex.sets,
  }));

  // Create macro breakdown data
  const macroData = [
    { name: "Eiwit", value: data.nutrition.averageProtein, color: "hsl(var(--primary))" },
    { name: "Koolh.", value: data.nutrition.averageCarbs, color: "hsl(var(--chart-2))" },
    { name: "Vet", value: data.nutrition.averageFat, color: "hsl(var(--chart-3))" },
  ];

  return (
    <div className="space-y-0">
      {/* Demo Data Banner */}
      {isUsingMockData && (
        <div className="bg-amber-500/20 border border-amber-500/30 text-amber-200 px-4 py-3 rounded-t-xl text-sm text-center">
          📊 Dit is een voorbeeld rapport met demo data. Voeg trainingen, voeding en metingen toe om je echte resultaten te zien.
        </div>
      )}
      
      {/* Premium Header */}
      <div className={`bg-slate-900 text-white p-8 ${isUsingMockData ? '' : 'rounded-t-xl'}`}>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-6">
            <Avatar className="h-20 w-20 border-4 border-white/20">
              <AvatarFallback className="bg-primary text-primary-foreground text-xl">
                {getInitials(data.user.name)}
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                All About {data.user.name.split(' ')[0]}
              </h1>
              <p className="text-lg text-slate-400 mt-1">
                {getReportTypeLabel(report.report_type)} REPORT
              </p>
              <p className="text-base text-primary mt-2 font-medium">
                {format(safeParseDate(data.period.start), "MMMM yyyy", { locale: nl }).toUpperCase()}
              </p>
            </div>
          </div>
          <div className="flex flex-col items-end gap-4">
            <img src={ubeLogo} alt="U.be" className="h-10 w-auto invert" />
            <div className="flex gap-2">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={handleDownloadPDF}
              className="text-white hover:bg-white/10"
            >
              <Download className="h-5 w-5" />
            </Button>
            <Button
              variant={report.shared_with_coach ? "default" : "ghost"}
              size="icon"
              onClick={() => toggleShareWithCoach.mutate({ 
                reportId: report.id, 
                share: !report.shared_with_coach 
              })}
              className={report.shared_with_coach ? "" : "text-white hover:bg-white/10"}
            >
              <Share2 className="h-5 w-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => deleteReport.mutate(report.id)}
              className="text-white hover:bg-white/10"
            >
              <Trash2 className="h-5 w-5" />
            </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Overview Row */}
      <div className="bg-slate-800 text-white p-6 grid grid-cols-4 gap-4">
        <div className="text-center">
          <p className="text-3xl font-bold">{data.training.totalWorkouts}</p>
          <p className="text-xs text-slate-400 uppercase tracking-wider">Workouts</p>
        </div>
        <div className="text-center border-l border-slate-700">
          <p className="text-3xl font-bold">{(data.training.totalVolume / 1000).toFixed(1)}k</p>
          <p className="text-xs text-slate-400 uppercase tracking-wider">Volume (kg)</p>
        </div>
        <div className="text-center border-l border-slate-700">
          <p className="text-3xl font-bold">{data.nutrition.averageCalories}</p>
          <p className="text-xs text-slate-400 uppercase tracking-wider">Avg Kcal</p>
        </div>
        <div className="text-center border-l border-slate-700">
          <div className="flex items-center justify-center gap-1">
            {data.body.weightChange !== null ? (
              <>
                {data.body.weightChange > 0 ? (
                  <TrendingUp className="h-5 w-5 text-orange-400" />
                ) : data.body.weightChange < 0 ? (
                  <TrendingDown className="h-5 w-5 text-green-400" />
                ) : (
                  <Minus className="h-5 w-5" />
                )}
                <p className="text-3xl font-bold">
                  {data.body.weightChange > 0 ? "+" : ""}{data.body.weightChange}
                </p>
              </>
            ) : (
              <p className="text-3xl font-bold">-</p>
            )}
          </div>
          <p className="text-xs text-slate-400 uppercase tracking-wider">Gewicht (kg)</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="bg-background rounded-b-xl border border-t-0 p-6 space-y-6">
        
        {/* Training Breakdown Section */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Dumbbell className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-bold uppercase tracking-wide">Training Breakdown</h3>
          </div>
          <p className="text-sm text-muted-foreground mb-6">
            Overzicht van je training volume per oefening deze periode. De grafiek toont je top oefeningen gerangschikt op totaal volume.
          </p>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Exercise Volume Chart */}
            <Card className="border-0 shadow-sm bg-muted/30">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                  Volume per Oefening
                </CardTitle>
              </CardHeader>
              <CardContent>
                {exerciseChartData.length > 0 ? (
                  <div className="h-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={exerciseChartData} layout="vertical">
                        <XAxis type="number" hide />
                        <YAxis 
                          type="category" 
                          dataKey="name" 
                          width={100}
                          tick={{ fontSize: 11 }}
                          axisLine={false}
                          tickLine={false}
                        />
                        <Tooltip 
                          formatter={(value: number) => [`${value.toLocaleString()} kg`, "Volume"]}
                          labelFormatter={(label) => {
                            const item = exerciseChartData.find(d => d.name === label);
                            return item?.fullName || label;
                          }}
                        />
                        <Bar dataKey="volume" radius={[0, 4, 4, 0]}>
                          {exerciseChartData.map((_, index) => (
                            <Cell 
                              key={`cell-${index}`} 
                              fill={index === 0 ? "hsl(var(--primary))" : "hsl(var(--primary) / 0.6)"}
                            />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    Geen oefeningen gelogd
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Training Stats Cards */}
            <div className="grid grid-cols-2 gap-4">
              <Card className="border-0 shadow-sm bg-muted/30">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2 mb-2">
                    <Activity className="h-4 w-4 text-primary" />
                    <span className="text-xs text-muted-foreground uppercase">Totaal Sets</span>
                  </div>
                  <p className="text-3xl font-bold">
                    {data.training.exerciseBreakdown.reduce((sum, e) => sum + e.sets, 0)}
                  </p>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-sm bg-muted/30">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2 mb-2">
                    <Target className="h-4 w-4 text-primary" />
                    <span className="text-xs text-muted-foreground uppercase">Gem. RPE</span>
                  </div>
                  <p className="text-3xl font-bold">{data.training.averageRPE || "-"}</p>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-sm bg-muted/30">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2 mb-2">
                    <Dumbbell className="h-4 w-4 text-primary" />
                    <span className="text-xs text-muted-foreground uppercase">Oefeningen</span>
                  </div>
                  <p className="text-3xl font-bold">{data.training.exerciseBreakdown.length}</p>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-sm bg-muted/30">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2 mb-2">
                    <Flame className="h-4 w-4 text-primary" />
                    <span className="text-xs text-muted-foreground uppercase">Per Workout</span>
                  </div>
                  <p className="text-3xl font-bold">
                    {data.training.totalWorkouts > 0 
                      ? Math.round(data.training.totalVolume / data.training.totalWorkouts).toLocaleString()
                      : "-"
                    }
                    <span className="text-sm font-normal text-muted-foreground ml-1">kg</span>
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        <Separator />

        {/* Nutrition Section */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Utensils className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-bold uppercase tracking-wide">Voeding Analyse</h3>
          </div>
          <p className="text-sm text-muted-foreground mb-6">
            Gemiddelde dagelijkse inname gebaseerd op {data.nutrition.daysLogged} gelogde dagen.
          </p>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Macro Chart */}
            <Card className="border-0 shadow-sm bg-muted/30">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                  Macro Verdeling (gemiddeld/dag)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={macroData}>
                      <XAxis 
                        dataKey="name" 
                        axisLine={false} 
                        tickLine={false}
                        tick={{ fontSize: 12 }}
                      />
                      <YAxis hide />
                      <Tooltip formatter={(value: number) => [`${value}g`, "Gram"]} />
                      <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                        {macroData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                {/* Legend */}
                <div className="flex justify-center gap-4 mt-4">
                  {macroData.map((macro) => (
                    <div key={macro.name} className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-sm" 
                        style={{ backgroundColor: macro.color }}
                      />
                      <span className="text-xs text-muted-foreground">
                        {macro.name}: {macro.value}g
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Nutrition Stats */}
            <div className="space-y-4">
              <Card className="border-0 shadow-sm bg-muted/30">
                <CardContent className="py-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground uppercase">Gemiddelde Calorieën</p>
                      <p className="text-2xl font-bold">{data.nutrition.averageCalories} <span className="text-sm font-normal">kcal</span></p>
                    </div>
                    <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <Flame className="h-6 w-6 text-primary" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="grid grid-cols-3 gap-3">
                <Card className="border-0 shadow-sm bg-primary/10">
                  <CardContent className="py-4 text-center">
                    <p className="text-2xl font-bold">{data.nutrition.averageProtein}g</p>
                    <p className="text-xs text-muted-foreground">Eiwit</p>
                  </CardContent>
                </Card>
                <Card className="border-0 shadow-sm bg-chart-2/10">
                  <CardContent className="py-4 text-center">
                    <p className="text-2xl font-bold">{data.nutrition.averageCarbs}g</p>
                    <p className="text-xs text-muted-foreground">Koolhydraten</p>
                  </CardContent>
                </Card>
                <Card className="border-0 shadow-sm bg-chart-3/10">
                  <CardContent className="py-4 text-center">
                    <p className="text-2xl font-bold">{data.nutrition.averageFat}g</p>
                    <p className="text-xs text-muted-foreground">Vet</p>
                  </CardContent>
                </Card>
              </div>

              <Card className="border-0 shadow-sm bg-muted/30">
                <CardContent className="py-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Dagen gelogd</span>
                    <span className="font-bold">{data.nutrition.daysLogged}</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        <Separator />

        {/* Body & Wellness Section */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Body Stats */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <Scale className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-bold uppercase tracking-wide">Lichaamsmetingen</h3>
            </div>
            
            <Card className="border-0 shadow-sm bg-muted/30">
              <CardContent className="py-6 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Aantal metingen</span>
                  <span className="text-xl font-bold">{data.body.measurementsCount}</span>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Huidig gewicht</span>
                  <span className="text-xl font-bold">
                    {data.body.latestWeight ? `${data.body.latestWeight} kg` : "-"}
                  </span>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Gewichtsverandering</span>
                  <div className="flex items-center gap-2">
                    {data.body.weightChange !== null ? (
                      <>
                        {data.body.weightChange > 0 ? (
                          <TrendingUp className="h-4 w-4 text-orange-500" />
                        ) : data.body.weightChange < 0 ? (
                          <TrendingDown className="h-4 w-4 text-green-500" />
                        ) : (
                          <Minus className="h-4 w-4" />
                        )}
                        <span className="text-xl font-bold">
                          {data.body.weightChange > 0 ? "+" : ""}{data.body.weightChange} kg
                        </span>
                      </>
                    ) : (
                      <span className="text-xl font-bold">-</span>
                    )}
                  </div>
                </div>
                {data.body.latestBodyFat && (
                  <>
                    <Separator />
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Vetpercentage</span>
                      <span className="text-xl font-bold">{data.body.latestBodyFat}%</span>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </section>

          {/* Wellness Stats */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <Heart className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-bold uppercase tracking-wide">Wellness & Habits</h3>
            </div>
            
            <Card className="border-0 shadow-sm bg-muted/30">
              <CardContent className="py-6">
                <div className="grid grid-cols-2 gap-6">
                  <div className="text-center">
                    <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                      <Heart className="h-8 w-8 text-primary" />
                    </div>
                    <p className="text-3xl font-bold">{data.wellness.checkinsCompleted}</p>
                    <p className="text-xs text-muted-foreground uppercase mt-1">Check-ins</p>
                  </div>
                  <div className="text-center">
                    <div className="h-16 w-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-3">
                      <Target className="h-8 w-8 text-green-500" />
                    </div>
                    <p className="text-3xl font-bold">{data.wellness.habitsCompleted}</p>
                    <p className="text-xs text-muted-foreground uppercase mt-1">Habits Voltooid</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>
        </div>

        {/* Footer */}
        <div className="pt-6 border-t">
          <p className="text-xs text-center text-muted-foreground">
            Rapport gegenereerd op {format(new Date(data.period.generatedAt), "d MMMM yyyy 'om' HH:mm", { locale: nl })}
          </p>
        </div>
      </div>
    </div>
  );
}
