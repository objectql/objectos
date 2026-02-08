/**
 * ChartWidget — dashboard chart widget.
 *
 * Renders various chart types (bar, line, pie, donut, area, number)
 * using pure CSS/SVG. No external chart library dependency.
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { ChartConfig } from '@/types/workflow';

interface ChartWidgetProps {
  config: ChartConfig;
}

const DEFAULT_COLORS = [
  '#3b82f6', '#8b5cf6', '#22c55e', '#f59e0b', '#ef4444',
  '#06b6d4', '#ec4899', '#14b8a6', '#f97316', '#6366f1',
];

function getColor(index: number, explicit?: string): string {
  return explicit ?? DEFAULT_COLORS[index % DEFAULT_COLORS.length];
}

function NumberChart({ config }: { config: ChartConfig }) {
  const value = config.data[0]?.value ?? 0;
  const label = config.data[0]?.label ?? '';
  const formatted = new Intl.NumberFormat().format(value);
  return (
    <div className="flex flex-col items-center justify-center py-4">
      <span className="text-3xl font-bold tracking-tight">{formatted}</span>
      {label && <span className="text-sm text-muted-foreground">{label}</span>}
    </div>
  );
}

function BarChart({ config }: { config: ChartConfig }) {
  const maxValue = Math.max(...config.data.map((d) => d.value), 1);
  return (
    <div className="space-y-2">
      {config.data.map((point, i) => (
        <div key={point.label} className="flex items-center gap-2">
          <span className="w-20 shrink-0 truncate text-xs text-muted-foreground">
            {point.label}
          </span>
          <div className="flex-1">
            <div
              className="h-6 rounded-sm transition-all"
              style={{
                width: `${(point.value / maxValue) * 100}%`,
                backgroundColor: getColor(i, point.color),
                minWidth: '2px',
              }}
            />
          </div>
          <span className="w-10 shrink-0 text-right text-xs font-medium">
            {point.value}
          </span>
        </div>
      ))}
    </div>
  );
}

function PieChart({ config, donut = false }: { config: ChartConfig; donut?: boolean }) {
  const total = config.data.reduce((sum, d) => sum + d.value, 0) || 1;
  const size = 120;
  const center = size / 2;
  const radius = 50;
  const innerRadius = donut ? 30 : 0;

  let cumulative = 0;
  const slices = config.data.map((point, i) => {
    const startAngle = (cumulative / total) * 2 * Math.PI - Math.PI / 2;
    cumulative += point.value;
    const endAngle = (cumulative / total) * 2 * Math.PI - Math.PI / 2;
    const largeArc = point.value / total > 0.5 ? 1 : 0;
    const color = getColor(i, point.color);

    const x1 = center + radius * Math.cos(startAngle);
    const y1 = center + radius * Math.sin(startAngle);
    const x2 = center + radius * Math.cos(endAngle);
    const y2 = center + radius * Math.sin(endAngle);

    if (donut) {
      const ix1 = center + innerRadius * Math.cos(startAngle);
      const iy1 = center + innerRadius * Math.sin(startAngle);
      const ix2 = center + innerRadius * Math.cos(endAngle);
      const iy2 = center + innerRadius * Math.sin(endAngle);

      return (
        <path
          key={point.label}
          d={`M ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} L ${ix2} ${iy2} A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${ix1} ${iy1} Z`}
          fill={color}
        />
      );
    }

    return (
      <path
        key={point.label}
        d={`M ${center} ${center} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z`}
        fill={color}
      />
    );
  });

  return (
    <div className="flex items-center gap-4">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label={config.title}>
        {slices}
      </svg>
      <div className="space-y-1">
        {config.data.map((point, i) => (
          <div key={point.label} className="flex items-center gap-2 text-xs">
            <div
              className="size-2.5 rounded-full"
              style={{ backgroundColor: getColor(i, point.color) }}
            />
            <span className="text-muted-foreground">{point.label}</span>
            <span className="font-medium">{point.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function ChartWidget({ config }: ChartWidgetProps) {
  return (
    <Card data-testid="chart-widget">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">{config.title}</CardTitle>
        {config.description && (
          <p className="text-xs text-muted-foreground">{config.description}</p>
        )}
      </CardHeader>
      <CardContent>
        {config.type === 'number' && <NumberChart config={config} />}
        {config.type === 'bar' && <BarChart config={config} />}
        {(config.type === 'line' || config.type === 'area') && <BarChart config={config} />}
        {config.type === 'pie' && <PieChart config={config} />}
        {config.type === 'donut' && <PieChart config={config} donut />}
      </CardContent>
    </Card>
  );
}
