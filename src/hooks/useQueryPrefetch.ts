import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

type PrefetchFn = () => Promise<void>;

interface UsePrefetchOptions {
  delay?: number;
  staleTime?: number;
}

export function useQueryPrefetch() {
  const queryClient = useQueryClient();
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const prefetchedRef = useRef<Set<string>>(new Set());

  const prefetchOnHover = useCallback(
    (key: string, prefetchFn: PrefetchFn, options: UsePrefetchOptions = {}) => {
      const { delay = 200, staleTime = 30000 } = options;

      return {
        onMouseEnter: () => {
          // Don't prefetch if already prefetched recently
          if (prefetchedRef.current.has(key)) return;

          hoverTimeoutRef.current = setTimeout(async () => {
            try {
              await prefetchFn();
              prefetchedRef.current.add(key);
              
              // Remove from prefetched set after stale time
              setTimeout(() => {
                prefetchedRef.current.delete(key);
              }, staleTime);
            } catch (error) {
              console.error('Prefetch failed:', error);
            }
          }, delay);
        },
        onMouseLeave: () => {
          if (hoverTimeoutRef.current) {
            clearTimeout(hoverTimeoutRef.current);
            hoverTimeoutRef.current = null;
          }
        },
      };
    },
    []
  );

  // Prefetch program details
  const prefetchProgram = useCallback(
    (programId: string) => {
      return prefetchOnHover(`program-${programId}`, async () => {
        await queryClient.prefetchQuery({
          queryKey: ['program', programId],
          queryFn: async () => {
            const { data } = await supabase
              .from('programs')
              .select('*, weeks(*, workouts(*))')
              .eq('id', programId)
              .single();
            return data;
          },
          staleTime: 30000,
        });
      });
    },
    [queryClient, prefetchOnHover]
  );

  // Prefetch workout details
  const prefetchWorkout = useCallback(
    (workoutId: string) => {
      return prefetchOnHover(`workout-${workoutId}`, async () => {
        await queryClient.prefetchQuery({
          queryKey: ['workout', workoutId],
          queryFn: async () => {
            const { data } = await supabase
              .from('workouts')
              .select('*, exercises(*)')
              .eq('id', workoutId)
              .single();
            return data;
          },
          staleTime: 30000,
        });
      });
    },
    [queryClient, prefetchOnHover]
  );

  // Prefetch member details (for coaches)
  const prefetchMember = useCallback(
    (memberId: string) => {
      return prefetchOnHover(`member-${memberId}`, async () => {
        await queryClient.prefetchQuery({
          queryKey: ['member', memberId],
          queryFn: async () => {
            const { data } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', memberId)
              .single();
            return data;
          },
          staleTime: 30000,
        });
      });
    },
    [queryClient, prefetchOnHover]
  );

  return {
    prefetchOnHover,
    prefetchProgram,
    prefetchWorkout,
    prefetchMember,
  };
}
