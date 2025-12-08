import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useLocalStorage } from './useLocalStorage';
import { useNetworkStatus } from './useNetworkStatus';
import { useToast } from './use-toast';

interface OfflineAction {
  id: string;
  type: 'create' | 'update' | 'delete';
  table: string;
  data: any;
  timestamp: number;
}

export function useOfflineSync() {
  const { toast } = useToast();
  const { isOnline } = useNetworkStatus();
  const [pendingActions, setPendingActions] = useLocalStorage<OfflineAction[]>('offline-actions', []);
  const [isSyncing, setIsSyncing] = useState(false);

  // Queue an action for offline sync
  const queueAction = useCallback((action: Omit<OfflineAction, 'id' | 'timestamp'>) => {
    const newAction: OfflineAction = {
      ...action,
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
    };
    
    setPendingActions(prev => [...prev, newAction]);
    
    if (!isOnline) {
      toast({
        title: "Actie opgeslagen",
        description: "Wordt gesynchroniseerd wanneer je weer online bent.",
      });
    }
  }, [isOnline, setPendingActions, toast]);

  // Process pending actions
  const processPendingActions = useCallback(async () => {
    if (pendingActions.length === 0 || isSyncing) return;

    setIsSyncing(true);
    const failedActions: OfflineAction[] = [];

    for (const action of pendingActions) {
      try {
        const table = action.table as any;
        switch (action.type) {
          case 'create':
            await supabase.from(table).insert(action.data);
            break;
          case 'update':
            await supabase
              .from(table)
              .update(action.data.updates)
              .eq('id', action.data.id);
            break;
          case 'delete':
            await supabase
              .from(table)
              .delete()
              .eq('id', action.data.id);
            break;
        }
      } catch (error) {
        console.error('Failed to sync action:', error);
        failedActions.push(action);
      }
    }

    setPendingActions(failedActions);

    if (failedActions.length === 0 && pendingActions.length > 0) {
      toast({
        title: "Synchronisatie voltooid",
        description: `${pendingActions.length} acties gesynchroniseerd.`,
      });
    } else if (failedActions.length > 0) {
      toast({
        title: "Sommige acties mislukt",
        description: `${failedActions.length} acties konden niet worden gesynchroniseerd.`,
        variant: "destructive",
      });
    }

    setIsSyncing(false);
  }, [pendingActions, isSyncing, setPendingActions, toast]);

  // Sync when coming back online
  useEffect(() => {
    if (isOnline && pendingActions.length > 0) {
      processPendingActions();
    }
  }, [isOnline, pendingActions.length, processPendingActions]);

  return {
    queueAction,
    pendingActions,
    isSyncing,
    processPendingActions,
    hasPendingActions: pendingActions.length > 0,
  };
}

// Hook for offline-capable data fetching
export function useOfflineData<T>(
  key: string,
  fetcher: () => Promise<T>,
  options: { enabled?: boolean } = {}
) {
  const { isOnline } = useNetworkStatus();
  const [cachedData, setCachedData] = useLocalStorage<T | null>(`cache-${key}`, null);
  const [data, setData] = useState<T | null>(cachedData);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async () => {
    if (options.enabled === false) return;

    setIsLoading(true);
    setError(null);

    try {
      if (isOnline) {
        const result = await fetcher();
        setData(result);
        setCachedData(result);
      } else if (cachedData) {
        setData(cachedData);
      } else {
        throw new Error('No cached data available offline');
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
      // Fall back to cached data if available
      if (cachedData) {
        setData(cachedData);
      }
    } finally {
      setIsLoading(false);
    }
  }, [isOnline, fetcher, cachedData, setCachedData, options.enabled]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    data,
    isLoading,
    error,
    isFromCache: !isOnline && data === cachedData,
    refetch: fetchData,
  };
}
