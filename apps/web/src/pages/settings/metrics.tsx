import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface Metric {
  name: string;
  type: 'counter' | 'gauge' | 'histogram';
  help: string;
  value?: number;
  labels?: Record<string, string>;
  timestamp: number;
  observations?: number[];
  percentiles?: {
    p50: number;
    p75: number;
    p90: number;
    p95: number;
    p99: number;
  };
  sum?: number;
  count?: number;
  min?: number;
  max?: number;
  mean?: number;
}

export default function MetricsPage() {
  const { data: metricsData, isLoading } = useQuery({
    queryKey: ['metrics'],
    queryFn: async () => {
      const response = await fetch('/api/v1/metrics');
      if (!response.ok) throw new Error('Failed to fetch metrics');
      return response.json();
    },
    refetchInterval: 5000, // Refresh every 5 seconds
  });

  const metrics: Metric[] = metricsData?.data || [];

  function formatValue(value: number | undefined): string {
    if (value === undefined) return '-';
    if (value >= 1000000) return `${(value / 1000000).toFixed(2)}M`;
    if (value >= 1000) return `${(value / 1000).toFixed(2)}K`;
    return value.toFixed(2);
  }

  function formatLabels(labels?: Record<string, string>): string {
    if (!labels || Object.keys(labels).length === 0) return '';
    return Object.entries(labels)
      .map(([key, value]) => `${key}="${value}"`)
      .join(', ');
  }

  // Group metrics by type
  const counterMetrics = metrics.filter((m) => m.type === 'counter');
  const gaugeMetrics = metrics.filter((m) => m.type === 'gauge');
  const histogramMetrics = metrics.filter((m) => m.type === 'histogram');

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Metrics Dashboard</h2>
        <p className="text-muted-foreground">
          System metrics and performance indicators from ObjectOS kernel.
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Metrics</CardDescription>
            <CardTitle className="text-3xl">{metrics.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Counters</CardDescription>
            <CardTitle className="text-3xl">{counterMetrics.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Histograms</CardDescription>
            <CardTitle className="text-3xl">{histogramMetrics.length}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full size-8 border-2 border-muted border-t-primary" />
        </div>
      ) : metrics.length === 0 ? (
        <Card>
          <CardContent className="py-8">
            <div className="text-center text-muted-foreground">No metrics available</div>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Counters */}
          {counterMetrics.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Counters</CardTitle>
                <CardDescription>
                  Monotonically increasing values tracking event counts
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Metric</TableHead>
                      <TableHead>Labels</TableHead>
                      <TableHead className="text-right">Value</TableHead>
                      <TableHead>Description</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {counterMetrics.map((metric, idx) => (
                      <TableRow key={idx}>
                        <TableCell className="font-medium">{metric.name}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {formatLabels(metric.labels)}
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          {formatValue(metric.value)}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {metric.help}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

          {/* Gauges */}
          {gaugeMetrics.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Gauges</CardTitle>
                <CardDescription>Current values that can increase or decrease</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Metric</TableHead>
                      <TableHead>Labels</TableHead>
                      <TableHead className="text-right">Value</TableHead>
                      <TableHead>Description</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {gaugeMetrics.map((metric, idx) => (
                      <TableRow key={idx}>
                        <TableCell className="font-medium">{metric.name}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {formatLabels(metric.labels)}
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          {formatValue(metric.value)}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {metric.help}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

          {/* Histograms */}
          {histogramMetrics.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Histograms</CardTitle>
                <CardDescription>Distribution of values with percentile breakdowns</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Metric</TableHead>
                      <TableHead>Count</TableHead>
                      <TableHead>Mean</TableHead>
                      <TableHead>P50</TableHead>
                      <TableHead>P95</TableHead>
                      <TableHead>P99</TableHead>
                      <TableHead>Max</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {histogramMetrics.map((metric, idx) => (
                      <TableRow key={idx}>
                        <TableCell className="font-medium">{metric.name}</TableCell>
                        <TableCell className="font-mono">{metric.count || 0}</TableCell>
                        <TableCell className="font-mono">{formatValue(metric.mean)}</TableCell>
                        <TableCell className="font-mono">
                          {formatValue(metric.percentiles?.p50)}
                        </TableCell>
                        <TableCell className="font-mono">
                          {formatValue(metric.percentiles?.p95)}
                        </TableCell>
                        <TableCell className="font-mono">
                          {formatValue(metric.percentiles?.p99)}
                        </TableCell>
                        <TableCell className="font-mono">{formatValue(metric.max)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

          {/* Prometheus Export */}
          <Card>
            <CardHeader>
              <CardTitle>Prometheus Export</CardTitle>
              <CardDescription>Export metrics in Prometheus text format</CardDescription>
            </CardHeader>
            <CardContent>
              <a
                href="/api/v1/metrics/prometheus"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-primary hover:underline"
              >
                /api/v1/metrics/prometheus
              </a>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
