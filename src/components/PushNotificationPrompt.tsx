import { useState, useEffect } from "react";
import { Bell, X } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { subscribeToPushNotifications, checkNotificationPermission } from "@/lib/pushNotifications";
import { toast } from "sonner";

export const PushNotificationPrompt = () => {
  const { user } = useAuth();
  const [showPrompt, setShowPrompt] = useState(false);
  const [isSubscribing, setIsSubscribing] = useState(false);

  useEffect(() => {
    // Check if we should show the prompt
    const checkPermission = () => {
      const permission = checkNotificationPermission();
      const hasBeenAsked = localStorage.getItem('push-notification-asked');
      
      // Show prompt if notifications are supported, not granted, and haven't been asked yet
      if (permission === 'default' && !hasBeenAsked && user) {
        setShowPrompt(true);
      }
    };

    checkPermission();
  }, [user]);

  const handleEnable = async () => {
    if (!user) return;
    
    setIsSubscribing(true);
    
    try {
      const subscription = await subscribeToPushNotifications(user.id);
      
      if (subscription) {
        toast.success("Notificaties ingeschakeld! Je krijgt nu dagelijkse reminders.");
        localStorage.setItem('push-notification-asked', 'true');
        setShowPrompt(false);
      } else {
        toast.error("Kon notificaties niet inschakelen. Probeer het later opnieuw.");
      }
    } catch (error) {
      console.error("Error enabling notifications:", error);
      toast.error("Er ging iets mis bij het inschakelen van notificaties.");
    } finally {
      setIsSubscribing(false);
    }
  };

  const handleDismiss = () => {
    localStorage.setItem('push-notification-asked', 'true');
    setShowPrompt(false);
  };

  if (!showPrompt) return null;

  return (
    <Card className="fixed bottom-24 left-4 right-4 z-50 p-4 bg-gradient-to-br from-ube-orange/10 to-ube-orange/5 border-ube-orange/20 shadow-xl animate-fade-in">
      <button
        onClick={handleDismiss}
        className="absolute top-2 right-2 p-1 rounded-full hover:bg-muted/20 transition-colors"
      >
        <X className="w-4 h-4 text-muted-foreground" />
      </button>

      <div className="flex gap-3">
        <div className="w-10 h-10 rounded-full bg-ube-orange/20 flex items-center justify-center flex-shrink-0">
          <Bell className="w-5 h-5 text-ube-orange" />
        </div>

        <div className="flex-1">
          <h3 className="font-semibold text-sm mb-1">
            Mis nooit je streak!
          </h3>
          <p className="text-xs text-muted-foreground mb-3">
            Krijg elke dag om 18:00 een reminder als je nog items open hebt staan
          </p>

          <div className="flex gap-2">
            <Button
              onClick={handleEnable}
              disabled={isSubscribing}
              className="bg-ube-orange hover:bg-ube-orange/90 text-white flex-1"
              size="sm"
            >
              {isSubscribing ? "Bezig..." : "Inschakelen"}
            </Button>
            <Button
              onClick={handleDismiss}
              variant="ghost"
              size="sm"
              className="text-muted-foreground"
            >
              Later
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
};
