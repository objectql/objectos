/**
 * ObjectUI Integration Example
 * 
 * Demonstrates how to use @object-ui components in the ObjectOS console.
 * This component uses the SchemaRenderer from @object-ui/react to render
 * metadata-driven UI components.
 */

import { SchemaRenderer } from '@object-ui/react';
import { objectUIAdapter } from '@/lib/object-ui-adapter';

interface ObjectUIExampleProps {
  /** Object name to render */
  objectName: string;
  /** View mode: 'form', 'grid', 'detail', 'kanban', etc. */
  view?: string;
  /** Optional record ID for detail/edit views */
  recordId?: string;
}

/**
 * Example component showing how to integrate @object-ui components.
 * 
 * The SchemaRenderer will automatically fetch object metadata from the ObjectStack
 * backend and render the appropriate view based on the schema definition.
 */
export function ObjectUIExample({ 
  objectName, 
  view = 'grid',
  recordId 
}: ObjectUIExampleProps) {
  return (
    <SchemaRenderer
      adapter={objectUIAdapter}
      objectName={objectName}
      view={view}
      recordId={recordId}
    />
  );
}

export default ObjectUIExample;
