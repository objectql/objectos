/**
 * Persistent Job Storage
 *
 * KV-backed implementation of JobStorage using the @objectos/storage
 * StorageBackend interface for persistence. Also provides Dead Letter Queue
 * functionality for jobs that exhaust all retries.
 */

import type { Job, JobStorage, JobQueryOptions, JobQueueStats, DeadLetterEntry } from './types.js';

/**
 * StorageBackend interface (from @objectos/storage)
 * Declared locally to avoid a hard dependency on the storage package.
 */
export interface StorageBackend {
  get(key: string): Promise<any>;
  set(key: string, value: any, ttl?: number): Promise<void>;
  delete(key: string): Promise<void>;
  keys(pattern?: string): Promise<string[]>;
  clear(): Promise<void>;
  close?(): Promise<void>;
}

/** Key prefix for job records */
const JOB_PREFIX = 'job:';

/** Key prefix for dead letter entries */
const DLQ_PREFIX = 'dlq:';

/**
 * Serialize a Job to a plain JSON-safe object, converting Dates to ISO strings.
 */
function serializeJob(job: Job): Record<string, any> {
  return {
    ...job,
    createdAt: job.createdAt.toISOString(),
    startedAt: job.startedAt?.toISOString() ?? null,
    completedAt: job.completedAt?.toISOString() ?? null,
    failedAt: job.failedAt?.toISOString() ?? null,
    nextRun: job.nextRun?.toISOString() ?? null,
  };
}

/**
 * Deserialize a plain object back into a Job, restoring Date instances.
 */
function deserializeJob(raw: Record<string, any>): Job {
  return {
    ...raw,
    createdAt: new Date(raw.createdAt),
    startedAt: raw.startedAt ? new Date(raw.startedAt) : undefined,
    completedAt: raw.completedAt ? new Date(raw.completedAt) : undefined,
    failedAt: raw.failedAt ? new Date(raw.failedAt) : undefined,
    nextRun: raw.nextRun ? new Date(raw.nextRun) : undefined,
  } as Job;
}

/**
 * Persistent job storage backed by a StorageBackend (KV store).
 *
 * Jobs are stored with key pattern `job:<id>` and dead-letter entries
 * with key pattern `dlq:<id>`.
 */
export class PersistentJobStorage implements JobStorage {
  private backend: StorageBackend;

  constructor(backend: StorageBackend) {
    this.backend = backend;
  }

  // ─── JobStorage interface ──────────────────────────────────────────

  /** Save a job */
  async save(job: Job): Promise<void> {
    await this.backend.set(`${JOB_PREFIX}${job.id}`, serializeJob(job));
  }

  /** Get a job by ID */
  async get(id: string): Promise<Job | null> {
    const raw = await this.backend.get(`${JOB_PREFIX}${id}`);
    return raw ? deserializeJob(raw) : null;
  }

  /** Update a job */
  async update(id: string, updates: Partial<Job>): Promise<void> {
    const existing = await this.get(id);
    if (!existing) {
      throw new Error(`Job ${id} not found`);
    }
    const merged: Job = { ...existing, ...updates };
    await this.save(merged);
  }

  /** Delete a job */
  async delete(id: string): Promise<void> {
    await this.backend.delete(`${JOB_PREFIX}${id}`);
  }

  /** Query jobs with filtering, sorting, and pagination */
  async query(options: JobQueryOptions = {}): Promise<Job[]> {
    const keys = await this.backend.keys(`${JOB_PREFIX}*`);
    let jobs: Job[] = [];

    for (const key of keys) {
      const raw = await this.backend.get(key);
      if (raw) {
        jobs.push(deserializeJob(raw));
      }
    }

    // Filter by name
    if (options.name) {
      jobs = jobs.filter((j) => j.name === options.name);
    }

    // Filter by status
    if (options.status) {
      const statuses = Array.isArray(options.status) ? options.status : [options.status];
      jobs = jobs.filter((j) => statuses.includes(j.status));
    }

    // Filter by priority
    if (options.priority) {
      jobs = jobs.filter((j) => j.priority === options.priority);
    }

    // Sort
    if (options.sortBy) {
      const sortOrder = options.sortOrder === 'desc' ? -1 : 1;
      const priorityOrder: Record<string, number> = { critical: 4, high: 3, normal: 2, low: 1 };
      jobs.sort((a, b) => {
        let aVal: number;
        let bVal: number;
        switch (options.sortBy) {
          case 'createdAt':
            aVal = a.createdAt.getTime();
            bVal = b.createdAt.getTime();
            break;
          case 'priority':
            aVal = priorityOrder[a.priority] || 0;
            bVal = priorityOrder[b.priority] || 0;
            break;
          case 'nextRun':
            aVal = a.nextRun?.getTime() || 0;
            bVal = b.nextRun?.getTime() || 0;
            break;
          default:
            return 0;
        }
        return (aVal - bVal) * sortOrder;
      });
    }

    // Pagination
    if (options.skip) {
      jobs = jobs.slice(options.skip);
    }
    if (options.limit) {
      jobs = jobs.slice(0, options.limit);
    }

    return jobs;
  }

