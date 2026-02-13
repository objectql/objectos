/**
 * Prometheus Exporter
 *
 * Formats metrics in Prometheus text format
 */

import { MetricType } from './types.js';
import type { Labels, Metric, CounterMetric, GaugeMetric, HistogramMetric } from './types.js';
import { HistogramCollector } from './collectors.js';

/**
 * Format labels for Prometheus output
 */
function formatLabels(labels: Labels): string {
  const entries = Object.entries(labels);
  if (entries.length === 0) {
    return '';
  }

  const formatted = entries.map(([key, value]) => `${key}="${escapeLabel(value)}"`).join(',');

  return `{${formatted}}`;
}

/**
 * Escape label values for Prometheus format
 */
function escapeLabel(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n');
}

/**
 * Format a single metric in Prometheus text format
 */
function formatMetric(metric: Metric): string {
  const lines: string[] = [];
  const labelsStr = formatLabels(metric.labels);

  // Add HELP and TYPE comments
  lines.push(`# HELP ${metric.name} ${metric.help}`);
  lines.push(`# TYPE ${metric.name} ${metric.type}`);

  switch (metric.type) {
    case MetricType.Counter:
    case MetricType.Gauge: {
      const m = metric as CounterMetric | GaugeMetric;
      lines.push(`${metric.name}${labelsStr} ${m.value} ${metric.timestamp}`);
      break;
    }

    case MetricType.Histogram: {
      const m = metric as HistogramMetric;
      const baseName = metric.name;

      // Calculate percentiles using a temporary collector
      const collector = new HistogramCollector(baseName, metric.help, metric.labels);

      // Restore observations
      m.observations.forEach((obs: any) => {
        collector.observe(obs.value);
      });

      const percentiles = collector.calculatePercentiles();

      // Output histogram metrics
      lines.push(`${baseName}_sum${labelsStr} ${m.sum} ${metric.timestamp}`);
      lines.push(`${baseName}_count${labelsStr} ${m.count} ${metric.timestamp}`);

      // Add percentile metrics
      lines.push(`${baseName}_p50${labelsStr} ${percentiles.p50} ${metric.timestamp}`);
      lines.push(`${baseName}_p90${labelsStr} ${percentiles.p90} ${metric.timestamp}`);
      lines.push(`${baseName}_p95${labelsStr} ${percentiles.p95} ${metric.timestamp}`);
      lines.push(`${baseName}_p99${labelsStr} ${percentiles.p99} ${metric.timestamp}`);
      break;
    }
  }

  return lines.join('\n');
}

/**
 * Export metrics in Prometheus text format
 */
export function exportPrometheus(metrics: Metric[]): string {
  if (metrics.length === 0) {
    return '';
  }

  const formatted = metrics.map((metric) => formatMetric(metric));
  return formatted.join('\n\n') + '\n';
}

/**
 * Parse Prometheus metric name and labels from a line
 */
export function parsePrometheusLine(
  line: string,
): { name: string; labels: Labels; value: number } | null {
  // Skip comments and empty lines
  if (line.startsWith('#') || line.trim() === '') {
    return null;
  }

  // Parse metric line: name{labels} value timestamp
  const match = line.match(
    /^([a-zA-Z_][a-zA-Z0-9_]*)((?:\{[^}]*\})?) ([+-]?[0-9.eE]+)(?: ([0-9]+))?$/,
  );
  if (!match) {
    return null;
  }

  const name = match[1];
  const labelsStr = match[2];
  const value = parseFloat(match[3]);

  // Parse labels
  const labels: Labels = {};
  if (labelsStr && labelsStr.length > 2) {
    const labelsContent = labelsStr.slice(1, -1); // Remove { }
    const labelPairs = labelsContent.match(/([a-zA-Z_][a-zA-Z0-9_]*)="([^"]*)"/g);

    if (labelPairs) {
      labelPairs.forEach((pair) => {
        const [key, val] = pair.split('=');
        labels[key] = val.slice(1, -1); // Remove quotes
      });
    }
  }

  return { name, labels, value };
}
