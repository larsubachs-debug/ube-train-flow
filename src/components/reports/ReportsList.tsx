import { format } from "date-fns";
import { nl } from "date-fns/locale";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { type UserReport } from "@/hooks/useReports";
import { 
  FileText, 
  Calendar, 
  Share2, 
  ChevronRight,
  FileWarning
} from "lucide-react";

interface ReportsListProps {
  reports: UserReport[];
  onViewReport: (report: UserReport) => void;
}

export function ReportsList({ reports, onViewReport }: ReportsListProps) {
  if (reports.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="font-medium mb-1">Nog geen rapporten</h3>
          <p className="text-sm text-muted-foreground">
            Genereer je eerste rapport om je voortgang te bekijken
          </p>
        </CardContent>
      </Card>
    );
  }

  const getReportTypeLabel = (type: string) => {
    switch (type) {
      case "week": return "Week";
      case "month": return "Maand";
      case "year": return "Jaar";
      case "program": return "Programma";
      default: return type;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge variant="default">Voltooid</Badge>;
      case "generating":
        return <Badge variant="secondary">Bezig...</Badge>;
      case "failed":
        return <Badge variant="destructive">Mislukt</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-3">
      {reports.map((report) => (
        <Card 
          key={report.id} 
          className="cursor-pointer hover:bg-accent/50 transition-colors"
          onClick={() => report.status === "completed" && onViewReport(report)}
        >
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  {report.status === "failed" ? (
                    <FileWarning className="h-5 w-5 text-destructive" />
                  ) : (
                    <FileText className="h-5 w-5 text-primary" />
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">
                      {getReportTypeLabel(report.report_type)}rapport
                    </span>
                    {report.shared_with_coach && (
                      <Share2 className="h-3 w-3 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    {format(new Date(report.period_start), "d MMM", { locale: nl })} - 
                    {format(new Date(report.period_end), "d MMM yyyy", { locale: nl })}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {getStatusBadge(report.status)}
                {report.status === "completed" && (
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