  /** Get queue statistics */
  async getStats(): Promise<JobQueueStats> {
    const allJobs = await this.query({});

    const stats: JobQueueStats = {
      total: allJobs.length,
      pending: 0,
      running: 0,
      completed: 0,
      failed: 0,
      cancelled: 0,
      scheduled: 0,
    };

    for (const job of allJobs) {
      switch (job.status) {
        case 'pending':
          stats.pending++;
          break;
        case 'running':
          stats.running++;
          break;
        case 'completed':
          stats.completed++;
          break;
        case 'failed':
          stats.failed++;
          break;
        case 'cancelled':
          stats.cancelled++;
          break;
        case 'scheduled':
          stats.scheduled++;
          break;
      }
    }

    return stats;
  }

  /** Get next pending job (highest priority, oldest first) */
  async getNextPending(): Promise<Job | null> {
    const allJobs = await this.query({ status: 'pending' });
    if (allJobs.length === 0) return null;

    const priorityOrder: Record<string, number> = { critical: 4, high: 3, normal: 2, low: 1 };
    allJobs.sort((a, b) => {
      const pDiff = (priorityOrder[b.priority] || 0) - (priorityOrder[a.priority] || 0);
      if (pDiff !== 0) return pDiff;
      return a.createdAt.getTime() - b.createdAt.getTime();
    });

    return allJobs[0];
  }

  /** Get scheduled jobs that are due for execution */
  async getScheduledDue(): Promise<Job[]> {
    const now = new Date();
    const allScheduled = await this.query({ status: 'scheduled' });
    return allScheduled.filter((j) => j.nextRun && j.nextRun <= now);
  }

  // ─── Dead Letter Queue ─────────────────────────────────────────────

  /**
   * Move a permanently failed job to the dead letter queue.
   */
  async moveToDeadLetter(job: Job, error: string): Promise<void> {
    const entry: DeadLetterEntry = {
      id: `dlq_${job.id}_${Date.now()}`,
      originalJobId: job.id,
      name: job.name,
      data: job.data,
      error,
      failedAt: new Date(),
      retryCount: job.attempts,
    };

    await this.backend.set(`${DLQ_PREFIX}${entry.id}`, {
      ...entry,
      failedAt: entry.failedAt.toISOString(),
    });
  }

  /**
   * List dead letter queue entries with optional pagination.
   */
  async getDeadLetters(options?: { limit?: number; offset?: number }): Promise<DeadLetterEntry[]> {
    const keys = await this.backend.keys(`${DLQ_PREFIX}*`);
    let entries: DeadLetterEntry[] = [];

    for (const key of keys) {
      const raw = await this.backend.get(key);
      if (raw) {
        entries.push({
          ...raw,
          failedAt: new Date(raw.failedAt),
        });
      }
    }

    // Sort newest first
    entries.sort((a, b) => b.failedAt.getTime() - a.failedAt.getTime());

    const offset = options?.offset ?? 0;
    entries = entries.slice(offset);
    if (options?.limit) {
      entries = entries.slice(0, options.limit);
    }

    return entries;
  }

  /**
   * Re-enqueue a dead letter entry as a new pending job.
   * Returns the new job ID.
   */
  async replayDeadLetter(entryId: string): Promise<string> {
    const raw = await this.backend.get(`${DLQ_PREFIX}${entryId}`);
    if (!raw) {
      throw new Error(`Dead letter entry ${entryId} not found`);
    }

    const entry: DeadLetterEntry = {
      ...raw,
      failedAt: new Date(raw.failedAt),
    };

    const newJobId = `${entry.name}_replay_${Date.now()}`;
    const newJob: Job = {
      id: newJobId,
      name: entry.name,
      data: entry.data,
      status: 'pending',
      priority: 'normal',
      attempts: 0,
      maxRetries: 3,
      retryDelay: 1000,
      timeout: 60000,
      createdAt: new Date(),
    };

    await this.save(newJob);

    // Remove from DLQ
    await this.backend.delete(`${DLQ_PREFIX}${entryId}`);

    return newJobId;
  }

  /**
   * Purge dead letter entries older than the given date.
   * Returns the number of entries removed.
   */
  async purgeDeadLetters(olderThan: Date): Promise<number> {
    const keys = await this.backend.keys(`${DLQ_PREFIX}*`);
    let purged = 0;

    for (const key of keys) {
      const raw = await this.backend.get(key);
      if (raw) {
        const failedAt = new Date(raw.failedAt);
        if (failedAt < olderThan) {
          await this.backend.delete(key);
          purged++;
        }
      }
    }

    return purged;
  }

  // ─── Helpers (for testing) ─────────────────────────────────────────

  /** Clear all jobs (for testing) */
  async clear(): Promise<void> {
    await this.backend.clear();
  }

  /** Get all jobs (for testing) */
  async getAll(): Promise<Job[]> {
    return this.query({});
  }
}
