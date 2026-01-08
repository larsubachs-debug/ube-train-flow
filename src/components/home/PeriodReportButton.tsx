import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { FileText } from "lucide-react";

type CompletedPeriod = {
  type: "week" | "month" | "year";
  label: string;
  periodStart: string;
  periodEnd: string;
};

const getCompletedPeriod = (): CompletedPeriod | null => {
  const now = new Date();
  const dayOfWeek = now.getDay(); // 0 = Sunday, 1 = Monday
  const dayOfMonth = now.getDate();
  const month = now.getMonth(); // 0-11
  
  // Check if previous week is complete (it's Monday or later)
  // A week is "complete" after Sunday ends, so on Monday we can report previous week
  if (dayOfWeek >= 1) { // Monday or later
    const prevWeekEnd = new Date(now);
    prevWeekEnd.setDate(now.getDate() - dayOfWeek); // Last Sunday
    prevWeekEnd.setHours(23, 59, 59, 999);
    
    const prevWeekStart = new Date(prevWeekEnd);
    prevWeekStart.setDate(prevWeekEnd.getDate() - 6); // Previous Monday
    prevWeekStart.setHours(0, 0, 0, 0);
    
    // Get week number of the year
    const startOfYear = new Date(prevWeekStart.getFullYear(), 0, 1);
    const days = Math.floor((prevWeekStart.getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000));
    const weekNumber = Math.ceil((days + startOfYear.getDay() + 1) / 7);
    
    return {
      type: "week",
      label: `Week ${weekNumber}`,
      periodStart: prevWeekStart.toISOString().split('T')[0],
      periodEnd: prevWeekEnd.toISOString().split('T')[0],
    };
  }
  
  // Check if previous month is complete (it's the 1st or later of a new month)
  if (dayOfMonth >= 1 && month > 0) {
    const prevMonthEnd = new Date(now.getFullYear(), month, 0); // Last day of prev month
    const prevMonthStart = new Date(now.getFullYear(), month - 1, 1);
    
    const monthNames = [
      "Januari", "Februari", "Maart", "April", "Mei", "Juni",
      "Juli", "Augustus", "September", "Oktober", "November", "December"
    ];
    
    return {
      type: "month",
      label: monthNames[month - 1],
      periodStart: prevMonthStart.toISOString().split('T')[0],
      periodEnd: prevMonthEnd.toISOString().split('T')[0],
    };
  }
  
  // Check if previous year is complete (it's January)
  if (month === 0) {
    const prevYear = now.getFullYear() - 1;
    
    return {
      type: "year",
      label: String(prevYear),
      periodStart: `${prevYear}-01-01`,
      periodEnd: `${prevYear}-12-31`,
    };
  }
  
  return null;
};

export const PeriodReportButton = () => {
  const completedPeriod = getCompletedPeriod();
  
  if (!completedPeriod) return null;
  
  // Create search params to pre-fill the report page
  const searchParams = new URLSearchParams({
    type: completedPeriod.type,
    start: completedPeriod.periodStart,
    end: completedPeriod.periodEnd,
  });
  
  return (
    <Link to={`/reports?${searchParams.toString()}`} className="block">
      <Button 
        variant="outline" 
        className="w-full justify-start gap-3 h-auto py-3 bg-accent/10 border-accent/20 hover:bg-accent/20"
      >
        <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center flex-shrink-0">
          <FileText className="w-5 h-5 text-accent-foreground" />
        </div>
        <div className="text-left">
          <p className="font-semibold text-foreground">
            Open {completedPeriod.type === "week" ? "week" : completedPeriod.type === "month" ? "maand" : "jaar"} {completedPeriod.label} rapport
          </p>
          <p className="text-xs text-muted-foreground">
            Bekijk je prestaties van afgelopen {completedPeriod.type === "week" ? "week" : completedPeriod.type === "month" ? "maand" : "jaar"}
          </p>
        </div>
      </Button>
    </Link>
  );
};
