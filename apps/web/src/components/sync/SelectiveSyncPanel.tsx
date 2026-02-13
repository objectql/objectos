/**
 * SelectiveSyncPanel — choose which objects to cache offline.
 *
 * Allows users to configure which object types should be synchronized
 * and cached locally for offline access.
 *
 * Phase K — Task K.6
 */

import { useState, useCallback } from 'react';
import { Database, Download, Trash2, HardDrive } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { ObjectDefinition } from '@/types/metadata';

export interface SyncConfig {
  objectName: string;
  enabled: boolean;
  /** Maximum records to sync locally */
  maxRecords: number;
  /** Last sync timestamp */
  lastSyncAt?: string;
  /** Number of records currently cached */
  cachedCount: number;
}

interface SelectiveSyncPanelProps {
  objects: ObjectDefinition[];
  configs: SyncConfig[];
  onToggleSync: (objectName: string, enabled: boolean) => void;
  onSyncNow?: (objectName: string) => void;
  onClearCache?: (objectName: string) => void;
  /** Total local storage usage in bytes */
  storageUsed?: number;
  /** Storage quota in bytes */
  storageQuota?: number;
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export function SelectiveSyncPanel({
  objects,
  configs,
  onToggleSync,
  onSyncNow,
  onClearCache,
  storageUsed = 0,
  storageQuota = 0,
}: SelectiveSyncPanelProps) {
  const [expandedObject, setExpandedObject] = useState<string | null>(null);

  const getConfig = useCallback(
    (objectName: string): SyncConfig | undefined => {
      return configs.find((c) => c.objectName === objectName);
    },
    [configs],
  );

  const enabledCount = configs.filter((c) => c.enabled).length;
  const totalCached = configs.reduce((sum, c) => sum + c.cachedCount, 0);
  const storagePercent = storageQuota > 0 ? Math.round((storageUsed / storageQuota) * 100) : 0;

  return (
    <Card data-testid="selective-sync-panel">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Database className="size-5 text-muted-foreground" />
            <CardTitle>Offline Sync</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary">
              {enabledCount} object{enabledCount !== 1 ? 's' : ''} synced
            </Badge>
            <Badge variant="outline">{totalCached} records cached</Badge>
          </div>
        </div>
        {storageQuota > 0 && (
          <div className="mt-3">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <HardDrive className="size-3" />
                Local storage: {formatBytes(storageUsed)} / {formatBytes(storageQuota)}
              </span>
              <span>{storagePercent}% used</span>
            </div>
            <div className="mt-1 h-1.5 w-full rounded-full bg-muted">
              <div
                className={`h-full rounded-full transition-all ${
                  storagePercent > 90
                    ? 'bg-red-500'
                    : storagePercent > 70
                      ? 'bg-yellow-500'
                      : 'bg-green-500'
                }`}
                style={{ width: `${Math.min(storagePercent, 100)}%` }}
              />
            </div>
          </div>
        )}
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {objects.map((obj) => {
            const config = getConfig(obj.name);
            const isEnabled = config?.enabled ?? false;
            const isExpanded = expandedObject === obj.name;

            return (
              <div key={obj.name} className="rounded-lg border">
                <div
                  className="flex cursor-pointer items-center gap-3 px-4 py-3"
                  onClick={() => setExpandedObject(isExpanded ? null : obj.name)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      setExpandedObject(isExpanded ? null : obj.name);
                    }
                  }}
                >
                  <input
                    type="checkbox"
                    checked={isEnabled}
                    onChange={(e) => {
                      e.stopPropagation();
                      onToggleSync(obj.name, !isEnabled);
                    }}
                    className="size-4 rounded"
                    aria-label={`Sync ${obj.label ?? obj.name} offline`}
                  />
                  <div className="flex-1">
                    <span className="font-medium">{obj.label ?? obj.name}</span>
                    {obj.description && (
                      <p className="text-xs text-muted-foreground">{obj.description}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {config?.cachedCount ? (
                      <Badge variant="secondary" className="text-xs">
                        {config.cachedCount} cached
                      </Badge>
                    ) : null}
                    {config?.lastSyncAt && (
                      <span className="text-xs text-muted-foreground">
                        Synced {new Date(config.lastSyncAt).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>

                {isExpanded && isEnabled && (
                  <div className="border-t px-4 py-2">
                    <div className="flex items-center gap-2">
                      {onSyncNow && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-1 text-xs"
                          onClick={() => onSyncNow(obj.name)}
                        >
                          <Download className="size-3" />
                          Sync now
                        </Button>
                      )}
                      {onClearCache && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="gap-1 text-xs text-destructive hover:text-destructive"
                          onClick={() => onClearCache(obj.name)}
                        >
                          <Trash2 className="size-3" />
                          Clear cache
                        </Button>
                      )}
                      <span className="ml-auto text-xs text-muted-foreground">
                        Max: {config?.maxRecords ?? 1000} records
                      </span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
