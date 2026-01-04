import { Dumbbell, MessageCircle, Loader2, CheckCircle2, MessageSquare } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Link } from "react-router-dom";

export const NoProgramState = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [isRequesting, setIsRequesting] = useState(false);
  const [requestSent, setRequestSent] = useState(false);

  const handleRequestProgram = async () => {
    if (!user) return;
    
    setIsRequesting(true);
    try {
      // Get user's profile to find their coach
      const { data: profile } = await supabase
        .from("profiles")
        .select("id, coach_id")
        .eq("user_id", user.id)
        .single();

      if (!profile?.coach_id) {
        toast({
          title: "Geen coach toegewezen",
          description: "Je hebt nog geen coach. Neem contact op met de beheerder.",
          variant: "destructive",
        });
        setIsRequesting(false);
        return;
      }

      // Send a message to the coach requesting a program
      const { error } = await supabase
        .from("chat_messages")
        .insert({
          member_id: profile.id,
          coach_id: profile.coach_id,
          sender_id: profile.id,
          message: "Hoi! Ik zou graag een trainingsschema willen ontvangen. Kun je een programma voor mij klaarzetten?",
        });

      if (error) throw error;

      setRequestSent(true);
    } catch (error) {
      console.error("Error requesting program:", error);
      toast({
        title: "Er ging iets mis",
        description: "Kon het verzoek niet verzenden. Probeer het later opnieuw.",
        variant: "destructive",
      });
    } finally {
      setIsRequesting(false);
    }
  };

  // Show confirmation screen after request is sent
  if (requestSent) {
    return (
      <Card className="border-dashed bg-muted/30">
        <CardContent className="flex flex-col items-center justify-center py-8 text-center">
          <div className="w-14 h-14 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-4 animate-scale-in">
            <CheckCircle2 className="w-7 h-7 text-green-600 dark:text-green-400" />
          </div>
          <h3 className="font-semibold text-foreground mb-2 text-lg">
            Verzoek verzonden!
          </h3>
          <p className="text-sm text-muted-foreground max-w-xs mb-5">
            Je coach heeft je bericht ontvangen en zal binnenkort een programma voor je klaarzetten.
          </p>
          <Link to="/chat">
            <Button variant="outline" className="gap-2">
              <MessageSquare className="w-4 h-4" />
              Bekijk chat
            </Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-dashed">
      <CardContent className="flex flex-col items-center justify-center py-8 text-center">
        <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4">
          <Dumbbell className="w-6 h-6 text-muted-foreground" />
        </div>
        <h3 className="font-medium text-foreground mb-1">
          {t('home.noProgram', 'Nog geen programma toegewezen')}
        </h3>
        <p className="text-sm text-muted-foreground max-w-xs mb-4">
          {t('home.noProgramDescription', 'Je coach zal binnenkort een programma voor je klaarzetten')}
        </p>
        <Button 
          onClick={handleRequestProgram} 
          disabled={isRequesting}
          variant="outline"
          className="gap-2"
        >
          {isRequesting ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <MessageCircle className="w-4 h-4" />
          )}
          Vraag een programma aan
        </Button>
      </CardContent>
    </Card>
  );
};
