import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Download, FileSpreadsheet, FileText, Loader2, Calendar } from "lucide-react";
import { format, subDays, subMonths } from "date-fns";
import { nl } from "date-fns/locale";

interface ExportOptions {
  workoutSets: boolean;
  workoutCompletions: boolean;
  bodyMetrics: boolean;
  dailyCheckins: boolean;
}

type DateRange = "7d" | "30d" | "90d" | "1y" | "all";

export const DataExport = () => {
  const { user } = useAuth();
  const [exporting, setExporting] = useState(false);
  const [dateRange, setDateRange] = useState<DateRange>("30d");
  const [options, setOptions] = useState<ExportOptions>({
    workoutSets: true,
    workoutCompletions: true,
    bodyMetrics: false,
    dailyCheckins: false,
  });

  const getDateFilter = (): string | null => {
    const now = new Date();
    switch (dateRange) {
      case "7d":
        return format(subDays(now, 7), "yyyy-MM-dd");
      case "30d":
        return format(subDays(now, 30), "yyyy-MM-dd");
      case "90d":
        return format(subDays(now, 90), "yyyy-MM-dd");
      case "1y":
        return format(subMonths(now, 12), "yyyy-MM-dd");
      case "all":
        return null;
    }
  };

  const exportToCSV = async () => {
    if (!user) {
      toast.error("Je moet ingelogd zijn om te exporteren");
      return;
    }

    setExporting(true);
    const startDate = getDateFilter();

    try {
      const exports: { name: string; data: any[] }[] = [];

      if (options.workoutSets) {
        let query = supabase
          .from("workout_sets")
          .select("*")
          .eq("user_id", user.id)
          .order("completed_at", { ascending: false });

        if (startDate) {
          query = query.gte("completed_at", startDate);
        }

        const { data, error } = await query;
        if (!error && data) {
          exports.push({ name: "workout_sets", data });
        }
      }

      if (options.workoutCompletions) {
        let query = supabase
          .from("workout_completions")
          .select("*")
          .eq("user_id", user.id)
          .order("completion_date", { ascending: false });

        if (startDate) {
          query = query.gte("completion_date", startDate);
        }

        const { data, error } = await query;
        if (!error && data) {
          exports.push({ name: "workout_completions", data });
        }
      }

      if (options.bodyMetrics) {
        let query = supabase
          .from("body_metrics")
          .select("*")
          .eq("user_id", user.id)
          .order("recorded_at", { ascending: false });

        if (startDate) {
          query = query.gte("recorded_at", startDate);
        }

        const { data, error } = await query;
        if (!error && data) {
          exports.push({ name: "body_metrics", data });
        }
      }

      if (options.dailyCheckins) {
        let query = supabase
          .from("daily_checkins")
          .select("*")
          .eq("user_id", user.id)
          .order("checkin_date", { ascending: false });

        if (startDate) {
          query = query.gte("checkin_date", startDate);
        }

        const { data, error } = await query;
        if (!error && data) {
          exports.push({ name: "daily_checkins", data });
        }
      }

      if (exports.length === 0) {
        toast.error("Selecteer minimaal één data type om te exporteren");
        return;
      }

      // Generate CSV for each export type
      exports.forEach((exp) => {
        if (exp.data.length === 0) return;

        const headers = Object.keys(exp.data[0]);
        const csvContent = [
          headers.join(","),
          ...exp.data.map((row) =>
            headers
              .map((header) => {
                const value = row[header];
                if (value === null || value === undefined) return "";
                if (typeof value === "object") return `"${JSON.stringify(value).replace(/"/g, '""')}"`;
                if (typeof value === "string" && (value.includes(",") || value.includes("\n"))) {
                  return `"${value.replace(/"/g, '""')}"`;
                }
                return value;
              })
              .join(",")
          ),
        ].join("\n");

        // Download file
        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute(
          "download",
          `${exp.name}_${format(new Date(), "yyyy-MM-dd")}.csv`
        );
        link.style.visibility = "hidden";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      });

      toast.success(`${exports.length} bestand(en) geëxporteerd!`);
    } catch (error) {
      console.error("Export error:", error);
      toast.error("Er is een fout opgetreden bij het exporteren");
    } finally {
      setExporting(false);
    }
  };

  const exportToPDF = async () => {
    toast.info("PDF export komt binnenkort beschikbaar");
  };

  const selectedCount = Object.values(options).filter(Boolean).length;

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold">Data Export</h3>
          <p className="text-sm text-muted-foreground">
            Exporteer je training data naar CSV of PDF
          </p>
        </div>
        <Badge variant="outline">
          {selectedCount} geselecteerd
        </Badge>
      </div>

      {/* Date Range Selection */}
      <div className="mb-6">
        <Label className="text-sm font-medium mb-2 block">Periode</Label>
        <Select value={dateRange} onValueChange={(v) => setDateRange(v as DateRange)}>
          <SelectTrigger className="w-full">
            <Calendar className="h-4 w-4 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7d">Laatste 7 dagen</SelectItem>
            <SelectItem value="30d">Laatste 30 dagen</SelectItem>
            <SelectItem value="90d">Laatste 3 maanden</SelectItem>
            <SelectItem value="1y">Laatste jaar</SelectItem>
            <SelectItem value="all">Alle data</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Data Type Selection */}
      <div className="space-y-3 mb-6">
        <Label className="text-sm font-medium">Data types</Label>
        
        <div className="flex items-center space-x-3 p-3 bg-muted/30 rounded-lg">
          <Checkbox
            id="workoutSets"
            checked={options.workoutSets}
            onCheckedChange={(checked) =>
              setOptions((prev) => ({ ...prev, workoutSets: !!checked }))
            }
          />
          <div className="flex-1">
            <Label htmlFor="workoutSets" className="cursor-pointer">
              Workout Sets
            </Label>
            <p className="text-xs text-muted-foreground">
              Alle sets met gewicht, reps en RPE
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3 p-3 bg-muted/30 rounded-lg">
          <Checkbox
            id="workoutCompletions"
            checked={options.workoutCompletions}
            onCheckedChange={(checked) =>
              setOptions((prev) => ({ ...prev, workoutCompletions: !!checked }))
            }
          />
          <div className="flex-1">
            <Label htmlFor="workoutCompletions" className="cursor-pointer">
              Workout Voltooiingen
            </Label>
            <p className="text-xs text-muted-foreground">
              Overzicht van voltooide workouts
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3 p-3 bg-muted/30 rounded-lg">
          <Checkbox
            id="bodyMetrics"
            checked={options.bodyMetrics}
            onCheckedChange={(checked) =>
              setOptions((prev) => ({ ...prev, bodyMetrics: !!checked }))
            }
          />
          <div className="flex-1">
            <Label htmlFor="bodyMetrics" className="cursor-pointer">
              Lichaamsmetingen
            </Label>
            <p className="text-xs text-muted-foreground">
              Gewicht, vetpercentage, spiermassa
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3 p-3 bg-muted/30 rounded-lg">
          <Checkbox
            id="dailyCheckins"
            checked={options.dailyCheckins}
            onCheckedChange={(checked) =>
              setOptions((prev) => ({ ...prev, dailyCheckins: !!checked }))
            }
          />
          <div className="flex-1">
            <Label htmlFor="dailyCheckins" className="cursor-pointer">
              Dagelijkse Check-ins
            </Label>
            <p className="text-xs text-muted-foreground">
              Alle dagelijkse check-in responses
            </p>
          </div>
        </div>
      </div>

      {/* Export Buttons */}
      <div className="grid grid-cols-2 gap-3">
        <Button
          onClick={exportToCSV}
          disabled={exporting || selectedCount === 0}
          className="gap-2"
        >
          {exporting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <FileSpreadsheet className="h-4 w-4" />
          )}
          Export CSV
        </Button>
        <Button
          onClick={exportToPDF}
          variant="outline"
          disabled={exporting || selectedCount === 0}
          className="gap-2"
        >
          <FileText className="h-4 w-4" />
          Export PDF
        </Button>
      </div>

      <p className="text-xs text-muted-foreground mt-4 text-center">
        CSV bestanden kunnen worden geopend in Excel, Google Sheets, of andere spreadsheet programma's
      </p>
    </Card>
  );
};
