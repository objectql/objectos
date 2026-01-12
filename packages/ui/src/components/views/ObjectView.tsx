import React, { Suspense } from 'react';
// import { FindOptions } from '@objectql/types';
import { Card } from '@/components/ui/card';

// Lazy load view components to avoid circular deps and bundle size
const ObjectGridView = React.lazy(() => import('./ObjectGridView').then(module => ({ default: module.ObjectGridView })));
// const ObjectKanbanView = React.lazy(() => import('./ObjectKanbanView'));
// const ObjectCalendarView = React.lazy(() => import('./ObjectCalendarView'));

export interface ObjectViewProps {
  objectName: string;
  viewName?: string;
  initialFilter?: any; // FindOptions;
}

export const ObjectView: React.FC<ObjectViewProps> = ({ objectName, viewName, initialFilter }) => {
  // TODO: Load view definition (YAML) from Kernel using objectName + viewName
  // For now, mock the resolving logic
  
  const viewType = 'grid' as string; // Resolved from YAML

  const renderView = () => {
    switch (viewType) {
      case 'grid':
      case 'list':
        return <ObjectGridView data={[]} />; // TODO: Pass real data and config
      case 'kanban':
        return <div>Kanban View (Not Implemented)</div>;
      default:
        return <div>Unknown View Type: {viewType}</div>;
    }
  };

  return (
    <div className="w-full h-full flex flex-col space-y-4">
      {/* View Toolbar will go here */}
      <Suspense fallback={<div>Loading view...</div>}>
         {renderView()}
      </Suspense>
    </div>
  );
};
