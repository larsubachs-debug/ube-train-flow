import { format } from "date-fns";
import { nl } from "date-fns/locale";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { useReports, type UserReport, type ReportData } from "@/hooks/useReports";
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
} from "lucide-react";

interface ReportViewerProps {
  report: UserReport;
}

export function ReportViewer({ report }: ReportViewerProps) {
  const { deleteReport, toggleShareWithCoach } = useReports();
  const data = report.report_data as ReportData | null;

  if (!data) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          Geen data beschikbaar voor dit rapport
        </CardContent>
      </Card>
    );
  }

  const handleDownloadPDF = () => {
    // Create a simple text version for now
    const content = `
VOORTGANGSRAPPORT
${data.user.name}
${format(new Date(data.period.start), "d MMMM yyyy", { locale: nl })} - ${format(new Date(data.period.end), "d MMMM yyyy", { locale: nl })}

TRAINING
- Workouts voltooid: ${data.training.totalWorkouts}
- Totaal volume: ${data.training.totalVolume.toLocaleString()} kg
- Gemiddelde RPE: ${data.training.averageRPE}

VOEDING (gemiddeld per dag)
- Calorieën: ${data.nutrition.averageCalories} kcal
- Eiwit: ${data.nutrition.averageProtein}g
- Koolhydraten: ${data.nutrition.averageCarbs}g
- Vet: ${data.nutrition.averageFat}g

LICHAAM
- Metingen: ${data.body.measurementsCount}
- Gewichtsverandering: ${data.body.weightChange !== null ? `${data.body.weightChange > 0 ? "+" : ""}${data.body.weightChange} kg` : "N/A"}
- Huidig gewicht: ${data.body.latestWeight ? `${data.body.latestWeight} kg` : "N/A"}

WELLNESS
- Check-ins voltooid: ${data.wellness.checkinsCompleted}
- Habits voltooid: ${data.wellness.habitsCompleted}
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
      case "week": return "Weekrapport";
      case "month": return "Maandrapport";
      case "year": return "Jaarrapport";
      case "program": return "Programmarapport";
      default: return "Rapport";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div>
              <Badge className="mb-2">{getReportTypeLabel(report.report_type)}</Badge>
              <CardTitle className="text-xl">{data.user.name}</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                {format(new Date(data.period.start), "d MMMM", { locale: nl })} - {format(new Date(data.period.end), "d MMMM yyyy", { locale: nl })}
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="icon" onClick={handleDownloadPDF}>
                <Download className="h-4 w-4" />
              </Button>
              <Button
                variant={report.shared_with_coach ? "default" : "outline"}
                size="icon"
                onClick={() => toggleShareWithCoach.mutate({ 
                  reportId: report.id, 
                  share: !report.shared_with_coach 
                })}
              >
                <Share2 className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => deleteReport.mutate(report.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Training Stats */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Dumbbell className="h-5 w-5" />
            Training
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold">{data.training.totalWorkouts}</p>
              <p className="text-xs text-muted-foreground">Workouts</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold">{data.training.totalVolume.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">Volume (kg)</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold">{data.training.averageRPE || "-"}</p>
              <p className="text-xs text-muted-foreground">Gem. RPE</p>
            </div>
          </div>

          {data.training.exerciseBreakdown.length > 0 && (
            <>
              <Separator />
              <div>
                <p className="text-sm font-medium mb-3">Top oefeningen</p>
                <div className="space-y-2">
                  {data.training.exerciseBreakdown.slice(0, 5).map((exercise, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <span className="text-sm truncate flex-1">{exercise.name}</span>
                      <Badge variant="secondary" className="ml-2">
                        {exercise.sets} sets • {exercise.volume.toLocaleString()} kg
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Nutrition Stats */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Utensils className="h-5 w-5" />
            Voeding
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Dagen gelogd</p>
              <p className="text-xl font-bold">{data.nutrition.daysLogged}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Gem. calorieën</p>
              <p className="text-xl font-bold">{data.nutrition.averageCalories} kcal</p>
            </div>
          </div>

          <Separator />

          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Eiwit</span>
                <span className="font-medium">{data.nutrition.averageProtein}g</span>
              </div>
              <Progress value={Math.min((data.nutrition.averageProtein / 150) * 100, 100)} className="h-2" />
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Koolhydraten</span>
                <span className="font-medium">{data.nutrition.averageCarbs}g</span>
              </div>
              <Progress value={Math.min((data.nutrition.averageCarbs / 250) * 100, 100)} className="h-2" />
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Vet</span>
                <span className="font-medium">{data.nutrition.averageFat}g</span>
              </div>
              <Progress value={Math.min((data.nutrition.averageFat / 80) * 100, 100)} className="h-2" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Body Stats */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Scale className="h-5 w-5" />
            Lichaam
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold">{data.body.measurementsCount}</p>
              <p className="text-xs text-muted-foreground">Metingen</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-1">
                {data.body.weightChange !== null ? (
                  <>
                    {data.body.weightChange > 0 ? (
                      <TrendingUp className="h-4 w-4 text-orange-500" />
                    ) : data.body.weightChange < 0 ? (
                      <TrendingDown className="h-4 w-4 text-green-500" />
                    ) : (
                      <Minus className="h-4 w-4 text-muted-foreground" />
                    )}
                    <p className="text-2xl font-bold">
                      {data.body.weightChange > 0 ? "+" : ""}{data.body.weightChange}
                    </p>
                  </>
                ) : (
                  <p className="text-2xl font-bold">-</p>
                )}
              </div>
              <p className="text-xs text-muted-foreground">kg verschil</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold">
                {data.body.latestWeight ? data.body.latestWeight : "-"}
              </p>
              <p className="text-xs text-muted-foreground">Huidig (kg)</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Wellness Stats */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Heart className="h-5 w-5" />
            Wellness
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold">{data.wellness.checkinsCompleted}</p>
              <p className="text-xs text-muted-foreground">Check-ins voltooid</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold">{data.wellness.habitsCompleted}</p>
              <p className="text-xs text-muted-foreground">Habits voltooid</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Generated info */}
      <p className="text-xs text-center text-muted-foreground">
        Gegenereerd op {format(new Date(data.period.generatedAt), "d MMMM yyyy 'om' HH:mm", { locale: nl })}
      </p>
    </div>
  );
}
