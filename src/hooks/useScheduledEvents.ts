import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface ScheduledEvent {
  id: string;
  member_id: string;
  coach_id: string;
  event_type: "workout" | "task" | "custom";
  title: string;
  description: string | null;
  scheduled_date: string;
  scheduled_time: string | null;
  duration_minutes: number | null;
  workout_id: string | null;
  task_id: string | null;
  status: "scheduled" | "completed" | "cancelled" | "missed";
  completed_at: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export const useScheduledEvents = (memberId?: string) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["scheduled-events", memberId || user?.id],
    queryFn: async () => {
      let query = supabase
        .from("scheduled_events")
        .select("*")
        .order("scheduled_date", { ascending: true })
        .order("scheduled_time", { ascending: true, nullsFirst: false });

      if (memberId) {
        query = query.eq("member_id", memberId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as ScheduledEvent[];
    },
    enabled: !!user,
  });
};

export const useUpcomingEvents = () => {
  const { user } = useAuth();
  const today = new Date().toISOString().split("T")[0];

  return useQuery({
    queryKey: ["upcoming-events", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("scheduled_events")
        .select("*")
        .gte("scheduled_date", today)
        .neq("status", "cancelled")
        .order("scheduled_date", { ascending: true })
        .order("scheduled_time", { ascending: true, nullsFirst: false })
        .limit(10);

      if (error) throw error;
      return data as ScheduledEvent[];
    },
    enabled: !!user,
  });
};

export const useCreateScheduledEvent = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (event: Omit<ScheduledEvent, "id" | "created_at" | "updated_at" | "completed_at">) => {
      const { data, error } = await supabase
        .from("scheduled_events")
        .insert(event)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["scheduled-events"] });
      queryClient.invalidateQueries({ queryKey: ["upcoming-events"] });
      toast.success("Event ingepland");
    },
    onError: (error) => {
      console.error("Error creating event:", error);
      toast.error("Kon event niet inplannen");
    },
  });
};

export const useUpdateScheduledEvent = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<ScheduledEvent> & { id: string }) => {
      const { data, error } = await supabase
        .from("scheduled_events")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["scheduled-events"] });
      queryClient.invalidateQueries({ queryKey: ["upcoming-events"] });
      toast.success("Event bijgewerkt");
    },
    onError: (error) => {
      console.error("Error updating event:", error);
      toast.error("Kon event niet bijwerken");
    },
  });
};

export const useDeleteScheduledEvent = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("scheduled_events")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["scheduled-events"] });
      queryClient.invalidateQueries({ queryKey: ["upcoming-events"] });
      toast.success("Event verwijderd");
    },
    onError: (error) => {
      console.error("Error deleting event:", error);
      toast.error("Kon event niet verwijderen");
    },
  });
};

export const useCompleteEvent = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase
        .from("scheduled_events")
        .update({ 
          status: "completed", 
          completed_at: new Date().toISOString() 
        })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["scheduled-events"] });
      queryClient.invalidateQueries({ queryKey: ["upcoming-events"] });
      toast.success("Gemarkeerd als voltooid!");
    },
    onError: (error) => {
      console.error("Error completing event:", error);
      toast.error("Kon event niet voltooien");
    },
  });
};
