import { useEffect, useState } from 'react';
import { Download, Smartphone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLocalStorage } from '@/hooks/useLocalStorage';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function PWAInstallBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [dismissed, setDismissed] = useLocalStorage('pwa-banner-dismissed', false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Check if already installed
    const standalone = window.matchMedia('(display-mode: standalone)').matches;
    setIsStandalone(standalone);

    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
    }
  };

  const handleDismiss = () => {
    setDismissed(true);
    setDeferredPrompt(null);
  };

  // Don't show if already installed, dismissed, or no prompt available
  if (isStandalone || dismissed || !deferredPrompt) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 z-40 animate-fade-in">
      <div className="bg-card border rounded-xl p-4 shadow-lg flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
          <Smartphone className="w-5 h-5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium">Installeer de app</p>
          <p className="text-xs text-muted-foreground">
            Voeg toe aan je startscherm
          </p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="ghost" onClick={handleDismiss}>
            Later
          </Button>
          <Button size="sm" onClick={handleInstall}>
            <Download className="w-4 h-4 mr-1" />
            Installeer
          </Button>
        </div>
      </div>
    </div>
  );
}
