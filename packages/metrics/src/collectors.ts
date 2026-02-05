/**
 * Metric Collectors
 * 
 * Implementations of different metric collector types
 */

import { MetricType } from './types.js';
import type {
    Labels,
    CounterMetric,
    GaugeMetric,
    HistogramMetric,
    HistogramObservation,
    Percentiles,
    MetricCollector,
} from './types.js';

/**
 * Counter Collector - monotonically increasing value
 */
export class CounterCollector implements MetricCollector {
    private value: number = 0;
    private timestamp: number;

    constructor(
        private name: string,
        private help: string,
        private labels: Labels = {}
    ) {
        this.timestamp = Date.now();
    }

    /**
     * Increment counter by amount (default 1)
     */
    inc(amount: number = 1): void {
        if (amount < 0) {
            throw new Error('Counter can only be incremented by non-negative values');
        }
        this.value += amount;
        this.timestamp = Date.now();
    }

    /**
     * Get current counter metric
     */
    get(): CounterMetric {
        return {
            name: this.name,
            type: MetricType.Counter,
            help: this.help,
            labels: { ...this.labels },
            timestamp: this.timestamp,
            value: this.value,
        };
    }

    /**
     * Reset counter to zero
     */
    reset(): void {
        this.value = 0;
        this.timestamp = Date.now();
    }
}

/**
 * Gauge Collector - arbitrary value that can go up or down
 */
export class GaugeCollector implements MetricCollector {
    private value: number = 0;
    private timestamp: number;

    constructor(
        private name: string,
        private help: string,
        private labels: Labels = {}
    ) {
        this.timestamp = Date.now();
    }

    /**
     * Set gauge to specific value
     */
    set(value: number): void {
        this.value = value;
        this.timestamp = Date.now();
    }

    /**
     * Increment gauge by amount (default 1)
     */
    inc(amount: number = 1): void {
        this.value += amount;
        this.timestamp = Date.now();
    }

    /**
     * Decrement gauge by amount (default 1)
     */
    dec(amount: number = 1): void {
        this.value -= amount;
        this.timestamp = Date.now();
    }

    /**
     * Get current gauge metric
     */
    get(): GaugeMetric {
        return {
            name: this.name,
            type: MetricType.Gauge,
            help: this.help,
            labels: { ...this.labels },
            timestamp: this.timestamp,
            value: this.value,
        };
    }

    /**
     * Reset gauge to zero
     */
    reset(): void {
        this.value = 0;
        this.timestamp = Date.now();
    }
}

/**
 * Histogram Collector - tracks distribution of values with percentiles
 */
export class HistogramCollector implements MetricCollector {
    private sum: number = 0;
    private count: number = 0;
    private observations: HistogramObservation[] = [];
    private timestamp: number;

    constructor(
        private name: string,
        private help: string,
        private labels: Labels = {},
        private maxObservations: number = 10000
    ) {
        this.timestamp = Date.now();
    }

    /**
     * Record an observation
     */
    observe(value: number): void {
        this.sum += value;
        this.count += 1;
        this.observations.push({
            value,
            timestamp: Date.now(),
        });

        // Trim old observations if exceeding max
        if (this.observations.length > this.maxObservations) {
            this.observations.shift();
        }

        this.timestamp = Date.now();
    }

    /**
     * Calculate percentiles from observations
     */
    calculatePercentiles(): Percentiles {
        if (this.observations.length === 0) {
            return { p50: 0, p90: 0, p95: 0, p99: 0 };
        }

        const sorted = [...this.observations]
            .map(o => o.value)
            .sort((a, b) => a - b);

        const getPercentile = (p: number): number => {
            const index = Math.ceil((p / 100) * sorted.length) - 1;
            return sorted[Math.max(0, index)];
        };

        return {
            p50: getPercentile(50),
            p90: getPercentile(90),
            p95: getPercentile(95),
            p99: getPercentile(99),
        };
    }

    /**
     * Get current histogram metric
     */
    get(): HistogramMetric {
        return {
            name: this.name,
            type: MetricType.Histogram,
            help: this.help,
            labels: { ...this.labels },
            timestamp: this.timestamp,
            sum: this.sum,
            count: this.count,
            observations: [...this.observations],
        };
    }

    /**
     * Reset histogram
     */
    reset(): void {
        this.sum = 0;
        this.count = 0;
        this.observations = [];
        this.timestamp = Date.now();
    }

    /**
     * Get average value
     */
    getAverage(): number {
        return this.count > 0 ? this.sum / this.count : 0;
    }
}
