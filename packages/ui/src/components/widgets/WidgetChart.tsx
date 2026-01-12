import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export interface WidgetChartProps {
  chart_id: string;
}

export const WidgetChart: React.FC<WidgetChartProps> = ({ chart_id }) => {
  return (
    <Card className="col-span-4">
      <CardHeader>
        <CardTitle>Chart: {chart_id}</CardTitle>
      </CardHeader>
      <CardContent className="pl-2">
        <div className="h-[200px] flex items-center justify-center border border-dashed rounded bg-muted/20">
            Visualization Primitive Placeholder
        </div>
      </CardContent>
    </Card>
  );
};
