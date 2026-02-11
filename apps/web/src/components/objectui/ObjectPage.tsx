/**
 * ObjectPage — bridge component wrapping SchemaRenderer with ObjectOS permissions check.
 *
 * Combines @object-ui SchemaRenderer with ObjectOS-specific features:
 * - Permission-based access control
 * - Loading and error states
 * - Consistent styling within the Admin Console shell
 *
 * Task H.4.1
 */

import { SchemaRenderer } from '@object-ui/react';
import { objectUIAdapter } from '@/lib/object-ui-adapter';
import { useObjectDefinition } from '@/hooks/use-metadata';
interface ObjectPageProps {
  /** Object name to render */
  objectName: string;
  /** View mode passed to SchemaRenderer */
  view: string;
  /** Optional record ID for detail/edit views */
  recordId?: string;
  /** Optional callback when record is saved */
  onSave?: (record: Record<string, unknown>) => void;
  /** Optional callback when save is cancelled */
  onCancel?: () => void;
  /** Optional CSS class name */
  className?: string;
}

export function ObjectPage({
  objectName,
  view,
  recordId,
  onSave,
  onCancel,
  className,
}: ObjectPageProps) {
  const { data: objectDef, isLoading, error } = useObjectDefinition(objectName);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full size-8 border-2 border-muted border-t-primary" />
      </div>
    );
  }

  if (error || !objectDef) {
    return (
      <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4">
        <h3 className="text-sm font-semibold text-destructive">Access Denied</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          You do not have permission to view this object, or it does not exist.
        </p>
      </div>
    );
  }

  return (
    <div className={className} data-testid="object-page">
      <SchemaRenderer
        adapter={objectUIAdapter}
        objectName={objectName}
        view={view}
        recordId={recordId}
        onSave={onSave}
        onCancel={onCancel}
      />
    </div>
  );
}
