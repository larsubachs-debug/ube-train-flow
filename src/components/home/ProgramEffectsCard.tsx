import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Sparkles, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import type { Program, Week } from "@/types/training";
import defaultCoach from "@/assets/default-coach.jpg";

interface ProgramEffectsCardProps {
  program: Program;
  currentWeek: Week | null;
  weekNumber: number;
  coachAvatar: string | null;
}

export const ProgramEffectsCard = ({ 
  program, 
  currentWeek, 
  weekNumber,
  coachAvatar 
}: ProgramEffectsCardProps) => {
  const [insight, setInsight] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const generateInsight = async () => {
    setLoading(true);
    
    try {
      // Build context about the program
      const totalWeeks = program.weeks?.length || 0;
      const currentWeekData = currentWeek || program.weeks?.[0];
      
      // Get workout names and exercise counts for context
      const workoutSummary = currentWeekData?.workouts?.map(w => {
        const exerciseCount = (w.warmUp?.length || 0) + (w.mainLifts?.length || 0) + 
                             (w.accessories?.length || 0) + (w.conditioning?.length || 0);
        return `${w.name} (${exerciseCount} exercises)`;
      }).join(", ") || "workouts";

      const context = {
        programName: program.name,
        programDescription: program.description,
        totalWeeks,
        currentWeek: weekNumber,
        phaseName: currentWeekData?.phase_name || currentWeekData?.name,
        phaseDescription: currentWeekData?.description,
        workoutsPerWeek: currentWeekData?.workouts?.length || 0,
        workoutSummary
      };

      const { data, error } = await supabase.functions.invoke('generate-program-insight', {
        body: { context }
      });

      if (error) throw error;
      
      setInsight(data.insight);
    } catch (err) {
      console.error('Failed to generate insight:', err);
      // Fallback to phase description or generic message
      setInsight(currentWeek?.description || 
        `Week ${weekNumber} van ${program.weeks?.length || 4}: Focus op progressieve opbouw en techniek.`);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    // Check cache first
    const cacheKey = `program-insight-${program.id}-week-${weekNumber}`;
    const cached = sessionStorage.getItem(cacheKey);
    
    if (cached) {
      setInsight(cached);
      setLoading(false);
    } else {
      generateInsight().then(() => {
        if (insight) {
          sessionStorage.setItem(cacheKey, insight);
        }
      });
    }
  }, [program.id, weekNumber]);

  // Cache insight when it changes
  useEffect(() => {
    if (insight) {
      const cacheKey = `program-insight-${program.id}-week-${weekNumber}`;
      sessionStorage.setItem(cacheKey, insight);
    }
  }, [insight, program.id, weekNumber]);

  const handleRefresh = async () => {
    setRefreshing(true);
    const cacheKey = `program-insight-${program.id}-week-${weekNumber}`;
    sessionStorage.removeItem(cacheKey);
    await generateInsight();
  };

  if (loading) {
    return (
      <Card className="p-4 bg-foreground text-background">
        <div className="flex items-start gap-4">
          <Skeleton className="w-12 h-12 rounded-full bg-background/20" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-5 w-3/4 bg-background/20" />
            <Skeleton className="h-4 w-full bg-background/20" />
            <Skeleton className="h-4 w-2/3 bg-background/20" />
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-4 bg-foreground text-background">
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-full bg-background/10 flex items-center justify-center flex-shrink-0 overflow-hidden">
          <img 
            src={coachAvatar || defaultCoach} 
            alt="Coach" 
            className="w-full h-full object-cover scale-[1.1] object-center" 
          />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-base font-bold">
              Week {weekNumber} van {program.weeks?.length || 4}
            </h3>
            <Sparkles className="h-4 w-4 text-background/60" />
          </div>
          <p className="text-sm opacity-90 leading-relaxed">
            {insight}
          </p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleRefresh}
          disabled={refreshing}
          className="h-8 w-8 text-background/60 hover:text-background hover:bg-background/10"
        >
          <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
        </Button>
      </div>
    </Card>
  );
};
