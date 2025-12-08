import { useState, useCallback, useRef } from 'react';

interface RateLimiterOptions {
  maxRequests: number;
  windowMs: number;
}

interface RateLimiterResult {
  canProceed: boolean;
  remainingRequests: number;
  resetTime: number | null;
  checkLimit: () => boolean;
  reset: () => void;
}

export function useRateLimiter(options: RateLimiterOptions): RateLimiterResult {
  const { maxRequests, windowMs } = options;
  const requestTimestamps = useRef<number[]>([]);
  const [state, setState] = useState({
    canProceed: true,
    remainingRequests: maxRequests,
    resetTime: null as number | null,
  });

  const cleanupOldRequests = useCallback(() => {
    const now = Date.now();
    requestTimestamps.current = requestTimestamps.current.filter(
      timestamp => now - timestamp < windowMs
    );
  }, [windowMs]);

  const checkLimit = useCallback(() => {
    cleanupOldRequests();
    
    const now = Date.now();
    const currentRequests = requestTimestamps.current.length;
    
    if (currentRequests >= maxRequests) {
      const oldestRequest = requestTimestamps.current[0];
      const resetTime = oldestRequest + windowMs;
      
      setState({
        canProceed: false,
        remainingRequests: 0,
        resetTime,
      });
      
      return false;
    }

    requestTimestamps.current.push(now);
    
    setState({
      canProceed: true,
      remainingRequests: maxRequests - currentRequests - 1,
      resetTime: null,
    });
    
    return true;
  }, [cleanupOldRequests, maxRequests, windowMs]);

  const reset = useCallback(() => {
    requestTimestamps.current = [];
    setState({
      canProceed: true,
      remainingRequests: maxRequests,
      resetTime: null,
    });
  }, [maxRequests]);

  return {
    ...state,
    checkLimit,
    reset,
  };
}

// Preset rate limiters
export function useFormRateLimiter() {
  return useRateLimiter({ maxRequests: 5, windowMs: 60000 }); // 5 per minute
}

export function useApiRateLimiter() {
  return useRateLimiter({ maxRequests: 30, windowMs: 60000 }); // 30 per minute
}

export function useSearchRateLimiter() {
  return useRateLimiter({ maxRequests: 10, windowMs: 10000 }); // 10 per 10 seconds
}
