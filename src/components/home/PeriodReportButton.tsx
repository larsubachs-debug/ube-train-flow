import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { FileText } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

type CompletedPeriod = {
  type: "week" | "month" | "year";
  label: string;
  periodStart: string;
  periodEnd: string;
};

const getCompletedPeriod = (): CompletedPeriod | null => {
  const now = new Date();
  const dayOfWeek = now.getDay(); // 0 = Sunday, 1 = Monday
  
  // Check if previous week is complete (it's Monday or later)
  if (dayOfWeek >= 1) {
    const prevWeekEnd = new Date(now);
    prevWeekEnd.setDate(now.getDate() - dayOfWeek);
    prevWeekEnd.setHours(23, 59, 59, 999);
    
    const prevWeekStart = new Date(prevWeekEnd);
    prevWeekStart.setDate(prevWeekEnd.getDate() - 6);
    prevWeekStart.setHours(0, 0, 0, 0);
    
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
  
  return null;
};

export const PeriodReportButton = () => {
  const { user } = useAuth();
  const [hasEnoughData, setHasEnoughData] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [hasViewed, setHasViewed] = useState(false);
  
  const completedPeriod = getCompletedPeriod();
  
  // Check if report was already viewed this period
  useEffect(() => {
    if (!completedPeriod) return;
    
    const viewedKey = `report_viewed_${completedPeriod.periodStart}_${completedPeriod.periodEnd}`;
    const viewed = localStorage.getItem(viewedKey) === 'true';
    setHasViewed(viewed);
  }, [completedPeriod?.periodStart, completedPeriod?.periodEnd]);
  
  // Check if user has enough data for the period
  useEffect(() => {
    if (!user || !completedPeriod) {
      setIsLoading(false);
      return;
    }
    
    const checkData = async () => {
      setIsLoading(true);
      
      try {
        // Check for workout completions in the period
        const { count: workoutCount } = await supabase
          .from("workout_completions")
          .select("*", { count: "exact", head: true })
          .eq("user_id", user.id)
          .gte("completion_date", completedPeriod.periodStart)
          .lte("completion_date", completedPeriod.periodEnd);
        
        // Check for food logs in the period
        const { count: foodCount } = await supabase
          .from("food_logs")
          .select("*", { count: "exact", head: true })
          .eq("user_id", user.id)
          .gte("log_date", completedPeriod.periodStart)
          .lte("log_date", completedPeriod.periodEnd);
        
        // Check for body metrics in the period
        const { count: metricsCount } = await supabase
          .from("body_metrics")
          .select("*", { count: "exact", head: true })
          .eq("user_id", user.id)
          .gte("recorded_at", completedPeriod.periodStart)
          .lte("recorded_at", completedPeriod.periodEnd);
        
        // User needs at least some activity to see report button
        const hasData = (workoutCount || 0) > 0 || (foodCount || 0) > 0 || (metricsCount || 0) > 0;
        setHasEnoughData(hasData);
      } catch (error) {
        console.error("Error checking data:", error);
        setHasEnoughData(false);
      } finally {
        setIsLoading(false);
      }
    };
    
    checkData();
  }, [user, completedPeriod?.periodStart, completedPeriod?.periodEnd]);
  
  // Mark report as viewed when clicking
  const handleClick = () => {
    if (!completedPeriod) return;
    
    const viewedKey = `report_viewed_${completedPeriod.periodStart}_${completedPeriod.periodEnd}`;
    localStorage.setItem(viewedKey, 'true');
    setHasViewed(true);
  };
  
  // Don't render if no period, loading, no data, or already viewed
  if (!completedPeriod || isLoading || !hasEnoughData || hasViewed) {
    return null;
  }
  
  const searchParams = new URLSearchParams({
    type: completedPeriod.type,
    start: completedPeriod.periodStart,
    end: completedPeriod.periodEnd,
  });
  
  return (
    <Link to={`/reports?${searchParams.toString()}`} className="block" onClick={handleClick}>
      <Button 
        variant="outline" 
        className="w-full justify-start gap-3 h-auto py-3 bg-accent/10 border-accent/20 hover:bg-accent/20"
      >
        <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center flex-shrink-0">
          <FileText className="w-5 h-5 text-accent-foreground" />
        </div>
        <div className="text-left">
          <p className="font-semibold text-foreground">
            Open {completedPeriod.label} rapport
          </p>
          <p className="text-xs text-muted-foreground">
            Bekijk je prestaties van afgelopen week
          </p>
        </div>
      </Button>
    </Link>
  );
};
