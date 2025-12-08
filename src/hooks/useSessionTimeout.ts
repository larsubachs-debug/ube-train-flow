import { useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

const TIMEOUT_DURATION = 30 * 60 * 1000; // 30 minutes
const WARNING_BEFORE = 5 * 60 * 1000; // 5 minutes before timeout

export function useSessionTimeout() {
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const warningRef = useRef<NodeJS.Timeout | null>(null);
  const hasWarnedRef = useRef(false);

  const clearTimers = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (warningRef.current) {
      clearTimeout(warningRef.current);
      warningRef.current = null;
    }
  }, []);

  const handleTimeout = useCallback(async () => {
    toast({
      title: "Sessie verlopen",
      description: "Je bent automatisch uitgelogd wegens inactiviteit.",
      variant: "destructive",
    });
    await signOut();
  }, [signOut, toast]);

  const showWarning = useCallback(() => {
    if (!hasWarnedRef.current) {
      hasWarnedRef.current = true;
      toast({
        title: "Sessie verloopt binnenkort",
        description: "Je sessie verloopt over 5 minuten. Beweeg je muis of klik om actief te blijven.",
      });
    }
  }, [toast]);

  const resetTimer = useCallback(() => {
    if (!user) return;

    hasWarnedRef.current = false;
    clearTimers();

    // Set warning timer
    warningRef.current = setTimeout(() => {
      showWarning();
    }, TIMEOUT_DURATION - WARNING_BEFORE);

    // Set timeout timer
    timeoutRef.current = setTimeout(() => {
      handleTimeout();
    }, TIMEOUT_DURATION);
  }, [user, clearTimers, showWarning, handleTimeout]);

  useEffect(() => {
    if (!user) {
      clearTimers();
      return;
    }

    // Events that reset the timer
    const events = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart', 'click'];
    
    const handleActivity = () => {
      resetTimer();
    };

    // Add event listeners
    events.forEach(event => {
      document.addEventListener(event, handleActivity, { passive: true });
    });

    // Initial timer setup
    resetTimer();

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, handleActivity);
      });
      clearTimers();
    };
  }, [user, resetTimer, clearTimers]);

  return { resetTimer };
}
