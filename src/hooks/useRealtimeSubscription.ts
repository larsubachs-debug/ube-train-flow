import { useEffect, useCallback, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js';

type PostgresChangeEvent = 'INSERT' | 'UPDATE' | 'DELETE' | '*';

interface RealtimeSubscriptionOptions<T> {
  table: string;
  schema?: string;
  event?: PostgresChangeEvent;
  filter?: string;
  queryKey?: string[];
  onInsert?: (payload: T) => void;
  onUpdate?: (payload: T) => void;
  onDelete?: (payload: { old: T }) => void;
  enabled?: boolean;
}

export function useRealtimeSubscription<T extends Record<string, any>>({
  table,
  schema = 'public',
  event = '*',
  filter,
  queryKey,
  onInsert,
  onUpdate,
  onDelete,
  enabled = true,
}: RealtimeSubscriptionOptions<T>) {
  const queryClient = useQueryClient();
  const channelRef = useRef<RealtimeChannel | null>(null);

  const handleChange = useCallback(
    (payload: RealtimePostgresChangesPayload<T>) => {
      // Invalidate related queries
      if (queryKey) {
        queryClient.invalidateQueries({ queryKey });
      }

      // Call specific handlers
      switch (payload.eventType) {
        case 'INSERT':
          onInsert?.(payload.new as T);
          break;
        case 'UPDATE':
          onUpdate?.(payload.new as T);
          break;
        case 'DELETE':
          onDelete?.({ old: payload.old as T });
          break;
      }
    },
    [queryClient, queryKey, onInsert, onUpdate, onDelete]
  );

  useEffect(() => {
    if (!enabled) return;

    const channelName = `${table}-changes-${Date.now()}`;
    
    const channelConfig: any = {
      event,
      schema,
      table,
    };
    
    if (filter) {
      channelConfig.filter = filter;
    }
    
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes' as any,
        channelConfig,
        handleChange as any
      )
      .subscribe((status) => {
        if (status === 'CHANNEL_ERROR') {
          console.error(`Realtime subscription error for ${table}`);
        }
      });

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [table, schema, event, filter, enabled, handleChange]);

  return {
    unsubscribe: () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    },
  };
}

// Preset hooks for common subscriptions
export function useChatMessagesRealtime(memberId: string, coachId: string) {
  return useRealtimeSubscription({
    table: 'chat_messages',
    event: 'INSERT',
    filter: `member_id=eq.${memberId}`,
    queryKey: ['chat-messages', memberId, coachId],
  });
}

export function useWorkoutCompletionsRealtime(userId: string) {
  return useRealtimeSubscription({
    table: 'workout_completions',
    event: '*',
    filter: `user_id=eq.${userId}`,
    queryKey: ['workout-completions', userId],
  });
}

export function useTaskCompletionsRealtime(userId: string) {
  return useRealtimeSubscription({
    table: 'task_completions',
    event: '*',
    filter: `user_id=eq.${userId}`,
    queryKey: ['task-completions', userId],
  });
}

export function useProfileUpdatesRealtime(userId: string) {
  return useRealtimeSubscription({
    table: 'profiles',
    event: 'UPDATE',
    filter: `user_id=eq.${userId}`,
    queryKey: ['profile', userId],
  });
}
