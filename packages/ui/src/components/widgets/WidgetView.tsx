import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ObjectView } from '../views/ObjectView';

export interface WidgetViewProps {
  view_id?: string;
  object?: string;
  view?: string;
  title?: string;
}

export const WidgetView: React.FC<WidgetViewProps> = ({ view_id, object, view, title }) => {
  const objectName = object || "unknown"; // TODO: Resolve from view_id if needed
  
  return (
    <Card className="col-span-12">
      {title && (
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
      )}
      <CardContent>
         <ObjectView objectName={objectName} viewName={view} />
      </CardContent>
    </Card>
  );
};
