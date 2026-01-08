import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface ReportData {
  period: {
    type: string;
    start: string;
    end: string;
    generatedAt: string;
  };
  user: {
    name: string;
    email?: string;
  };
  training: {
    totalWorkouts: number;
    totalVolume: number;
    averageRPE: number;
    exerciseBreakdown: Array<{ name: string; sets: number; volume: number }>;
  };
  nutrition: {
    daysLogged: number;
    averageCalories: number;
    averageProtein: number;
    averageCarbs: number;
    averageFat: number;
  };
  body: {
    measurementsCount: number;
    weightChange: number | null;
    latestWeight: number | null;
    latestBodyFat: number | null;
  };
  wellness: {
    checkinsCompleted: number;
    habitsCompleted: number;
  };
}

export interface UserReport {
  id: string;
  user_id: string;
  report_type: "week" | "month" | "year" | "program";
  period_start: string;
  period_end: string;
  file_path: string | null;
  file_name: string | null;
  status: "pending" | "generating" | "completed" | "failed";
  shared_with_coach: boolean;
  report_data: ReportData | null;
  created_at: string;
  completed_at: string | null;
  error_message: string | null;
}

export function useReports() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: reports, isLoading } = useQuery({
    queryKey: ["user-reports", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_reports")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return (data || []).map((r) => ({
        ...r,
        report_type: r.report_type as UserReport["report_type"],
        status: r.status as UserReport["status"],
        report_data: r.report_data as unknown as ReportData | null,
      })) as UserReport[];
    },
    enabled: !!user?.id,
  });

  const generateReport = useMutation({
    mutationFn: async ({
      reportType,
      periodStart,
      periodEnd,
      shareWithCoach,
    }: {
      reportType: "week" | "month" | "year" | "program";
      periodStart: string;
      periodEnd: string;
      shareWithCoach?: boolean;
    }) => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const response = await supabase.functions.invoke("generate-report", {
        body: { reportType, periodStart, periodEnd, shareWithCoach },
      });

      if (response.error) throw response.error;
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-reports"] });
      toast.success("Rapportage gegenereerd!");
    },
    onError: (error) => {
      console.error("Failed to generate report:", error);
      toast.error("Kon rapportage niet genereren");
    },
  });

  const deleteReport = useMutation({
    mutationFn: async (reportId: string) => {
      const { error } = await supabase
        .from("user_reports")
        .delete()
        .eq("id", reportId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-reports"] });
      toast.success("Rapportage verwijderd");
    },
    onError: () => {
      toast.error("Kon rapportage niet verwijderen");
    },
  });

  const toggleShareWithCoach = useMutation({
    mutationFn: async ({ reportId, share }: { reportId: string; share: boolean }) => {
      const { error } = await supabase
        .from("user_reports")
        .update({ shared_with_coach: share })
        .eq("id", reportId);

      if (error) throw error;
    },
    onSuccess: (_, { share }) => {
      queryClient.invalidateQueries({ queryKey: ["user-reports"] });
      toast.success(share ? "Gedeeld met coach" : "Delen uitgeschakeld");
    },
    onError: () => {
      toast.error("Kon instelling niet wijzigen");
    },
  });

  return {
    reports,
    isLoading,
    generateReport,
    deleteReport,
    toggleShareWithCoach,
  };
}
