import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { RefreshCw, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export function PWAUpdatePrompt() {
  const { toast } = useToast();
  const [showPrompt, setShowPrompt] = useState(false);
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then((reg) => {
        setRegistration(reg);
        reg.addEventListener('updatefound', () => {
          const newWorker = reg.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                setShowPrompt(true);
              }
            });
          }
        });
      });
    }
  }, []);

  const handleUpdate = async () => {
    if (registration?.waiting) {
      registration.waiting.postMessage({ type: 'SKIP_WAITING' });
    }
    window.location.reload();
    setShowPrompt(false);
    toast({
      title: "App bijgewerkt",
      description: "De nieuwste versie is geïnstalleerd.",
    });
  };

  const handleDismiss = () => {
    setShowPrompt(false);
  };

  if (!showPrompt) return null;

  return (
    <div className="fixed bottom-24 left-4 right-4 z-50 animate-fade-in">
      <Card className="p-4 shadow-lg border-primary/20">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
            <RefreshCw className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-sm">Update beschikbaar</h4>
            <p className="text-xs text-muted-foreground mt-0.5">
              Er is een nieuwe versie van de app beschikbaar.
            </p>
            <div className="flex gap-2 mt-3">
              <Button size="sm" onClick={handleUpdate}>
                Nu bijwerken
              </Button>
              <Button size="sm" variant="ghost" onClick={handleDismiss}>
                Later
              </Button>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 -mr-1 -mt-1"
            onClick={handleDismiss}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </Card>
    </div>
  );
}

// Hook to check offline status with cached data info
export function useOfflineReady() {
  const [isOfflineReady, setIsOfflineReady] = useState(false);

  useEffect(() => {
    // Check if service worker is active and has cached content
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then(() => {
        setIsOfflineReady(true);
      });
    }
  }, []);

  return isOfflineReady;
}
