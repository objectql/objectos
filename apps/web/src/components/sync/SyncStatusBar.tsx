/**
 * SyncStatusBar — global sync status indicator.
 *
 * Shows a persistent bar at the top/bottom of the app indicating
 * the current sync state: online, offline, syncing, conflicts.
 *
 * Phase K — Task K.5
 */

import { Wifi, WifiOff, RefreshCw, AlertTriangle, CheckCircle2, CloudOff } from 'lucide-react';
import { useOfflineStatus } from '@/hooks/use-offline';
import { useSyncEngine } from '@/hooks/use-sync';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface SyncStatusBarProps {
  /** Position of the bar */
  position?: 'top' | 'bottom';
  /** Callback to open conflict resolution */
  onOpenConflicts?: () => void;
}

export function SyncStatusBar({ position = 'bottom', onOpenConflicts }: SyncStatusBarProps) {
  const { isOnline } = useOfflineStatus();
  const { pendingCount, conflictCount, status, lastSyncAt } = useSyncEngine();

  // Don't show bar when everything is fine
  if (isOnline && pendingCount === 0 && conflictCount === 0 && status === 'idle') {
    return null;
  }

  const positionClasses = position === 'top'
    ? 'fixed top-0 left-0 right-0 z-50'
    : 'fixed bottom-0 left-0 right-0 z-50';

  const bgClass = !isOnline
    ? 'bg-destructive/10 border-destructive/30'
    : conflictCount > 0
      ? 'bg-yellow-50 border-yellow-300 dark:bg-yellow-900/20 dark:border-yellow-800'
      : status === 'syncing'
        ? 'bg-blue-50 border-blue-300 dark:bg-blue-900/20 dark:border-blue-800'
        : 'bg-muted border-border';

  return (
    <div
      className={`${positionClasses} border-y ${bgClass} px-4 py-1.5`}
      role="status"
      aria-live="polite"
      data-testid="sync-status-bar"
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Connection status */}
          {!isOnline ? (
            <div className="flex items-center gap-1.5 text-sm text-destructive">
              <WifiOff className="size-4" />
              <span className="font-medium">Offline</span>
              <span className="text-xs text-muted-foreground">
                Changes will sync when you reconnect
              </span>
            </div>
          ) : status === 'syncing' ? (
            <div className="flex items-center gap-1.5 text-sm text-blue-600 dark:text-blue-400">
              <RefreshCw className="size-4 animate-spin" />
              <span className="font-medium">Syncing...</span>
            </div>
          ) : status === 'error' ? (
            <div className="flex items-center gap-1.5 text-sm text-destructive">
              <CloudOff className="size-4" />
              <span className="font-medium">Sync error</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <Wifi className="size-4" />
              <span>Online</span>
            </div>
          )}

          {/* Pending mutations */}
          {pendingCount > 0 && (
            <Badge variant="secondary" className="text-xs">
              {pendingCount} pending change{pendingCount !== 1 ? 's' : ''}
            </Badge>
          )}

          {/* Conflicts */}
          {conflictCount > 0 && (
            <div className="flex items-center gap-1.5">
              <AlertTriangle className="size-4 text-yellow-600" />
              <Badge variant="outline" className="border-yellow-500 text-xs text-yellow-700 dark:text-yellow-400">
                {conflictCount} conflict{conflictCount !== 1 ? 's' : ''}
              </Badge>
              {onOpenConflicts && (
                <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={onOpenConflicts}>
                  Resolve
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Last sync time */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {lastSyncAt && (
            <span className="flex items-center gap-1">
              <CheckCircle2 className="size-3" />
              Last sync: {new Date(lastSyncAt).toLocaleTimeString()}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
