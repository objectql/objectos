/**
 * OfflineIndicator — visual indicator for connectivity status.
 *
 * Shows a subtle banner or badge when the user is offline,
 * along with pending sync count.
 */

import { Wifi, WifiOff, RefreshCw } from 'lucide-react';
import { useOfflineStatus } from '@/hooks/use-offline';
import { useSyncEngine } from '@/hooks/use-sync';

export function OfflineIndicator() {
  const { isOnline } = useOfflineStatus();
  const { pendingCount, status } = useSyncEngine();

  if (isOnline && pendingCount === 0 && status !== 'syncing') {
    return null;
  }

  return (
    <div
      className="flex items-center gap-2 rounded-md border px-3 py-1.5 text-xs font-medium"
      role="status"
      aria-live="polite"
      data-testid="offline-indicator"
    >
      {!isOnline ? (
        <>
          <WifiOff className="size-3.5 text-destructive" aria-hidden="true" />
          <span className="text-destructive">Offline</span>
        </>
      ) : status === 'syncing' ? (
        <>
          <RefreshCw className="size-3.5 animate-spin text-muted-foreground" aria-hidden="true" />
          <span>Syncing…</span>
        </>
      ) : (
        <>
          <Wifi className="size-3.5 text-muted-foreground" aria-hidden="true" />
          <span>Online</span>
        </>
      )}

      {pendingCount > 0 && (
        <span className="rounded-full bg-primary px-1.5 text-[10px] text-primary-foreground">
          {pendingCount}
        </span>
      )}
    </div>
  );
}
