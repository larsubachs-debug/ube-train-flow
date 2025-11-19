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
      <Card className="p-4 bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
        <div className="animate-pulse h-16" />
      </Card>
    );
  }

  if (isCompleted) {
    return (
      <Card className="p-4 bg-gradient-to-br from-green-500/10 to-green-600/10 border-green-500/20">
        <div className="flex items-center gap-3">
          <div className="bg-green-500/20 p-2 rounded-full">
            <CheckCircle2 className="h-6 w-6 text-green-600" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-foreground">Dagelijkse Check-in Voltooid</h3>
            <p className="text-sm text-muted-foreground">Je hebt de check-in van vandaag ingevuld!</p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <>
      <Card className="p-4 bg-gradient-to-br from-primary/10 to-accent/10 border-primary/30 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="bg-primary/20 p-2 rounded-full animate-pulse">
            <ClipboardList className="h-6 w-6 text-primary" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-foreground">Dagelijkse Check-in</h3>
            <p className="text-sm text-muted-foreground">Vul je dagelijkse check-in in</p>
          </div>
          <Button 
            onClick={() => setIsDialogOpen(true)}
            className="bg-primary hover:bg-primary/90"
          >
            Start Check-in
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
