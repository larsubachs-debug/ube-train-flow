import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, ClipboardList } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { DailyCheckinDialog } from "./DailyCheckinDialog";

export const DailyCheckinCard = () => {
  const { user } = useAuth();
  const [isCompleted, setIsCompleted] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkTodayCompletion();
  }, [user]);

  const checkTodayCompletion = async () => {
    if (!user) return;

    setLoading(true);
    const today = new Date().toISOString().split('T')[0];
    
    const { data } = await supabase
      .from('daily_checkins')
      .select('id')
      .eq('user_id', user.id)
      .eq('checkin_date', today)
      .maybeSingle();

    setIsCompleted(!!data);
    setLoading(false);
  };

  if (loading) {
    return (
      <Card className="p-3 bg-muted/30 border-border/40">
        <div className="animate-pulse h-12" />
      </Card>
    );
  }

  if (isCompleted) {
    return (
      <Card className="p-3 bg-muted/30 border-border/40">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="h-5 w-5 text-green-600" />
          <div className="flex-1">
            <p className="text-sm font-medium text-foreground">Check-in voltooid</p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <>
      <Card className="p-3 bg-muted/30 border-border/40">
        <div className="flex items-center gap-2">
          <ClipboardList className="h-5 w-5 text-muted-foreground" />
          <div className="flex-1">
            <p className="text-sm font-medium text-foreground">Dagelijkse Check-in</p>
          </div>
          <Button 
            onClick={() => setIsDialogOpen(true)}
            size="sm"
            variant="outline"
          >
            Check-in
          </Button>
        </div>
      </Card>

      <DailyCheckinDialog 
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onComplete={() => {
          setIsCompleted(true);
          setIsDialogOpen(false);
        }}
      />
    </>
  );
};
