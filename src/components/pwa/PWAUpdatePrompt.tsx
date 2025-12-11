import { useEffect, useState } from 'react';
import { useToast } from '@/hooks/use-toast';

export function PWAUpdatePrompt() {
  const { toast } = useToast();

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      // Listen for new service worker becoming active
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        window.location.reload();
      });

      navigator.serviceWorker.ready.then((reg) => {
        // Check for updates immediately
        reg.update();
        
        // Check for updates every 60 seconds
        setInterval(() => {
          reg.update();
        }, 60 * 1000);

        reg.addEventListener('updatefound', () => {
          const newWorker = reg.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                // New version available - auto-activate it
                newWorker.postMessage({ type: 'SKIP_WAITING' });
                toast({
                  title: "App wordt bijgewerkt...",
                  description: "Even geduld, de nieuwste versie wordt geladen.",
                });
              }
            });
          }
        });
      });
    }
  }, [toast]);

  return null; // No UI needed - updates happen automatically
}

// Hook to check offline status with cached data info
export function useOfflineReady() {
  const [isOfflineReady, setIsOfflineReady] = useState(false);

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then(() => {
        setIsOfflineReady(true);
      });
    }
  }, []);

  return isOfflineReady;
}
