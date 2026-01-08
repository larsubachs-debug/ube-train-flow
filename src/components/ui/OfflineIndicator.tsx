import { WifiOff, Cloud, CloudOff, RefreshCw } from 'lucide-react';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { useOfflineSync } from '@/hooks/useOfflineSync';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface OfflineIndicatorProps {
  showPendingActions?: boolean;
  className?: string;
}

export function OfflineIndicator({ showPendingActions = true, className }: OfflineIndicatorProps) {
  const { isOnline, isSlowConnection } = useNetworkStatus();
  const { hasPendingActions, pendingActions, isSyncing, processPendingActions } = useOfflineSync();

  if (isOnline && !hasPendingActions && !isSlowConnection) {
    return null;
  }

  return (
    <div className={cn("flex items-center gap-2", className)}>
      {!isOnline && (
        <Badge variant="secondary" className="bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 gap-1.5">
          <WifiOff className="h-3 w-3" />
          Offline
        </Badge>
      )}

      {isOnline && isSlowConnection && (
        <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 gap-1.5">
          <CloudOff className="h-3 w-3" />
          Langzame verbinding
        </Badge>
      )}

      {showPendingActions && hasPendingActions && (
        <Badge 
          variant="secondary" 
          className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 gap-1.5 cursor-pointer"
          onClick={() => isOnline && processPendingActions()}
        >
          {isSyncing ? (
            <RefreshCw className="h-3 w-3 animate-spin" />
          ) : (
            <Cloud className="h-3 w-3" />
          )}
          {pendingActions.length} te synchroniseren
        </Badge>
      )}
    </div>
  );
}

// Compact version for headers
export function OfflineBadge() {
  const { isOnline } = useNetworkStatus();
  const { hasPendingActions } = useOfflineSync();

  if (isOnline && !hasPendingActions) {
    return null;
  }

  return (
    <div className="flex items-center gap-1">
      {!isOnline && (
        <div className="flex items-center gap-1 px-2 py-0.5 bg-amber-100 dark:bg-amber-900/30 rounded-full">
          <WifiOff className="h-3 w-3 text-amber-600 dark:text-amber-400" />
          <span className="text-xs font-medium text-amber-700 dark:text-amber-400">Offline</span>
        </div>
      )}
      {hasPendingActions && (
        <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" title="Acties worden gesynchroniseerd" />
      )}
    </div>
  );
}

// Banner version for page tops
export function OfflineBanner() {
  const { isOnline } = useNetworkStatus();
  const { hasPendingActions, pendingActions, isSyncing, processPendingActions } = useOfflineSync();

  if (isOnline && !hasPendingActions) {
    return null;
  }

  return (
    <div className={cn(
      "px-4 py-2 flex items-center justify-between text-sm",
      !isOnline 
        ? "bg-amber-50 dark:bg-amber-900/20 border-b border-amber-200 dark:border-amber-800" 
        : "bg-blue-50 dark:bg-blue-900/20 border-b border-blue-200 dark:border-blue-800"
    )}>
      <div className="flex items-center gap-2">
        {!isOnline ? (
          <>
            <WifiOff className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            <span className="text-amber-700 dark:text-amber-400">
              Je bent offline. Wijzigingen worden lokaal opgeslagen.
            </span>
          </>
        ) : (
          <>
            <Cloud className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            <span className="text-blue-700 dark:text-blue-400">
              {pendingActions.length} wijzigingen wachten op synchronisatie
            </span>
          </>
        )}
      </div>

      {isOnline && hasPendingActions && (
        <Button 
          size="sm" 
          variant="ghost" 
          onClick={processPendingActions}
          disabled={isSyncing}
          className="text-blue-700 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/30"
        >
          {isSyncing ? (
            <RefreshCw className="h-4 w-4 animate-spin mr-1" />
          ) : (
            <RefreshCw className="h-4 w-4 mr-1" />
          )}
          Synchroniseren
        </Button>
      )}
    </div>
  );
}

// Small dot indicator for minimal UI
export function OfflineDot() {
  const { isOnline } = useNetworkStatus();
  
  if (isOnline) return null;
  
  return (
    <div 
      className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" 
      title="Offline"
    />
  );
}
