import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ReportRequest {
  reportType: "week" | "month" | "year" | "program";
  periodStart: string;
  periodEnd: string;
  shareWithCoach?: boolean;
}

serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("Missing authorization header");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error("Unauthorized");
    }

    const { reportType, periodStart, periodEnd, shareWithCoach }: ReportRequest = await req.json();

    // Get user profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("display_name, email")
      .eq("user_id", user.id)
      .single();

    // Fetch training data
    const { data: workoutCompletions } = await supabase
      .from("workout_completions")
      .select("*")
      .eq("user_id", user.id)
      .gte("completion_date", periodStart)
      .lte("completion_date", periodEnd);

    const { data: workoutSets } = await supabase
      .from("workout_sets")
      .select("*")
      .eq("user_id", user.id)
      .gte("completed_at", periodStart)
      .lte("completed_at", periodEnd);

    // Fetch nutrition data
    const { data: foodLogs } = await supabase
      .from("food_logs")
      .select("*")
      .eq("user_id", user.id)
      .gte("log_date", periodStart)
      .lte("log_date", periodEnd);

    // Fetch body metrics
    const { data: bodyMetrics } = await supabase
      .from("body_metrics")
      .select("*")
      .eq("user_id", user.id)
      .gte("recorded_at", periodStart)
      .lte("recorded_at", periodEnd)
      .order("recorded_at", { ascending: true });

    // Fetch check-ins
    const { data: dailyCheckins } = await supabase
      .from("daily_checkins")
      .select("*")
      .eq("user_id", user.id)
      .gte("checkin_date", periodStart)
      .lte("checkin_date", periodEnd);

    // Fetch habit completions
    const { data: habitCompletions } = await supabase
      .from("habit_completions")
      .select("*, member_habits(custom_title, habits_library(title))")
      .eq("user_id", user.id)
      .gte("completion_date", periodStart)
      .lte("completion_date", periodEnd);

    // Calculate statistics
    const totalWorkouts = workoutCompletions?.length || 0;
    const totalVolume = workoutSets?.reduce((sum, set) => {
      if (set.completed && set.weight && set.reps) {
        return sum + (Number(set.weight) * Number(set.reps));
      }
      return sum;
    }, 0) || 0;

    const avgRPE = workoutSets?.length
      ? workoutSets.filter(s => s.rpe).reduce((sum, s) => sum + Number(s.rpe), 0) / 
        workoutSets.filter(s => s.rpe).length
      : 0;

    // Nutrition averages
    const avgCalories = foodLogs?.length
      ? foodLogs.reduce((sum, log) => sum + log.calories, 0) / foodLogs.length
      : 0;
    const avgProtein = foodLogs?.length
      ? foodLogs.reduce((sum, log) => sum + Number(log.protein), 0) / foodLogs.length
      : 0;
    const avgCarbs = foodLogs?.length
      ? foodLogs.reduce((sum, log) => sum + Number(log.carbs), 0) / foodLogs.length
      : 0;
    const avgFat = foodLogs?.length
      ? foodLogs.reduce((sum, log) => sum + Number(log.fat), 0) / foodLogs.length
      : 0;

    // Body metrics changes
    const firstMetric = bodyMetrics?.[0];
    const lastMetric = bodyMetrics?.[bodyMetrics.length - 1];
    const weightChange = firstMetric && lastMetric
      ? Number(lastMetric.weight || 0) - Number(firstMetric.weight || 0)
      : null;

    // Check-in averages
    const checkinResponses = dailyCheckins?.flatMap(c => 
      typeof c.responses === 'object' ? Object.entries(c.responses as Record<string, unknown>) : []
    ) || [];

    // Habit completion rate
    const habitCompletionRate = habitCompletions?.length || 0;

    const reportData = {
      period: {
        type: reportType,
        start: periodStart,
        end: periodEnd,
        generatedAt: new Date().toISOString(),
      },
      user: {
        name: profile?.display_name || "Gebruiker",
        email: profile?.email,
      },
      training: {
        totalWorkouts,
        totalVolume: Math.round(totalVolume),
        averageRPE: Math.round(avgRPE * 10) / 10,
        exerciseBreakdown: getExerciseBreakdown(workoutSets || []),
      },
      nutrition: {
        daysLogged: foodLogs?.length || 0,
        averageCalories: Math.round(avgCalories),
        averageProtein: Math.round(avgProtein),
        averageCarbs: Math.round(avgCarbs),
        averageFat: Math.round(avgFat),
      },
      body: {
        measurementsCount: bodyMetrics?.length || 0,
        weightChange: weightChange ? Math.round(weightChange * 10) / 10 : null,
        latestWeight: lastMetric?.weight ? Number(lastMetric.weight) : null,
        latestBodyFat: lastMetric?.body_fat_percentage ? Number(lastMetric.body_fat_percentage) : null,
      },
      wellness: {
        checkinsCompleted: dailyCheckins?.length || 0,
        habitsCompleted: habitCompletionRate,
      },
    };

    // Create report record
    const fileName = `rapport-${reportType}-${periodStart}-${periodEnd}.json`;
    const filePath = `${user.id}/${fileName}`;

    const { error: insertError } = await supabase
      .from("user_reports")
      .insert({
        user_id: user.id,
        report_type: reportType,
        period_start: periodStart,
        period_end: periodEnd,
        file_path: filePath,
        file_name: fileName,
        status: "completed",
        shared_with_coach: shareWithCoach || false,
        report_data: reportData,
        completed_at: new Date().toISOString(),
      });

    if (insertError) {
      console.error("Insert error:", insertError);
      throw new Error("Failed to save report");
    }

    return new Response(JSON.stringify({ success: true, data: reportData }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: unknown) {
    console.error("Error generating report:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
});

function getExerciseBreakdown(sets: Array<{ exercise_name: string; weight?: number; reps?: number; completed?: boolean }>) {
  const breakdown: Record<string, { sets: number; volume: number }> = {};
  
  for (const set of sets) {
    if (!set.completed) continue;
    
    if (!breakdown[set.exercise_name]) {
      breakdown[set.exercise_name] = { sets: 0, volume: 0 };
    }
    
    breakdown[set.exercise_name].sets += 1;
    if (set.weight && set.reps) {
      breakdown[set.exercise_name].volume += Number(set.weight) * Number(set.reps);
    }
  }
  
  return Object.entries(breakdown)
    .map(([name, data]) => ({ name, ...data }))
    .sort((a, b) => b.volume - a.volume)
    .slice(0, 10);
}
