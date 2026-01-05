import { useEffect, useState } from 'react';
import { useToast } from '@/hooks/use-toast';

// App version - increment this to force cache bust
const APP_VERSION = '2026.01.05.1';

export function PWAUpdatePrompt() {
  const { toast } = useToast();

  useEffect(() => {
    // Check stored version and clear cache if different
    const storedVersion = localStorage.getItem('app_version');
    if (storedVersion !== APP_VERSION) {
      console.log(`App version changed: ${storedVersion} -> ${APP_VERSION}`);
      
      // Clear all caches
      const clearAllCaches = async () => {
        if ('caches' in window) {
          const cacheNames = await caches.keys();
          console.log('Clearing caches:', cacheNames);
          await Promise.all(cacheNames.map(name => caches.delete(name)));
        }
        
        // Update stored version
        localStorage.setItem('app_version', APP_VERSION);
        
        // Unregister service workers and reload
        if ('serviceWorker' in navigator) {
          const registrations = await navigator.serviceWorker.getRegistrations();
          for (const registration of registrations) {
            await registration.unregister();
          }
        }
        
        // Force reload to get fresh content
        if (storedVersion !== null) {
          window.location.reload();
        }
      };
      
      clearAllCaches();
    }

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
        
        // Check for updates every 30 seconds (aggressive)
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

      // Force update check when tab becomes visible
      document.addEventListener('visibilitychange', async () => {
        if (document.visibilityState === 'visible') {
          try {
            const reg = await navigator.serviceWorker.ready;
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
