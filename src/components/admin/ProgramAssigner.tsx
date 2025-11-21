import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { usePrograms } from "@/hooks/usePrograms";

interface ProgramAssignerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  memberId: string;
  memberName: string | null;
  memberUserId: string;
}

export const ProgramAssigner = ({
  open,
  onOpenChange,
  memberId,
  memberName,
  memberUserId,
}: ProgramAssignerProps) => {
  const { toast } = useToast();
  const { data: programs = [] } = usePrograms();
  const [selectedProgram, setSelectedProgram] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [currentProgram, setCurrentProgram] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !memberUserId) return;

    const fetchCurrentProgram = async () => {
      const { data } = await supabase
        .from("user_program_progress")
        .select("program_id")
        .eq("user_id", memberUserId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      setCurrentProgram(data?.program_id || null);
      setSelectedProgram(data?.program_id || "");
    };

    fetchCurrentProgram();
  }, [open, memberUserId]);

  const handleAssign = async () => {
    if (!selectedProgram) {
      toast({
        title: "Error",
        description: "Selecteer een programma",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      // Check if user already has progress for this program
      const { data: existing } = await supabase
        .from("user_program_progress")
        .select("id")
        .eq("user_id", memberUserId)
        .eq("program_id", selectedProgram)
        .maybeSingle();

      if (existing) {
        toast({
          title: "Info",
          description: "Member is al toegewezen aan dit programma",
        });
        onOpenChange(false);
        return;
      }

      // Create new progress entry
      const { error } = await supabase.from("user_program_progress").insert({
        user_id: memberUserId,
        program_id: selectedProgram,
        current_week_number: 1,
        start_date: new Date().toISOString().split("T")[0],
        completed: false,
      });

      if (error) throw error;

      // Get program name for notification
      const programName = programs.find(p => p.id === selectedProgram)?.name || "een nieuw programma";

      // Send notification to member
      try {
        await supabase.functions.invoke('send-notification', {
          body: {
            userId: memberUserId,
            title: "Nieuw programma toegewezen! 🎯",
            body: `Je coach heeft ${programName} aan je toegewezen. Bekijk het in je programma's.`,
            data: {
              type: 'program_assigned',
              programId: selectedProgram,
            }
          }
        });
        console.log('Notification sent to member');
      } catch (notifError) {
        console.error('Failed to send notification:', notifError);
        // Don't fail the assignment if notification fails
      }

      toast({
        title: "Success",
        description: `Programma toegewezen aan ${memberName}`,
      });

      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Programma toewijzen aan {memberName}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {currentProgram && (
            <div className="p-3 bg-muted rounded-lg text-sm">
              <p className="text-muted-foreground">Huidig programma:</p>
              <p className="font-medium">
                {programs.find((p) => p.id === currentProgram)?.name || currentProgram}
              </p>
            </div>
          )}

          <div>
            <label className="text-sm font-medium mb-2 block">
              Selecteer programma
            </label>
            <Select value={selectedProgram} onValueChange={setSelectedProgram}>
              <SelectTrigger>
                <SelectValue placeholder="Kies een programma" />
              </SelectTrigger>
              <SelectContent>
                {programs.map((program) => (
                  <SelectItem key={program.id} value={program.id}>
                    {program.name}
                    {!(program as any).is_public && " (Privé)"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Annuleren
            </Button>
            <Button onClick={handleAssign} disabled={loading}>
              {loading ? "Bezig..." : "Toewijzen"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
