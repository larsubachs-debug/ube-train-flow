import { useEffect, useState } from 'react';
import { useToast } from '@/hooks/use-toast';

export function PWAUpdatePrompt() {
  const { toast } = useToast();

  useEffect(() => {
    // Clear all caches on app start to ensure fresh content
    const clearAllCaches = async () => {
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map(name => caches.delete(name)));
      }
    };

    // Run cache clearing on mount
    clearAllCaches();

    if ('serviceWorker' in navigator) {
      // Listen for new service worker becoming active - force reload
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        window.location.reload();
      });

      navigator.serviceWorker.ready.then(async (reg) => {
        // Force update check immediately
        try {
          await reg.update();
        } catch (e) {
          console.log('Service worker update check failed:', e);
        }
        
        // Check for updates every 30 seconds (more aggressive)
        setInterval(async () => {
          try {
            await reg.update();
          } catch (e) {
            console.log('Service worker update check failed:', e);
          }
        }, 30 * 1000);

        // If there's a waiting service worker, activate it immediately
        if (reg.waiting) {
          reg.waiting.postMessage({ type: 'SKIP_WAITING' });
        }

        reg.addEventListener('updatefound', () => {
          const newWorker = reg.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed') {
                // New version available - auto-activate it immediately
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

      // Also unregister and re-register service worker on visibility change
      document.addEventListener('visibilitychange', async () => {
        if (document.visibilityState === 'visible') {
          const reg = await navigator.serviceWorker.ready;
          try {
            await reg.update();
          } catch (e) {
            console.log('Service worker update on visibility change failed:', e);
          }
        }
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
