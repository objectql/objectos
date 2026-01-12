import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export interface WidgetMetricProps {
  label: string;
  value: string | number;
  trend?: {
    value: number;
    direction: 'up' | 'down' | 'neutral';
  };
  format?: string;
}

export const WidgetMetric: React.FC<WidgetMetricProps> = ({ label, value, trend, format }) => {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">
          {label}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {trend && (
          <p className="text-xs text-muted-foreground">
            {trend.value}% {trend.direction === 'up' ? 'Increase' : 'Decrease'}
          </p>
        )}
      </CardContent>
    </Card>
  );
};
