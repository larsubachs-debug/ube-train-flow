import { useState, useEffect } from "react";
import { format, subDays, subMonths, subYears, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear } from "date-fns";
import { nl } from "date-fns/locale";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import BottomNav from "@/components/BottomNav";
import TopNav from "@/components/TopNav";
import { ReportViewer } from "@/components/reports/ReportViewer";
import { ReportsList } from "@/components/reports/ReportsList";
import { useReports, type UserReport } from "@/hooks/useReports";
import { 
  FileText, 
  Calendar, 
  ChevronLeft, 
  Download, 
  Share2,
  BarChart3,
  Loader2
} from "lucide-react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";

type ReportType = "week" | "month" | "year";

const Reports = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"generate" | "history">("generate");
  const [reportType, setReportType] = useState<ReportType>("week");
  const [selectedPeriod, setSelectedPeriod] = useState("current");
  const [shareWithCoach, setShareWithCoach] = useState(false);
  const [selectedReport, setSelectedReport] = useState<UserReport | null>(null);
  const [autoGenerating, setAutoGenerating] = useState(false);

  const { reports, isLoading, generateReport } = useReports();

  // Auto-generate report from URL params
  useEffect(() => {
    const urlType = searchParams.get("type") as ReportType | null;
    const urlStart = searchParams.get("start");
    const urlEnd = searchParams.get("end");

    if (urlType && urlStart && urlEnd && !autoGenerating) {
      setAutoGenerating(true);
      
      // Check if report already exists for this period
      const existingReport = reports?.find(
        r => r.report_type === urlType && 
             r.period_start === urlStart && 
             r.period_end === urlEnd &&
             r.status === "completed"
      );

      if (existingReport) {
        setSelectedReport(existingReport);
        navigate("/reports", { replace: true });
      } else {
        // Generate the report
        generateReport.mutate({
          reportType: urlType,
          periodStart: urlStart,
          periodEnd: urlEnd,
          shareWithCoach: false,
        }, {
          onSuccess: (newReport) => {
            if (newReport) {
              setSelectedReport(newReport);
            }
            navigate("/reports", { replace: true });
          },
          onError: () => {
            navigate("/reports", { replace: true });
          }
        });
      }
    }
  }, [searchParams, reports, autoGenerating, generateReport, navigate]);

  const getPeriodDates = () => {
    const now = new Date();
    
    if (reportType === "week") {
      if (selectedPeriod === "current") {
        return {
          start: format(startOfWeek(now, { weekStartsOn: 1 }), "yyyy-MM-dd"),
          end: format(endOfWeek(now, { weekStartsOn: 1 }), "yyyy-MM-dd"),
        };
      } else {
        const weeksAgo = parseInt(selectedPeriod);
        const targetDate = subDays(now, weeksAgo * 7);
        return {
          start: format(startOfWeek(targetDate, { weekStartsOn: 1 }), "yyyy-MM-dd"),
          end: format(endOfWeek(targetDate, { weekStartsOn: 1 }), "yyyy-MM-dd"),
        };
      }
    } else if (reportType === "month") {
      if (selectedPeriod === "current") {
        return {
          start: format(startOfMonth(now), "yyyy-MM-dd"),
          end: format(endOfMonth(now), "yyyy-MM-dd"),
        };
      } else {
        const monthsAgo = parseInt(selectedPeriod);
        const targetDate = subMonths(now, monthsAgo);
        return {
          start: format(startOfMonth(targetDate), "yyyy-MM-dd"),
          end: format(endOfMonth(targetDate), "yyyy-MM-dd"),
        };
      }
    } else {
      if (selectedPeriod === "current") {
        return {
          start: format(startOfYear(now), "yyyy-MM-dd"),
          end: format(endOfYear(now), "yyyy-MM-dd"),
        };
      } else {
        const yearsAgo = parseInt(selectedPeriod);
        const targetDate = subYears(now, yearsAgo);
        return {
          start: format(startOfYear(targetDate), "yyyy-MM-dd"),
          end: format(endOfYear(targetDate), "yyyy-MM-dd"),
        };
      }
    }
  };

  const handleGenerate = () => {
    const { start, end } = getPeriodDates();
    generateReport.mutate({
      reportType,
      periodStart: start,
      periodEnd: end,
      shareWithCoach,
    });
  };

  const getPeriodLabel = () => {
    const { start, end } = getPeriodDates();
    return `${format(new Date(start), "d MMM", { locale: nl })} - ${format(new Date(end), "d MMM yyyy", { locale: nl })}`;
  };

  // Show loading state when auto-generating
  if (autoGenerating && generateReport.isPending) {
    return (
      <div className="min-h-screen bg-background pb-24">
        <TopNav />
        <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <p className="text-muted-foreground">Rapport wordt gegenereerd...</p>
        </div>
        <BottomNav />
      </div>
    );
  }

  if (selectedReport) {
    return (
      <div className="min-h-screen bg-background pb-24">
        <TopNav />
        <div className="px-6 pt-6">
          <Button 
            variant="ghost" 
            onClick={() => setSelectedReport(null)}
            className="mb-4"
          >
            <ChevronLeft className="h-4 w-4 mr-2" />
            Terug naar overzicht
          </Button>
          <ReportViewer report={selectedReport} />
        </div>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <TopNav />
      
      {/* Header */}
      <div className="px-6 pt-6 pb-4">
        <div className="flex items-center gap-3 mb-2">
          <Link to="/dashboard">
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <ChevronLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Rapportages</h1>
            <p className="text-sm text-muted-foreground">
              Genereer en bekijk je voortgangsrapporten
            </p>
          </div>
        </div>
      </div>

      <div className="px-6">
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="generate">
              <FileText className="h-4 w-4 mr-2" />
              Nieuw rapport
            </TabsTrigger>
            <TabsTrigger value="history">
              <BarChart3 className="h-4 w-4 mr-2" />
              Geschiedenis
            </TabsTrigger>
          </TabsList>

          <TabsContent value="generate" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Rapportage genereren
                </CardTitle>
                <CardDescription>
                  Kies de periode en het type rapport dat je wilt genereren
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Report Type */}
                <div className="space-y-2">
                  <Label>Type rapport</Label>
                  <div className="grid grid-cols-3 gap-2">
                    {(["week", "month", "year"] as const).map((type) => (
                      <Button
                        key={type}
                        variant={reportType === type ? "default" : "outline"}
                        onClick={() => {
                          setReportType(type);
                          setSelectedPeriod("current");
                        }}
                        className="w-full"
                      >
                        {type === "week" && "Week"}
                        {type === "month" && "Maand"}
                        {type === "year" && "Jaar"}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Period Selection */}
                <div className="space-y-2">
                  <Label>Periode</Label>
                  <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="current">
                        {reportType === "week" && "Deze week"}
                        {reportType === "month" && "Deze maand"}
                        {reportType === "year" && "Dit jaar"}
                      </SelectItem>
                      <SelectItem value="1">
                        {reportType === "week" && "Vorige week"}
                        {reportType === "month" && "Vorige maand"}
                        {reportType === "year" && "Vorig jaar"}
                      </SelectItem>
                      <SelectItem value="2">
                        {reportType === "week" && "2 weken geleden"}
                        {reportType === "month" && "2 maanden geleden"}
                        {reportType === "year" && "2 jaar geleden"}
                      </SelectItem>
                      <SelectItem value="3">
                        {reportType === "week" && "3 weken geleden"}
                        {reportType === "month" && "3 maanden geleden"}
                        {reportType === "year" && "3 jaar geleden"}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-sm text-muted-foreground">
                    {getPeriodLabel()}
                  </p>
                </div>

                {/* Share with coach */}
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="share-coach">Delen met coach</Label>
                    <p className="text-sm text-muted-foreground">
                      Je coach kan dit rapport dan ook bekijken
                    </p>
                  </div>
                  <Switch
                    id="share-coach"
                    checked={shareWithCoach}
                    onCheckedChange={setShareWithCoach}
                  />
                </div>

                {/* Generate Button */}
                <Button 
                  onClick={handleGenerate} 
                  className="w-full"
                  disabled={generateReport.isPending}
                >
                  {generateReport.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Genereren...
                    </>
                  ) : (
                    <>
                      <FileText className="h-4 w-4 mr-2" />
                      Rapport genereren
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* What's included */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Wat zit er in het rapport?</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">Training</Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">Voeding</Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">Lichaamsmetingen</Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">Check-ins</Badge>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground mt-4">
                  Je rapport bevat een compleet overzicht van al je trainingsdata,
                  voedingsinformatie, lichaamsmetingen en dagelijkse check-ins voor
                  de geselecteerde periode.
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="history">
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-24 w-full" />
                ))}
              </div>
            ) : (
              <ReportsList 
                reports={reports || []} 
                onViewReport={setSelectedReport}
              />
            )}
          </TabsContent>
        </Tabs>
      </div>

      <BottomNav />
    </div>
  );
};

export default Reports;
